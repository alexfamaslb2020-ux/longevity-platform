'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { api } from '@/lib/api';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { MetricCard } from '@/components/ui/metric-card';
import {
  Presentation,
  Users,
  MessagesSquare,
  CalendarClock,
  ClipboardCheck,
  AlertTriangle,
  Workflow,
  ArrowRight,
  ShieldAlert,
  CheckCircle2,
  Clock3,
  XCircle,
} from 'lucide-react';

const ACTS = [
  {
    id: 1,
    title: 'Ato 1 — Captação',
    subtitle: 'A equipa comercial perde menos leads',
    points: [
      'Leads de todos os canais centralizados num só pipeline',
      'Qualificação com score e priorização automática',
      'WhatsApp e IA respondem ao primeiro contacto em segundos',
    ],
    links: [
      { label: 'Pipeline comercial', href: '/pipeline', icon: Users },
      { label: 'Leads e prioridades', href: '/leads', icon: Users },
      { label: 'Conversas WhatsApp', href: '/comunicacoes', icon: MessagesSquare },
    ],
  },
  {
    id: 2,
    title: 'Ato 2 — Conversão',
    subtitle: 'Menos trabalho manual, mais clientes acompanhados',
    points: [
      'Etapas de venda com tarefas e follow-ups automáticos',
      'Agenda integrada com avaliações e check-ups',
      'Conversão de lead em cliente com onboarding automático',
    ],
    links: [
      { label: 'Agenda da equipa', href: '/agenda', icon: CalendarClock },
      { label: 'Clientes ativos', href: '/customers', icon: Users },
      { label: 'Automações ativas', href: '/automations', icon: Workflow },
    ],
  },
  {
    id: 3,
    title: 'Ato 3 — Retenção',
    subtitle: 'O sistema identifica clientes em risco antes de desistirem',
    points: [
      'Check-ins automáticos por WhatsApp avaliam bem-estar continuamente',
      'Alertas de risco (adesão, feedback, inatividade) em tempo real',
      'Intervenção orientada por tarefas e chamadas de voz IA',
    ],
    links: [
      { label: 'Acompanhamento', href: '/acompanhamento', icon: ClipboardCheck },
      { label: 'Check-ins e alertas', href: '/checkins', icon: ClipboardCheck },
      { label: 'Portal do cliente', href: '/portal', icon: Users },
    ],
  },
];

const fmtEuro = (v: number) =>
  v.toLocaleString('pt-PT', { style: 'currency', currency: 'EUR', maximumFractionDigits: 0 });

