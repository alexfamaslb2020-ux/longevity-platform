'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { api } from '@/lib/api';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';

export default function EditLeadPage() {
  const { id } = useParams();
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [form, setForm] = useState({
    name: '',
    email: '',
    phone: '',
    source: '',
    notes: '',
  });

  useEffect(() => {
    if (!id) return;
    api.getLead(id as string)
      .then((lead) => setForm({
        name: lead.name || '',
        email: lead.email || '',
        phone: lead.phone || '',
        source: lead.source || '',
        notes: '',
      }))
      .catch((err) => setError(err.message || 'Erro ao carregar lead'))
      .finally(() => setLoading(false));
  }, [id]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name.trim()) return;
    setSaving(true);
    try {
      await api.updateLead(id as string, { name: form.name, email: form.email, phone: form.phone });
      router.push(`/leads/${id}`);
    } catch (err: any) {
      setError(err.message || 'Erro ao guardar');
    } finally {
      setSaving(false);
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
          <Button variant="outline" onClick={() => router.push(`/leads/${id}`)}>Voltar</Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="max-w-2xl mx-auto">
      <h2 className="text-2xl font-bold mb-6">Editar Lead</h2>
      <Card>
        <CardContent className="p-6">
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-1">Nome *</label>
              <input type="text" value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                className="w-full h-10 px-3 rounded-lg border border-input" required />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Email</label>
              <input type="email" value={form.email}
                onChange={(e) => setForm({ ...form, email: e.target.value })}
                className="w-full h-10 px-3 rounded-lg border border-input" />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Telemóvel</label>
              <input type="tel" value={form.phone}
                onChange={(e) => setForm({ ...form, phone: e.target.value })}
                className="w-full h-10 px-3 rounded-lg border border-input" />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Origem</label>
              <select value={form.source}
                onChange={(e) => setForm({ ...form, source: e.target.value })}
                className="w-full h-10 px-3 rounded-lg border border-input">
                <option value="">Selecionar...</option>
                <option value="WEBSITE">Website</option>
                <option value="REFERRAL">Referência</option>
                <option value="SOCIAL_MEDIA">Redes Sociais</option>
                <option value="WHATSAPP">WhatsApp</option>
                <option value="PHONE">Telefone</option>
                <option value="EMAIL">Email</option>
                <option value="EVENT">Evento</option>
                <option value="OTHER">Outro</option>
              </select>
            </div>
            <div className="flex gap-3 pt-4">
              <Button type="submit" loading={saving}>Guardar</Button>
              <Button type="button" variant="outline" onClick={() => router.push(`/leads/${id}`)}>Cancelar</Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
