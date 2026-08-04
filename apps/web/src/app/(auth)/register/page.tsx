'use client';

import { useState, FormEvent } from 'react';
import { useRouter } from 'next/navigation';
import { api } from '@/lib/api';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { LogoMark } from '@/components/ui/logo';
import { Badge } from '@/components/ui/badge';
import { UserRound, Mail, Lock, Eye, EyeOff, Sparkles, ArrowRight } from 'lucide-react';

export default function RegisterPage() {
  const router = useRouter();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const result = await api.register({ email, password, name });
      router.push(result.user.role === 'CLIENT' ? '/portal' : '/dashboard');
    } catch (err: any) {
      setError(err.message || 'Erro ao registar');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-[linear-gradient(180deg,hsl(42_33%_98%)_0%,hsl(42_33%_96%)_60%,hsl(42_30%_94%)_100%)] bg-dots-faint px-4 py-12">
      <div className="w-full max-w-[420px] animate-fadeIn">
        <div className="mb-9 flex flex-col items-center gap-4 text-center">
          <div className="rounded-2xl border border-border/70 bg-white p-3 shadow-card">
            <LogoMark className="h-10 w-10" />
          </div>
          <div>
            <Badge variant="soft" className="mb-3">
              <Sparkles className="h-3 w-3" /> Plataforma de demonstração
            </Badge>
            <h1 className="text-[26px] font-semibold tracking-tight text-foreground">Criar conta</h1>
            <p className="mt-2 text-sm text-muted-foreground">
              Comece a gerir a jornada de saúde dos seus pacientes
            </p>
          </div>
        </div>

        <div className="card-surface relative overflow-hidden p-7">
          <div className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-primary-300/60 to-transparent" />
          <form onSubmit={handleSubmit} className="space-y-5">
            {error && (
              <div className="animate-fadeIn rounded-xl border border-red-200 bg-red-50 px-3.5 py-2.5 text-sm text-red-700">
                {error}
              </div>
            )}

            <div className="space-y-2">
              <label htmlFor="name" className="text-[13px] font-medium text-foreground">Nome</label>
              <div className="relative">
                <UserRound className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground/60" />
                <Input
                  id="name"
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="h-11 pl-10"
                  placeholder="O seu nome"
                  autoComplete="name"
                  required
                />
              </div>
            </div>

            <div className="space-y-2">
              <label htmlFor="email" className="text-[13px] font-medium text-foreground">Email</label>
              <div className="relative">
                <Mail className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground/60" />
                <Input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="h-11 pl-10"
                  placeholder="seu@email.com"
                  autoComplete="email"
                  required
                />
              </div>
            </div>

            <div className="space-y-2">
              <label htmlFor="password" className="text-[13px] font-medium text-foreground">Password</label>
              <div className="relative">
                <Lock className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground/60" />
                <Input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="h-11 pl-10 pr-11"
                  placeholder="Mínimo 8 caracteres"
                  autoComplete="new-password"
                  required
                  minLength={8}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((v) => !v)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 rounded-md p-1 text-muted-foreground/60 transition-colors hover:bg-muted hover:text-foreground"
                  aria-label={showPassword ? 'Ocultar password' : 'Mostrar password'}
                >
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>

            <Button type="submit" className="h-11 w-full" size="lg" loading={loading}>
              Criar conta
            </Button>
          </form>

          <a
            href="/login"
            className="mt-5 flex items-center justify-center gap-1.5 text-sm text-muted-foreground transition-colors hover:text-primary-700"
          >
            Já tem conta?
            <ArrowRight className="h-3.5 w-3.5" />
          </a>
        </div>
      </div>
    </div>
  );
}
