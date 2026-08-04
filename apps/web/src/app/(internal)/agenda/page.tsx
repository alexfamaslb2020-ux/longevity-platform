'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { api } from '@/lib/api';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { EmptyState } from '@/components/ui/empty-state';
import { PageHeader } from '@/components/ui/page-header';
import { CalendarDays } from 'lucide-react';
import { norm } from '@/lib/status';

const STATUS_LABELS: Record<string, string> = {
  scheduled: 'Agendada',
  confirmed: 'Confirmada',
  in_progress: 'Em curso',
  completed: 'Concluída',
  cancelled: 'Cancelada',
  no_show: 'Não compareceu',
  rescheduled: 'Remarcada',
};

const STATUS_VARIANT: Record<string, 'sage' | 'gold' | 'amber' | 'red' | 'neutral' | 'blue'> = {
  scheduled: 'gold',
  confirmed: 'blue',
  in_progress: 'amber',
  completed: 'sage',
  cancelled: 'red',
  no_show: 'red',
  rescheduled: 'neutral',
};

const WEEKDAYS = ['domingo', 'segunda-feira', 'terça-feira', 'quarta-feira', 'quinta-feira', 'sexta-feira', 'sábado'];

export default function AgendaPage() {
  const [appointments, setAppointments] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('');

  useEffect(() => {
    api
      .getAppointments({ limit: '200', ...(statusFilter ? { status: statusFilter } : {}) })
      .then((data) => setAppointments(data || []))
      .catch(() => setAppointments([]))
      .finally(() => setLoading(false));
  }, [statusFilter]);

  const grouped = useMemo(() => {
    const map = new Map<string, any[]>();
    for (const ap of [...appointments].sort(
      (a, b) => new Date(a.startDate).getTime() - new Date(b.startDate).getTime()
    )) {
      const day = new Date(ap.startDate).toDateString();
      if (!map.has(day)) map.set(day, []);
      map.get(day)!.push(ap);
    }
    return Array.from(map.entries());
  }, [appointments]);

  const today = new Date();
  const in7days = new Date(today.getTime() + 7 * 86400000);
  const counts = useMemo(() => {
    const upcoming = appointments.filter(
      (ap) => new Date(ap.startDate) >= today && new Date(ap.startDate) <= in7days && !['CANCELLED', 'NO_SHOW'].includes(norm(ap.status).toUpperCase())
    ).length;
    return { today: appointments.filter((ap) => new Date(ap.startDate).toDateString() === today.toDateString()).length, upcoming };
  }, [appointments]);

  const dayLabel = (dayKey: string) => {
    const d = new Date(dayKey);
    const isToday = d.toDateString() === today.toDateString();
    if (isToday) return 'Hoje';
    const tomorrow = new Date(today.getTime() + 86400000);
    if (d.toDateString() === tomorrow.toDateString()) return 'Amanhã';
    const past = d < new Date(today.toDateString());
    const fmt = d.toLocaleDateString('pt-PT', { day: '2-digit', month: 'short' });
    const prefix = past ? `${fmt} · passado` : `${fmt} · ${WEEKDAYS[d.getDay()]}`;
    return prefix;
  };

  const contactOf = (ap: any) => ap.customer?.lead || ap.lead;
  const contactHref = (ap: any) =>
    ap.customer ? `/customers/${ap.customer.id}` : ap.lead ? `/leads/${ap.lead.id}` : null;

  return (
    <div className="space-y-5">
      <PageHeader
        title="Agenda"
        subtitle="Consultas de leads e clientes, ordenadas por data."
        actions={
          <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} className="input-base h-9 w-44 bg-white">
            <option value="">Todos os estados</option>
            {Object.entries(STATUS_LABELS).map(([k, v]) => (
              <option key={k} value={k.toUpperCase()}>{v}</option>
            ))}
          </select>
        }
      />

      <div className="grid grid-cols-2 gap-4">
        <Card className="flex items-baseline justify-between p-5">
          <div>
            <p className="text-[13px] font-medium text-muted-foreground">Hoje</p>
            <p className="mt-1 text-2xl font-semibold tracking-tight text-foreground">{counts.today}</p>
          </div>
          <CalendarDays className="h-5 w-5 text-muted-foreground/40" />
        </Card>
        <Card className="flex items-baseline justify-between p-5">
          <div>
            <p className="text-[13px] font-medium text-muted-foreground">Próximos 7 dias</p>
            <p className="mt-1 text-2xl font-semibold tracking-tight text-foreground">{counts.upcoming}</p>
          </div>
          <CalendarDays className="h-5 w-5 text-gold-600/50" />
        </Card>
      </div>

      <Card className="overflow-hidden">
        <div className="border-b border-border/70 px-6 py-3.5">
          <h2 className="text-sm font-semibold tracking-tight text-foreground">Consultas</h2>
        </div>
        {loading ? (
          <div className="space-y-3 p-6">
            {[0, 1, 2, 3, 4].map((i) => (
              <div key={i} className="h-14 animate-pulse rounded-xl bg-sand-100" />
            ))}
          </div>
        ) : grouped.length === 0 ? (
          <EmptyState
            icon={<CalendarDays />}
            title="Sem consultas"
            description="As consultas agendadas aparecerão aqui."
            className="min-h-[300px]"
          />
        ) : (
          <div className="divide-y divide-border/50">
            {grouped.map(([day, list]) => (
              <div key={day} className="px-6 py-4">
                <p className="mb-3 text-[13px] font-semibold text-foreground">{dayLabel(day)}</p>
                <div className="space-y-2">
                  {list.map((ap) => {
                    const contact = contactOf(ap);
                    const href = contactHref(ap);
                    const st = norm(ap.status);
                    return (
                      <div key={ap.id} className="flex items-center gap-4 rounded-xl border border-border/60 bg-white px-4 py-3">
                        <span className="w-16 shrink-0 text-[13px] font-semibold tabular-nums text-foreground">
                          {new Date(ap.startDate).toLocaleTimeString('pt-PT', { hour: '2-digit', minute: '2-digit' })}
                        </span>
                        <div className="min-w-0 flex-1">
                          <p className="truncate text-sm font-medium text-foreground">
                            {href ? (
                              <Link href={href} className="hover:text-primary-800 hover:underline">
                                {contact?.name || 'Contacto'}
                              </Link>
                            ) : (
                              contact?.name || 'Contacto'
                            )}
                          </p>
                          <p className="truncate text-xs text-muted-foreground">{ap.title}</p>
                        </div>
                        <Badge variant={STATUS_VARIANT[st] ?? 'neutral'} size="sm">
                          {STATUS_LABELS[st] ?? ap.status}
                        </Badge>
                      </div>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>
        )}
      </Card>
    </div>
  );
}
