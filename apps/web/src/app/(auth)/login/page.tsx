'use client';

import { useState, FormEvent } from 'react';
import { useRouter } from 'next/navigation';
import { api } from '@/lib/api';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { LogoMark } from '@/components/ui/logo';
import { Badge } from '@/components/ui/badge';
import {
  Mail,
  Lock,
  Eye,
  EyeOff,
  ShieldCheck,
  Sparkles,
  MessageCircle,
  UserRound,
  ArrowRight,
  Activity,
} from 'lucide-react';

function BrandPanel() {
  return (
    <div className="relative hidden w-[52%] flex-col justify-between overflow-hidden bg-[linear-gradient(160deg,#1b2620_0%,#141d18_50%,#0e1410_100%)] p-10 text-white lg:flex">
      <div
        className="pointer-events-none absolute inset-0"
        style={{
          backgroundImage:
            'radial-gradient(900px 480px at 0% 0%, hsl(156 24% 42% / 0.32), transparent 55%), radial-gradient(700px 420px at 100% 90%, hsl(38 45% 55% / 0.14), transparent 60%), radial-gradient(hsl(156 20% 85% / 0.045) 1px, transparent 1px)',
          backgroundSize: 'auto, auto, 26px 26px',
        }}
      />
      <div className="relative flex items-center gap-3">
        <LogoMark className="h-11 w-11" />
        <div className="leading-tight">
          <p className="text-lg font-semibold tracking-tight">Longevity Platform</p>
          <p className="text-[11px] font-medium uppercase tracking-[0.3em] text-primary-200/70">
            Saúde & Longevidade
          </p>
        </div>
      </div>

      <div className="relative max-w-lg">
        <p className="mb-6 inline-flex items-center gap-2 rounded-full border border-white/12 bg-white/[0.06] px-3.5 py-1.5 text-xs font-medium text-primary-100/90 backdrop-blur">
          <span className="h-1.5 w-1.5 animate-pulse-soft rounded-full bg-gold-300" />
          CRM inteligente para clínicas de longevidade
        </p>
        <h2 className="text-[36px] font-semibold leading-[1.12] tracking-tight">
          Acompanhe cada etapa da{' '}
          <span className="bg-gradient-to-r from-primary-200 via-white to-gold-200 bg-clip-text text-transparent">
            jornada de saúde
          </span>{' '}
          dos seus pacientes.
        </h2>
        <p className="mt-4 text-[15px] leading-relaxed text-white/55">
          Leads, conversas WhatsApp, chamadas com IA e check-ins — tudo num só lugar, pensado
          para equipas que cuidam de pessoas.
        </p>

        <div className="mt-9 grid grid-cols-1 gap-3.5 sm:grid-cols-2">
          {[
            { icon: Activity, text: 'Pipeline e risco em tempo real' },
            { icon: ShieldCheck, text: 'Priorização automática de clientes' },
            { icon: MessageCircle, text: 'IA no WhatsApp e nas chamadas' },
            { icon: Sparkles, text: 'Check-ins e acompanhamento' },
          ].map((f, i) => (
            <div
              key={i}
              className="flex items-center gap-3 rounded-xl border border-white/[0.07] bg-white/[0.04] px-3.5 py-3 text-sm text-white/75 backdrop-blur"
            >
              <span className="inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-white/[0.08] ring-1 ring-white/10">
                <f.icon className="h-4 w-4 text-primary-200" />
              </span>
              {f.text}
            </div>
          ))}
        </div>
      </div>

      <div className="relative mt-10 flex items-center justify-between gap-4 border-t border-white/[0.07] pt-6">
        <p className="text-xs text-white/35">
          © {new Date().getFullYear()} Longevity Platform · Demo
        </p>
        <div className="flex items-center gap-4 text-xs text-white/45">
          <span className="inline-flex items-center gap-1.5">
            <span className="h-1.5 w-1.5 rounded-full bg-emerald-400/80" /> API online
          </span>
          <span className="inline-flex items-center gap-1.5">
            <span className="h-1.5 w-1.5 rounded-full bg-gold-300/80" /> IA conectada
          </span>
        </div>
      </div>
    </div>
  );
}

