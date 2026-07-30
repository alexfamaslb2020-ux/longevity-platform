import type {
  LeadStatus, CustomerStatus, PipelineStageType,
  ConversationChannel, MessageRole, CallDirection, CallStatus,
  TaskStatus, TaskPriority, AppointmentStatus,
  CheckInStatus, CheckInChannel, AlertLevel, AlertType,
  ConsentType, WorkflowTriggerType, WorkflowActionType,
  NotificationChannel, SubscriptionStatus, PaymentStatus,
  DocumentType, LeadSource, UserRole,
} from './enums';

export interface PaginationParams {
  page?: number;
  limit?: number;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

export interface PaginatedResult<T> {
  data: T[];
  meta: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
}

export interface ApiResponse<T = unknown> {
  success: boolean;
  data?: T;
  error?: {
    code: string;
    message: string;
    details?: Record<string, string[]>;
  };
  meta?: {
    timestamp: string;
    requestId: string;
  };
}

export interface JWTPayload {
  sub: string;
  email: string;
  role: UserRole;
  permissions: string[];
}

export interface AuthTokens {
  accessToken: string;
  refreshToken: string;
  expiresIn: number;
}

export interface LeadData {
  name: string;
  email?: string;
  phone?: string;
  source: LeadSource;
  assignedToId?: string;
  metadata?: Record<string, unknown>;
}

export interface LeadScoreInput {
  engagement: number;
  responseRate: number;
  profileCompleteness: number;
  interestLevel: number;
  budgetFit?: number;
  urgency?: number;
}

export interface PipelineStageData {
  name: string;
  key: PipelineStageType;
  order: number;
  color: string;
}

export interface CheckInConfig {
  frequency: 'daily' | 'weekly' | 'biweekly' | 'monthly' | 'custom';
  intervalDays?: number;
  channels: CheckInChannel[];
  questions: string[];
  timeOfDay?: string;
  daysOfWeek?: number[];
}

export interface WorkflowRule {
  id: string;
  trigger: WorkflowTriggerType;
  conditions: WorkflowCondition[];
  actions: WorkflowAction[];
  priority: number;
  enabled: boolean;
}

export interface WorkflowCondition {
  field: string;
  operator: 'equals' | 'not_equals' | 'contains' | 'greater_than' | 'less_than' | 'in' | 'not_in' | 'exists' | 'not_exists';
  value: unknown;
}

export interface WorkflowAction {
  type: WorkflowActionType;
  config: Record<string, unknown>;
  delay?: number;
}

export interface VoicePrompt {
  id: string;
  category: string;
  version: number;
  content: string;
  variables: Record<string, string>;
  safetyRules: string[];
  successCriteria: string[];
  transferCriteria: string[];
}

export interface CallAnalytics {
  callId: string;
  duration: number;
  talkRatio: number;
  sentiment: number;
  keywords: string[];
  compliance: boolean;
}

export interface CheckInResponse {
  checkInId: string;
  answers: Record<string, number | string | boolean>;
  completedAt: string;
  trend?: {
    direction: 'improving' | 'stable' | 'declining';
    comparisons: Record<string, { previous: number; current: number; change: number }>;
  };
}

export interface AlertRule {
  type: AlertType;
  level: AlertLevel;
  conditions: WorkflowCondition[];
  actions: WorkflowAction[];
}
