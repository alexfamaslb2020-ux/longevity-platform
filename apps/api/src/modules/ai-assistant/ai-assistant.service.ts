import { BadRequestException, Injectable, Logger } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { Prisma, LeadSource } from "@prisma/client";
import { PrismaService } from "../../common/prisma.service";
import { AuditService } from "../../common/audit.service";
import { EmbeddingService } from "./embedding.service";
import { ChunkerService } from "./chunker.service";
import { RetrievalService } from "./retrieval.service";
import { IntentService } from "./intent.service";
import { EvaluatorService } from "./evaluator.service";
import { ScheduleToolService, CheckSlotsParams } from "./schedule-tool.service";
import { SYNTHETIC_DOCUMENTS } from "./knowledge-documents";
import type {
  AgentResult,
  ChatRequest,
  DocumentPayload,
  RetrievedChunk,
  SlotInfo,
  SourceRef,
  ToolCallRecord,
} from "./ai-assistant.types";

const RAG_INTENTS = new Set([
  "pricing",
  "checkin",
  "program",
  "faq",
  "question",
]);

@Injectable()
export class AiAssistantService {
  private readonly logger = new Logger(AiAssistantService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly audit: AuditService,
    private readonly embeddings: EmbeddingService,
    private readonly chunker: ChunkerService,
    private readonly retrieval: RetrievalService,
    private readonly intent: IntentService,
    private readonly evaluator: EvaluatorService,
    private readonly scheduleTool: ScheduleToolService,
    private readonly configService: ConfigService,
  ) {}

  // ─── Ingestão ──────────────────────────────────────────────────────────

  async ingestDocument(
    payload: DocumentPayload,
    organizationId: string | null | undefined,
    actorUserId?: string,
  ) {
    const title = payload.title.trim();
    if (!title || !payload.content?.trim()) {
      throw new BadRequestException({
        code: "EMPTY_DOCUMENT",
        message: "Título e conteúdo são obrigatórios",
      });
    }

    const chunks = this.chunker.chunk(payload.content);
    if (chunks.length === 0) {
      throw new BadRequestException({
        code: "EMPTY_DOCUMENT",
        message: "Documento sem conteúdo utilizável",
      });
    }

    const document = await this.prisma.knowledgeDocument.create({
      data: {
        organizationId,
        title,
        category: (payload.category ?? "GENERAL").toUpperCase(),
        content: payload.content,
        chunkCount: 0,
        status: "INGESTED",
      },
    });

    let embedded = 0;
    for (let i = 0; i < chunks.length; i++) {
      const chunk = await this.prisma.knowledgeChunk.create({
        data: {
          documentId: document.id,
          chunkIndex: i,
          content: chunks[i].content,
          tokenCount: chunks[i].tokenCount,
        },
      });
      const vector = await this.embeddings.embedText(chunks[i].content);
      await this.retrieval.setChunkEmbedding(
        chunk.id,
        this.embeddings.toVectorLiteral(vector),
      );
      embedded++;
    }

    await this.prisma.knowledgeDocument.update({
      where: { id: document.id },
      data: { chunkCount: embedded },
    });

    await this.audit.log({
      userId: actorUserId,
      organizationId: organizationId ?? undefined,
      action: "ai.document.ingested",
      resource: "knowledge_document",
      resourceId: document.id,
      details: { title, chunks: embedded, category: document.category },
    });

    return {
      documentId: document.id,
      title: document.title,
      category: document.category,
      chunks: embedded,
    };
  }

  async seedDemoDocuments(organizationId: string | null | undefined) {
    const results: Array<{ title: string; chunks: number; skipped?: boolean }> =
      [];
    for (const doc of SYNTHETIC_DOCUMENTS) {
      const existing = await this.prisma.knowledgeDocument.findFirst({
        where: { title: doc.title, organizationId },
      });
      if (existing) {
        results.push({
          title: doc.title,
          chunks: existing.chunkCount,
          skipped: true,
        });
        continue;
      }
      const result = await this.ingestDocument(doc, organizationId);
      results.push({ title: result.title, chunks: result.chunks });
    }
    return { documents: results, total: results.length };
  }

  async listDocuments(organizationId: string | null | undefined) {
    return this.prisma.knowledgeDocument.findMany({
      where: { organizationId },
      orderBy: { createdAt: "desc" },
      select: {
        id: true,
        title: true,
        category: true,
        chunkCount: true,
        status: true,
        createdAt: true,
      },
    });
  }