export default function PresentationPage() {
  const router = useRouter();
  const [data, setData] = useState<any>(null);
  const [health, setHealth] = useState<any>(null);
  const [state, setState] = useState<'loading' | 'ready' | 'disabled' | 'error'>('loading');

  useEffect(() => {
    Promise.all([
      api.get('/presentation/overview').catch((e: any) => {
        throw e;
      }),
      api.get('/presentation/health').catch(() => null),
    ])
      .then(([o, h]) => {
        setData(o);
        setHealth(h);
        setState('ready');
      })
      .catch((e: any) => {
        setState(e?.status === 404 ? 'disabled' : 'error');
      });
  }, []);

  if (state === 'loading') {
    return (
      <div className="space-y-6">
        <div className="h-44 animate-pulse rounded-2xl bg-muted" />
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {[0, 1, 2, 3].map((i) => (
            <div key={i} className="h-28 animate-pulse rounded-2xl bg-muted" />
          ))}
        </div>
      </div>
    );
  }

  if (state === 'disabled') {
    return (
      <Card className="mx-auto mt-16 max-w-lg p-8 text-center">
        <ShieldAlert className="mx-auto h-10 w-10 text-gold-500" />
        <h1 className="mt-4 text-xl font-semibold text-foreground">Modo de apresentação desativado</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Esta página só está disponível quando o ambiente demo é iniciado com
          DEMO_PRESENTATION_MODE=true.
        </p>
      </Card>
    );
  }

  if (state === 'error') {
    return (
      <Card className="mx-auto mt-16 max-w-lg p-8 text-center">
        <XCircle className="mx-auto h-10 w-10 text-red-500" />
        <h1 className="mt-4 text-xl font-semibold text-foreground">Não foi possível carregar a apresentação</h1>
        <p className="mt-2 text-sm text-muted-foreground">Verifique o estado do sistema e tente novamente.</p>
      </Card>
    );
  }

  const c = data.counts;
  const v = data.value;
  const healthItems: { key: string; label: string; icon: any }[] = [
    { key: 'database', label: 'Base de dados', icon: CheckCircle2 },
    { key: 'redis', label: 'Fila de mensagens', icon: CheckCircle2 },
    { key: 'queue', label: 'Automações', icon: Workflow },
    { key: 'ai', label: 'IA (Dify)', icon: CheckCircle2 },
  ];

  return (
    <div className="space-y-6">
      {/* Hero */}
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
              Modo de apresentação comercial
            </p>
            <h1 className="mt-3 text-2xl font-semibold tracking-tight sm:text-[28px]">
              {data.organization.name}
            </h1>
            <p className="mt-1.5 max-w-2xl text-sm leading-relaxed text-white/60">
              Toda a relação com o cliente, da captação à retenção: CRM, automações,
              WhatsApp, IA e acompanhamento contínuo — tudo num só lugar.
            </p>
          </div>
          <div className="flex shrink-0 flex-col items-end gap-2">
            <div className="flex items-center gap-2">
              {healthItems.map(({ key, label, icon: Icon }) => {
                const s = health?.checks?.[key]?.status;
                return (
                  <span
                    key={key}
                    title={label}
                    className={
                      'inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-[11px] font-medium ' +
                      (s === 'ok'
                        ? 'border-emerald-400/25 bg-emerald-400/10 text-emerald-300'
                        : s === 'warning'
                          ? 'border-gold-400/25 bg-gold-400/10 text-gold-300'
                          : 'border-red-400/25 bg-red-400/10 text-red-300')
                    }
                  >
                    <Icon className="h-3 w-3" />
                    {label}
                  </span>
                );
              })}
            </div>
            <p className="text-[11px] text-white/35">
              {health?.overall === 'ok' ? 'Sistema operacional' : 'Verificar estado do sistema'}
            </p>
          </div>
        </div>
      </div>

      {/* Valor estimado */}
      <div>
        <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
          <h2 className="font-semibold tracking-tight text-foreground">Valor estimado da demonstração</h2>
          <Badge variant="outline" className="border-gold-400/40 bg-gold-500/10 text-gold-600">
            Estimativas — não são projeções reais
          </Badge>
        </div>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <MetricCard
            label="Receita recorrente (carteira atual)"
            value={fmtEuro(v.mrr) + '/mês'}
            sub={`${c.activeSubscriptions} clientes com assinatura ativa`}
            accent="sage"
          />
          <MetricCard
            label="Potencial dos leads em pipeline"
            value={fmtEuro(v.potentialMonthly) + '/mês'}
            sub={`${c.leadsActive} leads ativos × ticket médio ${fmtEuro(v.avgTicket)}`}
            accent="gold"
          />
          <MetricCard
            label="Receita mensal em risco"
            value={fmtEuro(v.atRiskMonthly) + '/mês'}
            sub={`${c.customersAtRisk} clientes em risco de desistência`}
            accent="red"
          />
          <MetricCard
            label="Horas de equipa poupadas"
            value={`${v.hoursSavedMonthly}h/mês`}
            sub={`${c.checkinsMonth} check-ins automáticos este mês`}
            accent="neutral"
          />
        </div>
        <p className="mt-2 text-[12px] text-muted-foreground">
          {v.disclaimer}
        </p>
      </div>

      {/* Atos da história */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        {ACTS.map((act) => (
          <Card key={act.id} className="flex flex-col">
            <div className="px-6 pt-6">
              <Badge variant="soft" className="text-[11px]">
                Ato {act.id} de 3
              </Badge>
              <h3 className="mt-3 text-lg font-semibold tracking-tight text-foreground">{act.title}</h3>
              <p className="mt-1 text-[13px] font-medium text-primary-700">{act.subtitle}</p>
              <ul className="mt-4 space-y-2.5">
                {act.points.map((p) => (
                  <li key={p} className="flex items-start gap-2.5 text-[13px] leading-relaxed text-muted-foreground">
                    <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-emerald-500" />
                    {p}
                  </li>
                ))}
              </ul>
            </div>
            <div className="mt-auto space-y-2 p-6 pt-5">
              {act.links.map((l) => {
                const Icon = l.icon;
                return (
                  <button
                    key={l.href}
                    onClick={() => router.push(l.href)}
                    className="group flex w-full items-center justify-between rounded-xl border border-border/60 bg-muted/30 px-4 py-2.5 text-left text-[13px] font-medium text-foreground transition-colors hover:border-primary-300/60 hover:bg-primary-500/5"
                  >
                    <span className="inline-flex items-center gap-2.5">
                      <Icon className="h-4 w-4 text-muted-foreground group-hover:text-primary-700" />
                      {l.label}
                    </span>
                    <ArrowRight className="h-3.5 w-3.5 text-muted-foreground group-hover:text-primary-700" />
                  </button>
                );
              })}
            </div>
          </Card>
        ))}
      </div>

      {/* Pressupostos */}
      <Card>
        <div className="px-6 pt-6">
          <h3 className="flex items-center gap-2 font-semibold tracking-tight text-foreground">
            <ShieldAlert className="h-5 w-5 text-gold-500" />
            Pressupostos e notas de transparência
          </h3>
        </div>
        <div className="p-6 pt-3">
          <ul className="space-y-2 text-[13px] leading-relaxed text-muted-foreground">
            {v.assumptions.map((a: any) => (
              <li key={a.label}>
                <span className="font-medium text-foreground">{a.label}: </span>
                {a.description}
              </li>
            ))}
            <li>
              <span className="font-medium text-foreground">Dados: </span>
              todos os nomes, contactos e registos desta demonstração são fictícios;
              os valores apresentados são calculados a partir destes dados de exemplo.
            </li>
            <li className="flex items-center gap-2 pt-1 text-[12px] text-gold-600">
              <Clock3 className="h-3.5 w-3.5" />
              Acompanhe o roteiro completo em docs/demo-presentation.md (8–10 minutos).
            </li>
          </ul>
        </div>
      </Card>
    </div>
  );
}
