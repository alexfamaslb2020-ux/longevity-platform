'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { api } from '@/lib/api';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { PageHeader } from '@/components/ui/page-header';
import { SkeletonText } from '@/components/ui/skeleton';
import { Save, ArrowLeft } from 'lucide-react';

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
      .then((lead) =>
        setForm({
          name: lead.name || '',
          email: lead.email || '',
          phone: lead.phone || '',
          source: lead.source || '',
          notes: '',
        })
      )
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
      <div className="mx-auto max-w-2xl">
        <div className="card-surface p-6">
          <SkeletonText lines={5} />
        </div>
      </div>
    );
  }

  if (error && !form.name) {
    return (
      <div className="mx-auto max-w-2xl">
        <Card className="p-8">
          <p className="mb-4 text-sm text-red-600">{error}</p>
          <Button variant="outline" onClick={() => router.push(`/leads/${id}`)}>
            <ArrowLeft className="h-4 w-4" /> Voltar
          </Button>
        </Card>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-2xl">
      <PageHeader
        breadcrumb={['CRM', 'Leads', 'Editar']}
        title="Editar lead"
        subtitle="Atualize os dados de contacto e informação do lead"
      />
      <Card className="relative overflow-hidden p-6">
        <div className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-primary-300/60 to-transparent" />
        <form onSubmit={handleSubmit} className="space-y-5">
          {error && (
            <div className="rounded-xl border border-red-200 bg-red-50 px-3.5 py-2.5 text-sm text-red-700">
              {error}
            </div>
          )}

          <div className="space-y-2">
            <label htmlFor="name" className="text-[13px] font-medium text-foreground">Nome *</label>
            <Input
              id="name"
              type="text"
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              required
            />
          </div>

          <div className="space-y-2">
            <label htmlFor="email" className="text-[13px] font-medium text-foreground">Email</label>
            <Input
              id="email"
              type="email"
              value={form.email}
              onChange={(e) => setForm({ ...form, email: e.target.value })}
            />
          </div>

          <div className="space-y-2">
            <label htmlFor="phone" className="text-[13px] font-medium text-foreground">Telemóvel</label>
            <Input
              id="phone"
              type="tel"
              value={form.phone}
              onChange={(e) => setForm({ ...form, phone: e.target.value })}
            />
          </div>

          <div className="space-y-2">
            <label htmlFor="source" className="text-[13px] font-medium text-foreground">Origem</label>
            <select
              id="source"
              value={form.source}
              onChange={(e) => setForm({ ...form, source: e.target.value })}
              className="input-base bg-white"
            >
              <option value="">Selecionar…</option>
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

          <div className="flex gap-3 pt-2">
            <Button type="submit" loading={saving}>
              <Save className="h-4 w-4" /> Guardar
            </Button>
            <Button type="button" variant="outline" onClick={() => router.push(`/leads/${id}`)}>
              <ArrowLeft className="h-4 w-4" /> Cancelar
            </Button>
          </div>
        </form>
      </Card>
    </div>
  );
}
