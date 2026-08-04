'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { api } from '@/lib/api';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Avatar } from '@/components/ui/avatar';
import { Logo } from '@/components/ui/logo';
import { EmptyState } from '@/components/ui/empty-state';
import { FullPageSpinner } from '@/components/ui/spinner';
import DemoBanner from '@/components/demo-banner';
import {
  LogOut,
  ClipboardCheck,
  CalendarClock,
  MessagesSquare,
  Bell,
  HeartPulse,
  CheckCircle2,
  X,
  Sparkles,
  TrendingUp,
} from 'lucide-react';
import { riskLabel, checkinAlertLabel, formatRelative } from '@/lib/status';
import { clsx } from 'clsx';

const QUESTIONS = [
  { key: 'energy', label: 'Níveis de energia', hint: '1 (muito baixos) a 5 (ótimos)' },
  { key: 'sleep', label: 'Qualidade do sono', hint: '1 (muito má) a 5 (excelente)' },
  { key: 'stress', label: 'Stress diário', hint: '1 (muito alto) a 5 (muito baixo)' },
  { key: 'mood', label: 'Disposição geral', hint: '1 (em baixo) a 5 (muito boa)' },
  { key: 'adherence', label: 'Cumprimento do plano', hint: '1 (nada) a 5 (totalmente)' },
  { key: 'satisfaction', label: 'Satisfação com o programa', hint: '1 (nada) a 5 (muito satisfeito)' },
];

const RESPONSE_LABELS: Record<string, string> = {
  energy: 'Energia',
  sleep: 'Sono',
  stress: 'Stress',
  mood: 'Disposição',
  adherence: 'Adesão',
  satisfaction: 'Satisfação',
  difficulties: 'Dificuldades',
  support_needed: 'Apoio necessário',
};

const LEVEL_STYLES: Record<string, string> = {
  NORMAL: 'bg-sand-100 text-sand-700',
  ATTENTION: 'bg-amber-100 text-amber-700',
  PRIORITY: 'bg-orange-100 text-orange-700',
  URGENT: 'bg-red-100 text-red-700',
};

