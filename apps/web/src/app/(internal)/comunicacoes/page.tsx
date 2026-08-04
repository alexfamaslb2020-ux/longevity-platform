'use client';

import { useState } from 'react';
import { Tabs } from '@/components/ui/tabs';
import { PageHeader } from '@/components/ui/page-header';
import { WhatsappInbox } from '@/components/comunicacoes/whatsapp-inbox';
import { CallsConsole } from '@/components/comunicacoes/calls-console';

type Tab = 'whatsapp' | 'calls';

export default function ComunicacoesPage() {
  const [tab, setTab] = useState<Tab>('whatsapp');

  return (
    <div className="space-y-5">
      <PageHeader
        title="Comunicações"
        subtitle="WhatsApp e chamadas assistidas por IA num só lugar"
      />
      <Tabs<Tab>
        tabs={[
          { key: 'whatsapp', label: 'WhatsApp' },
          { key: 'calls', label: 'Chamadas IA' },
        ]}
        active={tab}
        onChange={setTab}
      />
      {tab === 'whatsapp' ? <WhatsappInbox /> : <CallsConsole />}
    </div>
  );
}
