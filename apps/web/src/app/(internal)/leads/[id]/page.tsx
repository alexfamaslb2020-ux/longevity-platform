'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { api } from '@/lib/api';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { EmptyState } from '@/components/ui/empty-state';
import { SkeletonText } from '@/components/ui/skeleton';
import { Avatar } from '@/components/ui/avatar';
import { Timeline } from '@/components/ui/timeline';
import { Tabs } from '@/components/ui/tabs';
import { ProfileBanner } from '@/components/ui/profile-banner';
import {
  ArrowLeft,
  Pencil,
  UserPlus2,
  MessagesSquare,
  CalendarClock,
  StickyNote,
  History,
  Send,
  ListTodo,
  UserRound,
  Target,
} from 'lucide-react';
import {
  leadStatusLabel,
  leadStatusBadgeVariant,
  scoreTone,
  taskPriorityLabel,
  taskPriorityBadgeVariant,
  formatDateTime,
} from '@/lib/status';

type Tab = 'resumo' | 'comunicacoes' | 'agenda' | 'notas';

export default function LeadDetailPage() {
  const { id } = useParams();
  const router = useRouter();
  const [lead, setLead] = useState<any>(null);
  const [history, setHistory] = useState<any[]>([]);
  const [notes, setNotes] = useState<any[]>([]);
  const [stages, setStages] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [tab, setTab] = useState<Tab>('resumo');
  const [noteText, setNoteText] = useState('');
  const [stageId, setStageId] = useState('');
  const [sending, setSending] = useState(false);

  useEffect(() => {
    if (!id) return;
    setLoading(true);
    Promise.all([
      api.getLead(id as string),
      api.getLeadHistory(id as string).catch(() => []),
      api.getPipelines().catch(() => []),
      api.getNotes({ relatedTo: 'lead', relatedId: id as string }).catch(() => []),
    ])
      .then(([l, h, p, n]) => {
        setLead(l);
        setHistory(h);
        setNotes(n);
        const allStages = (p ?? []).flatMap((pl: any) => pl.stages ?? []);
        setStages(allStages);
      })
      .catch((err) => setError(err.message || 'Erro ao carregar lead'))
      .finally(() => setLoading(false));
  }, [id]);

  const handleStageChange = async () => {
    if (!stageId) return;
    await api.moveLead(id as string, stageId);
    const updated = await api.getLead(id as string);
    setLead(updated);
    setStageId('');
  };

  const handleAddNote = async () => {
    if (!noteText.trim()) return;
    await api.post('/notes', { relatedTo: 'lead', relatedId: id as string, content: noteText });
    setNoteText('');
    setNotes(await api.getNotes({ relatedTo: 'lead', relatedId: id as string }).catch(() => []));
  };

  const handleConvert = async () => {
    if (!confirm('Converter este lead em cliente?')) return;
    await api.post('/customers', { leadId: id as string });
    router.push('/customers');
  };

  const handleSendMessage = async () => {
    if (!lead.phone) {
      alert('Este lead não tem telefone registado.');
      return;
    }
    const text = prompt(`Enviar WhatsApp para ${lead.phone}:`);
    if (text) {
      setSending(true);
      try {
        await api.sendWhatsApp(lead.phone, text);
      } finally {
        setSending(false);
      }
    }
  };

  const tone = scoreTone(lead?.score);
  const stageList = stages.length > 0 ? stages : lead?.pipelineStage ? [lead.pipelineStage] : [];

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
          title="Não foi possível carregar este lead"
          description={error}
          action={
            <Button variant="outline" onClick={() => router.push('/leads')}>
              <ArrowLeft className="h-4 w-4" /> Voltar aos leads
            </Button>
          }
        />
      </Card>
    );
  }

  if (!lead) return null;

  return (
    <div className="space-y-5">
      <ProfileBanner
        name={lead.name}
        subtitle={
          <>
            {lead.email && <span className="text-white/60">{lead.email}</span>}
            {lead.phone && (
              <span className="text-white/60">
                {lead.email && ' · '}
                {lead.phone}
              </span>
            )}
            <span className="text-white/40">
              {' · '}
              Origem: {lead.source || '—'} · Criado em {new Date(lead.createdAt).toLocaleDateString('pt-PT')}
            </span>
          </>
        }
        badges={
          <>
            <Badge variant={leadStatusBadgeVariant(lead.status)} dot className="bg-white/[0.08] text-white ring-1 ring-white/15 backdrop-blur [&>*]:text-white">
              {leadStatusLabel(lead.status)}
            </Badge>
            {lead.pipelineStage && (
              <Badge variant="outline" className="border-white/15 bg-white/[0.06] text-white/85 backdrop-blur">
                <Target className="h-3 w-3" /> {lead.pipelineStage.name}
              </Badge>
            )}
            <Badge variant="outline" className="border-white/15 bg-white/[0.06] text-white/85 backdrop-blur">
              <UserRound className="h-3 w-3" /> Score {lead.score ?? 0}
            </Badge>
          </>
        }
        actions={
          <>
            <Button
              variant="ghost"
              onClick={() => router.push('/leads')}
              className="text-white/80 hover:bg-white/10 hover:text-white"
            >
              <ArrowLeft className="h-4 w-4" /> Voltar
            </Button>
            <Button
              variant="ghost"
              onClick={() => router.push(`/leads/${id}/edit`)}
              className="text-white/80 hover:bg-white/10 hover:text-white"
            >
              <Pencil className="h-4 w-4" /> Editar
            </Button>
            {lead.status !== 'CONVERTED' && lead.status !== 'LOST' && (
              <Button onClick={handleConvert} className="bg-gradient-to-b from-gold-400 to-gold-600 text-white shadow-[0_6px_18px_-4px_hsl(38_45%_50%/0.55)] ring-1 ring-inset ring-white/20 hover:from-gold-300 hover:to-gold-500">
                <UserPlus2 className="h-4 w-4" /> Converter em cliente
              </Button>
            )}
          </>
        }
      />

      <Tabs<Tab>
        tabs={[
          { key: 'resumo', label: 'Resumo' },
          { key: 'comunicacoes', label: 'Comunicações', count: lead.conversations?.length },
          { key: 'agenda', label: 'Agenda', count: lead.appointments?.length },
          { key: 'notas', label: 'Notas', count: notes.length },
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
                  { label: 'Email', value: lead.email || '—' },
                  { label: 'Telemóvel', value: lead.phone || '—' },
                  { label: 'Origem', value: lead.source || '—' },
                  { label: 'Score', value: lead.score ?? '—' },
                  { label: 'Etapa', value: lead.pipelineStage?.name || '—' },
                  { label: 'Responsável', value: lead.assignedTo?.name || '—' },
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
                  <span className="font-medium text-muted-foreground">Qualidade do lead</span>
                  <span className={`font-semibold ${tone.text}`}>{lead.score ?? 0} / 100</span>
                </div>
                <div className="h-2 overflow-hidden rounded-full bg-muted">
                  <div
                    className={`h-full rounded-full transition-all duration-700 ${tone.bar}`}
                    style={{ width: `${Math.min(Math.max(lead.score ?? 0, 0), 100)}%` }}
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
                <Target className="h-4 w-4 text-primary-600" />
                <h2 className="font-semibold tracking-tight text-foreground">Etapa do pipeline</h2>
              </div>
              <div className="space-y-2.5 p-6 pt-4">
                {stageList.length > 0 ? (
                  <>
                    <select value={stageId} onChange={(e) => setStageId(e.target.value)} className="input-base">
                      <option value="">Mover para…</option>
                      {stageList.map((s: any) => (
                        <option key={s.id} value={s.id}>
                          {s.name}
                          {lead.pipelineStage?.id === s.id ? ' (atual)' : ''}
                        </option>
                      ))}
                    </select>
                    <Button className="w-full" size="sm" onClick={handleStageChange} disabled={!stageId}>
                      Mover
                    </Button>
                  </>
                ) : (
                  <p className="text-sm text-muted-foreground">Sem pipelines configuradas.</p>
                )}
              </div>
            </Card>

            <Card>
              <div className="flex items-center gap-2 px-6 pt-6">
                <ListTodo className="h-4 w-4 text-muted-foreground" />
                <h2 className="font-semibold tracking-tight text-foreground">Tarefas</h2>
              </div>
              <div className="p-6 pt-4">
                {!lead.tasks || lead.tasks.length === 0 ? (
                  <p className="text-sm text-muted-foreground">Nenhuma tarefa associada.</p>
                ) : (
                  <div className="space-y-2">
                    {lead.tasks.map((task: any) => (
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

            {lead.phone && (
              <Card className="p-5">
                <Button variant="soft" className="w-full" onClick={handleSendMessage} disabled={sending}>
                  <Send className="h-4 w-4" /> Enviar WhatsApp
                </Button>
              </Card>
            )}
          </div>
        </div>
      )}

      {tab === 'comunicacoes' && (
        <Card>
          <div className="flex items-center justify-between px-6 pt-6">
            <div>
              <h2 className="font-semibold tracking-tight text-foreground">Conversas</h2>
              <p className="mt-0.5 text-[13px] text-muted-foreground">
                Interações via WhatsApp e outros canais
              </p>
            </div>
            <Link
              href="/comunicacoes"
              className="inline-flex items-center gap-1 text-[13px] font-medium text-primary-700 hover:underline"
            >
              Ir para Comunicações
            </Link>
          </div>
          <div className="p-6 pt-4">
            {!lead.conversations || lead.conversations.length === 0 ? (
              <EmptyState
                icon={<MessagesSquare />}
                title="Nenhuma conversa registada"
                description="Quando houver mensagens WhatsApp, aparecerão aqui."
              />
            ) : (
              <div className="space-y-3">
                {lead.conversations.map((conv: any) => (
                  <div key={conv.id} className="rounded-xl border border-border/60 bg-muted/30 p-3.5">
                    <div className="mb-2 flex items-center justify-between">
                      <span className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
                        {conv.channel}
                      </span>
                      <span className="text-[11px] text-muted-foreground">
                        {formatDateTime(conv.createdAt)}
                      </span>
                    </div>
                    {conv.summary && (
                      <p className="text-[13px] italic text-muted-foreground">«{conv.summary}»</p>
                    )}
                    {conv.messages?.slice(0, 3).map((msg: any) => (
                      <div key={msg.id} className="mt-2 flex gap-2">
                        <span className="shrink-0 text-[11px] font-semibold uppercase text-muted-foreground/70">
                          {msg.role}:
                        </span>
                        <p className="break-words text-[13px] leading-snug text-foreground/90">{msg.content}</p>
                      </div>
                    ))}
                  </div>
                ))}
              </div>
            )}
          </div>
        </Card>
      )}

      {tab === 'agenda' && (
        <Card>
          <div className="px-6 pt-6">
            <h2 className="font-semibold tracking-tight text-foreground">Agendamentos</h2>
          </div>
          <div className="p-6 pt-4">
            {!lead.appointments || lead.appointments.length === 0 ? (
              <EmptyState
                icon={<CalendarClock />}
                title="Nenhum agendamento"
                description="As consultas marcadas com este lead aparecerão aqui."
              />
            ) : (
              <div className="space-y-2.5">
                {lead.appointments.map((apt: any) => (
                  <div
                    key={apt.id}
                    className="flex flex-wrap items-center gap-3 rounded-xl border border-border/60 p-3.5"
                  >
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-medium text-foreground">{apt.title}</p>
                      <p className="text-xs text-muted-foreground">
                        {new Date(apt.startDate).toLocaleString('pt-PT')}
                      </p>
                    </div>
                    <Badge variant="neutral" size="sm">
                      {apt.status}
                    </Badge>
                  </div>
                ))}
              </div>
            )}
          </div>
        </Card>
      )}

      {tab === 'notas' && (
        <Card>
          <div className="px-6 pt-6">
            <h2 className="font-semibold tracking-tight text-foreground">Notas internas</h2>
          </div>
          <div className="p-6 pt-4">
            {notes.length === 0 && (
              <EmptyState
                icon={<StickyNote />}
                title="Sem notas por agora"
                description="Registe observações úteis para a equipa."
              />
            )}
            {notes.map((note: any) => (
              <div key={note.id} className="mb-2.5 rounded-xl border border-border/60 bg-muted/30 p-3.5">
                <p className="text-sm text-foreground">{note.content}</p>
                <p className="mt-1.5 text-[11px] text-muted-foreground">
                  {note.author?.name || 'Sistema'} · {formatDateTime(note.createdAt)}
                </p>
              </div>
            ))}
            <div className="mt-4 flex gap-2">
              <input
                type="text"
                value={noteText}
                onChange={(e) => setNoteText(e.target.value)}
                placeholder="Adicionar nota…"
                onKeyDown={(e) => e.key === 'Enter' && handleAddNote()}
                className="input-base"
              />
              <Button variant="secondary" onClick={handleAddNote}>
                <StickyNote className="h-4 w-4" /> Adicionar
              </Button>
            </div>
          </div>
        </Card>
      )}
    </div>
  );
}
