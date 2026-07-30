import { Injectable } from "@nestjs/common";

export enum RiskLevel {
  NORMAL = "NORMAL",
  ATTENTION = "ATTENTION",
  HIGH = "HIGH",
  CRITICAL = "CRITICAL",
}

export interface RiskFactor {
  name: string;
  score: number;
  weight: number;
  description: string;
}

export interface RiskResult {
  level: RiskLevel;
  score: number;
  factors: RiskFactor[];
  requiresHumanReview: boolean;
}

interface CheckInData {
  energy?: number;
  sleep?: number;
  stress?: number;
  mood?: number;
  adherence?: number;
  satisfaction?: number;
  dropoutIntention?: boolean;
  requestContact?: boolean;
  noResponse?: boolean;
}

@Injectable()
export class RiskService {
  calculate(data: CheckInData, previousData?: CheckInData): RiskResult {
    const factors: RiskFactor[] = [];

    // Energy (weight: 3)
    if (data.energy !== undefined) {
      const energyScore = Math.max(0, 10 - data.energy);
      factors.push({
        name: "energy",
        score: energyScore,
        weight: 3,
        description: `Nível de energia: ${data.energy}/10`,
      });
    }

    // Sleep (weight: 2)
    if (data.sleep !== undefined) {
      const sleepScore = data.sleep < 5 ? 7 : data.sleep < 7 ? 3 : 0;
      factors.push({
        name: "sleep",
        score: sleepScore,
        weight: 2,
        description: `Horas de sono: ${data.sleep}`,
      });
    }

    // Stress (weight: 3)
    if (data.stress !== undefined) {
      const stressScore = Math.max(0, data.stress - 3);
      factors.push({
        name: "stress",
        score: stressScore,
        weight: 3,
        description: `Nível de stress: ${data.stress}/10`,
      });
    }

    // Mood (weight: 2)
    if (data.mood !== undefined) {
      const moodScore = Math.max(0, 10 - data.mood);
      factors.push({
        name: "mood",
        score: moodScore,
        weight: 2,
        description: `Estado emocional: ${data.mood}/10`,
      });
    }

    // Adherence (weight: 4)
    if (data.adherence !== undefined) {
      const adherenceScore = Math.max(0, 10 - data.adherence);
      factors.push({
        name: "adherence",
        score: adherenceScore,
        weight: 4,
        description: `Adesão ao programa: ${data.adherence}/10`,
      });
    }

    // Satisfaction (weight: 3)
    if (data.satisfaction !== undefined) {
      const satisfactionScore = Math.max(0, 10 - data.satisfaction);
      factors.push({
        name: "satisfaction",
        score: satisfactionScore,
        weight: 3,
        description: `Satisfação: ${data.satisfaction}/10`,
      });
    }

    // Dropout intention (weight: 5)
    if (data.dropoutIntention) {
      factors.push({
        name: "dropout_intention",
        score: 10,
        weight: 5,
        description: "Intenção de desistir do programa",
      });
    }

    // Request contact (weight: 4)
    if (data.requestContact) {
      factors.push({
        name: "request_contact",
        score: 8,
        weight: 4,
        description: "Solicitou contacto",
      });
    }

    // No response (weight: 3)
    if (data.noResponse) {
      factors.push({
        name: "no_response",
        score: 6,
        weight: 3,
        description: "Sem resposta ao check-in",
      });
    }

    // Variation from previous (weight: 2)
    if (
      previousData &&
      data.energy !== undefined &&
      previousData.energy !== undefined
    ) {
      const variation = Math.abs(data.energy - previousData.energy);
      if (variation >= 4) {
        factors.push({
          name: "high_variation",
          score: variation * 1.5,
          weight: 2,
          description: `Variação significativa de energia: ${variation} pontos`,
        });
      }
    }

    // Calculate total weighted score
    const totalWeight = factors.reduce((sum, f) => sum + f.weight, 0);
    const weightedScore =
      totalWeight > 0
        ? factors.reduce((sum, f) => sum + f.score * f.weight, 0) / totalWeight
        : 0;

    // Determine level
    const level = this.determineLevel(weightedScore);
    const requiresHumanReview =
      level === RiskLevel.HIGH || level === RiskLevel.CRITICAL;

    return {
      level,
      score: Math.round(weightedScore * 10) / 10,
      factors,
      requiresHumanReview,
    };
  }

  private determineLevel(score: number): RiskLevel {
    if (score >= 7) return RiskLevel.CRITICAL;
    if (score >= 4.5) return RiskLevel.HIGH;
    if (score >= 2) return RiskLevel.ATTENTION;
    return RiskLevel.NORMAL;
  }
}
