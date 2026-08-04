'use client';

import { useEffect, useState, useMemo } from 'react';
import Link from 'next/link';
import { api } from '@/lib/api';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { MetricCard } from '@/components/ui/metric-card';
import { EmptyState } from '@/components/ui/empty-state';
import { Avatar } from '@/components/ui/avatar';
import { Drawer } from '@/components/ui/drawer';
import {
  Play,
  RotateCcw,
  ArrowRight,
  CheckCircle2,
  XCircle,
  Clock3,
} from 'lucide-react';
import { formatRelative, riskLabel } from '@/lib/status';

const JOURNEY_STEPS = [
  { id: 'capture', title: 'Captação do lead' },
  { id: 'qualify', title: 'Qualificação automática' },
  { id: 'whatsapp', title: 'Conversa WhatsApp' },
  { id: 'voice', title: 'Chamada IA de voz' },
  { id: 'appointment', title: 'Agendamento' },
  { id: 'pipeline', title: 'Movimento no pipeline' },
  { id: 'convert', title: 'Conversão em cliente' },
  { id: 'onboarding', title: 'Onboarding' },
  { id: 'checkin', title: 'Check-in' },
  { id: 'risk', title: 'Deteção de risco' },
  { id: 'alert-task', title: 'Alerta e tarefa' },
  { id: 'followup', title: 'Acompanhamento' },
  { id: 'portal', title: 'Portal do cliente' },
  { id: 'history', title: 'Histórico no CRM' },
];

