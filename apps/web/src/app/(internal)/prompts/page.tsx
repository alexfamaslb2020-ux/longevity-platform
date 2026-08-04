'use client';

import { useState } from 'react';
import { PageHeader } from '@/components/ui/page-header';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

const PROMPTS = [
  {
    key: 'QUALIFICATION',
    title: 'Qualificação',
    objective: 'Qualificar o potencial cliente e agendar uma avaliação gratuita.',
    collects: ['Nome completo', 'Objetivo principal', 'Interesse no serviço', 'Acompanhamento atual'],
    transfers: [
      'Pedido explícito para falar com um humano',
      'Menção de sintomas ou condição médica',
      'Insatisfação ou frustração',
      'Situação de urgência',
    ],
  },
  {
    key: 'CHECK_IN',
    title: 'Check-in por voz',
    objective: 'Realizar um check-in de acompanhamento com o cliente.',
    collects: ['Energia (1-5)', 'Sono (1-5)', 'Stress (1-5)', 'Adesão ao plano', 'Satisfação (1-5)'],
    transfers: [
      'Energia ou satisfação ≤ 2',
      'Stress ≥ 4',
      'Desânimo profundo',
      'Sintomas novos ou agravados',
    ],
  },
  {
    key: 'SCHEDULING',
    title: 'Agendamento',
    objective: 'Agendar ou confirmar uma avaliação ou consulta.',
    collects: ['Objetivo do agendamento', 'Data e hora', 'Confirmação dos detalhes'],
    transfers: ['Cliente insatisfeito com horários', 'Pedido para falar com humano'],
  },
];

export default function PromptsPage() {
  const [open, setOpen] = useState<string | null>(null);

  return (
    <div className="space-y-5">
      <PageHeader
        title="Prompts"
        subtitle="Guiões que a assistente IA segue nas chamadas e conversas."
      />
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        {PROMPTS.map((p) => {
          const expanded = open === p.key;
          return (
            <Card key={p.key} className="flex flex-col p-5">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <h2 className="font-semibold tracking-tight text-foreground">{p.title}</h2>
                  <p className="mt-1 text-[13px] leading-relaxed text-muted-foreground">{p.objective}</p>
                </div>
                <Badge variant="outline" size="sm">v1</Badge>
              </div>
              <div className="mt-4 space-y-4 text-[13px]">
                <div>
                  <p className="mb-1.5 font-medium text-foreground">Dados recolhidos</p>
                  <ul className="space-y-1 text-muted-foreground">
                    {p.collects.map((c) => (
                      <li key={c} className="flex gap-2">
                        <span className="text-primary-600">·</span>
                        {c}
                      </li>
                    ))}
                  </ul>
                </div>
                <div>
                  <p className="mb-1.5 font-medium text-foreground">Transfere para humano quando</p>
                  <ul className="space-y-1 text-muted-foreground">
                    {p.transfers.map((c) => (
                      <li key={c} className="flex gap-2">
                        <span className="text-gold-600">·</span>
                        {c}
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
              <button
                onClick={() => setOpen(expanded ? null : p.key)}
                className="mt-4 text-left text-[13px] font-medium text-primary-700 hover:underline"
              >
                {expanded ? 'Ocultar guião' : 'Ver guião completo'}
              </button>
              {expanded && (
                <pre className="thin-scrollbar mt-3 max-h-64 overflow-y-auto whitespace-pre-wrap rounded-xl border border-border/60 bg-muted/40 p-4 text-xs leading-relaxed text-muted-foreground">
                  {`És um assistente virtual da Longevidade, especializada em saúde preventiva.\n\nSeguir o fluxo do guião, recolher os dados indicados e, se necessário,\nencaminhar para um profissional humano.\n\nA assistente chama-se Sofia e nunca dá aconselhamento médico.`}
                </pre>
              )}
            </Card>
          );
        })}
      </div>
    </div>
  );
}
