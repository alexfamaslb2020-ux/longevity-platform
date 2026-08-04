'use client';

import { useEffect, useState } from 'react';
import { api } from '@/lib/api';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { PageHeader } from '@/components/ui/page-header';
import { EmptyState } from '@/components/ui/empty-state';
import { SkeletonList } from '@/components/ui/skeleton';
import {
  Workflow,
  ListChecks,
  PlayCircle,
  CheckCircle2,
  XCircle,
  Clock3,
} from 'lucide-react';
import {
  workflowStatusBadgeVariant,
  jobStatusLabel,
  formatRelative,
} from '@/lib/status';

export default function AutomationsPage() {
  const [workflows, setWorkflows] = useState<any[]>([]);
  const [executions, setExecutions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      api.getWorkflows().catch(() => []),
      api.getWorkflowExecutions({ limit: '50' }).catch(() => []),
    ])
      .then(([w, e]) => {
        setWorkflows(w);
        setExecutions(e);
      })
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
          <div className="card-surface p-6"><SkeletonList rows={4} /></div>
          <div className="card-surface p-6"><SkeletonList rows={4} /></div>
        </div>
      </div>
    );
  }

  const execIcon = (status: string) => {
    if (status === 'completed') return <CheckCircle2 className="h-4 w-4 text-primary-600" />;
    if (status === 'failed') return <XCircle className="h-4 w-4 text-red-500" />;
    if (status === 'running' || status === 'pending') return <Clock3 className="h-4 w-4 text-amber-500" />;
    return <PlayCircle className="h-4 w-4 text-muted-foreground" />;
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Automações"
        subtitle="Workflows que respondem automaticamente a cada evento da plataforma"
      />

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        {/* Workflows */}
        <div className="space-y-3">
          <div className="flex items-center gap-2.5">
            <span className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-primary-50 text-primary-700 ring-1 ring-primary-100">
              <Workflow className="h-4 w-4" />
            </span>
            <div>
              <h2 className="text-sm font-semibold tracking-tight text-foreground">Workflows ativos</h2>
              <p className="text-xs text-muted-foreground">{workflows.length} automações configuradas</p>
            </div>
          </div>
          {workflows.length === 0 ? (
            <Card>
              <EmptyState
                icon={<Workflow />}
                title="Sem workflows configurados"
                description="Os workflows de demonstração são criados pelo seed da plataforma."
              />
            </Card>
          ) : (
            workflows.map((w) => (
              <Card key={w.id} className="p-5 transition-all hover:shadow-card-hover">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-start gap-3">
                    <div>
                      <div className="flex flex-wrap items-center gap-2">
                        <p className="text-sm font-semibold text-foreground">{w.name}</p>
                        <Badge variant={w.active ? 'sage' : 'neutral'} size="xs" dot>
                          {w.active ? 'Ativo' : 'Inativo'}
                        </Badge>
                      </div>
                      {w.description && (
                        <p className="mt-1 text-[13px] leading-relaxed text-muted-foreground">{w.description}</p>
                      )}
                    </div>
                  </div>
                </div>
                <div className="mt-4 space-y-2.5">
                  <div>
                    <p className="mb-1.5 flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
                      <PlayCircle className="h-3.5 w-3.5" /> Gatilhos
                    </p>
                    <div className="flex flex-wrap gap-1.5">
                      {(w.triggers || []).map((t: string) => (
                        <span key={t} className="rounded-full bg-primary-50 px-2.5 py-1 text-[11px] font-medium text-primary-800 ring-1 ring-primary-200/70">
                          {t}
                        </span>
                      ))}
                      {(w.triggers || []).length === 0 && (
                        <span className="text-xs text-muted-foreground">Sem gatilhos</span>
                      )}
                    </div>
                  </div>
                  <div>
                    <p className="mb-1.5 flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
                      <ListChecks className="h-3.5 w-3.5" /> Ações
                    </p>
                    <div className="flex flex-wrap gap-1.5">
                      {(w.actions || []).map((a: any, i: number) => (
                        <span key={i} className="rounded-full border border-border bg-muted/50 px-2.5 py-1 text-[11px] font-medium text-muted-foreground">
                          {a.type}
                        </span>
                      ))}
                      {(w.actions || []).length === 0 && (
                        <span className="text-xs text-muted-foreground">Sem ações</span>
                      )}
                    </div>
                  </div>
                </div>
                <p className="mt-3 text-[11px] text-muted-foreground/80">
                  {w._count?.executions || 0} execuções registadas
                </p>
              </Card>
            ))
          )}
        </div>

        {/* Execuções */}
        <div>
          <div className="mb-3 flex items-center gap-2.5">
            <span className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-gold-50 text-gold-700 ring-1 ring-gold-100">
              <PlayCircle className="h-4 w-4" />
            </span>
            <div>
              <h2 className="text-sm font-semibold tracking-tight text-foreground">Execuções recentes</h2>
              <p className="text-xs text-muted-foreground">Cada evento dispara um workflow automaticamente</p>
            </div>
          </div>
          <Card className="overflow-hidden">
            {executions.length === 0 ? (
              <EmptyState
                icon={<PlayCircle />}
                title="Sem execuções"
                description="Os eventos (leads, check-ins, chamadas) disparam os workflows automaticamente."
              />
            ) : (
              <div className="divide-y divide-border/50">
                {executions.map((e) => (
                  <div key={e.id} className="flex items-center gap-3 px-5 py-3.5 transition-colors hover:bg-muted/40">
                    <span className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-muted ring-1 ring-border">
                      {execIcon(e.status)}
                    </span>
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-[13px] font-medium text-foreground">
                        {e.workflow?.name || 'Workflow'}
                      </p>
                      <p className="mt-0.5 truncate text-[11px] text-muted-foreground">
                        {e.triggerType} · {e.entityType} · {formatRelative(e.startedAt)}
                      </p>
                    </div>
                    <Badge variant={workflowStatusBadgeVariant(e.status)} size="sm" dot>
                      {jobStatusLabel(e.status)}
                    </Badge>
                  </div>
                ))}
              </div>
            )}
          </Card>
        </div>
      </div>
    </div>
  );
}
