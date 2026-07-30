'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { api } from '@/lib/api';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

export default function CustomerDetailPage() {
  const { id } = useParams();
  const router = useRouter();
  const [customer, setCustomer] = useState<any>(null);
  const [checkins, setCheckins] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!id) return;
    setLoading(true);
    Promise.all([
      api.getCustomer(id as string),
      api.getCustomerCheckIns(id as string).catch(() => []),
    ])
      .then(([cust, chk]) => {
        setCustomer(cust);
        setCheckins(chk);
      })
      .catch((err) => setError(err.message || 'Erro ao carregar cliente'))
      .finally(() => setLoading(false));
  }, [id]);

  const handleSendMessage = async () => {
    if (!customer.phone) return;
    const text = prompt(`Enviar WhatsApp para ${customer.phone}:`);
    if (text) {
      await api.sendWhatsApp(customer.phone, text);
      alert('Mensagem enviada');
    }
  };

  const handleCall = async () => {
    if (!customer.phone) return;
    const confirmCall = confirm(`Iniciar chamada para ${customer.phone}?`);
    if (confirmCall) {
      await api.makeVoiceCall(customer.phone, 'engagement', { customerId: customer.id });
      alert('Chamada iniciada');
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="animate-spin h-8 w-8 border-4 border-primary-500 border-t-transparent rounded-full" />
      </div>
    );
  }

  if (error) {
    return (
      <Card>
        <CardContent className="p-8 text-center">
          <p className="text-red-600 mb-4">{error}</p>
          <Button variant="outline" onClick={() => router.push('/customers')}>Voltar</Button>
        </CardContent>
      </Card>
    );
  }

  if (!customer) return null;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">{customer.name}</h2>
          <p className="text-gray-500">
            {customer.email} {customer.phone && `• ${customer.phone}`}
          </p>
        </div>
        <Button variant="outline" onClick={() => router.push('/customers')}>Voltar</Button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <Card>
            <CardHeader><CardTitle className="text-lg">Informação Geral</CardTitle></CardHeader>
            <CardContent>
              <dl className="grid grid-cols-2 gap-4">
                <div>
                  <dt className="text-sm text-gray-500">Segmento</dt>
                  <dd className="font-medium">{customer.segment || '-'}</dd>
                </div>
                <div>
                  <dt className="text-sm text-gray-500">Estado</dt>
                  <dd className="font-medium">{customer.status}</dd>
                </div>
                <div>
                  <dt className="text-sm text-gray-500">Nível Risco</dt>
                  <dd>
                    <span className={`px-2 py-0.5 rounded text-xs font-medium ${
                      customer.riskLevel === 'HIGH' ? 'bg-red-100 text-red-700' :
                      customer.riskLevel === 'MEDIUM' ? 'bg-yellow-100 text-yellow-700' :
                      'bg-green-100 text-green-700'
                    }`}>
                      {customer.riskLevel || 'N/A'}
                    </span>
                  </dd>
                </div>
                <div>
                  <dt className="text-sm text-gray-500">Score Risco</dt>
                  <dd className="font-medium">{customer.riskScore ?? '-'}</dd>
                </div>
                {customer.dateOfBirth && (
                  <div>
                    <dt className="text-sm text-gray-500">Data Nascimento</dt>
                    <dd className="font-medium">{new Date(customer.dateOfBirth).toLocaleDateString('pt-PT')}</dd>
                  </div>
                )}
                <div>
                  <dt className="text-sm text-gray-500">Criado em</dt>
                  <dd className="font-medium">{new Date(customer.createdAt).toLocaleDateString('pt-PT')}</dd>
                </div>
              </dl>
            </CardContent>
          </Card>

          <Card>
            <CardHeader><CardTitle className="text-lg">Check-ins Recentes</CardTitle></CardHeader>
            <CardContent>
              {checkins.length === 0 ? (
                <p className="text-sm text-gray-500">Nenhum check-in</p>
              ) : (
                <div className="space-y-3">
                  {checkins.map((ci: any) => (
                    <div key={ci.id} className="p-3 bg-gray-50 rounded-lg">
                      <div className="flex justify-between text-sm mb-2">
                        <span className="font-medium">{ci.type}</span>
                        <span className="text-gray-500">{new Date(ci.date).toLocaleString('pt-PT')}</span>
                      </div>
                      {ci.responses && (
                        <div className="text-xs text-gray-600 space-y-1">
                          {Object.entries(ci.responses).map(([key, val]) => (
                            <p key={key}>• {key}: {String(val)}</p>
                          ))}
                        </div>
                      )}
                      {ci.riskScore !== null && (
                        <p className="text-xs mt-2 font-medium">
                          Score: {ci.riskScore} {ci.riskLevel && `(${ci.riskLevel})`}
                        </p>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader><CardTitle className="text-lg">Conversas Recentes</CardTitle></CardHeader>
            <CardContent>
              {(!customer.conversations || customer.conversations.length === 0) ? (
                <p className="text-sm text-gray-500">Nenhuma conversa</p>
              ) : (
                <div className="space-y-3">
                  {customer.conversations.map((conv: any) => (
                    <div key={conv.id} className="p-3 bg-gray-50 rounded-lg">
                      <div className="flex justify-between text-sm">
                        <span className="font-medium">{conv.channel}</span>
                        <span className="text-gray-500">{new Date(conv.createdAt).toLocaleDateString('pt-PT')}</span>
                      </div>
                      {conv.summary && <p className="text-xs text-gray-600 mt-1">{conv.summary}</p>}
                      {conv.messages?.slice(0, 2).map((msg: any) => (
                        <p key={msg.id} className="text-xs text-gray-500 mt-1">
                          <span className="font-medium">{msg.role}:</span> {msg.content?.substring(0, 100)}
                        </p>
                      ))}
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader><CardTitle className="text-lg">Agendamentos</CardTitle></CardHeader>
            <CardContent>
              {(!customer.appointments || customer.appointments.length === 0) ? (
                <p className="text-sm text-gray-500">Nenhum agendamento</p>
              ) : (
                <div className="space-y-2">
                  {customer.appointments.map((apt: any) => (
                    <div key={apt.id} className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
                      <div>
                        <p className="text-sm font-medium">{apt.title}</p>
                        <p className="text-xs text-gray-500">{new Date(apt.startDate).toLocaleString('pt-PT')}</p>
                      </div>
                      <span className="text-xs px-2 py-0.5 rounded bg-gray-200">{apt.status}</span>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        <div className="space-y-6">
          <Card>
            <CardHeader><CardTitle className="text-lg">Ações</CardTitle></CardHeader>
            <CardContent className="space-y-3">
              <Button className="w-full" onClick={handleSendMessage} disabled={!customer.phone}>
                Enviar WhatsApp
              </Button>
              <Button className="w-full" variant="outline" onClick={handleCall} disabled={!customer.phone}>
                Iniciar Chamada
              </Button>
              <Button className="w-full" variant="secondary" disabled>
                Agendar Check-in
              </Button>
            </CardContent>
          </Card>

          <Card>
            <CardHeader><CardTitle className="text-lg">Tarefas</CardTitle></CardHeader>
            <CardContent>
              {(!customer.tasks || customer.tasks.length === 0) ? (
                <p className="text-sm text-gray-500">Nenhuma tarefa</p>
              ) : (
                <div className="space-y-2">
                  {customer.tasks.map((task: any) => (
                    <div key={task.id} className="p-2 bg-gray-50 rounded text-sm">
                      <p className="font-medium">{task.title}</p>
                      <p className="text-xs text-gray-500">{task.status} • {task.priority}</p>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader><CardTitle className="text-lg">Serviços</CardTitle></CardHeader>
            <CardContent>
              {(!customer.services || customer.services.length === 0) ? (
                <p className="text-sm text-gray-500">Nenhum serviço</p>
              ) : (
                <div className="space-y-2">
                  {customer.services.map((s: any) => (
                    <div key={s.id} className="p-2 bg-gray-50 rounded text-sm">
                      <p className="font-medium">{s.name}</p>
                      <p className="text-xs text-gray-500">
                        {s.status} • {s.assignedTo?.name || 'Não atribuído'}
                      </p>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader><CardTitle className="text-lg">Documentos</CardTitle></CardHeader>
            <CardContent>
              {(!customer.documents || customer.documents.length === 0) ? (
                <p className="text-sm text-gray-500">Nenhum documento</p>
              ) : (
                <div className="space-y-1">
                  {customer.documents.map((doc: any) => (
                    <div key={doc.id} className="flex justify-between text-sm p-1">
                      <span>{doc.name}</span>
                      <span className="text-xs text-gray-500">{doc.type}</span>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
