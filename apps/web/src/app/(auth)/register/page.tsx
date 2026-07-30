'use client';

import { useState, FormEvent } from 'react';
import { useRouter } from 'next/navigation';
import { api } from '@/lib/api';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

export default function RegisterPage() {
  const router = useRouter();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      await api.register({ email, password, name });
      router.push('/dashboard');
    } catch (err: any) {
      setError(err.message || 'Erro ao registar');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-primary-50 to-primary-100 p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="space-y-1 text-center">
          <CardTitle className="text-3xl font-bold text-primary-700">
            Criar Conta
          </CardTitle>
          <CardDescription>
            Registe-se para aceder à plataforma
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            {error && (
              <div className="bg-red-50 text-red-600 text-sm p-3 rounded-lg border border-red-200">
                {error}
              </div>
            )}

            <div className="space-y-2">
              <label htmlFor="name" className="text-sm font-medium">Nome</label>
              <input id="name" type="text" value={name} onChange={(e) => setName(e.target.value)}
                className="w-full h-10 px-3 rounded-lg border border-input bg-background focus:outline-none focus:ring-2 focus:ring-primary-500"
                placeholder="O seu nome" required />
            </div>

            <div className="space-y-2">
              <label htmlFor="email" className="text-sm font-medium">Email</label>
              <input id="email" type="email" value={email} onChange={(e) => setEmail(e.target.value)}
                className="w-full h-10 px-3 rounded-lg border border-input bg-background focus:outline-none focus:ring-2 focus:ring-primary-500"
                placeholder="seu@email.com" required />
            </div>

            <div className="space-y-2">
              <label htmlFor="password" className="text-sm font-medium">Password</label>
              <input id="password" type="password" value={password} onChange={(e) => setPassword(e.target.value)}
                className="w-full h-10 px-3 rounded-lg border border-input bg-background focus:outline-none focus:ring-2 focus:ring-primary-500"
                placeholder="Mínimo 8 caracteres" required minLength={8} />
            </div>

            <Button type="submit" className="w-full" size="lg" loading={loading}>
              Criar Conta
            </Button>

            <p className="text-center text-sm text-muted-foreground">
              Já tem conta?{' '}
              <a href="/login" className="text-primary-600 hover:underline">Entrar</a>
            </p>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
