'use client';

import { useEffect, useState } from 'react';
import { api } from '@/lib/api';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { PageHeader } from '@/components/ui/page-header';
import { SkeletonList } from '@/components/ui/skeleton';
import { Plug, CheckCircle2, XCircle, MessageCircle, Phone, CalendarClock, HeartPulse, Workflow, Bell } from 'lucide-react';

const providerIcons: Record<string, any> = {
  whatsapp: MessageCircle,
  voice: Phone,
  calendar: CalendarClock,
  crm: HeartPulse,
  notifications: Bell,
};

const featureDescriptions: Record<string, string> = {
  whatsapp: 'WhatsApp Business com resposta automática por IA',
  voice: 'Chamadas de voz com assistente IA',
  checkins: 'Check-ins periódicos de bem-estar',
  risk_scoring: 'Deteção automática de risco de abandono',
  automations: 'Workflows e automações de eventos',
  portal: 'Portal do cliente',
};

export default function IntegrationsPage() {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.getDemoIntegrations().then(setData).catch(() => setData(null)).finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
        <div className="card-surface p-6"><SkeletonList rows={3} /></div>
        <div className="card-surface p-6"><SkeletonList rows={4} /></div>
      </div>
    );
  }

  const integrations = data?.integrations ?? [];
  const features = data?.features?.features ?? {};

  return (
    <div className="space-y-6">
      <PageHeader
        title="Integrações"
        subtitle="Estado das ligações a serviços externos — todas simuladas em modo demonstração"
      />

      <p className="rounded-xl border border-gold-200/70 bg-gold-50/60 px-4 py-3 text-[13px] text-gold-900">
        Ambiente de demonstração — nenhum serviço pago é utilizado; todas as ligações externas são simuladas de forma segura.
      </p>

      {/* Integrações */}
      <div>
        <div className="mb-3">
          <h2 className="text-sm font-semibold tracking-tight text-foreground">Integrações externas</h2>
          <p className="text-xs text-muted-foreground">Ligações configuradas na plataforma</p>
        </div>
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          {integrations.map((i: any) => {
            const Icon = providerIcons[i.provider] ?? Plug;
            const connected = i.status === 'connected';
            return (
              <Card key={i.provider} className="p-5 transition-all hover:shadow-card-hover">
                <div className="flex items-start gap-3.5">
                  <span
                    className={[
                      'inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-xl ring-1 [&>svg]:h-5 [&>svg]:w-5',
                      connected
                        ? 'bg-primary-50 text-primary-700 ring-primary-100'
                        : 'bg-sand-100 text-sand-600 ring-sand-200',
                    ].join(' ')}
                  >
                    <Icon />
                  </span>
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <p className="text-sm font-semibold text-foreground">{i.label}</p>
                      <Badge variant="gold" size="xs" dot>simulado</Badge>
                      <Badge variant={connected ? 'sage' : 'neutral'} size="xs">
                        {connected ? 'ligado' : 'desligado'}
                      </Badge>
                    </div>
                    <p className="mt-1 text-[13px] leading-relaxed text-muted-foreground">{i.description}</p>
                    <p className="mt-2 flex items-center gap-1.5 text-[11px] text-muted-foreground/70">
                      {connected ? (
                        <CheckCircle2 className="h-3.5 w-3.5 text-primary-600" />
                      ) : (
                        <XCircle className="h-3.5 w-3.5 text-sand-500" />
                      )}
                      {connected
                        ? 'Provider simulado a responder'
                        : 'Ligação real não configurada'}
                    </p>
                  </div>
                </div>
              </Card>
            );
          })}
          {integrations.length === 0 && (
            <Card className="md:col-span-2">
              <p className="p-8 text-center text-sm text-muted-foreground">
                Sem integrações configuradas — execute o seed da demonstração.
              </p>
            </Card>
          )}
        </div>
      </div>

      {/* Funcionalidades */}
      <div>
        <div className="mb-3">
          <h2 className="text-sm font-semibold tracking-tight text-foreground">Funcionalidades ativas</h2>
          <p className="text-xs text-muted-foreground">
            Ativadas por variáveis de ambiente no servidor
          </p>
        </div>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {Object.entries(features).map(([key, value]) => {
            const Icon = featureDescriptions[key] ? (providerIcons[key] ?? Workflow) : Workflow;
            const active = Boolean(value);
            return (
              <Card
                key={key}
                className={[
                  'flex items-center gap-3.5 p-4 transition-all',
                  active ? '' : 'opacity-60',
                ].join(' ')}
              >
                <span
                  className={[
                    'inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ring-1 [&>svg]:h-4 [&>svg]:w-4',
                    active
                      ? 'bg-primary-50 text-primary-700 ring-primary-100'
                      : 'bg-sand-100 text-sand-500 ring-sand-200',
                  ].join(' ')}
                >
                  <Icon />
                </span>
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-semibold capitalize text-foreground">{key.replace(/_/g, ' ')}</p>
                  <p className="mt-0.5 text-xs leading-snug text-muted-foreground">
                    {featureDescriptions[key] ?? 'Funcionalidade da plataforma'}
                  </p>
                </div>
                <Badge variant={active ? 'sage' : 'neutral'} size="sm" dot>
                  {active ? 'ativa' : 'desativada'}
                </Badge>
              </Card>
            );
          })}
        </div>
      </div>
    </div>
  );
}
