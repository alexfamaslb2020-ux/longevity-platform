import { BadgeVariant } from '@/components/ui/badge';

export function norm(value?: string | null): string {
  return (value ?? '').toLowerCase().trim();
}

export const leadStatusLabels: Record<string, string> = {
  new: 'Novo',
  contacted: 'Contactado',
  qualifying: 'A qualificar',
  qualified: 'Qualificado',
  in_progress: 'Em progresso',
  converted: 'Convertido',
  lost: 'Perdido',
  archived: 'Arquivado',
};

export const leadStatusBadge: Record<string, BadgeVariant> = {
  new: 'blue',
  contacted: 'gold',
  qualifying: 'amber',
  qualified: 'sage',
  in_progress: 'amber',
  converted: 'sage',
  lost: 'red',
  archived: 'neutral',
};

export const riskLabels: Record<string, string> = {
  low: 'Baixo risco',
  medium: 'Risco médio',
  high: 'Risco alto',
};

export const riskBadge: Record<string, BadgeVariant> = {
  low: 'sage',
  medium: 'amber',
  high: 'red',
};

export function riskLabel(level?: string | null): string {
  return riskLabels[norm(level)] ?? 'Desconhecido';
}

export const checkinAlertLabels: Record<string, string> = {
  normal: 'Normal',
  attention: 'Atenção',
  priority: 'Prioridade',
  urgent: 'Urgente',
};

export function checkinAlertLabel(level?: string | null): string {
  return checkinAlertLabels[norm(level)] ?? 'OK';
}

export function riskBadgeVariant(level?: string | null): BadgeVariant {
  return riskBadge[norm(level)] ?? 'neutral';
}

export function leadStatusLabel(status?: string | null): string {
  return leadStatusLabels[norm(status)] ?? status ?? '—';
}

export function leadStatusBadgeVariant(status?: string | null): BadgeVariant {
  return leadStatusBadge[norm(status)] ?? 'neutral';
}

export function callStatusLabel(status?: string | null): string {
  return callStatusLabels[norm(status)] ?? status ?? '—';
}

export function callStatusBadgeVariant(status?: string | null): BadgeVariant {
  return callStatusBadge[norm(status)] ?? 'neutral';
}

export function alertLevelLabel(level?: string | null): string {
  return alertLevelLabels[norm(level)] ?? level ?? '—';
}

export function alertLevelBadgeVariant(level?: string | null): BadgeVariant {
  return alertLevelBadge[norm(level)] ?? 'neutral';
}

export function taskPriorityLabel(priority?: string | null): string {
  return taskPriorityLabels[norm(priority)] ?? priority ?? '—';
}

export function taskPriorityBadgeVariant(priority?: string | null): BadgeVariant {
  return taskPriorityBadge[norm(priority)] ?? 'neutral';
}

export function workflowStatusLabel(status?: string | null): string {
  return workflowStatusLabels[norm(status)] ?? status ?? '—';
}

export function workflowStatusBadgeVariant(status?: string | null): BadgeVariant {
  return workflowStatusBadge[norm(status)] ?? 'neutral';
}

export function checkinStatusLabel(status?: string | null): string {
  return checkinStatusLabels[norm(status)] ?? status ?? '—';
}

export function checkinStatusBadgeVariant(status?: string | null): BadgeVariant {
  return checkinStatusBadge[norm(status)] ?? 'neutral';
}

export function integrationStatusLabel(status?: string | null): string {
  return integrationStatusLabels[norm(status)] ?? status ?? '—';
}

export function integrationStatusBadgeVariant(status?: string | null): BadgeVariant {
  return integrationStatusBadge[norm(status)] ?? 'neutral';
}

export function conversationStatusLabel(status?: string | null): string {
  return conversationStatusLabels[norm(status)] ?? status ?? '—';
}

export function conversationStatusBadgeVariant(status?: string | null): BadgeVariant {
  return conversationStatusBadge[norm(status)] ?? 'neutral';
}

export function jobStatusLabel(status?: string | null): string {
  return jobStatusLabels[norm(status)] ?? status ?? '—';
}

