import { Injectable } from "@nestjs/common";
import type { AgentIntent, IntentResult } from "./ai-assistant.types";

interface IntentRule {
  intent: AgentIntent;
  patterns: RegExp[];
  weight: number;
}

const RULES: IntentRule[] = [
  {
    intent: "appointment",
    patterns: [
      /(marcar|agendar|marcacao|agendamento|agenda)/,
      /(horari|disponibil|vaga|livre para|fazer uma consulta|marcar uma)/,
      /(avaliacao inicial|consulta de acompanhamento|quero uma consulta)/,
    ],
    weight: 2,
  },
  {
    intent: "pricing",
    patterns: [
      /(preco|quanto custa|custo|valor|mensalidade|assinatura|subscricao|plano essencial|plano premium)/,
      /(pagar|pagamento|taxa|euros|eur)/,
    ],
    weight: 1.5,
  },
  {
    intent: "checkin",
    patterns: [
      /(check.?in|checkin|como te sentes|como esta|como estao|bem.?estar|energia|sono|stress|disposicao)/,
      /(resposta|sintoma|dificuldade)/,
    ],
    weight: 1,
  },
  {
    intent: "program",
    patterns: [
      /(como funciona|o que e|que e|inscricao|comecar|processo|primeiro contacto|passos|aderir)/,
      /(plano de subscricao|programa|membership|fideliz)/,
    ],
    weight: 1,
  },
  {
    intent: "faq",
    patterns: [
      /(pergunta|faq|duvida|onde fica|morada|localizacao|telefone|contacto|contactar|horario de funcionamento|funcionam|metodo de pagamento)/,
      /(cancelar|remarcar|aviso|reembolso)/,
    ],
    weight: 1,
  },
];

const GREETING_PATTERNS: RegExp[] = [
  /^(ola|oi|bom dia|boa tarde|boa noite|hey|olha)\b/,
  /(tudo bem|como estas\b)/,
];

const THANKS_PATTERNS: RegExp[] = [/(obrigad|agradecid)/];

const STOP_WORDS = new Set([
  "a",
  "o",
  "as",
  "os",
  "um",
  "uma",
  "uns",
  "umas",
  "de",
  "do",
  "da",
  "dos",
  "das",
  "em",
  "no",
  "na",
  "nos",
  "nas",
  "para",
  "por",
  "com",
  "sem",
  "que",
  "qual",
  "quais",
  "e",
  "ou",
  "mas",
  "se",
  "ao",
  "aos",
  "nao",
  "sim",
  "como",
  "quando",
  "onde",
  "porque",
  "pode",
  "podem",
  "quero",
  "gostaria",
  "queria",
  "vou",
  "fazer",
  "faz",
  "tem",
  "tenho",
  "esta",
  "estou",
  "meu",
  "minha",
  "sua",
  "seu",
  "nosso",
  "você",
  "voce",
  "tu",
  "eu",
  "ele",
  "ela",
  "isso",
]);

function normalize(input: string): string {
  return input
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/\s+/g, " ")
    .trim();
}

/**
 * Classificador determinístico de intenções para o assistente.
 * Keyword scoring com pesos — sem LLM — para ser reproduzível e testável.
 */
@Injectable()
export class IntentService {
  classify(query: string): IntentResult {
    const normalized = normalize(query);
    if (!normalized) {
      return { intent: "unknown", confidence: 0, normalized };
    }

    const greetingMatch = GREETING_PATTERNS.some((re) => re.test(normalized));
    const thanks = THANKS_PATTERNS.some((re) => re.test(normalized));

    const scores = new Map<AgentIntent, number>();
    for (const rule of RULES) {
      let hits = 0;
      for (const pattern of rule.patterns) {
        if (pattern.test(normalized)) hits++;
      }
      if (hits > 0) {
        scores.set(
          rule.intent,
          (scores.get(rule.intent) || 0) + hits * rule.weight,
        );
      }
    }

    const tokenCount = normalized
      .split(/\s+/)
      .filter((w) => w.length > 2 && !STOP_WORDS.has(w)).length;

    if (scores.size === 0) {
      if (thanks) {
        return { intent: "question", confidence: 0.55, normalized };
      }
      if (greetingMatch && tokenCount <= 4) {
        return { intent: "greeting", confidence: 0.8, normalized };
      }
      if (normalized.endsWith("?") || tokenCount >= 3) {
        return { intent: "question", confidence: 0.5, normalized };
      }
      return { intent: "unknown", confidence: 0.35, normalized };
    }

    let best: AgentIntent = "question";
    let bestScore = 0;
    for (const [intent, score] of scores.entries()) {
      if (score > bestScore) {
        best = intent;
        bestScore = score;
      }
    }

    const confidence = Math.min(0.97, 0.55 + bestScore * 0.12);
    return { intent: best, confidence, normalized };
  }
}
