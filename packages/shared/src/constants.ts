export const DEFAULT_PIPELINE_STAGES = [
  { key: 'NEW_LEAD', name: 'Novo Lead', order: 0, color: '#6366f1' },
  { key: 'CONTACT_INITIATED', name: 'Contacto Iniciado', order: 1, color: '#8b5cf6' },
  { key: 'QUALIFYING', name: 'Em Qualificação', order: 2, color: '#a855f7' },
  { key: 'EVALUATION_SCHEDULED', name: 'Avaliação Agendada', order: 3, color: '#d946ef' },
  { key: 'EVALUATION_DONE', name: 'Avaliação Realizada', order: 4, color: '#ec4899' },
  { key: 'PROPOSAL_SENT', name: 'Proposta Enviada', order: 5, color: '#f43f5e' },
  { key: 'DECISION', name: 'Em Decisão', order: 6, color: '#e11d48' },
  { key: 'ACTIVE', name: 'Cliente Ativo', order: 7, color: '#10b981' },
  { key: 'FOLLOW_UP', name: 'Em Acompanhamento', order: 8, color: '#14b8a6' },
  { key: 'RENEWAL', name: 'Renovação', order: 9, color: '#06b6d4' },
  { key: 'INACTIVE', name: 'Inativo', order: 10, color: '#6b7280' },
  { key: 'LOST', name: 'Perdido', order: 11, color: '#ef4444' },
] as const;

export const CHECK_IN_QUESTIONS = {
  ENERGY: {
    key: 'energy',
    question: 'Como está o seu nível de energia hoje?',
    type: 'scale',
    min: 1,
    max: 5,
  },
  SLEEP: {
    key: 'sleep',
    question: 'Como foi a qualidade do seu sono?',
    type: 'scale',
    min: 1,
    max: 5,
  },
  STRESS: {
    key: 'stress',
    question: 'Qual o seu nível de stress neste momento?',
    type: 'scale',
    min: 1,
    max: 5,
  },
  MOOD: {
    key: 'mood',
    question: 'Como descreve o seu estado emocional?',
    type: 'scale',
    min: 1,
    max: 5,
  },
  ADHERENCE: {
    key: 'adherence',
    question: 'Conseguiu seguir o plano conforme recomendado?',
    type: 'scale',
    min: 1,
    max: 5,
  },
  DIFFICULTIES: {
    key: 'difficulties',
    question: 'Sentiu alguma dificuldade desde o último contacto?',
    type: 'text',
  },
  SATISFACTION: {
    key: 'satisfaction',
    question: 'Qual o seu nível de satisfação com o acompanhamento?',
    type: 'scale',
    min: 1,
    max: 5,
  },
  SUPPORT_NEEDED: {
    key: 'support_needed',
    question: 'Gostaria de falar com um profissional?',
    type: 'boolean',
  },
} as const;

export const CHURN_RISK_THRESHOLDS = {
  LOW: 0.3,
  MEDIUM: 0.5,
  HIGH: 0.7,
} as const;

export const WHATSAPP_TEMPLATE_NAMES = {
  WELCOME: 'welcome_message',
  CHECK_IN: 'check_in',
  APPOINTMENT_REMINDER: 'appointment_reminder',
  APPOINTMENT_CONFIRMATION: 'appointment_confirmation',
  FOLLOW_UP: 'follow_up',
  SURVEY: 'satisfaction_survey',
} as const;

export const VOICE_PROMPT_CATEGORIES = [
  'INBOUND',
  'FIRST_CONTACT',
  'QUALIFICATION',
  'SCHEDULING',
  'CONFIRMATION',
  'RESCHEDULE',
  'LEAD_RECOVERY',
  'SALES_FOLLOWUP',
  'ONBOARDING',
  'CHECK_IN',
  'FEEDBACK',
  'RENEWAL',
  'CHURN_PREVENTION',
  'TRANSFER_TO_HUMAN',
] as const;

export const LLM_SAFETY_RULES = [
  'Nunca realizar diagnósticos médicos',
  'Nunca prescrever ou alterar medicação',
  'Nunca interpretar sintomas de forma definitiva',
  'Nunca prometer resultados',
  'Sempre encaminhar situações urgentes para emergência (112)',
  'Identificar-se sempre como assistente virtual',
  'Registar todas as interações para auditoria',
] as const;