  async removeDocument(
    documentId: string,
    organizationId: string | null | undefined,
    actorUserId?: string,
  ) {
    const document = await this.prisma.knowledgeDocument.findFirst({
      where: { id: documentId, organizationId },
    });
    if (!document) {
      throw new BadRequestException({
        code: "DOCUMENT_NOT_FOUND",
        message: "Documento não encontrado",
      });
    }
    await this.prisma.knowledgeDocument.delete({ where: { id: document.id } });
    await this.audit.log({
      userId: actorUserId,
      organizationId: organizationId ?? undefined,
      action: "ai.document.removed",
      resource: "knowledge_document",
      resourceId: document.id,
      details: { title: document.title },
    });
    return { removed: document.id };
  }

  // ─── Chat do agente ────────────────────────────────────────────────────

  async processQuery(
    request: ChatRequest,
    organizationId: string | null | undefined,
    actorUserId?: string,
  ): Promise<AgentResult> {
    const startedAt = Date.now();
    const query = (request.query || "").trim();
    if (!query) {
      throw new BadRequestException({
        code: "EMPTY_QUERY",
        message: "Mensagem vazia",
      });
    }

    const intentResult = this.intent.classify(query);
    const queryVector = await this.embeddings.embedText(query);
    const chunks = await this.retrieval.search(queryVector, organizationId);
    const hasContext = chunks.length > 0;
    const minSimilarity = this.configService.get<number>(
      "aiAssistant.retrieval.minSimilarity",
      0.32,
    );

    let responseText = "";
    let grounded = false;
    let refused = false;
    let usedTool = false;
    let toolCall: ToolCallRecord | null = null;
    let sources: SourceRef[] = [];
    let proposedSlots: SlotInfo[] | undefined;

    if (intentResult.intent === "appointment") {
      const slots = await this.scheduleTool.checkAvailableSlots({
        organizationId,
      });
      toolCall = await this.createPendingToolCall({
        organizationId,
        conversationRef: request.conversationRef,
        args: {
          leadId: request.leadId ?? null,
          phone: request.phone ?? null,
          requestedSlots: slots.slots.slice(0, 4),
          durationMinutes: 30,
        },
        actorUserId,
      });
      usedTool = true;
      proposedSlots = slots.slots.slice(0, 4);
      responseText = this.buildBookingProposal(slots.slots);
    } else if (intentResult.intent === "greeting") {
      responseText = this.buildGreeting();
    } else if (RAG_INTENTS.has(intentResult.intent) && hasContext) {
      const answer = this.buildGroundedAnswer(chunks);
      responseText = answer.text;
      grounded = true;
      sources = answer.sources;
    } else {
      refused = true;
      responseText = this.buildRefusal();
    }

    const latencyMs = Date.now() - startedAt;

    const evaluationInput = {
      intent: intentResult.intent,
      grounded,
      refused,
      usedTool,
      toolSuccess: true,
      hasContext,
      sourceCount: sources.length,
      minSimilarity,
      latencyMs,
      answerLength: responseText.length,
    };
    const evaluation = this.evaluator.evaluate(evaluationInput);

    const persisted = await this.prisma.aiResponse.create({
      data: {
        organizationId,
        query,
        response: responseText,
        intent: intentResult.intent,
        confidence: intentResult.confidence,
        grounded,
        refused,
        usedTool,
        toolCallId: toolCall?.id ?? null,
        latencyMs,
        sources: sources as unknown as Prisma.InputJsonValue,
        evaluation: evaluation as unknown as Prisma.InputJsonValue,
        evaluationScore: evaluation.score,
        model: `local-rag-${this.embeddings.name}`,
      },
    });

    await this.audit.log({
      userId: actorUserId,
      organizationId: organizationId ?? undefined,
      action: "ai.assistant.response",
      resource: "ai_response",
      resourceId: persisted.id,
      details: {
        intent: intentResult.intent,
        grounded,
        refused,
        usedTool,
        toolCallId: toolCall?.id ?? null,
        sources: sources.length,
        evaluationScore: evaluation.score,
        latencyMs,
      },
    });

    return {
      aiResponseId: persisted.id,
      query,
      response: responseText,
      intent: intentResult.intent,
      confidence: intentResult.confidence,
      grounded,
      refused,
      usedTool,
      toolCall,
      sources,
      evaluation,
      latencyMs,
      proposedSlots,
    };
  }

  // ─── Confirmação de ferramentas ────────────────────────────────────────

