import {
  Injectable,
  NotFoundException,
  ConflictException,
  Logger,
} from "@nestjs/common";
import { PrismaService } from "../../common/prisma.service";

@Injectable()
export class PipelineService {
  private readonly logger = new Logger(PipelineService.name);

  constructor(private readonly prisma: PrismaService) {}

  async create(name: string, organizationId?: string) {
    const pipeline = await this.prisma.pipeline.create({
      data: { name, organizationId },
    });

    const defaultStages = [
      { key: "NEW_LEAD", name: "Novo Lead", order: 0, color: "#6366f1" },
      {
        key: "CONTACT_INITIATED",
        name: "Contacto Iniciado",
        order: 1,
        color: "#8b5cf6",
      },
      {
        key: "QUALIFYING",
        name: "Em Qualificação",
        order: 2,
        color: "#a855f7",
      },
      {
        key: "EVALUATION_SCHEDULED",
        name: "Avaliação Agendada",
        order: 3,
        color: "#d946ef",
      },
      {
        key: "EVALUATION_DONE",
        name: "Avaliação Realizada",
        order: 4,
        color: "#ec4899",
      },
      {
        key: "PROPOSAL_SENT",
        name: "Proposta Enviada",
        order: 5,
        color: "#f43f5e",
      },
      { key: "DECISION", name: "Em Decisão", order: 6, color: "#e11d48" },
      { key: "ACTIVE", name: "Cliente Ativo", order: 7, color: "#10b981" },
      {
        key: "FOLLOW_UP",
        name: "Em Acompanhamento",
        order: 8,
        color: "#14b8a6",
      },
      { key: "RENEWAL", name: "Renovação", order: 9, color: "#06b6d4" },
      { key: "INACTIVE", name: "Inativo", order: 10, color: "#6b7280" },
      { key: "LOST", name: "Perdido", order: 11, color: "#ef4444" },
    ];

    for (const stage of defaultStages) {
      await this.prisma.pipelineStage.create({
        data: {
          pipelineId: pipeline.id,
          ...stage,
        },
      });
    }

    this.logger.log(
      `Pipeline created: ${pipeline.name} with ${defaultStages.length} stages`,
    );
    return this.findById(pipeline.id);
  }

  async findById(id: string) {
    const pipeline = await this.prisma.pipeline.findUnique({
      where: { id },
      include: {
        stages: { orderBy: { order: "asc" } },
      },
    });

    if (!pipeline) {
      throw new NotFoundException({
        code: "PIPELINE_NOT_FOUND",
        message: "Pipeline não encontrado",
      });
    }

    return pipeline;
  }

  async findAll(organizationId?: string) {
    return this.prisma.pipeline.findMany({
      where: organizationId ? { organizationId } : {},
      include: {
        stages: { orderBy: { order: "asc" } },
        _count: { select: { stages: true } },
      },
    });
  }

  async addStage(
    pipelineId: string,
    data: {
      name: string;
      key: string;
      order: number;
      color: string;
    },
  ) {
    const existing = await this.prisma.pipelineStage.findUnique({
      where: { pipelineId_key: { pipelineId, key: data.key } },
    });

    if (existing) {
      throw new ConflictException({
        code: "STAGE_EXISTS",
        message: "Etapa já existe neste pipeline",
      });
    }

    return this.prisma.pipelineStage.create({
      data: { pipelineId, ...data },
    });
  }

  async updateStage(
    id: string,
    data: {
      name?: string;
      color?: string;
      order?: number;
    },
  ) {
    const stage = await this.prisma.pipelineStage.findUnique({ where: { id } });
    if (!stage) {
      throw new NotFoundException({
        code: "STAGE_NOT_FOUND",
        message: "Etapa não encontrada",
      });
    }

    return this.prisma.pipelineStage.update({
      where: { id },
      data,
    });
  }

  async deleteStage(id: string) {
    const stage = await this.prisma.pipelineStage.findUnique({ where: { id } });
    if (!stage) {
      throw new NotFoundException({
        code: "STAGE_NOT_FOUND",
        message: "Etapa não encontrada",
      });
    }

    await this.prisma.pipelineStage.delete({ where: { id } });
    this.logger.log(`Pipeline stage deleted: ${stage.name}`);
  }

  async moveLead(leadId: string, stageId: string) {
    const stage = await this.prisma.pipelineStage.findUnique({
      where: { id: stageId },
    });
    if (!stage) {
      throw new NotFoundException({
        code: "STAGE_NOT_FOUND",
        message: "Etapa não encontrada",
      });
    }

    return this.prisma.lead.update({
      where: { id: leadId },
      data: { pipelineStageId: stageId },
      include: {
        pipelineStage: true,
      },
    });
  }
}