export const callStatusLabels: Record<string, string> = {
  pending: 'Pendente',
  in_progress: 'Em curso',
  completed: 'Concluída',
  failed: 'Falhou',
  cancelled: 'Cancelada',
};

export const callStatusBadge: Record<string, BadgeVariant> = {
  pending: 'blue',
  in_progress: 'amber',
  completed: 'sage',
  failed: 'red',
  cancelled: 'neutral',
};

export const alertLevelLabels: Record<string, string> = {
  info: 'Informativo',
  warning: 'Atenção',
  critical: 'Crítico',
};

export const alertLevelBadge: Record<string, BadgeVariant> = {
  info: 'blue',
  warning: 'amber',
  critical: 'red',
};

export const taskPriorityLabels: Record<string, string> = {
  low: 'Baixa',
  medium: 'Média',
  high: 'Alta',
  urgent: 'Urgente',
};

export const taskPriorityBadge: Record<string, BadgeVariant> = {
  low: 'neutral',
  medium: 'blue',
  high: 'amber',
  urgent: 'red',
};

export const workflowStatusLabels: Record<string, string> = {
  active: 'Ativo',
  paused: 'Pausado',
  completed: 'Concluído',
  failed: 'Falhou',
};

export const workflowStatusBadge: Record<string, BadgeVariant> = {
  active: 'sage',
  paused: 'amber',
  completed: 'blue',
  failed: 'red',
};

export const checkinStatusLabels: Record<string, string> = {
  pending: 'Pendente',
  completed: 'Concluído',
  skipped: 'Ignorado',
  failed: 'Falhou',
};

export const checkinStatusBadge: Record<string, BadgeVariant> = {
  pending: 'amber',
  completed: 'sage',
  skipped: 'neutral',
  failed: 'red',
};

export const integrationStatusLabels: Record<string, string> = {
  connected: 'Ligado',
  disconnected: 'Desligado',
  error: 'Erro',
};

export const integrationStatusBadge: Record<string, BadgeVariant> = {
  connected: 'sage',
  disconnected: 'neutral',
  error: 'red',
};

export const conversationStatusLabels: Record<string, string> = {
  active: 'Ativa',
  pending: 'Pendente',
  closed: 'Fechada',
};

export const conversationStatusBadge: Record<string, BadgeVariant> = {
  active: 'sage',
  pending: 'amber',
  closed: 'neutral',
};

export const jobStatusLabels: Record<string, string> = {
  pending: 'Pendente',
  running: 'Em execução',
  completed: 'Concluído',
  failed: 'Falhou',
  cancelled: 'Cancelado',
};

export function formatDateTime(iso?: string | null): string {
  if (!iso) return '—';
  const d = new Date(iso);
  if (isNaN(d.getTime())) return '—';
  return d.toLocaleString('pt-PT', {
    day: '2-digit',
    month: 'short',
    hour: '2-digit',
    minute: '2-digit',
  });
}

export function formatTime(iso?: string | null): string {
  if (!iso) return '—';
  const d = new Date(iso);
  if (isNaN(d.getTime())) return '—';
  return d.toLocaleTimeString('pt-PT', { hour: '2-digit', minute: '2-digit' });
}

export function formatRelative(iso?: string | null): string {
  if (!iso) return '—';
  const d = new Date(iso);
  if (isNaN(d.getTime())) return '—';
  const diff = Date.now() - d.getTime();
  const mins = Math.round(diff / 60000);
  if (mins < 1) return 'agora mesmo';
  if (mins < 60) return `há ${mins} min`;
  const hours = Math.round(mins / 60);
  if (hours < 24) return `há ${hours} h`;
  const days = Math.round(hours / 24);
  return `há ${days} dia${days > 1 ? 's' : ''}`;
}

export function scoreTone(score?: number | null): { text: string; bar: string } {
  const s = score ?? 0;
  if (s >= 70) return { text: 'text-primary-700', bar: 'bg-primary-600' };
  if (s >= 45) return { text: 'text-gold-600', bar: 'bg-gold-400' };
  if (s >= 25) return { text: 'text-amber-600', bar: 'bg-amber-500' };
  return { text: 'text-red-600', bar: 'bg-red-500' };
}