export default function ClientPortalPage() {
  const router = useRouter();
  const [user, setUser] = useState<any>(null);
  const [customer, setCustomer] = useState<any>(null);
  const [notifications, setNotifications] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const [modalOpen, setModalOpen] = useState(false);
  const [responses, setResponses] = useState<Record<string, number>>({});
  const [difficulties, setDifficulties] = useState('');
  const [supportNeeded, setSupportNeeded] = useState(false);
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState('');
  const [activeCheckIn, setActiveCheckIn] = useState<any>(null);

  useEffect(() => {
    const token = api.getToken();
    if (!token) {
      router.push('/login');
      return;
    }
    api
      .me()
      .then((me) => {
        if (me.role !== 'CLIENT') {
          router.push('/dashboard');
          return;
        }
        setUser(me);
        return Promise.all([api.getMyCustomer().catch(() => null), api.getNotifications().catch(() => [])]);
      })
      .then(([cust, notifs]: any) => {
        setCustomer(cust);
        setNotifications(notifs || []);
      })
      .catch(() => router.push('/login'))
      .finally(() => setLoading(false));
  }, [router]);

  const pendingCheckIns = (customer?.checkIns || []).filter((ci: any) => !ci.completedAt);
  const checkIns = (customer?.checkIns || [])
    .filter((ci: any) => ci.completedAt)
    .sort((a: any, b: any) => new Date(b.completedAt).getTime() - new Date(a.completedAt).getTime());

  const openCheckIn = (ci: any) => {
    setActiveCheckIn(ci);
    setResponses({ energy: 3, sleep: 3, stress: 3, mood: 3, adherence: 3, satisfaction: 3 });
    setDifficulties('');
    setSupportNeeded(false);
    setMsg('');
    setModalOpen(true);
  };

  const submitCheckIn = async () => {
    if (!activeCheckIn) return;
    setSaving(true);
    setMsg('');
    try {
      await api.completeCheckIn(activeCheckIn.id, {
        ...responses,
        difficulties,
        support_needed: supportNeeded,
      });
      setModalOpen(false);
      setMsg('Obrigado! O seu check-in foi registado e a equipa foi notificada.');
      const cust = await api.getMyCustomer();
      setCustomer(cust);
    } catch (e: any) {
      setMsg(e.message || 'Erro ao submeter o check-in');
    } finally {
      setSaving(false);
    }
  };

  const handleLogout = () => {
    api.setToken(null);
    router.push('/login');
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[hsl(42_33%_96%)]">
        <FullPageSpinner label="A preparar o seu portal…" />
      </div>
    );
  }

  const risk = customer?.churnRisk ? Math.round(customer.churnRisk * 100) : null;
  const name = customer?.lead?.name || user?.name?.split(' ')[0] || 'cliente';
  const firstName = String(name || '').split(' ')[0];

  return (
    <div className="min-h-screen bg-[hsl(42_33%_96%)] bg-dots-faint">
      {/* ── Cabeçalho ─────────────────────────────── */}
      <header className="sticky top-0 z-30 border-b border-border/70 bg-white/85 backdrop-blur-md">
        <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-4 sm:px-6">
          <div className="flex items-center gap-3">
            <Logo />
            <div className="hidden md:block">
              <DemoBanner compact />
            </div>
          </div>
          <div className="flex items-center gap-3">
            <span className="hidden text-sm text-muted-foreground sm:block">
              Olá, <span className="font-medium text-foreground">{firstName}</span>
            </span>
            <button
              onClick={handleLogout}
              className="inline-flex h-9 items-center gap-1.5 rounded-lg border border-border bg-white px-3 text-xs font-medium text-muted-foreground shadow-sm transition-colors hover:border-red-200 hover:bg-red-50 hover:text-red-600"
            >
              <LogOut className="h-3.5 w-3.5" /> Sair
            </button>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-6xl space-y-6 px-4 py-8 sm:px-6">
        {!customer ? (
          <Card className="mx-auto max-w-lg p-10">
            <EmptyState
              icon={<HeartPulse />}
              title="Ainda não tem um programa associado"
              description="Quando a equipa ativar o seu programa de longevidade, vai aparecer aqui."
            />
          </Card>
        ) : (
          <>
            {/* ── Boas-vindas ───────────────────────── */}
            <div className="card-surface relative overflow-hidden">
              <div
                className="pointer-events-none absolute inset-0"
                style={{
                  backgroundImage:
                    'radial-gradient(700px 260px at 100% 0%, hsl(156 24% 40% / 0.14), transparent 60%), radial-gradient(500px 240px at 0% 100%, hsl(38 45% 55% / 0.12), transparent 60%)',
                }}
              />
              <div className="relative flex flex-wrap items-center gap-5 p-6 sm:p-7">
                <Avatar name={customer.lead?.name || customer.user?.name || customer.name} size="xl" />
                <div className="min-w-0 flex-1">
                  <p className="text-[13px] font-medium uppercase tracking-wider text-gold-600">
                    Programa {customer.segment || 'Longevidade'}
                  </p>
                  <h1 className="mt-0.5 text-2xl font-semibold tracking-tight text-foreground">
                    Bem-vindo, {firstName}
                  </h1>
                  <p className="mt-1 text-sm text-muted-foreground">
                    Desde {new Date(customer.createdAt).toLocaleDateString('pt-PT', { month: 'long', year: 'numeric' })}{' '}
                    · Estado: <span className="capitalize">{customer.status}</span>
                  </p>
                </div>
                <div className="flex items-center gap-8">
                  <div className="text-center">
                    <p
                      className={clsx(
                        'text-3xl font-semibold leading-none',
                        risk !== null && risk >= 50 ? 'text-red-500' : risk !== null && risk >= 30 ? 'text-gold-600' : 'text-primary-700'
                      )}
                    >
                      {risk !== null ? `${risk}%` : '—'}
                    </p>
                    <p className="mt-1 text-[11px] uppercase tracking-wider text-muted-foreground">
                      Risco de desistência
                    </p>
                  </div>
                  <div className="hidden text-center sm:block">
                    <p className="text-3xl font-semibold leading-none text-primary-700">{checkIns.length}</p>
                    <p className="mt-1 text-[11px] uppercase tracking-wider text-muted-foreground">Check-ins</p>
                  </div>
                </div>
              </div>
            </div>

            {/* ── Check-in disponível ───────────────── */}
            {pendingCheckIns.length > 0 && (
              <div className="card-surface animate-fadeIn overflow-hidden border-l-4 border-l-primary-500">
                <div className="flex flex-wrap items-center gap-4 p-5">
                  <span className="inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-primary-50 text-primary-700 ring-1 ring-primary-100 animate-pulse-soft">
                    <ClipboardCheck className="h-5 w-5" />
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-semibold text-foreground">O seu check-in semanal está disponível</p>
                    <p className="mt-0.5 text-[13px] text-muted-foreground">
                      {pendingCheckIns[0].channel === 'WHATSAPP'
                        ? 'Recebido por WhatsApp'
                        : 'No portal'} · agendado para{' '}
                      {new Date(pendingCheckIns[0].scheduledAt).toLocaleDateString('pt-PT', {
                        day: '2-digit',
                        month: 'long',
                      })}
                    </p>
                  </div>
                  <Button onClick={() => openCheckIn(pendingCheckIns[0])}>
                    <ClipboardCheck className="h-4 w-4" /> Responder agora
                  </Button>
                </div>
              </div>
            )}

            <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
              <div className="space-y-6 lg:col-span-2">
                {/* Evolução */}
                <Card>
                  <div className="flex items-center gap-2.5 px-6 pt-6">
                    <TrendingUp className="h-4 w-4 text-primary-600" />
                    <div>
                      <h2 className="font-semibold tracking-tight text-foreground">A sua evolução</h2>
                      <p className="text-[13px] text-muted-foreground">
                        Resumo dos seus check-ins concluídos
                      </p>
                    </div>
                  </div>
                  <div className="p-6 pt-4">
                    {checkIns.length === 0 ? (
                      <EmptyState
                        icon={<TrendingUp />}
                        title="Sem check-ins concluídos ainda"
                        description="Responda ao seu primeiro check-in para ver aqui a sua evolução."
                      />
                    ) : (
                      <div className="space-y-3">
                        {checkIns.map((ci: any) => (
                          <div key={ci.id} className="rounded-xl border border-border/60 p-4">
                            <div className="flex flex-wrap items-center justify-between gap-2">
                              <p className="text-sm font-medium text-foreground">
                                Check-in {ci.type} ·{' '}
                                {new Date(ci.completedAt).toLocaleDateString('pt-PT', {
                                  day: '2-digit',
                                  month: 'long',
                                  year: 'numeric',
                                })}
                              </p>
                              <span
                                className={clsx(
                                  'rounded-full px-2.5 py-1 text-[11px] font-semibold',
                                  LEVEL_STYLES[ci.alertLevel as string] || 'bg-sand-100 text-sand-700'
                                )}
                              >
                                {ci.alertLevel ? checkinAlertLabel(ci.alertLevel) : 'OK'}
                              </span>
                            </div>
                            {ci.responses && (
                              <div className="mt-3 grid grid-cols-2 gap-2 md:grid-cols-3">
                                {Object.entries(ci.responses).map(([key, val]) => {
                                  const label = RESPONSE_LABELS[key] ?? key.replace(/_/g, ' ');
                                  const isScale = typeof val === 'number' && val >= 1 && val <= 5;
                                  return (
                                    <div key={key} className="rounded-lg bg-muted/60 px-2.5 py-1.5">
                                      <p className="text-[10px] font-medium uppercase tracking-wider text-muted-foreground">
                                        {label}
                                      </p>
                                      <p className="text-sm font-semibold text-foreground">
                                        {isScale ? (
                                          <>
                                            {val}
                                            <span className="text-muted-foreground">/5</span>
                                          </>
                                        ) : key === 'support_needed' ? (
                                          val ? 'Sim' : 'Não'
                                        ) : (
                                          String(val)
                                        )}
                                      </p>
                                    </div>
                                  );
                                })}
                              </div>
                            )}
                            {ci.riskScore !== null && ci.riskScore !== undefined && (
                              <p className="mt-2.5 text-xs font-medium text-foreground">
                                Nível automático:{' '}
                                <span className={ci.riskScore >= 70 ? 'text-red-600' : ci.riskScore >= 45 ? 'text-amber-600' : 'text-primary-700'}>
                                  {ci.riskScore}/100
                                </span>{' '}
                                ({riskLabel(ci.riskLevel)})
                              </p>
                            )}
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </Card>

                {/* Consultas */}
                <Card>
                  <div className="flex items-center gap-2.5 px-6 pt-6">
                    <CalendarClock className="h-4 w-4 text-gold-600" />
                    <div>
                      <h2 className="font-semibold tracking-tight text-foreground">Próximas consultas</h2>
                      <p className="text-[13px] text-muted-foreground">A sua agenda de acompanhamento</p>
                    </div>
                  </div>
                  <div className="p-6 pt-4">
                    {(customer.appointments || []).length === 0 ? (
                      <EmptyState
                        icon={<CalendarClock />}
                        title="Sem consultas agendadas"
                        description="Quando a equipa marcar uma consulta, aparecerá aqui."
                      />
                    ) : (
                      <div className="space-y-2.5">
                        {(customer.appointments as any[]).map((apt: any) => (
                          <div key={apt.id} className="flex flex-wrap items-center gap-3 rounded-xl border border-border/60 p-3.5">
                            <span className="inline-flex h-9 w-9 items-center justify-center rounded-lg bg-gold-50 text-gold-700 ring-1 ring-gold-200">
                              <CalendarClock className="h-4 w-4" />
                            </span>
                            <div className="min-w-0 flex-1">
                              <p className="text-sm font-medium text-foreground">{apt.title}</p>
                              <p className="text-xs text-muted-foreground">
                                {new Date(apt.startDate).toLocaleString('pt-PT')}
                              </p>
                            </div>
                            <Badge variant={apt.status === 'scheduled' ? 'sage' : 'gold'} size="sm">
                              {apt.status}
                            </Badge>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </Card>

                {/* Conversas */}
                <Card>
                  <div className="flex items-center gap-2.5 px-6 pt-6">
                    <MessagesSquare className="h-4 w-4 text-sky-600" />
                    <div>
                      <h2 className="font-semibold tracking-tight text-foreground">As suas conversas</h2>
                      <p className="text-[13px] text-muted-foreground">
                        Últimas interações com a equipa
                      </p>
                    </div>
                  </div>
                  <div className="p-6 pt-4">
                    {(customer.conversations || []).length === 0 ? (
                      <EmptyState
                        icon={<MessagesSquare />}
                        title="Sem conversas"
                        description="As mensagens com a equipa aparecerão aqui."
                      />
                    ) : (
                      <div className="space-y-2.5">
                        {(customer.conversations as any[]).slice(0, 4).map((conv: any) => (
                          <div key={conv.id} className="rounded-xl border border-border/60 bg-muted/30 p-3.5">
                            <div className="flex items-center justify-between">
                              <Badge variant={conv.channel === 'whatsapp' ? 'sage' : 'blue'} size="sm">
                                {conv.channel}
                              </Badge>
                              <span className="text-[11px] text-muted-foreground">
                                {formatRelative(conv.createdAt)}
                              </span>
                            </div>
                            {conv.summary && (
                              <p className="mt-2 text-[13px] italic text-muted-foreground">«{conv.summary}»</p>
                            )}
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </Card>
              </div>

              {/* ── Coluna lateral ──────────────────── */}
              <div className="space-y-6">
                <Card>
                  <div className="flex items-center gap-2.5 px-6 pt-6">
                    <Bell className="h-4 w-4 text-gold-600" />
                    <h2 className="font-semibold tracking-tight text-foreground">Avisos</h2>
                  </div>
                  <div className="space-y-2.5 p-6 pt-4">
                    {notifications.length === 0 ? (
                      <p className="text-sm text-muted-foreground">Sem avisos por agora.</p>
                    ) : (
                      notifications.slice(0, 6).map((n: any) => (
                        <div
                          key={n.id}
                          className={clsx(
                            'rounded-xl border p-3.5',
                            n.readAt ? 'border-border/60 bg-muted/30' : 'border-primary-200/80 bg-primary-50/50'
                          )}
                        >
                          <div className="flex items-start gap-2.5">
                            <span className={clsx('mt-1.5 h-2 w-2 shrink-0 rounded-full', !n.readAt ? 'bg-primary-500' : 'bg-sand-300')} />
                            <div className="min-w-0">
                              <p className="text-[13px] font-medium text-foreground">{n.title}</p>
                              {n.body && <p className="mt-0.5 text-xs text-muted-foreground">{n.body}</p>}
                              <p className="mt-1 text-[11px] text-muted-foreground/70">
                                {formatRelative(n.sentAt ?? n.createdAt)}
                              </p>
                            </div>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </Card>

                <div className="card-surface overflow-hidden bg-gradient-to-br from-primary-700 via-primary-800 to-primary-900 p-6 text-white">
                  <div className="flex items-center gap-2">
                    <Sparkles className="h-4 w-4 text-gold-300" />
                    <p className="text-sm font-semibold">O nosso compromisso</p>
                  </div>
                  <p className="mt-2.5 text-[13px] leading-relaxed text-primary-100/85">
                    A nossa equipa acompanha de perto a sua evolução. Cada resposta que dá ajuda-nos a
                    ajustar o seu programa para obter os melhores resultados possíveis.
                  </p>
                  <div className="mt-4 flex items-center gap-2 rounded-xl bg-white/10 p-3 ring-1 ring-white/10">
                    <HeartPulse className="h-4 w-4 shrink-0 text-gold-300" />
                    <p className="text-xs text-primary-100/90">
                      Risco atual:{' '}
                      <span className={risk !== null && risk >= 50 ? 'font-semibold text-red-300' : 'font-semibold'}>
                        {risk !== null ? `${risk}%` : '—'}
                      </span>
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </>
        )}
      </main>

      {/* ── Modal de check-in ─────────────────────── */}
      {modalOpen && activeCheckIn && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm"
          onClick={() => !saving && setModalOpen(false)}
        >
          <div
            className="thin-scrollbar max-h-[90vh] w-full max-w-lg overflow-y-auto rounded-2xl border border-border/70 bg-white shadow-pop-lg animate-scaleIn"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="border-b border-border/70 bg-gradient-to-r from-primary-50 to-gold-50/60 px-6 py-5">
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-center gap-3">
                  <span className="inline-flex h-10 w-10 items-center justify-center rounded-xl bg-white text-primary-700 shadow-sm ring-1 ring-primary-100">
                    <ClipboardCheck className="h-5 w-5" />
                  </span>
                  <div>
                    <h3 className="text-base font-semibold tracking-tight text-foreground">
                      Check-in {activeCheckIn.type}
                    </h3>
                    <p className="text-[13px] text-muted-foreground">
                      Como se tem sentido esta semana? As suas respostas ajudam a equipa a ajustar o seu plano.
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => !saving && setModalOpen(false)}
                  className="inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-muted-foreground hover:bg-muted"
                  aria-label="Fechar"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
            </div>

            <div className="space-y-5 p-6">
              {QUESTIONS.map((q) => (
                <div key={q.key}>
                  <div className="flex items-center justify-between">
                    <label className="text-sm font-medium text-foreground">{q.label}</label>
                    <span className="text-sm font-bold text-primary-700">{responses[q.key]}/5</span>
                  </div>
                  <p className="mb-2 text-[11px] text-muted-foreground">{q.hint}</p>
                  <div className="flex gap-1.5">
                    {[1, 2, 3, 4, 5].map((v) => (
                      <button
                        key={v}
                        type="button"
                        onClick={() => setResponses((r) => ({ ...r, [q.key]: v }))}
                        className={clsx(
                          'flex-1 h-10 rounded-xl text-sm font-semibold transition-all',
                          responses[q.key] === v
                            ? 'bg-primary-600 text-white shadow-[0_2px_10px_-2px_hsl(157_25%_34%/0.5)] scale-[1.02]'
                            : 'bg-sand-100 text-sand-600 hover:bg-sand-200'
                        )}
                      >
                        {v}
                      </button>
                    ))}
                  </div>
                </div>
              ))}

              <div>
                <label className="text-sm font-medium text-foreground">Dificuldades ou observações</label>
                <textarea
                  value={difficulties}
                  onChange={(e) => setDifficulties(e.target.value)}
                  className="mt-1.5 h-20 w-full rounded-xl border border-input bg-white p-3 text-sm placeholder:text-muted-foreground/60 focus:border-ring/70 focus:outline-none focus:ring-[3px] focus:ring-ring/15"
                  placeholder="Algo que queira partilhar com a equipa…"
                />
              </div>

              <label className="flex cursor-pointer items-center gap-2.5 text-sm text-foreground">
                <input
                  type="checkbox"
                  checked={supportNeeded}
                  onChange={(e) => setSupportNeeded(e.target.checked)}
                  className="h-4 w-4 rounded border-border accent-primary-600"
                />
                Gostaria de ser contactado pela equipa
              </label>

              {msg && <p className="text-sm text-red-600">{msg}</p>}

              <div className="flex gap-2.5 pt-1">
                <Button variant="outline" onClick={() => setModalOpen(false)} disabled={saving} className="flex-1">
                  Cancelar
                </Button>
                <Button onClick={submitCheckIn} loading={saving} className="flex-1">
                  <CheckCircle2 className="h-4 w-4" /> Submeter check-in
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ── Toast de sucesso ──────────────────────── */}
      {msg && !modalOpen && (
        <div className="fixed bottom-5 right-5 z-50 flex items-center gap-2.5 rounded-xl bg-primary-700 px-4 py-3 text-sm text-white shadow-pop-lg animate-scaleIn">
          <CheckCircle2 className="h-4 w-4 shrink-0 text-primary-200" />
          {msg}
          <button onClick={() => setMsg('')} className="ml-1 text-white/60 hover:text-white" aria-label="Fechar">
            <X className="h-3.5 w-3.5" />
          </button>
        </div>
      )}
    </div>
  );
}
