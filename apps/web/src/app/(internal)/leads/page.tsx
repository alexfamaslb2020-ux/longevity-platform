'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { api } from '@/lib/api';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Modal } from '@/components/ui/modal';
import { PageHeader } from '@/components/ui/page-header';
import { EmptyState } from '@/components/ui/empty-state';
import { SkeletonList } from '@/components/ui/skeleton';
import { Avatar } from '@/components/ui/avatar';
import { Search, UserPlus, Users, ChevronLeft, ChevronRight } from 'lucide-react';
import { leadStatusLabel, leadStatusBadgeVariant, scoreTone } from '@/lib/status';

export default function LeadsPage() {
  const [leads, setLeads] = useState<any[]>([]);
  const [meta, setMeta] = useState({ total: 0, page: 1, totalPages: 0 });
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [showCreate, setShowCreate] = useState(false);
  const [form, setForm] = useState({ name: '', email: '', phone: '' });
  const [creating, setCreating] = useState(false);

  async function loadLeads(page = 1) {
    setLoading(true);
    const params: Record<string, string | undefined> = {
      page: String(page),
      limit: '20',
      search: search || undefined,
      status: statusFilter || undefined,
    };
    try {
      const result = await api.getLeads(params);
      setLeads(result.data);
      setMeta(result.meta);
    } catch {
      setLeads([]);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadLeads();
  }, [statusFilter]);

  async function handleCreate() {
    if (!form.name.trim()) return;
    setCreating(true);
    try {
      await api.createLead(form);
      setForm({ name: '', email: '', phone: '' });
      setShowCreate(false);
      loadLeads();
    } catch (e: any) {
      alert(e.message || 'Erro ao criar lead');
    } finally {
      setCreating(false);
    }
  }

  return (
    <div className="space-y-5">
      <PageHeader
        title="Leads"
        subtitle="Potenciais clientes captados pelas campanhas."
        actions={
          <Button onClick={() => setShowCreate(true)}>
            <UserPlus className="h-4 w-4" /> Novo lead
          </Button>
        }
      />

      {/* Filtros */}
      <div className="flex flex-wrap items-center gap-2.5">
        <div className="relative">
          <Search className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground/60" />
          <input
            placeholder="Pesquisar por nome, email ou telefone…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && loadLeads()}
            className="input-base h-9 w-full pl-10 sm:w-80"
          />
        </div>
        <Button variant="outline" size="sm" onClick={() => loadLeads()}>
          <Search className="h-3.5 w-3.5" /> Pesquisar
        </Button>
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="input-base h-9 w-44 bg-white"
        >
          <option value="">Todos os estados</option>
          {['new', 'contacted', 'qualifying', 'qualified', 'in_progress', 'converted', 'lost'].map((s) => (
            <option key={s} value={s}>{leadStatusLabel(s)}</option>
          ))}
        </select>
        <span className="ml-auto text-[13px] text-muted-foreground">{meta.total} leads</span>
      </div>

      {/* Tabela */}
      <div className="card-surface overflow-hidden">
        {loading ? (
          <div className="p-6">
            <SkeletonList rows={6} />
          </div>
        ) : leads.length === 0 ? (
          <EmptyState
            icon={<Users />}
            title="Nenhum lead encontrado"
            description={
              search || statusFilter
                ? 'Ajuste os filtros ou o termo de pesquisa e tente novamente.'
                : 'Crie o primeiro lead para começar a acompanhar a sua jornada.'
            }
            action={
              !search && !statusFilter ? (
                <Button size="sm" onClick={() => setShowCreate(true)}>
                  <UserPlus className="h-3.5 w-3.5" /> Criar lead
                </Button>
              ) : undefined
            }
          />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[720px]">
              <thead>
                <tr className="border-b border-border/70 bg-muted/50">
                  {['Nome', 'Contacto', 'Estado', 'Score', 'Origem', 'Data'].map((h) => (
                    <th key={h} className="px-5 py-3 text-left text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {leads.map((lead) => {
                  const tone = scoreTone(lead.score);
                  return (
                    <tr
                      key={lead.id}
                      className="group border-b border-border/50 transition-colors last:border-0 hover:bg-primary-50/30"
                    >
                      <td className="px-5 py-3.5">
                        <Link href={`/leads/${lead.id}`} className="flex items-center gap-3">
                          <Avatar name={lead.name} size="sm" />
                          <span className="font-medium text-foreground transition-colors group-hover:text-primary-800">
                            {lead.name}
                          </span>
                        </Link>
                      </td>
                      <td className="px-5 py-3.5 text-[13px] text-muted-foreground">
                        {lead.email && <p>{lead.email}</p>}
                        {lead.phone && <p className="text-xs">{lead.phone}</p>}
                      </td>
                      <td className="px-5 py-3.5">
                        <Badge variant={leadStatusBadgeVariant(lead.status)} dot>
                          {leadStatusLabel(lead.status)}
                        </Badge>
                      </td>
                      <td className="px-5 py-3.5">
                        <div className="flex items-center gap-2">
                          <div className="h-1.5 w-14 overflow-hidden rounded-full bg-muted">
                            <div
                              className={`h-full rounded-full ${tone.bar}`}
                              style={{ width: `${Math.min(Math.max(lead.score ?? 0, 0), 100)}%` }}
                            />
                          </div>
                          <span className={`text-[13px] font-semibold ${tone.text}`}>{lead.score}</span>
                        </div>
                      </td>
                      <td className="px-5 py-3.5 text-[13px] text-muted-foreground">{lead.source || '—'}</td>
                      <td className="px-5 py-3.5 text-[13px] text-muted-foreground">
                        {new Date(lead.createdAt).toLocaleDateString('pt-PT', {
                          day: '2-digit',
                          month: 'short',
                          year: 'numeric',
                        })}
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
            <Button variant="outline" size="sm" disabled={meta.page <= 1} onClick={() => loadLeads(meta.page - 1)}>
              <ChevronLeft className="h-4 w-4" /> Anterior
            </Button>
            <Button variant="outline" size="sm" disabled={meta.page >= meta.totalPages} onClick={() => loadLeads(meta.page + 1)}>
              Seguinte <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      )}

      {/* Modal novo lead */}
      <Modal
        open={showCreate}
        onClose={() => setShowCreate(false)}
        title="Novo lead"
        subtitle="Os dados podem ser preenchidos depois"
      >
        <div className="space-y-4">
          <div className="space-y-1.5">
            <label className="text-[13px] font-medium text-foreground">Nome *</label>
            <input
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              placeholder="Nome do contacto"
              className="input-base"
              autoFocus
            />
          </div>
          <div className="space-y-1.5">
            <label className="text-[13px] font-medium text-foreground">Email</label>
            <input
              type="email"
              value={form.email}
              onChange={(e) => setForm({ ...form, email: e.target.value })}
              placeholder="email@exemplo.pt"
              className="input-base"
            />
          </div>
          <div className="space-y-1.5">
            <label className="text-[13px] font-medium text-foreground">Telemóvel</label>
            <input
              type="tel"
              value={form.phone}
              onChange={(e) => setForm({ ...form, phone: e.target.value })}
              placeholder="+351…"
              className="input-base"
            />
          </div>
        </div>
        <div className="mt-5 flex justify-end gap-2.5">
          <Button variant="outline" onClick={() => setShowCreate(false)}>Cancelar</Button>
          <Button onClick={handleCreate} loading={creating}>
            <UserPlus className="h-4 w-4" /> Criar
          </Button>
        </div>
      </Modal>
    </div>
  );
}
