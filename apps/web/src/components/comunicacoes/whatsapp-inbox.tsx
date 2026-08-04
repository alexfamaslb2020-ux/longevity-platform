'use client';

import { useEffect, useState, useRef } from 'react';
import { api } from '@/lib/api';
import { Button } from '@/components/ui/button';
import { Avatar } from '@/components/ui/avatar';
import { EmptyState } from '@/components/ui/empty-state';
import { Search, Send, Bot, MessagesSquare, PhoneCall } from 'lucide-react';
import { formatRelative, formatTime } from '@/lib/status';
import { clsx } from 'clsx';

interface Conversation {
  id: string;
  channel: string;
  status: string;
  aiHandled: boolean;
  summary?: string;
  lead?: { id: string; name: string; phone?: string; email?: string } | null;
  customer?: {
    id: string;
    lead?: { id: string; name: string; phone?: string; email?: string } | null;
  } | null;
  messages?: { id: string; content: string; role: string; sentAt: string }[];
  _count?: { messages: number };
}

export function WhatsappInbox() {
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [selected, setSelected] = useState<Conversation | null>(null);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [draft, setDraft] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [simulating, setSimulating] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);

  const loadList = async () => {
    const res = await api.getConversations({ search: search || undefined, limit: '100' });
    setConversations(res.data || []);
  };

  useEffect(() => {
    loadList().finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    if (selected) {
      api.getConversation(selected.id).then((full) => {
        setSelected(full);
        setConversations((prev) =>
          prev.map((c) => (c.id === full.id ? { ...c, messages: full.messages, summary: full.summary } : c))
        );
      });
    }
  }, [selected?.id]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [selected?.messages?.length]);

  const contactName = (c: Conversation) => c.lead?.name || c.customer?.lead?.name || 'Desconhecido';
  const contactPhone = (c: Conversation) => c.lead?.phone || c.customer?.lead?.phone || '';
  const lastMsg = (c: Conversation) =>
    c.messages?.[c.messages.length - 1]?.content || c.summary || 'Sem mensagens';
  const lastDate = (c: Conversation) => c.messages?.[c.messages.length - 1]?.sentAt;

  const send = async () => {
    if (!draft.trim() || !selected) return;
    const phone = contactPhone(selected);
    if (!phone) return;
    setBusy(true);
    setError('');
    try {
      await api.sendWhatsApp(phone, draft.trim());
      setDraft('');
      const full = await api.getConversation(selected.id);
      setSelected(full);
    } catch (e: any) {
      setError(e.message || 'Erro ao enviar');
    } finally {
      setBusy(false);
    }
  };

  const simulateReply = async () => {
    if (!selected) return;
    const phone = contactPhone(selected);
    if (!phone) return;
    setSimulating(true);
    try {
      await api.demoWhatsappReply(phone);
      const full = await api.getConversation(selected.id);
      setSelected(full);
    } catch (e: any) {
      setError(e.message || 'Erro ao simular resposta');
    } finally {
      setSimulating(false);
    }
  };

  if (loading) {
    return (
      <div className="grid h-[calc(100vh-220px)] grid-cols-1 gap-4 lg:grid-cols-3">
        <div className="card-surface p-4">
          <div className="mb-4 h-9 animate-pulse rounded-lg bg-sand-100" />
          {[0, 1, 2, 3, 4].map((i) => (
            <div key={i} className="mb-3 flex animate-pulse items-center gap-3">
              <div className="h-10 w-10 rounded-full bg-sand-100" />
              <div className="flex-1">
                <div className="h-3 w-2/5 rounded bg-sand-100" />
                <div className="mt-2 h-3 w-4/5 rounded bg-sand-100" />
              </div>
            </div>
          ))}
        </div>
        <div className="card-surface lg:col-span-2" />
      </div>
    );
  }

  return (
    <div className="grid h-[calc(100vh-220px)] min-h-[480px] grid-cols-1 gap-4 lg:grid-cols-3">
      {/* Lista */}
      <div className="card-surface flex flex-col overflow-hidden">
        <div className="border-b border-border/70 p-3">
          <div className="relative">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground/60" />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && loadList()}
              placeholder="Pesquisar…"
              className="input-base h-9 pl-9"
            />
          </div>
        </div>
        <div className="thin-scrollbar flex-1 overflow-y-auto">
          {conversations.length === 0 ? (
            <EmptyState
              icon={<MessagesSquare />}
              title="Sem conversas"
              description="As conversas WhatsApp aparecerão aqui."
            />
          ) : (
            conversations.map((c) => {
              const active = selected?.id === c.id;
              return (
                <button
                  key={c.id}
                  onClick={() => setSelected(c)}
                  className={clsx(
                    'flex w-full items-center gap-3 border-b border-border/50 px-4 py-3 text-left transition-colors last:border-0',
                    active ? 'bg-primary-50/60' : 'hover:bg-muted/40'
                  )}
                >
                  <Avatar name={contactName(c)} size="sm" />
                  <div className="min-w-0 flex-1">
                    <div className="flex items-baseline justify-between gap-2">
                      <p className="truncate text-sm font-medium text-foreground">{contactName(c)}</p>
                      <span className="shrink-0 text-[11px] text-muted-foreground/70">
                        {formatRelative(lastDate(c))}
                      </span>
                    </div>
                    <p className="mt-0.5 truncate text-[13px] text-muted-foreground">{lastMsg(c)}</p>
                  </div>
                  {c.aiHandled && (
                    <span className="shrink-0 text-primary-600" title="Resposta assistida por IA">
                      <Bot className="h-3.5 w-3.5" />
                    </span>
                  )}
                </button>
              );
            })
          )}
        </div>
      </div>

      {/* Thread */}
      <div className="card-surface flex flex-col overflow-hidden lg:col-span-2">
        {!selected ? (
          <div className="flex flex-1 flex-col items-center justify-center gap-2 text-center">
            <MessagesSquare className="h-6 w-6 text-sand-300" />
            <p className="text-sm font-medium text-foreground">Selecione uma conversa</p>
            <p className="text-[13px] text-muted-foreground">
              Escolha uma conversa da lista para ver as mensagens
            </p>
          </div>
        ) : (
          <>
            <div className="flex items-center gap-3 border-b border-border/70 px-4 py-3">
              <Avatar name={contactName(selected)} size="sm" />
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-semibold text-foreground">{contactName(selected)}</p>
                <p className="truncate text-xs text-muted-foreground">
                  {contactPhone(selected) || 'Sem telefone'}
                </p>
              </div>
              {contactPhone(selected) && (
                <Button size="sm" variant="outline" loading={simulating} onClick={simulateReply} title="Simular resposta do cliente">
                  <PhoneCall className="h-3.5 w-3.5" /> Simular
                </Button>
              )}
            </div>

            <div className="thin-scrollbar flex-1 space-y-2.5 overflow-y-auto bg-[radial-gradient(hsl(200_10%_30%/0.03)_1px,transparent_1px)] bg-[size:20px_20px] p-4">
              {(selected.messages || []).map((m) => {
                const isClient = m.role === 'USER';
                return (
                  <div key={m.id} className={clsx('flex animate-slideIn', isClient ? 'justify-start' : 'justify-end')}>
                    <div
                      className={clsx(
                        'max-w-[78%] rounded-2xl px-3.5 py-2 text-[13.5px] leading-relaxed shadow-sm whitespace-pre-wrap',
                        isClient
                          ? 'rounded-tl-md border border-border/70 bg-white text-foreground'
                          : m.role === 'AI'
                            ? 'rounded-tr-md bg-primary-600 text-white'
                            : 'rounded-tr-md border border-border/70 bg-sand-50 text-foreground'
                      )}
                    >
                      <p>{m.content}</p>
                      <p
                        className={clsx(
                          'mt-1 flex items-center justify-end gap-1 text-[10px]',
                          m.role === 'AI' ? 'text-primary-100/80' : 'text-muted-foreground/60'
                        )}
                      >
                        {formatTime(m.sentAt)}
                      </p>
                    </div>
                  </div>
                );
              })}
              <div ref={bottomRef} />
            </div>

            <div className="border-t border-border/70 bg-white p-3">
              {error && <p className="mb-2 rounded-lg bg-red-50 px-3 py-2 text-xs text-red-600">{error}</p>}
              <div className="flex gap-2">
                <input
                  value={draft}
                  onChange={(e) => setDraft(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && send()}
                  placeholder="Escrever mensagem…"
                  className="input-base h-9"
                />
                <Button onClick={send} loading={busy} className="h-9 shrink-0" size="sm">
                  <Send className="h-3.5 w-3.5" /> Enviar
                </Button>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