export default function DashboardPage() {
  const [stats, setStats] = useState<any>({});
  const [atRisk, setAtRisk] = useState<any[]>([]);
  const [pendingCheckIns, setPendingCheckIns] = useState<any[]>([]);
  const [tasks, setTasks] = useState<any[]>([]);

  const [demoStatus, setDemoStatus] = useState<any>(null);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [running, setRunning] = useState(false);
  const [journey, setJourney] = useState<any[] | null>(null);
  const [demoMsg, setDemoMsg] = useState('');

  const load = () => {
    Promise.all([
      api.getPipelineStats().catch(() => ({})),
      api.getAtRiskCustomers().catch(() => []),
      api.getPendingCheckIns().catch(() => []),
      api.getDemoStatus().catch(() => null),
      api.getTasks().catch(() => []),
    ])
      .then(([s, r, c, d, t]) => {
        setStats(s);
        setAtRisk(r);
        setPendingCheckIns(c);
        setDemoStatus(d);
        setTasks(t);
      });
  };

  useEffect(() => {
    load();
  }, []);

  const runJourney = async () => {
    setRunning(true);
    setDemoMsg('');
    setJourney(null);
    setDrawerOpen(true);
    try {
      const result = await api.runDemoJourney();
      setJourney(result.steps || []);
      setDemoMsg(
        result.success
          ? 'Demonstração concluída — todos os passos executados e registados no CRM.'
          : 'A demonstração terminou com erros em alguns passos.'
      );
      await load();
    } catch (e: any) {
      setDemoMsg(e.message || 'Erro ao correr a demonstração');
    } finally {
      setRunning(false);
    }
  };

  const resetDemo = async () => {
    if (!confirm('Repor a demonstração? Elimina os dados criados pela demo (não afeta leads/clientes reais).'))
      return;
    setRunning(true);
    try {
      const res = await api.resetDemo();
      setDemoMsg(
        `Demonstração reposta (${Object.values(res.deleted || {}).reduce((a: any, b: any) => a + b, 0)} registos removidos).`
      );
      setJourney(null);
      setDemoStatus(null);
      await load();
    } catch (e: any) {
      setDemoMsg(e.message || 'Erro ao repor a demonstração');
    } finally {
      setRunning(false);
    }
  };

  const maxStageCount = Math.max(1, ...(stats.stages ?? []).map((s: any) => s.count));
  const totalLeads = stats.total ?? 0;
  const openTasks = tasks.filter((t: any) => !t.completedAt);

  const attentionList = useMemo(() => {
    const items: {
      id: string;
      kind: 'risk' | 'checkin' | 'task';
      name: string;
      detail: string;
      when: string | null;
      href?: string;
      level: string;
    }[] = [];
    atRisk.forEach((c) =>
      items.push({
        id: `r-${c.id}`,
        kind: 'risk',
        name: c.lead?.name || 'Cliente',
        detail: `Risco ${Math.round(c.churnRisk * 100)}% · ${riskLabel(c.churnRisk >= 0.7 ? 'HIGH' : c.churnRisk >= 0.5 ? 'MEDIUM' : 'LOW')}`,
        when: null,
        href: `/customers/${c.id}`,
        level: c.churnRisk >= 0.7 ? 'high' : 'medium',
      })
    );
    pendingCheckIns.forEach((ci) =>
      items.push({
        id: `c-${ci.id}`,
        kind: 'checkin',
        name: ci.customer?.lead?.name || 'Cliente',
        detail: `Check-in ${ci.type ?? ''} aguarda resposta`.trim(),
        when: ci.scheduledAt,
        href: `/acompanhamento?tab=checkins`,
        level: 'medium',
      })
    );
    openTasks.forEach((t) =>
      items.push({
        id: `t-${t.id}`,
        kind: 'task',
        name: t.title || 'Tarefa',
        detail: t.description || t.priority || 'Tarefa aberta',
        when: t.dueAt ?? t.createdAt,
        href: `/acompanhamento?tab=tarefas`,
        level: t.priority === 'urgent' ? 'high' : 'normal',
      })
    );
    return items
      .sort((a, b) => {
        const rank: Record<string, number> = { high: 0, medium: 1, normal: 2 };
        if (a.level !== b.level) return rank[a.level] - rank[b.level];
        return (b.when ? new Date(b.when).getTime() : 0) - (a.when ? new Date(a.when).getTime() : 0);
      })
      .slice(0, 8);
  }, [atRisk, pendingCheckIns, openTasks]);

  const doneSteps = journey ? journey.filter((s) => s.status === 'ok').length : 0;

  return (
    <div className="space-y-6">
      <div className="relative overflow-hidden rounded-2xl border border-border/60 bg-[linear-gradient(135deg,#16201a_0%,#1a2a22_55%,#223529_100%)] px-6 py-7 text-white shadow-card sm:px-8">
        <div
          className="pointer-events-none absolute inset-0 opacity-80"
          style={{
            backgroundImage:
              'radial-gradient(600px 260px at 90% -20%, hsl(156 24% 45% / 0.4), transparent 60%), radial-gradient(400px 240px at -10% 120%, hsl(38 45% 55% / 0.15), transparent 60%)',
          }}
        />
        <div className="relative flex flex-wrap items-center justify-between gap-4">
          <div>
            <p className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/[0.07] px-3 py-1 text-[11px] font-medium uppercase tracking-[0.14em] text-primary-100">
              <span className="h-1.5 w-1.5 animate-pulse-soft rounded-full bg-gold-300" />
              Demo interativa
            </p>
            <h1 className="mt-3 text-2xl font-semibold tracking-tight sm:text-[28px]">
              Bem-vindo ao Longevity Platform
            </h1>
            <p className="mt-1.5 max-w-xl text-sm leading-relaxed text-white/60">
              Reproduza o percurso completo de um cliente — do lead ao acompanhamento —
              ou explore os indicadores da clínica em tempo real.
            </p>
          </div>
          <div className="flex shrink-0 flex-wrap items-center gap-2.5">
            <button
              onClick={resetDemo}
              disabled={running}
              className="inline-flex h-10 items-center gap-2 rounded-lg border border-white/15 bg-white/[0.06] px-4 text-sm font-medium text-white/85 backdrop-blur transition-colors hover:bg-white/[0.12] disabled:opacity-45"
            >
              <RotateCcw className="h-4 w-4" /> Repor demo
            </button>
            <button
              onClick={runJourney}
              disabled={running}
              className="inline-flex h-10 items-center gap-2 rounded-lg bg-gradient-to-b from-gold-400 to-gold-600 px-5 text-sm font-semibold text-white shadow-[0_1px_2px_rgba(26,32,28,0.3),0_6px_18px_-4px_hsl(38_45%_50%/0.55)] ring-1 ring-inset ring-white/20 transition-all hover:from-gold-300 hover:to-gold-500 active:scale-[0.98] disabled:opacity-45"
            >
              {running ? (
                <>
                  <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/30 border-t-white" />
                  A executar…
                </>
              ) : (
                <>
                  <Play className="h-4 w-4" /> Reproduzir demonstração
                </>
              )}
            </button>
          </div>
        </div>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <MetricCard label="Total de leads" value={totalLeads} sub="Em todas as etapas do pipeline" accent="neutral" />
        <MetricCard
          label="Clientes em risco"
          value={atRisk.length}
          sub={atRisk.length > 0 ? 'Necessitam de atenção' : 'Nenhum cliente em risco'}
          accent="red"
        />
        <MetricCard
          label="Check-ins pendentes"
          value={pendingCheckIns.length}
          sub={pendingCheckIns.length > 0 ? 'Aguardam resposta' : 'Tudo em dia'}
          accent="gold"
        />
        <MetricCard
          label="Tarefas abertas"
          value={openTasks.length}
          sub={`${openTasks.filter((t: any) => t.priority === 'urgent').length} urgentes`}
          accent="sage"
        />
      </div>

      {/* Pipeline + Atenção */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-5">
        <Card className="lg:col-span-3">
          <div className="flex items-center justify-between px-6 pt-6">
            <div>
              <h2 className="font-semibold tracking-tight text-foreground">Pipeline comercial</h2>
              <p className="mt-0.5 text-[13px] text-muted-foreground">
                {totalLeads} leads por etapa
              </p>
            </div>
            <Link
              href="/leads"
              className="inline-flex items-center gap-1 text-[13px] font-medium text-primary-700 hover:underline"
            >
              Ver leads <ArrowRight className="h-3.5 w-3.5" />
            </Link>
          </div>
          <div className="p-6 pt-4">
            {stats.stages && stats.stages.length > 0 ? (
              <div className="space-y-4">
                {stats.stages.map((stage: any) => {
                  const pct = Math.round((stage.count / maxStageCount) * 100);
                  return (
                    <div key={stage.name}>
                      <div className="mb-1.5 flex items-center justify-between text-[13px]">
                        <span className="flex items-center gap-2 font-medium text-foreground">
                          <span className="h-2 w-2 rounded-full" style={{ backgroundColor: stage.color }} />
                          {stage.name}
                        </span>
                        <span className="font-semibold text-foreground">{stage.count}</span>
                      </div>
                      <div className="h-2 overflow-hidden rounded-full bg-muted">
                        <div
                          className="h-full rounded-full transition-all duration-700"
                          style={{ width: `${Math.max(pct, 4)}%`, backgroundColor: stage.color }}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <EmptyState title="Sem leads no pipeline" description="Os leads captados aparecerão aqui organizados por etapa." />
            )}
          </div>
        </Card>

        <Card className="lg:col-span-2">
          <div className="flex items-center justify-between px-6 pt-6">
            <div>
              <h2 className="font-semibold tracking-tight text-foreground">Precisa de atenção</h2>
              <p className="mt-0.5 text-[13px] text-muted-foreground">
                Risco, check-ins e tarefas ordenados por urgência
              </p>
            </div>
            <Badge variant={attentionList.length > 0 ? 'red' : 'sage'} dot>
              {attentionList.length}
            </Badge>
          </div>
          <div className="p-6 pt-4">
            {attentionList.length === 0 ? (
              <EmptyState title="Nada a tratar" description="Sem riscos, check-ins ou tarefas pendentes." />
            ) : (
              <div className="space-y-1">
                {attentionList.map((item) => (
                  <Link
                    key={item.id}
                    href={item.href || '#'}
                    className="group flex items-center gap-3 rounded-xl px-2.5 py-2.5 transition-colors hover:bg-muted/60"
                  >
                    <Avatar name={item.name} size="sm" />
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-[13px] font-medium text-foreground group-hover:text-primary-800">
                        {item.name}
                      </p>
                      <p className="truncate text-xs text-muted-foreground">{item.detail}</p>
                    </div>
                    <span className="shrink-0 text-[11px] text-muted-foreground/80">
                      {item.when ? formatRelative(item.when) : 'agora'}
                    </span>
                  </Link>
                ))}
              </div>
            )}
          </div>
        </Card>
      </div>

      {/* Drawer de demonstração */}
      <Drawer
        open={drawerOpen}
        onClose={() => setDrawerOpen(false)}
        title="Demonstração da plataforma"
        subtitle={
          demoStatus?.lead
            ? `${demoStatus.lead.name} · score ${demoStatus.lead.score}${demoStatus.customer ? ` · risco ${Math.round(demoStatus.customer.churnRisk * 100)}%` : ''}`
            : 'Percurso completo de um cliente'
        }
        footer={
          <>
            <Button variant="outline" onClick={resetDemo} disabled={running}>
              <RotateCcw className="h-4 w-4" /> Repor demo
            </Button>
            <Button onClick={runJourney} loading={running}>
              <Play className="h-4 w-4" /> {journey ? 'Repetir' : 'Iniciar'}
            </Button>
          </>
        }
      >
        {demoMsg && (
          <p
            className={[
              'mb-4 rounded-xl border px-3.5 py-2.5 text-sm animate-fadeIn',
              demoMsg.includes('Erro') || demoMsg.includes('erros')
                ? 'border-red-200 bg-red-50 text-red-700'
                : 'border-primary-200/80 bg-primary-50/60 text-primary-800',
            ].join(' ')}
          >
            {demoMsg}
          </p>
        )}

        {journey && (
          <div className="mb-4">
            <div className="mb-2 flex items-center justify-between text-[13px]">
              <span className="font-medium text-foreground">
                {doneSteps} de {JOURNEY_STEPS.length} passos concluídos
              </span>
              <span className="text-muted-foreground">{Math.round((doneSteps / JOURNEY_STEPS.length) * 100)}%</span>
            </div>
            <div className="h-2 overflow-hidden rounded-full bg-muted">
              <div
                className="h-full rounded-full bg-primary-600 transition-all duration-500"
                style={{ width: `${(doneSteps / JOURNEY_STEPS.length) * 100}%` }}
              />
            </div>
          </div>
        )}

        <div className="space-y-1.5">
          {JOURNEY_STEPS.map((step) => {
            const result = journey?.find((s) => s.id === step.id);
            const ok = result?.status === 'ok';
            const err = result?.status === 'error';
            return (
              <div
                key={step.id}
                className={[
                  'flex items-center gap-2.5 rounded-lg px-2.5 py-2 text-[13px]',
                  ok ? 'bg-primary-50/60 text-foreground' : err ? 'bg-red-50 text-foreground' : 'text-muted-foreground/70',
                ].join(' ')}
              >
                {ok ? (
                  <CheckCircle2 className="h-4 w-4 shrink-0 text-primary-600" />
                ) : err ? (
                  <XCircle className="h-4 w-4 shrink-0 text-red-500" />
                ) : (
                  <Clock3 className="h-4 w-4 shrink-0 text-muted-foreground/50" />
                )}
                <span className="flex-1">{step.title}</span>
                {!journey && !running && (
                  <span className="text-xs text-muted-foreground/50">{step.id === 'capture' ? 'próximo' : ''}</span>
                )}
              </div>
            );
          })}
        </div>
      </Drawer>
    </div>
  );
}
