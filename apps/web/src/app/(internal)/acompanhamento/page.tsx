'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { api } from '@/lib/api';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Modal } from '@/components/ui/modal';
import { EmptyState } from '@/components/ui/empty-state';
import { Avatar } from '@/components/ui/avatar';
import { Tabs } from '@/components/ui/tabs';
import { PageHeader } from '@/components/ui/page-header';
import { CheckCircle2, ClipboardCheck, ListChecks, BellRing, CalendarPlus, AlertTriangle } from 'lucide-react';
import { formatRelative, formatDateTime, norm } from '@/lib/status';

type Tab = 'checkins' | 'tarefas' | 'alertas';

const CHECKIN_STATUS: Record<string, { label: string; variant: any }> = {
  pending: { label: 'Pendente', variant: 'gold' },
  sent: { label: 'Enviado', variant: 'blue' },
  completed: { label: 'Completo', variant: 'sage' },
  skipped: { label: 'Ignorado', variant: 'neutral' },
  overdue: { label: 'Em atraso', variant: 'red' },
};

const TASK_STATUS: Record<string, string> = {
  pending: 'Pendente',
  in_progress: 'Em curso',
  completed: 'Concluída',
  cancelled: 'Cancelada',
};

const ALERT_LEVEL: Record<string, { label: string; variant: any }> = {
  normal: { label: 'Normal', variant: 'neutral' },
  attention: { label: 'Atenção', variant: 'gold' },
  priority: { label: 'Prioritário', variant: 'amber' },
  urgent: { label: 'Urgente', variant: 'red' },
};

const CHECKIN_TYPES = ['ENERGY', 'SLEEP', 'STRESS', 'MOOD', 'ADHERENCE', 'SATISFACTION'];
const CHECKIN_CHANNELS = ['WHATSAPP', 'APP', 'VOICE', 'EMAIL'];

