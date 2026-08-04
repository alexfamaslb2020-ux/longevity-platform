'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { api } from '@/lib/api';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ProfileBanner } from '@/components/ui/profile-banner';
import { EmptyState } from '@/components/ui/empty-state';
import { SkeletonText } from '@/components/ui/skeleton';
import { Avatar } from '@/components/ui/avatar';
import { Timeline } from '@/components/ui/timeline';
import { Tabs } from '@/components/ui/tabs';
import {
  ArrowLeft,
  Send,
  ClipboardCheck,
  CalendarClock,
  MessagesSquare,
  History,
  FileText,
  Layers,
  CheckCircle2,
  UserRound,
  ListChecks,
} from 'lucide-react';
import {
  riskLabel,
  riskBadgeVariant,
  taskPriorityLabel,
  taskPriorityBadgeVariant,
  checkinStatusLabel,
  checkinStatusBadgeVariant,
  formatDateTime,
  scoreTone,
} from '@/lib/status';

type Tab = 'resumo' | 'checkins' | 'comunicacoes' | 'servicos';

export default function CustomerDetailPage() {
  const { id } = useParams();
  const router = useRouter();
  const [customer, setCustomer] = useState<any>(null);
  const [checkins, setCheckins] = useState<any[]>([]);
  const [history, setHistory] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [tab, setTab] = useState<Tab>('resumo');

  useEffect(() => {
    if (!id) return;
    setLoading(true);
    Promise.all([
      api.getCustomer(id as string),
      api.getCustomerCheckIns(id as string).catch(() => []),
      api.getCustomerHistory(id as string).catch(() => []),
    ])
      .then(([cust, chk, hist]) => {
        setCustomer(cust);
        setCheckins(chk);
        setHistory(hist);
      })
      .catch((err) => setError(err.message || 'Erro ao carregar cliente'))
      .finally(() => setLoading(false));
  }, [id]);

  const name = customer?.lead?.name ?? customer?.name ?? 'Cliente';
  const email = customer?.lead?.email ?? customer?.email;
  const phone = customer?.lead?.phone ?? customer?.phone;

  const handleSendMessage = async () => {
    if (!phone) return;
    const text = prompt(`Enviar WhatsApp para ${phone}:`);
    if (text) {
      await api.sendWhatsApp(phone, text);
      alert('Mensagem enviada');
    }
  };

  const pendingCheckin = checkins.find((ci: any) => !ci.completedAt);

  const handleCompleteCheckIn = async () => {
    if (!pendingCheckin) return;
    if (!confirm('Concluir o check-in pendente agora (simulando as respostas do cliente)?')) return;
    await api.completeCheckIn(pendingCheckin.id, {
      energy: 4, sleep: 4, stress: 2, mood: 4, adherence: 4, satisfaction: 4,
      difficulties: '', support_needed: false,
    });
    alert('Check-in concluído');
    setCheckins(await api.getCustomerCheckIns(id as string).catch(() => []));
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="h-24 animate-pulse rounded-2xl bg-sand-100" />
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
          <div className="card-surface p-6 lg:col-span-2">
            <SkeletonText lines={8} />
          </div>
          <div className="card-surface p-6">
            <SkeletonText lines={5} />
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <Card className="p-10">
        <EmptyState
          icon={<ArrowLeft />}
          title="Não foi possível carregar este cliente"
          description={error}
          action={
            <Button variant="outline" onClick={() => router.push('/customers')}>
              <ArrowLeft className="h-4 w-4" /> Voltar aos clientes
            </Button>
          }
        />
      </Card>
    );
  }

  if (!customer) return null;

  const riskTone = scoreTone(100 - (customer.riskScore ?? 0));

  return (
    <div className="space-y-5">
      <ProfileBanner
        name={name}
        subtitle={
          <>
            {email && <span className="text-white/60">{email}</span>}
            {phone && (
              <span className="text-white/60">
                {email && ' · '}
                {phone}
              </span>
            )}
            <span className="text-white/40">
              {email && phone && ' · '}
              Cliente desde {new Date(customer.createdAt).toLocaleDateString('pt-PT')}
            </span>
          </>
        }
        badges={
          <>
            <Badge variant={riskBadgeVariant(customer.riskLevel)} dot className="bg-white/[0.08] text-white ring-1 ring-white/15 backdrop-blur [&>*]:text-white">
              {riskLabel(customer.riskLevel)}
            </Badge>
            <Badge variant="outline" className="border-white/15 bg-white/[0.06] text-white/85 backdrop-blur">
              <UserRound className="h-3 w-3" /> {customer.segment || 'Cliente'}
            </Badge>
          </>
        }
        actions={
          <>
            <Button
              variant="ghost"
              onClick={() => router.push('/customers')}
              className="text-white/80 hover:bg-white/10 hover:text-white"
            >
              <ArrowLeft className="h-4 w-4" /> Voltar
            </Button>
            <Button onClick={handleSendMessage} disabled={!phone} className="bg-gradient-to-b from-gold-400 to-gold-600 text-white shadow-[0_6px_18px_-4px_hsl(38_45%_50%/0.55)] ring-1 ring-inset ring-white/20 hover:from-gold-300 hover:to-gold-500">
              <Send className="h-4 w-4" /> Enviar WhatsApp
            </Button>
          </>
        }
      />

      {pendingCheckin && (
        <div className="flex flex-wrap items-center gap-3 rounded-xl border border-gold-200/80 bg-gold-50/60 px-5 py-3">
          <span className="inline-flex h-8 w-8 items-center justify-center rounded-lg bg-gold-100 text-gold-700 ring-1 ring-gold-200">
            <ClipboardCheck className="h-4 w-4" />
          </span>
          <p className="flex-1 text-[13px] text-gold-900">
            Check-in pendente desde {formatDateTime(pendingCheckin.scheduledAt)}
          </p>
          <Button size="sm" variant="gold" onClick={handleCompleteCheckIn}>
            <CheckCircle2 className="h-3.5 w-3.5" /> Concluir check-in
          </Button>
        </div>
      )}

      <Tabs<Tab>
        tabs={[
          { key: 'resumo', label: 'Resumo' },
          { key: 'checkins', label: 'Check-ins', count: checkins.length },
          { key: 'comunicacoes', label: 'Comunicações', count: customer.conversations?.length },
          { key: 'servicos', label: 'Serviços' },
        ]}
        active={tab}
        onChange={setTab}
      />

      {tab === 'resumo' && (
        <div className="grid grid-cols-1 gap-5 lg:grid-cols-3">
          <div className="space-y-5 lg:col-span-2">
            <Card>
              <div className="flex items-center gap-2 px-6 pt-6">
                <UserRound className="h-4 w-4 text-primary-600" />
                <h2 className="font-semibold tracking-tight text-foreground">Informação geral</h2>
              </div>
              <div className="grid grid-cols-2 gap-x-6 gap-y-4 p-6 pt-4 sm:grid-cols-3">
                {[
                  { label: 'Email', value: email || '—' },
                  { label: 'Telemóvel', value: phone || '—' },
                  { label: 'Segmento', value: customer.segment || '—' },
                  { label: 'Nível de risco', value: riskLabel(customer.riskLevel) },
                  { label: 'Score de risco', value: customer.riskScore ?? '—' },
                  { label: 'Estado', value: customer.status || '—' },
                ].map((f) => (
                  <div key={f.label}>
                    <dt className="text-[11px] font-medium uppercase tracking-wider text-muted-foreground">
                      {f.label}
                    </dt>
                    <dd className="mt-1 truncate text-sm font-medium text-foreground" title={f.value}>
                      {f.value}
                    </dd>
                  </div>
                ))}
              </div>
              <div className="px-6 pb-6">
                <div className="mb-1.5 flex items-center justify-between text-[13px]">
                  <span className="font-medium text-muted-foreground">Risco de abandono</span>
                  <span className={`font-semibold ${riskTone.text}`}>{customer.riskScore ?? 0} / 100</span>
                </div>
                <div className="h-2 overflow-hidden rounded-full bg-muted">
                  <div
                    className="h-full rounded-full bg-gradient-to-r from-amber-400 to-red-500 transition-all duration-700"
                    style={{ width: `${Math.min(Math.max(customer.riskScore ?? 0, 0), 100)}%` }}
                  />
                </div>
              </div>
            </Card>

            <Card>
              <div className="flex items-center gap-2 px-6 pt-6">
                <History className="h-4 w-4 text-primary-600" />
                <h2 className="font-semibold tracking-tight text-foreground">Histórico de atividade</h2>
              </div>
              <div className="p-6 pt-4">
                {history.length === 0 ? (
                  <EmptyState
                    icon={<History />}
                    title="Sem atividade registada"
                    description="Cada ação na plataforma fica registada aqui."
                  />
                ) : (
                  <Timeline
                    items={history.slice(0, 30).map((item) => ({
                      id: `${item.date}-${item.type}-${item.title}`,
                      title: item.title,
                      description: item.description,
                      meta: `${formatDateTime(item.date)}`,
                    }))}
                  />
                )}
              </div>
            </Card>
          </div>

          <div className="space-y-5">
            <Card>
              <div className="flex items-center gap-2 px-6 pt-6">
                <ListChecks className="h-4 w-4 text-primary-600" />
                <h2 className="font-semibold tracking-tight text-foreground">Tarefas</h2>
              </div>
              <div className="p-6 pt-4">
                {!customer.tasks || customer.tasks.length === 0 ? (
                  <p className="text-sm text-muted-foreground">Nenhuma tarefa associada.</p>
                ) : (
                  <div className="space-y-2">
                    {customer.tasks.map((task: any) => (
                      <div
                        key={task.id}
                        className={[
                          'rounded-xl border p-3',
                          task.completedAt ? 'border-border/60 bg-muted/30 opacity-70' : 'border-border/60 bg-white',
                        ].join(' ')}
                      >
                        <p className="text-[13px] font-medium text-foreground">{task.title}</p>
                        <div className="mt-1.5 flex flex-wrap items-center gap-2">
                          <Badge variant={taskPriorityBadgeVariant(task.priority)} size="sm">
                            {taskPriorityLabel(task.priority)}
                          </Badge>
                          {task.dueAt && (
                            <span className="text-[11px] text-muted-foreground">
                              até {formatDateTime(task.dueAt)}
                            </span>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </Card>

            <Card>
              <div className="flex items-center gap-2 px-6 pt-6">
                <CalendarClock className="h-4 w-4 text-primary-600" />
                <h2 className="font-semibold tracking-tight text-foreground">Próximas consultas</h2>
              </div>
              <div className="p-6 pt-4">
                {!customer.appointments || customer.appointments.length === 0 ? (
                  <p className="text-sm text-muted-foreground">Sem consultas agendadas.</p>
                ) : (
                  <div className="space-y-2.5">
                    {customer.appointments.slice(0, 3).map((apt: any) => (
                      <div key={apt.id} className="flex items-center gap-3 rounded-xl border border-border/60 p-3">
                        <CalendarClock className="h-4 w-4 shrink-0 text-muted-foreground" />
                        <div className="min-w-0 flex-1">
                          <p className="truncate text-[13px] font-medium text-foreground">{apt.title}</p>
                          <p className="text-xs text-muted-foreground">
                            {new Date(apt.startDate).toLocaleString('pt-PT')}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </Card>
          </div>
        </div>
      )}

      {tab === 'checkins' && (
        <Card>
          <div className="flex items-center justify-between px-6 pt-6">
            <div className="flex items-center gap-2">
              <ClipboardCheck className="h-4 w-4 text-primary-600" />
              <div>
                <h2 className="font-semibold tracking-tight text-foreground">Check-ins</h2>
                <p className="mt-0.5 text-[13px] text-muted-foreground">
                  Respostas periódicas do cliente sobre o seu estado
                </p>
              </div>
            </div>
            <Link
              href="/acompanhamento?tab=checkins"
              className="inline-flex items-center gap-1 text-[13px] font-medium text-primary-700 hover:underline"
            >
              Ver todos
            </Link>
          </div>
          <div className="p-6 pt-4">
            {checkins.length === 0 ? (
              <EmptyState
                icon={<ClipboardCheck />}
                title="Nenhum check-in registado"
                description="Agende um check-in para monitorizar o estado do cliente."
              />
            ) : (
              <div className="space-y-3">
                {checkins.map((ci: any) => (
                  <div key={ci.id} className="rounded-xl border border-border/60 p-4">
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <div className="flex items-center gap-2.5">
                        <Badge variant={checkinStatusBadgeVariant(ci.status)} size="sm" dot>
                          {checkinStatusLabel(ci.status)}
                        </Badge>
                        <span className="text-sm font-medium capitalize text-foreground">{ci.type}</span>
                        <span className="text-[11px] uppercase tracking-wider text-muted-foreground">
                          via {ci.channel}
                        </span>
                      </div>
                      <span className="text-xs text-muted-foreground">
                        {formatDateTime(ci.completedAt ?? ci.scheduledAt)}
                      </span>
                    </div>
                    {ci.responses && Object.keys(ci.responses).length > 0 && (
                      <div className="mt-3 grid grid-cols-2 gap-2 sm:grid-cols-3">
                        {Object.entries(ci.responses).map(([key, val]) => (
                          <div key={key} className="rounded-lg bg-muted/60 px-2.5 py-1.5">
                            <p className="text-[10px] font-medium uppercase tracking-wider text-muted-foreground">
                              {key.replace(/_/g, ' ')}
                            </p>
                            <p className="text-sm font-semibold capitalize text-foreground">{String(val)}</p>
                          </div>
                        ))}
                      </div>
                    )}
                    {ci.riskScore !== null && ci.riskScore !== undefined && (
                      <p className="mt-2.5 text-xs font-medium text-foreground">
                        Score de risco:{' '}
                        <span className={ci.riskScore >= 70 ? 'text-red-600' : ci.riskScore >= 45 ? 'text-amber-600' : 'text-primary-700'}>
                          {ci.riskScore}
                        </span>
                        {ci.riskLevel ? ` (${riskLabel(ci.riskLevel)})` : ''}
                      </p>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        </Card>
      )}

      {tab === 'comunicacoes' && (
        <Card>
          <div className="px-6 pt-6">
            <h2 className="font-semibold tracking-tight text-foreground">Conversas recentes</h2>
          </div>
          <div className="p-6 pt-4">
            {!customer.conversations || customer.conversations.length === 0 ? (
              <EmptyState
                icon={<MessagesSquare />}
                title="Nenhuma conversa"
                description="As mensagens com este cliente aparecerão aqui."
              />
            ) : (
              <div className="space-y-3">
                {customer.conversations.map((conv: any) => (
                  <div key={conv.id} className="rounded-xl border border-border/60 bg-muted/30 p-3.5">
                    <div className="flex items-center justify-between">
                      <span className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
                        {conv.channel}
                      </span>
                      <span className="text-[11px] text-muted-foreground">
                        {formatDateTime(conv.createdAt)}
                      </span>
                    </div>
                    {conv.summary && (
                      <p className="mt-2 text-[13px] italic text-muted-foreground">«{conv.summary}»</p>
                    )}
                    {conv.messages?.slice(0, 2).map((msg: any) => (
                      <p key={msg.id} className="mt-1.5 text-[13px] text-foreground/90">
                        <span className="font-semibold uppercase text-muted-foreground/70">{msg.role}: </span>
                        {msg.content?.substring(0, 140)}
                      </p>
                    ))}
                  </div>
                ))}
              </div>
            )}
          </div>
        </Card>
      )}

      {tab === 'servicos' && (
        <div className="grid grid-cols-1 gap-5 lg:grid-cols-2">
          <Card>
            <div className="px-6 pt-6">
              <h2 className="font-semibold tracking-tight text-foreground">Serviços</h2>
            </div>
            <div className="p-6 pt-4">
              {!customer.services || customer.services.length === 0 ? (
                <EmptyState
                  icon={<Layers />}
                  title="Sem serviços"
                  description="Os serviços contratados pelo cliente aparecerão aqui."
                />
              ) : (
                <div className="space-y-2">
                  {customer.services.map((s: any) => (
                    <div key={s.id} className="rounded-xl border border-border/60 p-3">
                      <p className="text-[13px] font-medium text-foreground">{s.name}</p>
                      <div className="mt-1.5 flex items-center justify-between">
                        <Badge variant={s.status === 'active' ? 'sage' : 'neutral'} size="sm">
                          {s.status}
                        </Badge>
                        <span className="text-[11px] text-muted-foreground">
                          {s.assignedTo?.name || 'Não atribuído'}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </Card>

          <Card>
            <div className="px-6 pt-6">
              <h2 className="font-semibold tracking-tight text-foreground">Documentos</h2>
            </div>
            <div className="p-6 pt-4">
              {!customer.documents || customer.documents.length === 0 ? (
                <EmptyState
                  icon={<FileText />}
                  title="Sem documentos"
                  description="Os documentos clínicos aparecerão aqui."
                />
              ) : (
                <div className="space-y-1.5">
                  {customer.documents.map((doc: any) => (
                    <div
                      key={doc.id}
                      className="flex items-center justify-between rounded-lg border border-border/60 px-3 py-2"
                    >
                      <span className="flex items-center gap-2 text-[13px] text-foreground">
                        <FileText className="h-3.5 w-3.5 text-muted-foreground" />
                        {doc.name}
                      </span>
                      <Badge variant="outline" size="sm">{doc.type}</Badge>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </Card>
        </div>
      )}
    </div>
  );
}
