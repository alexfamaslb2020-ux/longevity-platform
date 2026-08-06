import { Injectable } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import type {
  AgentIntent,
  EvaluationCriterion,
  EvaluationResult,
} from "./ai-assistant.types";

export interface EvaluationInput {
  intent: AgentIntent;
  grounded: boolean;
  refused: boolean;
  usedTool: boolean;
  toolSuccess: boolean;
  hasContext: boolean;
  sourceCount: number;
  minSimilarity: number;
  latencyMs: number;
  answerLength: number;
}

const RAG_INTENTS: AgentIntent[] = [
  "pricing",
  "checkin",
  "program",
  "faq",
  "question",
];

/**
 * Avaliação determinística e explicável de cada resposta da IA.
 * Sem LLM-as-judge: cada critério é uma regra verificável e regista-se a
 * justificação, para transparência e reprodutibilidade.
 */
@Injectable()
export class EvaluatorService {
  private readonly latencyTargetMs: number;

  constructor(configService: ConfigService) {
    this.latencyTargetMs = configService.get<number>(
      "aiAssistant.evaluation.latencyTargetMs",
      1500,
    );
  }

  evaluate(input: EvaluationInput): EvaluationResult {
    const criteria: EvaluationCriterion[] = [];
    const isRag = RAG_INTENTS.includes(input.intent);

    // 1. Resposta fundamentada no contexto recuperado
    if (isRag) {
      criteria.push(
        input.grounded && input.sourceCount > 0
          ? {
              name: "grounding",
              passed: true,
              reason: `resposta construída a partir de ${input.sourceCount} chunk(s) recuperados`,
            }
          : {
              name: "grounding",
              passed: false,
              reason: "resposta sem contexto recuperado relevante",
            },
      );
    } else {
      criteria.push({
        name: "grounding",
        passed: true,
        reason: `intenção "${input.intent}" não exige contexto (não-RAG)`,
      });
    }

    // 2. Recusa honesta quando não há contexto
    if (isRag) {
      criteria.push(
        input.refused === !input.hasContext
          ? {
              name: "honest_refusal",
              passed: true,
              reason: input.hasContext
                ? "houve contexto e a IA respondeu"
                : "sem contexto, a IA assumiu desconhecimento em vez de inventar",
            }
          : {
              name: "honest_refusal",
              passed: false,
              reason: input.hasContext
                ? "havia contexto mas a IA recusou"
                : "a IA respondeu sem contexto recuperado (risco de alucinação)",
            },
      );
    }

    // 3. Fontes citadas
    criteria.push(
      input.sourceCount > 0
        ? {
            name: "source_trace",
            passed: true,
            reason: `${input.sourceCount} fonte(s) citada(s) (similaridade mínima ${input.minSimilarity.toFixed(2)})`,
          }
        : {
            name: "source_trace",
            passed: false,
            reason: "nenhuma fonte citada",
          },
    );

    // 4. Uso correto de ferramentas na intenção de agendamento
    if (input.intent === "appointment") {
      criteria.push(
        input.usedTool && input.toolSuccess
          ? {
              name: "tool_use",
              passed: true,
              reason: "ferramenta selecionada e executada com sucesso",
            }
          : input.usedTool
            ? {
                name: "tool_use",
                passed: false,
                reason: "ferramenta executada mas com falha",
              }
            : {
                name: "tool_use",
                passed: false,
                reason: "intenção de agendamento sem uso de ferramenta",
              },
      );
    }

    // 5. Latência
    criteria.push(
      input.latencyMs <= this.latencyTargetMs
        ? {
            name: "latency",
            passed: true,
            reason: `${input.latencyMs}ms <= alvo ${this.latencyTargetMs}ms`,
          }
        : {
            name: "latency",
            passed: false,
            reason: `${input.latencyMs}ms > alvo ${this.latencyTargetMs}ms`,
          },
    );

    // 6. Resposta não vazia
    criteria.push(
      input.answerLength > 10
        ? {
            name: "completeness",
            passed: true,
            reason: `resposta com ${input.answerLength} caracteres`,
          }
        : {
            name: "completeness",
            passed: false,
            reason: "resposta demasiado curta",
          },
    );

    const passed = criteria.filter((c) => c.passed).length;
    const score = Math.round((passed / criteria.length) * 100);

    return { score, criteria };
  }
}