export default function AcompanhamentoPage() {
  const [tab, setTab] = useState<Tab>('checkins');
  const [checkins, setCheckins] = useState<any[]>([]);
  const [tasks, setTasks] = useState<any[]>([]);
  const [alerts, setAlerts] = useState<any[]>([]);
  const [customers, setCustomers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState('');

  const [newModal, setNewModal] = useState(false);
  const [newCheckin, setNewCheckin] = useState({ customerId: '', type: 'ENERGY', channel: 'WHATSAPP', scheduledAt: '' });

  useEffect(() => {
    const t = new URLSearchParams(window.location.search).get('tab');
    if (t === 'checkins' || t === 'tarefas' || t === 'alertas') setTab(t);
  }, []);

  const load = () => {
    Promise.all([
      api.getCheckins({ limit: '100' }).then((r) => r.data || []).catch(() => []),
      api.getTasks({ limit: '100' }).catch(() => []),
      api.getAlerts({ limit: '100' }).catch(() => []),
      api.getCustomers({ limit: '100' }).then((r) => r.data || []).catch(() => []),
    ])
      .then(([c, t, a, cust]) => {
        setCheckins(c);
        setTasks(t);
        setAlerts(a);
        setCustomers(cust);
      })
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    load();
  }, []);

  const openTasks = tasks.filter((t: any) => norm(t.status) !== 'completed' && norm(t.status) !== 'cancelled');
  const openAlerts = alerts.filter((a: any) => !a.resolvedAt);

  const counts = useMemo(
    () => ({
      checkins: checkins.filter((c) => ['PENDING', 'SENT', 'OVERDUE'].includes(norm(c.status).toUpperCase())).length,
      tarefas: openTasks.length,
      alertas: openAlerts.length,
    }),
    [checkins, openTasks, openAlerts]
  );

  const scheduleCheckin = async () => {
    if (!newCheckin.customerId || !newCheckin.scheduledAt) {
      setMessage('Escolha um cliente, uma data e uma hora.');
      return;
    }
    setBusy(true);
    setMessage('');
    try {
      await api.scheduleCheckIn({
        customerId: newCheckin.customerId,
        type: newCheckin.type,
        channel: newCheckin.channel,
        scheduledAt: new Date(newCheckin.scheduledAt).toISOString(),
      });
      setNewModal(false);
      setNewCheckin({ customerId: '', type: 'ENERGY', channel: 'WHATSAPP', scheduledAt: '' });
      await load();
    } catch (e: any) {
      setMessage(e.message || 'Erro ao agendar check-in');
    } finally {
      setBusy(false);
    }
  };

  const completeTask = async (id: string) => {
    setBusy(true);
    try {
      await api.completeTask(id);
      await load();
    } finally {
      setBusy(false);
    }
  };

  const resolveAlert = async (id: string) => {
    setBusy(true);
    try {
      await api.resolveAlert(id);
      await load();
    } finally {
      setBusy(false);
    }
  };

  const customerHref = (c: any) => (c?.customer?.id ? `/customers/${c.customer.id}` : '#');
  const customerName = (c: any) => c?.customer?.lead?.name || 'Cliente';

  return (
    <div className="space-y-5">
      <PageHeader
        title="Acompanhamento"
        subtitle="Check-ins, tarefas e alertas — tudo o que precisa de atenção."
        actions={
          tab === 'checkins' && (
            <Button onClick={() => setNewModal(true)}>
              <CalendarPlus className="h-4 w-4" /> Agendar check-in
            </Button>
          )
        }
      />

      <Tabs<Tab>
        tabs={[
          { key: 'checkins', label: 'Check-ins', count: counts.checkins },
          { key: 'tarefas', label: 'Tarefas', count: counts.tarefas },
          { key: 'alertas', label: 'Alertas', count: counts.alertas },
        ]}
        active={tab}
        onChange={setTab}
      />

      {message && (
        <div className="flex items-center gap-2.5 rounded-xl border border-red-200 bg-red-50 px-4 py-2.5 text-sm text-red-700 animate-fadeIn">
          <AlertTriangle className="h-4 w-4 shrink-0" />
          {message}
        </div>
      )}

      {/* ── Check-ins ── */}
      {tab === 'checkins' && (
        <Card className="overflow-hidden">
          <div className="border-b border-border/70 px-6 py-3.5">
            <h2 className="text-sm font-semibold tracking-tight text-foreground">Check-ins de bem-estar</h2>
          </div>
          {loading ? (
            <div className="space-y-3 p-6">
              {[0, 1, 2].map((i) => (
                <div key={i} className="h-14 animate-pulse rounded-xl bg-sand-100" />
              ))}
            </div>
          ) : checkins.length === 0 ? (
            <EmptyState icon={<ClipboardCheck />} title="Sem check-ins" description="Os questionários enviados aparecerão aqui." className="min-h-[280px]" />
          ) : (
            <div className="divide-y divide-border/50">
              {checkins.map((ci) => {
                const st = norm(ci.status);
                return (
                  <div key={ci.id} className="flex items-center gap-4 px-6 py-3.5">
                    <Link href={customerHref(ci)} className="flex min-w-0 flex-1 items-center gap-3">
                      <Avatar name={customerName(ci)} size="sm" />
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-sm font-medium text-foreground hover:text-primary-800">
                          {customerName(ci)}
                        </p>
                        <p className="truncate text-xs capitalize text-muted-foreground">
                          {norm(ci.type)} · {norm(ci.channel)} · {ci.scheduledAt ? formatDateTime(ci.scheduledAt) : ''}
                        </p>
                      </div>
                    </Link>
                    <span className="shrink-0 text-[11px] text-muted-foreground/70">
                      {formatRelative(ci.scheduledAt)}
                    </span>
                    <Badge variant={CHECKIN_STATUS[st]?.variant ?? 'neutral'} size="sm" dot>
                      {CHECKIN_STATUS[st]?.label ?? ci.status}
                    </Badge>
                  </div>
                );
              })}
            </div>
          )}
        </Card>
      )}

      {/* ── Tarefas ── */}
      {tab === 'tarefas' && (
        <Card className="overflow-hidden">
          <div className="border-b border-border/70 px-6 py-3.5">
            <h2 className="text-sm font-semibold tracking-tight text-foreground">Tarefas</h2>
          </div>
          {loading ? (
            <div className="space-y-3 p-6">
              {[0, 1, 2].map((i) => (
                <div key={i} className="h-14 animate-pulse rounded-xl bg-sand-100" />
              ))}
            </div>
          ) : tasks.length === 0 ? (
            <EmptyState icon={<ListChecks />} title="Sem tarefas" description="As tarefas criadas aparecerão aqui." className="min-h-[280px]" />
          ) : (
            <div className="divide-y divide-border/50">
              {tasks.map((t) => {
                const done = norm(t.status) === 'completed';
                return (
                  <div key={t.id} className="flex items-center gap-4 px-6 py-3.5">
                    <div className="min-w-0 flex-1">
                      <p className={done ? 'text-sm font-medium text-muted-foreground line-through' : 'text-sm font-medium text-foreground'}>
                        {t.title}
                      </p>
                      {t.description && (
                        <p className="truncate text-xs text-muted-foreground">{t.description}</p>
                      )}
                      <p className="text-[11px] capitalize text-muted-foreground/70">
                        {TASK_STATUS[norm(t.status)] ?? t.status}
                        {t.dueAt ? ` · até ${formatRelative(t.dueAt)}` : ''}
                      </p>
                    </div>
                    {t.priority && norm(t.priority) !== 'low' && (
                      <Badge variant={norm(t.priority) === 'urgent' || norm(t.priority) === 'high' ? 'red' : 'amber'} size="sm">
                        {norm(t.priority)}
                      </Badge>
                    )}
                    {!done && (
                      <Button size="sm" variant="outline" loading={busy} onClick={() => completeTask(t.id)}>
                        <CheckCircle2 className="h-3.5 w-3.5" /> Concluir
                      </Button>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </Card>
      )}

      {/* ── Alertas ── */}
      {tab === 'alertas' && (
        <Card className="overflow-hidden">
          <div className="border-b border-border/70 px-6 py-3.5">
            <h2 className="text-sm font-semibold tracking-tight text-foreground">Alertas</h2>
          </div>
          {loading ? (
            <div className="space-y-3 p-6">
              {[0, 1, 2].map((i) => (
                <div key={i} className="h-14 animate-pulse rounded-xl bg-sand-100" />
              ))}
            </div>
          ) : alerts.length === 0 ? (
            <EmptyState icon={<BellRing />} title="Sem alertas" description="Os alertas gerados aparecerão aqui." className="min-h-[280px]" />
          ) : (
            <div className="divide-y divide-border/50">
              {alerts.map((a) => {
                const lvl = norm(a.level);
                const resolved = !!a.resolvedAt;
                return (
                  <div key={a.id} className="flex items-center gap-4 px-6 py-3.5">
                    <Link href={customerHref(a)} className="flex min-w-0 flex-1 items-center gap-3">
                      <Avatar name={customerName(a)} size="sm" />
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-sm font-medium text-foreground">{a.title}</p>
                        <p className="truncate text-xs text-muted-foreground">
                          {customerName(a)} · {formatRelative(a.createdAt)}
                        </p>
                      </div>
                    </Link>
                    <Badge variant={ALERT_LEVEL[lvl]?.variant ?? 'neutral'} size="sm" dot>
                      {ALERT_LEVEL[lvl]?.label ?? a.level}
                    </Badge>
                    {!resolved && (
                      <Button size="sm" variant="outline" loading={busy} onClick={() => resolveAlert(a.id)}>
                        <CheckCircle2 className="h-3.5 w-3.5" /> Resolver
                      </Button>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </Card>
      )}

      {/* Modal novo check-in */}
      <Modal
        open={newModal}
        onClose={() => setNewModal(false)}
        title="Agendar check-in"
        subtitle="Envia um questionário de bem-estar a um cliente"
      >
        <div className="space-y-4">
          <div className="space-y-1.5">
            <label className="text-[13px] font-medium text-foreground">Cliente</label>
            <select
              value={newCheckin.customerId}
              onChange={(e) => setNewCheckin({ ...newCheckin, customerId: e.target.value })}
              className="input-base bg-white"
            >
              <option value="">Selecionar cliente…</option>
              {customers.map((c) => (
                <option key={c.id} value={c.id}>{c.lead?.name}</option>
              ))}
            </select>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <label className="text-[13px] font-medium text-foreground">Tipo</label>
              <select
                value={newCheckin.type}
                onChange={(e) => setNewCheckin({ ...newCheckin, type: e.target.value })}
                className="input-base bg-white"
              >
                {CHECKIN_TYPES.map((t) => (
                  <option key={t} value={t}>{t.charAt(0) + t.slice(1).toLowerCase()}</option>
                ))}
              </select>
            </div>
            <div className="space-y-1.5">
              <label className="text-[13px] font-medium text-foreground">Canal</label>
              <select
                value={newCheckin.channel}
                onChange={(e) => setNewCheckin({ ...newCheckin, channel: e.target.value })}
                className="input-base bg-white"
              >
                {CHECKIN_CHANNELS.map((c) => (
                  <option key={c} value={c}>{c.charAt(0) + c.slice(1).toLowerCase()}</option>
                ))}
              </select>
            </div>
          </div>
          <div className="space-y-1.5">
            <label className="text-[13px] font-medium text-foreground">Data e hora</label>
            <input
              type="datetime-local"
              value={newCheckin.scheduledAt}
              onChange={(e) => setNewCheckin({ ...newCheckin, scheduledAt: e.target.value })}
              className="input-base"
            />
          </div>
        </div>
        <div className="mt-5 flex justify-end gap-2.5">
          <Button variant="outline" onClick={() => setNewModal(false)}>Cancelar</Button>
          <Button onClick={scheduleCheckin} loading={busy}>
            <CalendarPlus className="h-4 w-4" /> Agendar
          </Button>
        </div>
      </Modal>
    </div>
  );
}
