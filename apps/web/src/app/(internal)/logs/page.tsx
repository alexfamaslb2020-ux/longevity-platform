'use client';

import { useEffect, useState } from 'react';
import { api } from '@/lib/api';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { EmptyState } from '@/components/ui/empty-state';
import { PageHeader } from '@/components/ui/page-header';
import { ScrollText } from 'lucide-react';
import { formatDateTime, norm } from '@/lib/status';

const LEVEL: Record<string, { label: string; variant: any }> = {
  info: { label: 'Info', variant: 'neutral' },
  warning: { label: 'Aviso', variant: 'gold' },
  critical: { label: 'Crítico', variant: 'red' },
};

export default function LogsPage() {
  const [logs, setLogs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api
      .getNotifications()
      .then((data) => setLogs(data || []))
      .catch(() => setLogs([]))
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="space-y-5">
      <PageHeader
        title="Logs"
        subtitle="Registo de eventos do sistema, do mais recente ao mais antigo."
      />
      <Card className="overflow-hidden">
        <div className="flex items-center gap-2.5 border-b border-border/70 px-6 py-3.5">
          <span className="inline-flex h-8 w-8 items-center justify-center rounded-lg bg-primary-50 text-primary-700 ring-1 ring-primary-100">
            <ScrollText className="h-4 w-4" />
          </span>
          <h2 className="text-sm font-semibold tracking-tight text-foreground">Eventos recentes</h2>
        </div>
        {loading ? (
          <div className="space-y-3 p-6">
            {[0, 1, 2, 3].map((i) => (
              <div key={i} className="h-12 animate-pulse rounded-xl bg-sand-100" />
            ))}
          </div>
        ) : logs.length === 0 ? (
          <EmptyState icon={<ScrollText />} title="Sem eventos" description="Os eventos do sistema aparecerão aqui." className="min-h-[280px]" />
        ) : (
          <div className="divide-y divide-border/50">
            {logs.map((l) => {
              const lvl = norm(l.level || 'info');
              return (
                <div key={l.id} className="flex items-center gap-4 px-6 py-3">
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium text-foreground">{l.title}</p>
                    {l.message && <p className="truncate text-xs text-muted-foreground">{l.message}</p>}
                  </div>
                  <span className="shrink-0 text-[11px] tabular-nums text-muted-foreground/70">
                    {formatDateTime(l.createdAt)}
                  </span>
                  <Badge variant={LEVEL[lvl]?.variant ?? 'neutral'} size="sm">
                    {LEVEL[lvl]?.label ?? l.level}
                  </Badge>
                </div>
              );
            })}
          </div>
        )}
      </Card>
    </div>
  );
}
