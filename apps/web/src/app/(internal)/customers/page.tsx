'use client';

import { useEffect, useState } from 'react';
import { api } from '@/lib/api';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useRouter } from 'next/navigation';

export default function CustomersPage() {
  const [customers, setCustomers] = useState<any[]>([]);
  const [meta, setMeta] = useState({ total: 0, page: 1, totalPages: 0 });
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [atRisk, setAtRisk] = useState<any[]>([]);
  const [error, setError] = useState('');
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
      setError('Erro ao carregar clientes');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { loadCustomers(); }, []);

  useEffect(() => {
    api.getAtRiskCustomers().then(setAtRisk).catch(() => {});
  }, []);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <input
            type="text"
            placeholder="Pesquisar clientes..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && loadCustomers()}
            className="w-80 h-10 px-3 rounded-lg border border-input bg-white"
          />
          <Button variant="outline" onClick={() => loadCustomers()}>Pesquisar</Button>
        </div>
      </div>

      {atRisk.length > 0 && (
        <Card className="border-red-200 bg-red-50">
          <CardHeader><CardTitle className="text-lg text-red-700">Clientes em Risco</CardTitle></CardHeader>
          <CardContent>
            <div className="space-y-2">
              {atRisk.slice(0, 5).map((c: any) => (
                <div key={c.id} className="flex justify-between items-center p-2 bg-white rounded">
                  <div>
                    <p className="text-sm font-medium">{c.name}</p>
                    <p className="text-xs text-gray-500">
                      Risco: {c.riskLevel || 'Médio'} • Score: {c.riskScore || '-'}
                    </p>
                  </div>
                  <Button size="sm" variant="outline" onClick={() => router.push(`/customers/${c.id}`)}>
                    Ver
                  </Button>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {error && <p className="text-sm text-red-600">{error}</p>}

      <Card>
        <CardContent className="p-0">
          <table className="w-full">
            <thead>
              <tr className="border-b bg-gray-50">
                <th className="text-left p-4 text-sm font-medium text-gray-500">Nome</th>
                <th className="text-left p-4 text-sm font-medium text-gray-500">Contacto</th>
                <th className="text-left p-4 text-sm font-medium text-gray-500">Segmento</th>
                <th className="text-left p-4 text-sm font-medium text-gray-500">Nível Risco</th>
                <th className="text-left p-4 text-sm font-medium text-gray-500">Check-ins</th>
                <th className="text-left p-4 text-sm font-medium text-gray-500">Data</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={6} className="text-center p-8 text-gray-500">A carregar...</td>
                </tr>
              ) : customers.length === 0 ? (
                <tr>
                  <td colSpan={6} className="text-center p-8 text-gray-500">Nenhum cliente encontrado</td>
                </tr>
              ) : customers.map((c) => (
                <tr key={c.id} className="border-b hover:bg-gray-50 cursor-pointer" onClick={() => router.push(`/customers/${c.id}`)}>
                  <td className="p-4 font-medium text-primary-700">{c.name}</td>
                  <td className="p-4 text-sm text-gray-600">
                    {c.email && <div>{c.email}</div>}
                    {c.phone && <div className="text-xs">{c.phone}</div>}
                  </td>
                  <td className="p-4 text-sm">{c.segment || '-'}</td>
                  <td className="p-4">
                    <span className={`px-2 py-0.5 rounded text-xs font-medium ${
                      c.riskLevel === 'HIGH' ? 'bg-red-100 text-red-700' :
                      c.riskLevel === 'MEDIUM' ? 'bg-yellow-100 text-yellow-700' :
                      'bg-green-100 text-green-700'
                    }`}>
                      {c.riskLevel || 'N/A'}
                    </span>
                  </td>
                  <td className="p-4 text-sm">{c.checkInsCount ?? '-'}</td>
                  <td className="p-4 text-sm text-gray-500">
                    {new Date(c.createdAt).toLocaleDateString('pt-PT')}
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
            <Button key={p} variant={p === meta.page ? 'primary' : 'outline'} size="sm" onClick={() => loadCustomers(p)}>
              {p}
            </Button>
          ))}
        </div>
      )}

      <p className="text-sm text-gray-500 text-center">Total: {meta.total} clientes</p>
    </div>
  );
}
