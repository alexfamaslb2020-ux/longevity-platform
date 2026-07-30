'use client';

import { useEffect, useState } from 'react';
import { api } from '@/lib/api';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

interface DashboardStats {
  stages?: { name: string; count: number; color: string }[];
  total?: number;
}

interface AtRiskCustomer {
  id: string;
  lead: { name: string; email: string; phone: string };
  churnRisk: number;
  _count: { alerts: number };
}

export default function DashboardPage() {
  const [stats, setStats] = useState<DashboardStats>({});
  const [atRisk, setAtRisk] = useState<AtRiskCustomer[]>([]);
  const [pendingCheckIns, setPendingCheckIns] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      api.getPipelineStats().catch(() => ({})),
      api.getAtRiskCustomers().catch(() => []),
      api.getPendingCheckIns().catch(() => []),
    ]).then(([s, r, c]) => {
      setStats(s);
      setAtRisk(r);
      setPendingCheckIns(c);
    }).finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="animate-spin h-8 w-8 border-4 border-primary-500 border-t-transparent rounded-full" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-500">Total Leads</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold">{stats.total || 0}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-500">Em Risco</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold text-red-600">{atRisk.length}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-500">Check-ins Pendentes</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold text-amber-600">{pendingCheckIns.length}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-500">Etapas Ativas</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold">{stats.stages?.length || 0}</p>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Pipeline</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {stats.stages?.map((stage) => (
                <div key={stage.name} className="flex items-center gap-3">
                  <div
                    className="w-3 h-3 rounded-full flex-shrink-0"
                    style={{ backgroundColor: stage.color }}
                  />
                  <span className="flex-1 text-sm">{stage.name}</span>
                  <span className="text-sm font-semibold">{stage.count}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Clientes em Risco</CardTitle>
          </CardHeader>
          <CardContent>
            {atRisk.length === 0 ? (
              <p className="text-sm text-gray-500">Nenhum cliente em risco</p>
            ) : (
              <div className="space-y-3">
                {atRisk.slice(0, 5).map((c) => (
                  <div key={c.id} className="flex items-center justify-between py-2 border-b last:border-0">
                    <div>
                      <p className="text-sm font-medium">{c.lead.name}</p>
                      <p className="text-xs text-gray-500">{c.lead.email || c.lead.phone}</p>
                    </div>
                    <div className="text-right">
                      <span className={clsx(
                        'px-2 py-0.5 rounded text-xs font-medium',
                        c.churnRisk >= 0.7 ? 'bg-red-100 text-red-700' :
                        c.churnRisk >= 0.5 ? 'bg-amber-100 text-amber-700' :
                        'bg-yellow-100 text-yellow-700'
                      )}>
                        {Math.round(c.churnRisk * 100)}%
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Check-ins Pendentes</CardTitle>
        </CardHeader>
        <CardContent>
          {pendingCheckIns.length === 0 ? (
            <p className="text-sm text-gray-500">Nenhum check-in pendente</p>
          ) : (
            <div className="space-y-2">
              {pendingCheckIns.slice(0, 5).map((ci: any) => (
                <div key={ci.id} className="flex items-center justify-between py-2 border-b last:border-0">
                  <div>
                    <p className="text-sm font-medium">{ci.customer?.lead?.name || 'Cliente'}</p>
                    <p className="text-xs text-gray-500">{ci.type} - {ci.channel}</p>
                  </div>
                  <span className="text-xs text-gray-500">
                    {new Date(ci.scheduledAt).toLocaleDateString('pt-PT')}
                  </span>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

function clsx(...classes: (string | boolean | undefined | null | Record<string, boolean | undefined>)[]): string {
  return classes
    .filter(Boolean)
    .map((c) => {
      if (typeof c === 'string') return c;
      if (typeof c === 'object' && c !== null) {
        return Object.entries(c)
          .filter(([, v]) => v)
          .map(([k]) => k)
          .join(' ');
      }
      return '';
    })
    .join(' ');
}