  async confirmToolCall(
    toolCallId: string,
    organizationId: string | null | undefined,
    actorUserId?: string,
  ) {
    const toolCall = await this.prisma.toolCall.findFirst({
      where: { id: toolCallId, organizationId },
    });
    if (!toolCall) {
      throw new BadRequestException({
        code: "TOOL_CALL_NOT_FOUND",
        message: "Tool call não encontrada",
      });
    }
    if (toolCall.status !== "PENDING") {
      throw new BadRequestException({
        code: "TOOL_CALL_ALREADY_RESOLVED",
        message: `Tool call já resolvida (${toolCall.status})`,
      });
    }

    const args = (toolCall.args as Record<string, unknown>) ?? {};
    if (toolCall.toolName !== "schedule_appointment") {
      throw new BadRequestException({
        code: "TOOL_NOT_CONFIRMABLE",
        message: `Ferramenta "${toolCall.toolName}" não requer confirmação`,
      });
    }

    const lead = await this.resolveLead(args, organizationId);
    const slot = (args.requestedSlots as SlotInfo[] | undefined)?.[0];
    if (!slot) {
      throw new BadRequestException({
        code: "NO_SLOT_SELECTED",
        message: "Nenhum horário foi selecionado na proposta",
      });
    }

    try {
      const result = await this.scheduleTool.scheduleAppointment({
        organizationId,
        leadId: lead.id,
        startIso: slot.start,
        title: "Avaliação Inicial",
        type: "EVALUATION",
        durationMinutes: (args.durationMinutes as number) ?? 30,
        appointmentMetadata: { viaAssistant: true },
        actorUserId,
      });

      const updated = await this.prisma.toolCall.update({
        where: { id: toolCall.id },
        data: {
          status: "EXECUTED",
          confirmedAt: new Date(),
          executedAt: new Date(),
          result: {
            appointmentId: result.appointment.id,
            startDate: result.appointment.startDate,
            title: result.appointment.title,
            leadId: lead.id,
          } as unknown as Prisma.InputJsonValue,
        },
      });

      await this.audit.log({
        userId: actorUserId,
        organizationId: organizationId ?? undefined,
        action: "ai.tool.executed",
        resource: "tool_call",
        resourceId: toolCall.id,
        details: {
          toolName: "schedule_appointment",
          appointmentId: result.appointment.id,
        },
      });

      return {
        status: updated.status,
        appointment: result.appointment,
        message: `Agendamento confirmado: ${result.appointment.title} para ${new Date(result.appointment.startDate).toLocaleString("pt-PT")}.`,
      };
    } catch (error: unknown) {
      const message = error as { message?: string };
      await this.prisma.toolCall.update({
        where: { id: toolCall.id },
        data: { status: "FAILED", error: message.message ?? "unknown" },
      });
      throw new BadRequestException({
        code: "TOOL_EXECUTION_FAILED",
        message: `Falha ao executar agendamento: ${message.message ?? "erro desconhecido"}`,
      });
    }
  }

  async rejectToolCall(
    toolCallId: string,
    organizationId: string | null | undefined,
  ) {
    const toolCall = await this.prisma.toolCall.findFirst({
      where: { id: toolCallId, organizationId },
    });
    if (!toolCall) {
      throw new BadRequestException({
        code: "TOOL_CALL_NOT_FOUND",
        message: "Tool call não encontrada",
      });
    }
    if (toolCall.status !== "PENDING") {
      throw new BadRequestException({
        code: "TOOL_CALL_ALREADY_RESOLVED",
        message: `Tool call já resolvida (${toolCall.status})`,
      });
    }
    const updated = await this.prisma.toolCall.update({
      where: { id: toolCall.id },
      data: { status: "REJECTED", confirmedAt: new Date() },
    });
    return { status: updated.status };
  }

  // ─── Avaliações / estado ───────────────────────────────────────────────

  async listEvaluations(organizationId: string | null | undefined, limit = 20) {
    return this.prisma.aiResponse.findMany({
      where: { organizationId },
      orderBy: { createdAt: "desc" },
      take: Math.min(limit, 100),
      select: {
        id: true,
        query: true,
        intent: true,
        confidence: true,
        grounded: true,
        refused: true,
        usedTool: true,
        sources: true,
        evaluation: true,
        evaluationScore: true,
        latencyMs: true,
        model: true,
        createdAt: true,
      },
    });
  }

  async status(organizationId: string | null | undefined) {
    const counts = await this.retrieval.count();
    const evaluations = await this.prisma.aiResponse.aggregate({
      where: { organizationId },
      _avg: { evaluationScore: true },
      _count: { _all: true },
    });
    const toolCalls = await this.prisma.toolCall.groupBy({
      by: ["status"],
      where: { organizationId },
      _count: { _all: true },
    });
    return {
      enabled: this.configService.get<boolean>("aiAssistant.enabled", true),
      embeddingProvider: this.embeddings.name,
      embeddingDimensions: this.embeddings.dimension,
      documents: counts.documents,
      chunks: counts.chunks,
      averageEvaluationScore: evaluations._avg.evaluationScore
        ? Math.round(evaluations._avg.evaluationScore * 100) / 100
        : 0,
      responsesEvaluated: evaluations._count._all,
      toolCalls: Object.fromEntries(
        toolCalls.map((t) => [t.status, t._count._all]),
      ),
    };
  }

