'use client';

import { useEffect, useState } from 'react';
import { api } from '@/lib/api';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Modal } from '@/components/ui/modal';
import { EmptyState } from '@/components/ui/empty-state';
import { Avatar } from '@/components/ui/avatar';
import { PhoneCall, PhoneOff, Mic, FileText, Database, CheckCircle2, Bot } from 'lucide-react';
import { callStatusLabel, formatDateTime, norm } from '@/lib/status';

const PROMPT_CATEGORIES = [
  { key: 'QUALIFICATION', label: 'Qualificação', desc: 'Interesse, necessidades e orçamento' },
  { key: 'CHECK_IN', label: 'Check-in por voz', desc: 'Questionário de bem-estar' },
  { key: 'SCHEDULING', label: 'Agendamento', desc: 'Marcar ou confirmar consultas' },
];

export function CallsConsole() {
  const [calls, setCalls] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState<any>(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [newCall, setNewCall] = useState({ to: '', promptCategory: 'QUALIFICATION' });
  const [customers, setCustomers] = useState<any[]>([]);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState<{ kind: 'ok' | 'err'; text: string } | null>(null);

  const load = async () => {
    const res = await api.getCalls({ limit: '100' });
    setCalls(res || []);
  };

  useEffect(() => {
    Promise.all([
      load(),
      api.getCustomers({ limit: '100' }).then((r) => setCustomers(r.data || [])).catch(() => setCustomers([])),
    ]).finally(() => setLoading(false));
  }, []);

  const contactOf = (c: any) => c.conversation?.lead || c.conversation?.customer?.lead || null;

  const startCall = async () => {
    if (!newCall.to) {
      setMessage({ kind: 'err', text: 'Selecione um contacto ou indique um número.' });
      return;
    }
    setBusy(true);
    setMessage(null);
    try {
      const call = await api.makeVoiceCall(newCall.to, newCall.promptCategory);
      setModalOpen(false);
      setNewCall({ to: '', promptCategory: 'QUALIFICATION' });
      await load();
      setSelected(call);
    } catch (e: any) {
      setMessage({ kind: 'err', text: e.message || 'Erro ao iniciar chamada' });
    } finally {
      setBusy(false);
    }
  };

  const completeCall = async (callId: string) => {
    setBusy(true);
    try {
      const updated = await api.demoVoiceComplete(callId);
      await load();
      setSelected(updated);
    } catch (e: any) {
      setMessage({ kind: 'err', text: e.message || 'Erro ao concluir chamada' });
    } finally {
      setBusy(false);
    }
  };

  const categoryLabel = (c: any) => {
    const cat = c.metadata?.promptCategory || c.promptCategory;
    return PROMPT_CATEGORIES.find((p) => p.key === cat)?.label || cat || 'Geral';
  };

  return (
    <div className="space-y-4">
      {message && (
        <div
          className={[
            'flex items-center gap-2.5 rounded-xl border px-4 py-2.5 text-sm animate-fadeIn',
            message.kind === 'ok' ? 'border-primary-200 bg-primary-50/70 text-primary-800' : 'border-red-200 bg-red-50 text-red-700',
          ].join(' ')}
        >
          {message.kind === 'ok' ? <CheckCircle2 className="h-4 w-4 shrink-0" /> : <PhoneOff className="h-4 w-4 shrink-0" />}
          {message.text}
        </div>
      )}

      <div className="flex items-center justify-between gap-3">
        <p className="text-[13px] text-muted-foreground">
          A assistente IA liga, segue o script e regista a transcrição no CRM.
        </p>
        <Button onClick={() => setModalOpen(true)} className="shrink-0">
          <PhoneCall className="h-4 w-4" /> Nova chamada
        </Button>
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        {/* Lista */}
        <Card className="overflow-hidden">
          <div className="border-b border-border/70 px-5 py-3.5">
            <h2 className="text-sm font-semibold tracking-tight text-foreground">Chamadas</h2>
            <p className="text-xs text-muted-foreground">{calls.length} registos</p>
          </div>
          <div className="thin-scrollbar max-h-[540px] divide-y divide-border/50 overflow-y-auto">
            {loading ? (
              <div className="space-y-3 p-4">
                {[0, 1, 2, 3].map((i) => (
                  <div key={i} className="h-12 animate-pulse rounded-lg bg-sand-100" />
                ))}
              </div>
            ) : calls.length === 0 ? (
              <EmptyState icon={<PhoneCall />} title="Sem chamadas" description="Inicie uma chamada para ver o registo." />
            ) : (
              calls.map((c) => {
                const contact = contactOf(c);
                const active = selected?.id === c.id;
                const inProgress = norm(c.status) === 'in_progress';
                return (
                  <button
                    key={c.id}
                    onClick={() => setSelected(c)}
                    className={[
                      'flex w-full items-center gap-3 px-5 py-3 text-left transition-colors',
                      active ? 'bg-primary-50/60' : 'hover:bg-muted/40',
                    ].join(' ')}
                  >
                    <Avatar name={contact?.name} size="sm" />
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-medium text-foreground">
                        {contact?.name || c.toNumber || 'Chamada'}
                      </p>
                      <p className="mt-0.5 truncate text-xs text-muted-foreground">
                        {categoryLabel(c)} · {c.startedAt ? formatDateTime(c.startedAt) : '—'}
                      </p>
                    </div>
                    <div className="flex shrink-0 items-center gap-2">
                      {inProgress && (
                        <Button
                          size="sm"
                          variant="gold"
                          loading={busy}
                          onClick={(e) => {
                            e.stopPropagation();
                            completeCall(c.id);
                          }}
                        >
                          <PhoneCall className="h-3.5 w-3.5" /> Concluir
                        </Button>
                      )}
                      <Badge variant={inProgress ? 'amber' : norm(c.status) === 'completed' ? 'sage' : 'neutral'} size="sm" dot>
                        {callStatusLabel(c.status)}
                      </Badge>
                    </div>
                  </button>
                );
              })
            )}
          </div>
        </Card>

        {/* Detalhe */}
        <Card className="overflow-hidden">
          {!selected ? (
            <EmptyState
              icon={<Bot />}
              title="Selecione uma chamada"
              description="O resumo e a transcrição aparecerão aqui."
              className="min-h-[400px]"
            />
          ) : (
            <div className="flex h-full flex-col">
              <div className="flex items-center gap-3 border-b border-border/70 px-5 py-4">
                <Avatar name={contactOf(selected)?.name} size="md" />
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <h2 className="text-sm font-semibold tracking-tight text-foreground">
                      {contactOf(selected)?.name || selected.toNumber || 'Chamada'}
                    </h2>
                    <Badge variant="outline" size="sm">{categoryLabel(selected)}</Badge>
                  </div>
                  <p className="mt-0.5 text-xs text-muted-foreground">
                    {formatDateTime(selected.startedAt)} ·{' '}
                    {selected.duration ? `${Math.floor(selected.duration / 60)}m ${selected.duration % 60}s` : 'sem duração registada'}
                  </p>
                </div>
                {norm(selected.status) === 'in_progress' && (
                  <Button size="sm" variant="gold" loading={busy} onClick={() => completeCall(selected.id)}>
                    <PhoneCall className="h-3.5 w-3.5" /> Concluir
                  </Button>
                )}
              </div>

              <div className="thin-scrollbar flex-1 space-y-5 overflow-y-auto p-5">
                {selected.summary && (
                  <div>
                    <div className="mb-2 flex items-center gap-2">
                      <FileText className="h-4 w-4 text-primary-600" />
                      <h3 className="text-sm font-semibold text-foreground">Resumo</h3>
                    </div>
                    <p className="rounded-xl border border-primary-200/60 bg-primary-50/40 p-3.5 text-[13px] leading-relaxed text-foreground">
                      {selected.summary}
                    </p>
                  </div>
                )}

                {(selected.metadata?.extractedData || selected.metadata?.outcome) && (
                  <div>
                    <div className="mb-2 flex items-center gap-2">
                      <Database className="h-4 w-4 text-gold-600" />
                      <h3 className="text-sm font-semibold text-foreground">Dados extraídos</h3>
                    </div>
                    <div className="rounded-xl border border-gold-200/60 bg-gold-50/40 p-4">
                      {selected.metadata?.outcome && (
                        <p className="mb-2 text-[13px] italic text-gold-800">«{selected.metadata.outcome}»</p>
                      )}
                      {selected.metadata?.extractedData && (
                        <dl className="grid grid-cols-2 gap-x-4 gap-y-2">
                          {Object.entries(selected.metadata.extractedData).map(([k, v]) => (
                            <div key={k}>
                              <dt className="text-[10px] font-medium uppercase tracking-wider text-gold-700/70">
                                {k.replace(/_/g, ' ')}
                              </dt>
                              <dd className="truncate text-[13px] font-medium text-foreground" title={String(v)}>
                                {String(v)}
                              </dd>
                            </div>
                          ))}
                        </dl>
                      )}
                    </div>
                  </div>
                )}

                {selected.metadata?.transcript?.length ? (
                  <div>
                    <div className="mb-2 flex items-center gap-2">
                      <Mic className="h-4 w-4 text-muted-foreground" />
                      <h3 className="text-sm font-semibold text-foreground">Transcrição (simulada)</h3>
                    </div>
                    <div className="space-y-2 rounded-xl border border-border/60 bg-muted/30 p-3.5">
                      {selected.metadata.transcript.map((line: string, i: number) => (
                        <p key={i} className="text-[13px] leading-relaxed text-foreground">
                          {line}
                        </p>
                      ))}
                    </div>
                  </div>
                ) : (
                  <p className="text-[13px] text-muted-foreground">
                    {norm(selected.status) === 'in_progress'
                      ? 'Chamada em curso — a transcrição é gerada no fim.'
                      : 'Sem transcrição disponível.'}
                  </p>
                )}
              </div>
            </div>
          )}
        </Card>
      </div>

      {/* Modal nova chamada */}
      <Modal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        title="Nova chamada com IA"
        subtitle="A assistente liga ao contacto e regista tudo no CRM"
      >
        <div className="space-y-4">
          <div className="space-y-1.5">
            <label className="text-[13px] font-medium text-foreground">Contacto</label>
            <select
              value={newCall.to}
              onChange={(e) => setNewCall({ ...newCall, to: e.target.value })}
              className="input-base bg-white"
            >
              <option value="">Selecionar cliente…</option>
              {customers.map((c) => (
                <option key={c.id} value={c.lead?.phone}>
                  {c.lead?.name} — {c.lead?.phone}
                </option>
              ))}
            </select>
          </div>
          <div className="space-y-1.5">
            <label className="text-[13px] font-medium text-foreground">Tipo de chamada</label>
            <select
              value={newCall.promptCategory}
              onChange={(e) => setNewCall({ ...newCall, promptCategory: e.target.value })}
              className="input-base bg-white"
            >
              {PROMPT_CATEGORIES.map((p) => (
                <option key={p.key} value={p.key}>{p.label} — {p.desc}</option>
              ))}
            </select>
          </div>
          <div className="space-y-1.5">
            <label className="text-[13px] font-medium text-foreground">Ou número direto</label>
            <input
              value={newCall.to}
              onChange={(e) => setNewCall({ ...newCall, to: e.target.value })}
              placeholder="+351…"
              className="input-base"
            />
          </div>
        </div>
        <div className="mt-5 flex justify-end gap-2.5">
          <Button variant="outline" onClick={() => setModalOpen(false)}>Cancelar</Button>
          <Button onClick={startCall} loading={busy}>
            <PhoneCall className="h-4 w-4" /> Ligar
          </Button>
        </div>
      </Modal>
    </div>
  );
}
