'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { api } from '@/lib/api';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { PageHeader } from '@/components/ui/page-header';
import { EmptyState } from '@/components/ui/empty-state';
import { SkeletonList } from '@/components/ui/skeleton';
import { Avatar } from '@/components/ui/avatar';
import { Search, UserRound, ChevronLeft, ChevronRight } from 'lucide-react';
import { riskLabel, riskBadgeVariant, scoreTone } from '@/lib/status';

export default function CustomersPage() {
  const [customers, setCustomers] = useState<any[]>([]);
  const [meta, setMeta] = useState({ total: 0, page: 1, totalPages: 0 });
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const router = useRouter();

  async function loadCustomers(page = 1) {
    setLoading(true);
    const params: Record<string, string | undefined> = { page: String(page), limit: '20' };
    if (search) params.search = search;

    try {
      const result = await api.getCustomers(params);
      setCustomers(result.data);
      setMeta(result.meta);
    } catch {
      setCustomers([]);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadCustomers();
  }, []);

  return (
    <div className="space-y-5">
      <PageHeader
        title="Clientes"
        subtitle="Pacientes e clientes ativos da clínica."
      />

      {/* Pesquisa */}
      <div className="flex flex-wrap items-center gap-2.5">
        <div className="relative">
          <Search className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground/60" />
          <input
            placeholder="Pesquisar por nome, email ou telefone…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && loadCustomers()}
            className="input-base h-9 w-full pl-10 sm:w-80"
          />
        </div>
        <Button variant="outline" size="sm" onClick={() => loadCustomers()}>
          <Search className="h-3.5 w-3.5" /> Pesquisar
        </Button>
        <span className="ml-auto text-[13px] text-muted-foreground">
          {meta.total} cliente{meta.total !== 1 ? 's' : ''}
        </span>
      </div>

      {/* Tabela */}
      <div className="card-surface overflow-hidden">
        {loading ? (
          <div className="p-6">
            <SkeletonList rows={6} />
          </div>
        ) : customers.length === 0 ? (
          <EmptyState
            icon={<UserRound />}
            title="Nenhum cliente encontrado"
            description={
              search
                ? 'Ajuste o termo de pesquisa e tente novamente.'
                : 'Os clientes convertidos aparecerão aqui com o seu perfil completo.'
            }
          />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[640px]">
              <thead>
                <tr className="border-b border-border/70 bg-muted/50">
                  {['Cliente', 'Contacto', 'Nível de risco', 'Score'].map((h) => (
                    <th key={h} className="px-5 py-3 text-left text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {customers.map((c) => {
                  const tone = scoreTone(c.riskScore);
                  return (
                    <tr
                      key={c.id}
                      onClick={() => router.push(`/customers/${c.id}`)}
                      className="group cursor-pointer border-b border-border/50 transition-colors last:border-0 hover:bg-primary-50/30"
                    >
                      <td className="px-5 py-3.5">
                        <div className="flex items-center gap-3">
                          <Avatar name={c.lead?.name ?? c.name} size="sm" />
                          <span className="font-medium text-foreground transition-colors group-hover:text-primary-800">
                            {c.lead?.name ?? c.name}
                          </span>
                        </div>
                      </td>
                      <td className="px-5 py-3.5 text-[13px] text-muted-foreground">
                        {c.lead?.email && <p>{c.lead.email}</p>}
                        {c.lead?.phone && <p className="text-xs">{c.lead.phone}</p>}
                      </td>
                      <td className="px-5 py-3.5">
                        <Badge variant={riskBadgeVariant(c.riskLevel)} dot>
                          {riskLabel(c.riskLevel)}
                        </Badge>
                      </td>
                      <td className="px-5 py-3.5">
                        <div className="flex items-center gap-2">
                          <div className="h-1.5 w-14 overflow-hidden rounded-full bg-muted">
                            <div
                              className={`h-full rounded-full ${tone.bar}`}
                              style={{ width: `${Math.min(Math.max(c.riskScore ?? 0, 0), 100)}%` }}
                            />
                          </div>
                          <span className={`text-[13px] font-semibold ${tone.text}`}>
                            {c.riskScore ?? '—'}
                          </span>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Paginação */}
      {meta.totalPages > 1 && (
        <div className="flex items-center justify-between">
          <p className="text-[13px] text-muted-foreground">
            Página {meta.page} de {meta.totalPages}
          </p>
          <div className="flex gap-1.5">
            <Button variant="outline" size="sm" disabled={meta.page <= 1} onClick={() => loadCustomers(meta.page - 1)}>
              <ChevronLeft className="h-4 w-4" /> Anterior
            </Button>
            <Button variant="outline" size="sm" disabled={meta.page >= meta.totalPages} onClick={() => loadCustomers(meta.page + 1)}>
              Seguinte <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