export default function LoginPage() {
  const router = useRouter();
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
      const result = await api.login(email, password);
      router.push(result.user.role === 'CLIENT' ? '/portal' : '/dashboard');
    } catch (err: any) {
      setError(err.message || 'Erro ao fazer login');
    } finally {
      setLoading(false);
    }
  }

  const fillDemo = (demoEmail: string, demoPassword: string) => {
    setEmail(demoEmail);
    setPassword(demoPassword);
    setError('');
  };

  return (
    <div className="flex min-h-screen bg-background">
      <BrandPanel />

      {/* ── Formulário ─────────────────────────────── */}
      <div className="flex flex-1 flex-col items-center justify-center bg-[linear-gradient(180deg,hsl(42_33%_98%)_0%,hsl(42_33%_96%)_60%,hsl(42_30%_94%)_100%)] bg-dots-faint px-4 py-12">
        <div className="w-full max-w-[420px] animate-fadeIn">
          <div className="mb-9 flex flex-col items-center text-center">
            <div className="mb-5 rounded-2xl border border-border/70 bg-white p-3 shadow-card lg:hidden">
              <LogoMark className="h-10 w-10" />
            </div>
            <Badge variant="soft" className="mb-4">
              <Sparkles className="h-3 w-3" /> Plataforma de demonstração
            </Badge>
            <h1 className="text-[26px] font-semibold tracking-tight text-foreground">
              Bem-vindo de volta
            </h1>
            <p className="mt-2 text-sm text-muted-foreground">
              Inicie sessão para aceder à sua plataforma
            </p>
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
                <label htmlFor="email" className="text-[13px] font-medium text-foreground">
                  Email
                </label>
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
                <div className="flex items-center justify-between">
                  <label htmlFor="password" className="text-[13px] font-medium text-foreground">
                    Password
                  </label>
                  <span className="text-xs text-muted-foreground/80">Sem conta? Fale com a equipa</span>
                </div>
                <div className="relative">
                  <Lock className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground/60" />
                  <Input
                    id="password"
                    type={showPassword ? 'text' : 'password'}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="h-11 pl-10 pr-11"
                    placeholder="••••••••"
                    autoComplete="current-password"
                    required
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
                Entrar na plataforma
              </Button>
            </form>

            <div className="my-6 flex items-center gap-3">
              <span className="h-px flex-1 bg-border" />
              <span className="text-[11px] font-medium uppercase tracking-wider text-muted-foreground">
                Acesso rápido — demo
              </span>
              <span className="h-px flex-1 bg-border" />
            </div>

            <div className="grid grid-cols-2 gap-2.5">
              <button
                type="button"
                onClick={() => fillDemo('admin@longevity.local', 'dev-password-123')}
                className="group flex flex-col items-start gap-1.5 rounded-xl border border-primary-200/70 bg-primary-50/50 px-3.5 py-3 text-left transition-all hover:border-primary-300 hover:bg-primary-50 hover:shadow-sm active:scale-[0.98]"
              >
                <span className="inline-flex h-7 w-7 items-center justify-center rounded-lg bg-primary-100 text-primary-700">
                  <UserRound className="h-3.5 w-3.5" />
                </span>
                <span>
                  <span className="block text-[13px] font-medium text-primary-900">Equipa</span>
                  <span className="block truncate text-[11px] text-primary-700/70">
                    admin@longevity.local
                  </span>
                </span>
              </button>
              <button
                type="button"
                onClick={() => fillDemo('cliente@longevity.local', 'dev-password-123')}
                className="group flex flex-col items-start gap-1.5 rounded-xl border border-gold-200/70 bg-gold-50/50 px-3.5 py-3 text-left transition-all hover:border-gold-300 hover:bg-gold-50 hover:shadow-sm active:scale-[0.98]"
              >
                <span className="inline-flex h-7 w-7 items-center justify-center rounded-lg bg-gold-100 text-gold-700">
                  <ShieldCheck className="h-3.5 w-3.5" />
                </span>
                <span>
                  <span className="block text-[13px] font-medium text-gold-900">Cliente</span>
                  <span className="block truncate text-[11px] text-gold-700/70">
                    cliente@longevity.local
                  </span>
                </span>
              </button>
            </div>

            <a
              href="/register"
              className="mt-5 flex items-center justify-center gap-1.5 text-sm text-muted-foreground transition-colors hover:text-primary-700"
            >
              Criar nova conta
              <ArrowRight className="h-3.5 w-3.5" />
            </a>
          </div>

          <p className="mt-5 text-center text-xs leading-relaxed text-muted-foreground/80">
            Demonstração com dados simulados — ambiente seguro e isolado.
          </p>
        </div>
      </div>
    </div>
  );
}
