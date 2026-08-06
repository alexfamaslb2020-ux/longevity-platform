'use client';

import { useCallback, useEffect, useState } from 'react';
import { api } from '@/lib/api';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { EmptyState } from '@/components/ui/empty-state';
import { PageHeader } from '@/components/ui/page-header';
import { Bot, Database, Loader2, Send, Sparkles } from 'lucide-react';

interface ChatMessage {
  role: 'user' | 'ai';
  content: string;
  meta?: string;
}

export default function IaPage() {
  const [query, setQuery] = useState('');
  const [chat, setChat] = useState<ChatMessage[]>([]);
  const [sending, setSending] = useState(false);
  const [documents, setDocuments] = useState<any[]>([]);
  const [evaluations, setEvaluations] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [seeding, setSeeding] = useState(false);
  const [status, setStatus] = useState<any>(null);

  const refresh = useCallback(async () => {
    try {
      const [docs, evals, st] = await Promise.all([
        api.aiDocuments(),
        api.aiEvaluations(6),
        api.aiStatus(),
      ]);
      setDocuments(docs || []);
      setEvaluations(evals || []);
      setStatus(st);
    } catch {
      setDocuments([]);
      setEvaluations([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    refresh();
  }, [refresh]);

  const send = async () => {
    const q = query.trim();
    if (!q || sending) return;
    setChat((c) => [...c, { role: 'user', content: q }]);
    setQuery('');
    setSending(true);
    try {
      const res = await api.aiChat(q);
      setChat((c) => [
        ...c,
        {
          role: 'ai',
          content: res.response,
          meta: `intent=${res.intent} · grounding=${res.grounded} · score=${res.evaluation?.score ?? res.evaluationScore}% · fontes=${res.sources?.length ?? 0}`,
        },
      ]);
      refresh();
    } catch (err: any) {
      setChat((c) => [
        ...c,
        { role: 'ai', content: `Erro: ${err?.message ?? 'falha ao contactar o assistente'}` },
      ]);
    } finally {
      setSending(false);
    }
  };

  const seed = async () => {
    setSeeding(true);
    try {
      await api.aiSeedDocuments();
      await refresh();
    } finally {
      setSeeding(false);
    }
  };

  return (
    <div className="space-y-5">
      <PageHeader
        title="Assistente IA (RAG)"
        subtitle="Agente com pesquisa semântica (pgvector), fontes citadas e avaliação determinística."
      />

      <div className="grid grid-cols-1 gap-5 lg:grid-cols-5">
        <div className="space-y-5 lg:col-span-3">
          <Card className="flex h-[460px] flex-col">
            <div className="flex items-center justify-between border-b border-border/70 px-6 py-3.5">
              <div className="flex items-center gap-2.5">
                <span className="inline-flex h-8 w-8 items-center justify-center rounded-lg bg-primary-50 text-primary-700 ring-1 ring-primary-100">
                  <Bot className="h-4 w-4" />
                </span>
                <h2 className="text-sm font-semibold tracking-tight text-foreground">
                  Conversa com o agente
                </h2>
              </div>
              {status && (
                <Badge variant={status.documents > 0 ? 'sage' : 'neutral'} size="sm">
                  {status.provider} · {status.dimensions} dim · {status.documents} docs
                </Badge>
              )}
            </div>
            <div className="thin-scrollbar flex-1 space-y-3 overflow-y-auto p-5">
              {chat.length === 0 ? (
                <EmptyState
                  icon={<Sparkles />}
                  title="Pergunta algo à base de conhecimento"
                  description="Ex.: quanto custa o plano essencial? · como funciona o programa? · quero marcar uma consulta"
                  className="min-h-[320px]"
                />
              ) : (
                chat.map((m, i) => (
                  <div key={i} className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                    <div
                      className={`max-w-[85%] rounded-2xl px-4 py-2.5 text-sm ${
                        m.role === 'user'
                          ? 'rounded-br-sm bg-primary-600 text-white'
                          : 'rounded-bl-sm bg-muted/60 text-foreground'
                      }`}
                    >
                      <p className="whitespace-pre-wrap leading-relaxed">{m.content}</p>
                      {m.meta && (
                        <p className="mt-1.5 text-[11px] font-medium text-muted-foreground/80">
                          {m.meta}
                        </p>
                      )}
                    </div>
                  </div>
                ))
              )}
              {sending && (
                <div className="flex items-center gap-2 pl-1 text-xs text-muted-foreground">
                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                  A recuperar contexto…
                </div>
              )}
            </div>
            <div className="flex items-center gap-2 border-t border-border/70 p-4">
              <input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && send()}
                placeholder="Faz uma pergunta sobre programas, preços, agendamento…"
                className="flex-1 rounded-xl border border-border/70 bg-muted/40 px-4 py-2.5 text-sm outline-none ring-primary-200 focus:ring-2"
              />
              <button
                onClick={send}
                disabled={sending || !query.trim()}
                className="inline-flex h-10 items-center gap-2 rounded-xl bg-primary-600 px-4 text-sm font-medium text-white transition hover:bg-primary-700 disabled:opacity-50"
              >
                <Send className="h-4 w-4" />
                Enviar
              </button>
            </div>
          </Card>
        </div>

        <div className="space-y-5 lg:col-span-2">
          <Card className="overflow-hidden">
            <div className="flex items-center justify-between border-b border-border/70 px-6 py-3.5">
              <div className="flex items-center gap-2.5">
                <span className="inline-flex h-8 w-8 items-center justify-center rounded-lg bg-sand-100 text-sand-700 ring-1 ring-sand-200">
                  <Database className="h-4 w-4" />
                </span>
                <h2 className="text-sm font-semibold tracking-tight text-foreground">
                  Base de conhecimento
                </h2>
              </div>
              <button
                onClick={seed}
                disabled={seeding}
                className="inline-flex items-center gap-1.5 rounded-lg bg-muted px-2.5 py-1.5 text-xs font-medium text-muted-foreground transition hover:bg-sand-100 disabled:opacity-50"
              >
                {seeding && <Loader2 className="h-3 w-3 animate-spin" />}
                Semear demo
              </button>
            </div>
            <div className="divide-y divide-border/50">
              {loading ? (
                <div className="space-y-3 p-5">
                  {[0, 1, 2].map((i) => (
                    <div key={i} className="h-10 animate-pulse rounded-xl bg-sand-100" />
                  ))}
                </div>
              ) : documents.length === 0 ? (
                <EmptyState
                  icon={<Database />}
                  title="Sem documentos"
                  description="Usa «Semear demo» para carregar a base de conhecimento."
                  className="min-h-[180px]"
                />
              ) : (
                documents.map((d) => (
                  <div key={d.id} className="flex items-center gap-3 px-5 py-3">
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-medium text-foreground">{d.title}</p>
                      <p className="text-[11px] text-muted-foreground">
                        {d.category ?? 'geral'} · {d.chunkCount} chunks
                      </p>
                    </div>
                    <Badge variant={d.status === 'READY' ? 'sage' : 'gold'} size="sm">
                      {d.status}
                    </Badge>
                  </div>
                ))
              )}
            </div>
          </Card>

          <Card className="overflow-hidden">
            <div className="border-b border-border/70 px-6 py-3.5">
              <h2 className="text-sm font-semibold tracking-tight text-foreground">
                Avaliações recentes
              </h2>
              <p className="text-xs text-muted-foreground">
                Cada resposta é pontuada por critérios verificáveis (grounding, fontes, latência…).
              </p>
            </div>
            <div className="divide-y divide-border/50">
              {evaluations.length === 0 ? (
                <EmptyState
                  icon={<Sparkles />}
                  title="Sem avaliações"
                  description="As perguntas feitas ao agente aparecem aqui."
                  className="min-h-[150px]"
                />
              ) : (
                evaluations.map((e) => (
                  <div key={e.id} className="flex items-center gap-3 px-5 py-3">
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm text-foreground">“{e.query}”</p>
                      <p className="text-[11px] text-muted-foreground">
                        {e.intent} · {e.latencyMs}ms ·{' '}
                        {e.refused ? 'recusa honesta' : e.grounded ? 'fundamentada' : 'sem contexto'}
                      </p>
                    </div>
                    <Badge variant={e.evaluationScore >= 80 ? 'sage' : e.evaluationScore >= 50 ? 'gold' : 'red'} size="sm">
                      {e.evaluationScore}%
                    </Badge>
                  </div>
                ))
              )}
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}