  // ─── Internos ──────────────────────────────────────────────────────────

  private async createPendingToolCall(params: {
    organizationId: string | null | undefined;
    conversationRef?: string;
    args: Record<string, unknown>;
    actorUserId?: string;
  }): Promise<ToolCallRecord> {
    const record = await this.prisma.toolCall.create({
      data: {
        organizationId: params.organizationId,
        conversationRef: params.conversationRef ?? null,
        toolName: "schedule_appointment",
        args: params.args as Prisma.InputJsonValue,
        status: "PENDING",
      },
    });
    await this.audit.log({
      userId: params.actorUserId,
      organizationId: params.organizationId ?? undefined,
      action: "ai.tool.proposed",
      resource: "tool_call",
      resourceId: record.id,
      details: { toolName: "schedule_appointment", args: params.args },
    });
    return {
      id: record.id,
      toolName: record.toolName,
      status: record.status as ToolCallRecord["status"],
      args: params.args,
    };
  }

  private async resolveLead(
    args: Record<string, unknown>,
    organizationId: string | null | undefined,
  ) {
    if (typeof args.leadId === "string" && args.leadId) {
      const existing = await this.prisma.lead.findUnique({
        where: { id: args.leadId },
      });
      if (existing) return existing;
    }
    const phone =
      typeof args.phone === "string" && args.phone ? args.phone : null;
    if (phone) {
      const byPhone = await this.prisma.lead.findFirst({ where: { phone } });
      if (byPhone) return byPhone;
    }
    return this.prisma.lead.create({
      data: {
        name: "Cliente IA",
        phone: phone ?? null,
        source: LeadSource.WHATSAPP,
        organizationId,
        metadata: { createdByAssistant: true },
      },
    });
  }

  private buildGroundedAnswer(chunks: RetrievedChunk[]): {
    text: string;
    sources: SourceRef[];
  } {
    const selected = chunks.slice(0, 3);
    const primary = selected[0];

    const paragraph = primary.content.trim().replace(/\s+/g, " ");
    const cut =
      paragraph.length > 420 ? `${paragraph.slice(0, 420)}…` : paragraph;

    let text = `Segundo a informação disponível (${primary.title}): ${cut}`;

    if (selected.length > 1) {
      const extra = selected[1];
      const extraParagraph = extra.content.trim().replace(/\s+/g, " ");
      text += `\n\nComplementarmente (${extra.title}): ${
        extraParagraph.length > 260
          ? `${extraParagraph.slice(0, 260)}…`
          : extraParagraph
      }`;
    }

    text += `\n\nFonte: ${primary.title} (${primary.category})`;

    const sources: SourceRef[] = selected.map((chunk) => ({
      documentId: chunk.documentId,
      title: chunk.title,
      category: chunk.category,
      chunkId: chunk.chunkId,
      similarity: chunk.similarity,
      excerpt: chunk.content.replace(/\s+/g, " ").slice(0, 180),
    }));

    return { text, sources };
  }

  private buildRefusal(): string {
    return (
      "Não tenho informação suficiente sobre esse assunto. " +
      "Posso ajudar com programas e preços, como funciona a inscrição, " +
      "check-ins semanais, perguntas frequentes e marcação de avaliações. " +
      "Ou prefere que encaminhe a sua questão para a equipa?"
    );
  }

  private buildGreeting(): string {
    return (
      "Olá! Sou o assistente da Clínica Vida Longa. Posso esclarecer " +
      "dúvidas sobre programas e preços, como funciona a inscrição, " +
      "check-ins semanais, perguntas frequentes e marcar a sua avaliação " +
      "inicial. Como posso ajudar?"
    );
  }

  private buildBookingProposal(slots: SlotInfo[]): string {
    if (slots.length === 0) {
      return (
        "Não encontrei horários livres nos próximos dias. Posso " +
        "verificar com a receção por telefone (210 123 456) para encontrar " +
        "uma alternativa. Quer que tente uma data diferente?"
      );
    }
    const labels = slots
      .slice(0, 4)
      .map((s) => `• ${s.label}`)
      .join("\n");
    return (
      `Encontrei estes horários livres para a Avaliação Inicial (45 minutos):\n` +
      `${labels}\n\n` +
      `Confirma que agendo a sua avaliação para o primeiro horário? ` +
      `Responda "sim" para confirmar ou indique outro horário da lista.`
    );
  }
}

export type { CheckSlotsParams };
