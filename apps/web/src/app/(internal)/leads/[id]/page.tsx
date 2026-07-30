'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { api } from '@/lib/api';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

export default function LeadDetailPage() {
  const { id } = useParams();
  const router = useRouter();
  const [lead, setLead] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [noteText, setNoteText] = useState('');
  const [stageId, setStageId] = useState('');

  useEffect(() => {
    if (!id) return;
    setLoading(true);
    api.getLead(id as string)
      .then(setLead)
      .catch((err) => setError(err.message || 'Erro ao carregar lead'))
      .finally(() => setLoading(false));
  }, [id]);

  const handleStageChange = async () => {
    if (!stageId) return;
    await api.moveLead(id as string, stageId);
    const updated = await api.getLead(id as string);
    setLead(updated);
    setStageId('');
  };

  const handleAddNote = async () => {
    if (!noteText.trim()) return;
    await api.post(`/leads/${id}/notes`, { content: noteText });
    setNoteText('');
  };

  const handleConvert = async () => {
    if (!confirm('Converter este lead em cliente?')) return;
    await api.post('/customers', { leadId: id as string });
    router.push('/customers');
  };

  const statusColors: Record<string, string> = {
    NEW: 'bg-blue-100 text-blue-700',
    CONTACTED: 'bg-purple-100 text-purple-700',
    QUALIFYING: 'bg-yellow-100 text-yellow-700',
    QUALIFIED: 'bg-green-100 text-green-700',
    CONVERTED: 'bg-emerald-100 text-emerald-700',
    LOST: 'bg-red-100 text-red-700',
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
          <Button variant="outline" onClick={() => router.push('/leads')}>Voltar</Button>
        </CardContent>
      </Card>
    );
  }

  if (!lead) return null;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">{lead.name}</h2>
          <p className="text-gray-500">
            {lead.email} {lead.phone && `• ${lead.phone}`}
          </p>
        </div>
        <div className="flex gap-2">
          {lead.status !== 'CONVERTED' && lead.status !== 'LOST' && (
            <Button onClick={handleConvert}>Converter em Cliente</Button>
          )}
          <Button variant="outline" onClick={() => router.push('/leads')}>Voltar</Button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <Card>
            <CardHeader><CardTitle className="text-lg">Informação Geral</CardTitle></CardHeader>
            <CardContent>
              <dl className="grid grid-cols-2 gap-4">
                <div>
                  <dt className="text-sm text-gray-500">Origem</dt>
                  <dd className="font-medium">{lead.source}</dd>
                </div>
                <div>
                  <dt className="text-sm text-gray-500">Score</dt>
                  <dd className="font-medium">{lead.score}</dd>
                </div>
                <div>
                  <dt className="text-sm text-gray-500">Estado</dt>
                  <dd>
                    <span className={`px-2 py-0.5 rounded text-xs font-medium ${statusColors[lead.status] || 'bg-gray-100'}`}>
                      {lead.status}
                    </span>
                  </dd>
                </div>
                <div>
                  <dt className="text-sm text-gray-500">Etapa Pipeline</dt>
                  <dd className="font-medium">{lead.pipelineStage?.name || '-'}</dd>
                </div>
                <div>
                  <dt className="text-sm text-gray-500">Responsável</dt>
                  <dd className="font-medium">{lead.assignedTo?.name || 'Não atribuído'}</dd>
                </div>
                <div>
                  <dt className="text-sm text-gray-500">Criado em</dt>
                  <dd className="font-medium">{new Date(lead.createdAt).toLocaleDateString('pt-PT')}</dd>
                </div>
              </dl>
            </CardContent>
          </Card>

          <Card>
            <CardHeader><CardTitle className="text-lg">Conversas</CardTitle></CardHeader>
            <CardContent>
              {(!lead.conversations || lead.conversations.length === 0) ? (
                <p className="text-sm text-gray-500">Nenhuma conversa</p>
              ) : (
                <div className="space-y-3">
                  {lead.conversations.slice(0, 5).map((conv: any) => (
                    <div key={conv.id} className="p-3 bg-gray-50 rounded-lg">
                      <div className="flex justify-between text-sm mb-2">
                        <span className="font-medium">{conv.channel}</span>
                        <span className="text-gray-500">{new Date(conv.createdAt).toLocaleDateString('pt-PT')}</span>
                      </div>
                      {conv.summary && <p className="text-sm text-gray-600">{conv.summary}</p>}
                      {conv.messages?.slice(0, 3).map((msg: any) => (
                        <p key={msg.id} className="text-xs text-gray-500 mt-1">
                          <span className="font-medium">{msg.role}:</span> {msg.content}
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
              {(!lead.appointments || lead.appointments.length === 0) ? (
                <p className="text-sm text-gray-500">Nenhum agendamento</p>
              ) : (
                <div className="space-y-2">
                  {lead.appointments.map((apt: any) => (
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

          <Card>
            <CardHeader><CardTitle className="text-lg">Notas</CardTitle></CardHeader>
            <CardContent>
              {(!lead.notes || lead.notes.length === 0) && (
                <p className="text-sm text-gray-500 mb-4">Nenhuma nota</p>
              )}
              {lead.notes?.map((note: any) => (
                <div key={note.id} className="p-3 bg-gray-50 rounded-lg mb-2">
                  <p className="text-sm">{note.content}</p>
                  <p className="text-xs text-gray-500 mt-1">
                    {note.author?.name || 'Sistema'} — {new Date(note.createdAt).toLocaleString('pt-PT')}
                  </p>
                </div>
              ))}
              <div className="mt-4 flex gap-2">
                <input
                  type="text"
                  value={noteText}
                  onChange={(e) => setNoteText(e.target.value)}
                  placeholder="Adicionar nota..."
                  className="flex-1 h-10 px-3 rounded-lg border border-input"
                  onKeyDown={(e) => e.key === 'Enter' && handleAddNote()}
                />
                <Button variant="secondary" onClick={handleAddNote}>Adicionar</Button>
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="space-y-6">
          <Card>
            <CardHeader><CardTitle className="text-lg">Ações</CardTitle></CardHeader>
            <CardContent className="space-y-3">
              {lead.pipelineStage && (
                <div>
                  <label className="text-sm font-medium">Mover Etapa</label>
                  <select
                    value={stageId}
                    onChange={(e) => setStageId(e.target.value)}
                    className="w-full h-10 px-3 rounded-lg border border-input mt-1"
                  >
                    <option value="">Selecionar etapa...</option>
                    {lead.pipelineStage.pipelineId && (
                      <option value={lead.pipelineStage.id}>Atual: {lead.pipelineStage.name}</option>
                    )}
                  </select>
                  <Button className="w-full mt-2" size="sm" onClick={handleStageChange} disabled={!stageId}>
                    Mover
                  </Button>
                </div>
              )}

              <Button className="w-full" variant="outline" onClick={() => router.push(`/leads/${id}/edit`)}>
                Editar Lead
              </Button>
            </CardContent>
          </Card>

          <Card>
            <CardHeader><CardTitle className="text-lg">Tarefas</CardTitle></CardHeader>
            <CardContent>
              {(!lead.tasks || lead.tasks.length === 0) ? (
                <p className="text-sm text-gray-500">Nenhuma tarefa</p>
              ) : (
                <div className="space-y-2">
                  {lead.tasks.map((task: any) => (
                    <div key={task.id} className="p-2 bg-gray-50 rounded text-sm">
                      <p className="font-medium">{task.title}</p>
                      <p className="text-xs text-gray-500">{task.status} • {task.priority}</p>
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
