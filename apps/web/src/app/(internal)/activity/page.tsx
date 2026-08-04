'use client';

import { useEffect, useState } from 'react';
import { api } from '@/lib/api';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { PageHeader } from '@/components/ui/page-header';
import { EmptyState } from '@/components/ui/empty-state';
import { SkeletonList } from '@/components/ui/skeleton';
import { Avatar } from '@/components/ui/avatar';
import { Bell, AlertTriangle, ListTodo, CheckCheck, CheckCircle2 } from 'lucide-react';
import { taskPriorityLabel, taskPriorityBadgeVariant, alertLevelLabel, alertLevelBadgeVariant, formatRelative } from '@/lib/status';
import { clsx } from 'clsx';

export default function ActivityPage() {
  const [notifications, setNotifications] = useState<any[]>([]);
  const [alerts, setAlerts] = useState<any[]>([]);
  const [tasks, setTasks] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [busyId, setBusyId] = useState('');

  const load = async () => {
    const [n, a, t] = await Promise.all([
      api.getNotifications().catch(() => []),
      api.getAlerts({ limit: '100' }).catch(() => []),
      api.getTasks({ limit: '100' }).catch(() => []),
    ]);
    setNotifications(n);
    setAlerts(a);
    setTasks(t);
  };

  useEffect(() => {
    load().finally(() => setLoading(false));
  }, []);

  const act = async (fn: () => Promise<any>, id: string) => {
    setBusyId(id);
    try {
      await fn();
      await load();
    } finally {
      setBusyId('');
    }
  };

  if (loading) {
    return (
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <div className="card-surface p-6"><SkeletonList rows={5} /></div>
        <div className="card-surface p-6"><SkeletonList rows={5} /></div>
        <div className="card-surface p-6"><SkeletonList rows={5} /></div>
      </div>
    );
  }

  const notifDot = (n: any) =>
    n.level === 'critical' || n.type === 'ALERT'
      ? 'bg-red-500'
      : n.level === 'warning'
        ? 'bg-amber-500'
        : 'bg-primary-500';

  return (
    <div className="space-y-6">
      <PageHeader
        title="Atividade"
        subtitle="Notificações, alertas de risco e tarefas da equipa num só lugar"
      />

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        {/* Notificações */}
        <Card className="overflow-hidden">
          <div className="flex items-center gap-3 border-b border-border/70 px-6 py-4">
            <span className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-primary-50 text-primary-700 ring-1 ring-primary-100">
              <Bell className="h-4 w-4" />
            </span>
            <div>
              <h2 className="text-sm font-semibold tracking-tight text-foreground">Notificações</h2>
              <p className="text-xs text-muted-foreground">
                {notifications.filter((n) => !n.readAt).length} por ler · {notifications.length} no total
              </p>
            </div>
          </div>
          <div className="thin-scrollbar max-h-[560px] divide-y divide-border/50 overflow-y-auto">
            {notifications.length === 0 ? (
              <EmptyState
                icon={<Bell />}
                title="Sem notificações"
                description="Os avisos do sistema aparecerão aqui."
              />
            ) : (
              notifications.slice(0, 15).map((n) => (
                <div
                  key={n.id}
                  className={clsx('px-5 py-3.5 transition-colors', !n.readAt ? 'bg-primary-50/40' : 'hover:bg-muted/40')}
                >
                  <div className="flex items-start gap-3">
                    <span className={clsx('mt-1.5 h-2 w-2 shrink-0 rounded-full', notifDot(n))} />
                    <div className="min-w-0 flex-1">
                      <p className="text-[13px] font-medium text-foreground">{n.title}</p>
                      {n.body && <p className="mt-0.5 text-xs text-muted-foreground">{n.body}</p>}
                      <p className="mt-1 flex items-center gap-1.5 text-[11px] text-muted-foreground/70">
                        {formatRelative(n.sentAt ?? n.createdAt)} · {n.type}
                      </p>
                    </div>
                    {!n.readAt && (
                      <Button
                        size="sm"
                        variant="ghost"
                        loading={busyId === n.id}
                        onClick={() => act(() => api.readNotification(n.id), n.id)}
                        className="shrink-0"
                      >
                        <CheckCheck className="h-3.5 w-3.5" /> Lida
                      </Button>
                    )}
                  </div>
                </div>
              ))
            )}
          </div>
        </Card>

        {/* Alertas */}
        <Card className="overflow-hidden">
          <div className="flex items-center gap-3 border-b border-border/70 px-6 py-4">
            <span className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-red-50 text-red-600 ring-1 ring-red-100">
              <AlertTriangle className="h-4 w-4" />
            </span>
            <div>
              <h2 className="text-sm font-semibold tracking-tight text-foreground">Alertas de risco</h2>
              <p className="text-xs text-muted-foreground">
                {alerts.filter((a) => !a.resolvedAt).length} ativos · {alerts.length} no total
              </p>
            </div>
          </div>
          <div className="thin-scrollbar max-h-[560px] divide-y divide-border/50 overflow-y-auto">
            {alerts.length === 0 ? (
              <EmptyState
                icon={<AlertTriangle />}
                title="Sem alertas"
                description="Os alertas de risco clínico aparecerão aqui."
              />
            ) : (
              alerts.map((a) => (
                <div
                  key={a.id}
                  className={clsx('px-5 py-3.5', a.resolvedAt ? 'opacity-60' : 'bg-red-50/20')}
                >
                  <div className="flex items-start gap-3">
                    <span
                      className={clsx(
                        'mt-0.5 inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-lg ring-1 [&>svg]:h-3.5 [&>svg]:w-3.5',
                        a.resolvedAt ? 'bg-sand-100 text-sand-500 ring-sand-200' : 'bg-red-50 text-red-500 ring-red-100'
                      )}
                    >
                      {a.resolvedAt ? <CheckCircle2 /> : <AlertTriangle />}
                    </span>
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <p className="text-[13px] font-medium text-foreground">{a.title}</p>
                        <Badge variant={alertLevelBadgeVariant(a.level)} size="xs">
                          {alertLevelLabel(a.level)}
                        </Badge>
                      </div>
                      {a.message && <p className="mt-0.5 text-xs text-muted-foreground">{a.message}</p>}
                      <p className="mt-1 flex items-center gap-1.5 text-[11px] text-muted-foreground/70">
                        <Avatar name={a.customer?.lead?.name} size="xs" />
                        {a.customer?.lead?.name || 'Cliente'} · {formatRelative(a.createdAt)}
                      </p>
                    </div>
                    {!a.resolvedAt && (
                      <Button
                        size="sm"
                        variant="outline"
                        loading={busyId === a.id}
                        onClick={() => act(() => api.resolveAlert(a.id), a.id)}
                        className="shrink-0"
                      >
                        <CheckCircle2 className="h-3.5 w-3.5" /> Resolver
                      </Button>
                    )}
                  </div>
                </div>
              ))
            )}
          </div>
        </Card>

        {/* Tarefas */}
        <Card className="overflow-hidden">
          <div className="flex items-center gap-3 border-b border-border/70 px-6 py-4">
            <span className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-gold-50 text-gold-700 ring-1 ring-gold-100">
              <ListTodo className="h-4 w-4" />
            </span>
            <div>
              <h2 className="text-sm font-semibold tracking-tight text-foreground">Tarefas</h2>
              <p className="text-xs text-muted-foreground">
                {tasks.filter((t) => t.status !== 'COMPLETED').length} por concluir · {tasks.length} no total
              </p>
            </div>
          </div>
          <div className="thin-scrollbar max-h-[560px] divide-y divide-border/50 overflow-y-auto">
            {tasks.length === 0 ? (
              <EmptyState
                icon={<ListTodo />}
                title="Sem tarefas"
                description="As tarefas geradas (manuais ou automáticas) aparecerão aqui."
              />
            ) : (
              tasks.map((t) => {
                const done = t.status === 'COMPLETED' || Boolean(t.completedAt);
                return (
                  <div key={t.id} className={clsx('px-5 py-3.5', done && 'opacity-60')}>
                    <div className="flex items-start gap-3">
                      <span
                        className={clsx(
                          'mt-0.5 inline-flex h-5 w-5 shrink-0 items-center justify-center rounded-full border-2',
                          done ? 'border-primary-600 bg-primary-600' : 'border-border'
                        )}
                      >
                        {done && <CheckCheck className="h-3 w-3 text-white" />}
                      </span>
                      <div className="min-w-0 flex-1">
                        <p className={clsx('text-[13px] font-medium', done ? 'text-muted-foreground line-through' : 'text-foreground')}>
                          {t.title}
                        </p>
                        {t.description && <p className="mt-0.5 text-xs text-muted-foreground">{t.description}</p>}
                        <div className="mt-1.5 flex flex-wrap items-center gap-2">
                          <Badge variant={taskPriorityBadgeVariant(t.priority)} size="xs">
                            {taskPriorityLabel(t.priority)}
                          </Badge>
                          <span className="text-[11px] text-muted-foreground/70">
                            {t.assignedTo?.name || 'Sem responsável'}
                          </span>
                        </div>
                      </div>
                      {!done && (
                        <Button
                          size="sm"
                          variant="soft"
                          loading={busyId === t.id}
                          onClick={() => act(() => api.completeTask(t.id), t.id)}
                          className="shrink-0"
                        >
                          <CheckCheck className="h-3.5 w-3.5" /> Concluir
                        </Button>
                      )}
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </Card>
      </div>
    </div>
  );
}
