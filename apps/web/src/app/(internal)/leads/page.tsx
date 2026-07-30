'use client';

import { useEffect, useState } from 'react';
import { api } from '@/lib/api';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

export default function LeadsPage() {
  const [leads, setLeads] = useState<any[]>([]);
  const [meta, setMeta] = useState({ total: 0, page: 1, totalPages: 0 });
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [showCreate, setShowCreate] = useState(false);
  const [form, setForm] = useState({ name: '', email: '', phone: '' });

  async function loadLeads(page = 1) {
    setLoading(true);
    const params: Record<string, string | undefined> = { page: String(page), limit: '20' };
    if (search) params.search = search;

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

  useEffect(() => { loadLeads(); }, []);

  async function handleCreate() {
    if (!form.name.trim()) return;
    await api.createLead(form);
    setForm({ name: '', email: '', phone: '' });
    setShowCreate(false);
    loadLeads();
  }

  async function handleDelete(id: string) {
    if (!confirm('Tem a certeza?')) return;
    await api.delete(`/leads/${id}`);
    loadLeads();
  }

  const statusColors: Record<string, string> = {
    NEW: 'bg-blue-100 text-blue-700',
    CONTACTED: 'bg-purple-100 text-purple-700',
    QUALIFYING: 'bg-yellow-100 text-yellow-700',
    QUALIFIED: 'bg-green-100 text-green-700',
    CONVERTED: 'bg-emerald-100 text-emerald-700',
    LOST: 'bg-red-100 text-red-700',
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <input
            type="text"
            placeholder="Pesquisar leads..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && loadLeads()}
            className="w-80 h-10 px-3 rounded-lg border border-input bg-white"
          />
          <Button variant="outline" onClick={() => loadLeads()}>Pesquisar</Button>
        </div>
        <Button onClick={() => setShowCreate(!showCreate)}>
          {showCreate ? 'Cancelar' : '+ Novo Lead'}
        </Button>
      </div>

      {showCreate && (
        <Card>
          <CardHeader><CardTitle className="text-lg">Novo Lead</CardTitle></CardHeader>
          <CardContent>
            <div className="flex gap-4">
              <input type="text" placeholder="Nome *" value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                className="flex-1 h-10 px-3 rounded-lg border border-input" />
              <input type="email" placeholder="Email" value={form.email}
                onChange={(e) => setForm({ ...form, email: e.target.value })}
                className="flex-1 h-10 px-3 rounded-lg border border-input" />
              <input type="tel" placeholder="Telemóvel" value={form.phone}
                onChange={(e) => setForm({ ...form, phone: e.target.value })}
                className="flex-1 h-10 px-3 rounded-lg border border-input" />
              <Button onClick={handleCreate}>Criar</Button>
            </div>
          </CardContent>
        </Card>
      )}

      <Card>
        <CardContent className="p-0">
          <table className="w-full">
            <thead>
              <tr className="border-b bg-gray-50">
                <th className="text-left p-4 text-sm font-medium text-gray-500">Nome</th>
                <th className="text-left p-4 text-sm font-medium text-gray-500">Contacto</th>
                <th className="text-left p-4 text-sm font-medium text-gray-500">Estado</th>
                <th className="text-left p-4 text-sm font-medium text-gray-500">Score</th>
                <th className="text-left p-4 text-sm font-medium text-gray-500">Origem</th>
                <th className="text-left p-4 text-sm font-medium text-gray-500">Data</th>
                <th className="text-right p-4 text-sm font-medium text-gray-500">Ações</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={7} className="text-center p-8 text-gray-500">A carregar...</td>
                </tr>
              ) : leads.length === 0 ? (
                <tr>
                  <td colSpan={7} className="text-center p-8 text-gray-500">Nenhum lead encontrado</td>
                </tr>
              ) : leads.map((lead) => (
                <tr key={lead.id} className="border-b hover:bg-gray-50">
                  <td className="p-4">
                    <a href={`/leads/${lead.id}`} className="font-medium text-primary-700 hover:underline">
                      {lead.name}
                    </a>
                  </td>
                  <td className="p-4 text-sm text-gray-600">
                    {lead.email && <div>{lead.email}</div>}
                    {lead.phone && <div className="text-xs">{lead.phone}</div>}
                  </td>
                  <td className="p-4">
                    <span className={`px-2 py-0.5 rounded text-xs font-medium ${statusColors[lead.status] || 'bg-gray-100'}`}>
                      {lead.status}
                    </span>
                  </td>
                  <td className="p-4 text-sm">{lead.score}</td>
                  <td className="p-4 text-sm text-gray-600">{lead.source}</td>
                  <td className="p-4 text-sm text-gray-500">
                    {new Date(lead.createdAt).toLocaleDateString('pt-PT')}
                  </td>
                  <td className="p-4 text-right">
                    <button onClick={() => handleDelete(lead.id)} className="text-xs text-red-600 hover:underline">
                      Eliminar
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </CardContent>
      </Card>

      {meta.totalPages > 1 && (
        <div className="flex justify-center gap-2">
          {Array.from({ length: meta.totalPages }, (_, i) => i + 1).map((p) => (
            <Button
              key={p}
              variant={p === meta.page ? 'primary' : 'outline'}
              size="sm"
              onClick={() => loadLeads(p)}
            >
              {p}
            </Button>
          ))}
        </div>
      )}

      <p className="text-sm text-gray-500 text-center">
        Total: {meta.total} leads
      </p>
    </div>
  );
}
