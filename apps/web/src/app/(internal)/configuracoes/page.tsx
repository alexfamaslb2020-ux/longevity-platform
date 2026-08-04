'use client';

import { useEffect, useState } from 'react';
import { api } from '@/lib/api';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { PageHeader } from '@/components/ui/page-header';
import { RotateCcw } from 'lucide-react';

export default function ConfiguracoesPage() {
  const [me, setMe] = useState<any>(null);
  const [demo, setDemo] = useState<any>(null);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState('');

  useEffect(() => {
    api
      .me()
      .then(setMe)
      .catch(() => setMe(null));
    api
      .getDemoStatus()
      .then(setDemo)
      .catch(() => setDemo(null));
  }, []);

  const resetDemo = async () => {
    if (!confirm('Repor a demonstração? Elimina os dados criados pela demo (não afeta leads/clientes reais).'))
      return;
    setBusy(true);
    try {
      const res = await api.resetDemo();
      setMessage(
        `Demonstração reposta (${Object.values(res.deleted || {}).reduce((a: any, b: any) => a + b, 0)} registos removidos).`
      );
      const d = await api.getDemoStatus();
      setDemo(d);
    } catch (e: any) {
      setMessage(e.message || 'Erro ao repor a demonstração');
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="space-y-5">
      <PageHeader title="Configurações" subtitle="Conta e manutenção da demonstração." />

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <Card className="p-5">
          <h2 className="font-semibold tracking-tight text-foreground">Conta</h2>
          <p className="mt-0.5 text-[13px] text-muted-foreground">Dados do utilizador com sessão iniciada</p>
          <dl className="mt-4 space-y-2.5 text-[13px]">
            {[
              { label: 'Nome', value: me?.name || '—' },
              { label: 'Email', value: me?.email || '—' },
              { label: 'Perfil', value: me?.role || '—' },
            ].map((f) => (
              <div key={f.label} className="flex items-baseline justify-between gap-4 border-b border-border/50 pb-2.5 last:border-0">
                <dt className="text-muted-foreground">{f.label}</dt>
                <dd className="text-right font-medium text-foreground">{f.value}</dd>
              </div>
            ))}
          </dl>
        </Card>

        <Card className="p-5">
          <h2 className="font-semibold tracking-tight text-foreground">Demonstração</h2>
          <p className="mt-0.5 text-[13px] text-muted-foreground">
            Dados criados pela reprodução da demo, no ambiente atual.
          </p>
          {demo?.counts && (
            <dl className="mt-4 grid grid-cols-2 gap-x-4 gap-y-2.5 text-[13px]">
              {Object.entries(demo.counts).map(([k, v]) => (
                <div key={k} className="flex items-baseline justify-between border-b border-border/50 pb-2">
                  <dt className="capitalize text-muted-foreground">{k}</dt>
                  <dd className="font-medium text-foreground">{String(v)}</dd>
                </div>
              ))}
            </dl>
          )}
          {message && (
            <p className="mt-4 rounded-xl border border-primary-200/80 bg-primary-50/60 px-3.5 py-2.5 text-sm text-primary-800 animate-fadeIn">
              {message}
            </p>
          )}
          <div className="mt-4">
            <Button variant="outline" onClick={resetDemo} loading={busy} size="sm">
              <RotateCcw className="h-4 w-4" /> Repor demonstração
            </Button>
          </div>
        </Card>
      </div>
    </div>
  );
}
