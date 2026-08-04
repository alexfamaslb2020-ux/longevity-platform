'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import Link from 'next/link';
import { api } from '@/lib/api';
import { clsx } from 'clsx';
import {
  LayoutDashboard,
  Users,
  UserRound,
  MessagesSquare,
  CalendarDays,
  ClipboardCheck,
  Search,
  LogOut,
  ChevronLeft,
  ChevronsLeft,
  ChevronDown,
  Menu,
  Bell,
  Workflow,
  Plug,
  FileText,
  Activity,
  Settings,
  ScrollText,
  FlaskConical,
  Presentation,
} from 'lucide-react';
import { Logo } from '@/components/ui/logo';
import { Badge } from '@/components/ui/badge';
import { Avatar } from '@/components/ui/avatar';
import { formatRelative } from '@/lib/status';

const primaryNav = [
  { name: 'Dashboard', href: '/dashboard', icon: LayoutDashboard },
  { name: 'Leads', href: '/leads', icon: Users },
  { name: 'Clientes', href: '/customers', icon: UserRound },
  { name: 'Comunicações', href: '/comunicacoes', icon: MessagesSquare },
  { name: 'Agenda', href: '/agenda', icon: CalendarDays },
  { name: 'Acompanhamento', href: '/acompanhamento', icon: ClipboardCheck },
];

const presentationNav = {
  name: 'Apresentação',
  href: '/presentation',
  icon: Presentation,
};

const moreNav = [
  { name: 'Automações', href: '/automations', icon: Workflow },
  { name: 'Integrações', href: '/integrations', icon: Plug },
  { name: 'Prompts', href: '/prompts', icon: FileText },
  { name: 'Atividade técnica', href: '/activity', icon: Activity },
  { name: 'Configurações', href: '/configuracoes', icon: Settings },
  { name: 'Logs', href: '/logs', icon: ScrollText },
];

export default function InternalLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const [user, setUser] = useState<{ name: string; email: string; role: string } | null>(null);
  const [loading, setLoading] = useState(true);
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [moreOpen, setMoreOpen] = useState(false);
  const [notifications, setNotifications] = useState<any[]>([]);
  const [notifOpen, setNotifOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const notifRef = useRef<HTMLDivElement>(null);
  const searchRef = useRef<HTMLDivElement>(null);
  const [notifLoading, setNotifLoading] = useState(false);

  useEffect(() => {
    const token = api.getToken();
    if (!token) {
      router.push('/login');
      return;
    }
    api
      .me()
      .then((me) => {
        if (me.role === 'CLIENT') {
          router.push('/portal');
          return;
        }
        setUser(me);
      })
      .catch(() => router.push('/login'))
      .finally(() => setLoading(false));
  }, [router]);

  useEffect(() => {
    function onDown(e: MouseEvent) {
      if (notifRef.current && !notifRef.current.contains(e.target as Node)) setNotifOpen(false);
      if (searchRef.current && !searchRef.current.contains(e.target as Node)) setSearchOpen(false);
    }
    document.addEventListener('mousedown', onDown);
    return () => document.removeEventListener('mousedown', onDown);
  }, []);

  const loadNotifications = useCallback(async () => {
    setNotifLoading(true);
    try {
      const data = await api.getNotifications();
      setNotifications(data ?? []);
    } catch {
      setNotifications([]);
    } finally {
      setNotifLoading(false);
    }
  }, []);

  const unreadCount = notifications.filter((n) => !n.read).length;

  const toggleNotifications = () => {
    if (!notifOpen) loadNotifications();
    setNotifOpen(!notifOpen);
    setSearchOpen(false);
  };

  const markAllRead = async () => {
    await Promise.all(
      notifications.filter((n) => !n.read).map((n) => api.readNotification(n.id).catch(() => null))
    );
    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
  };

  const handleLogout = () => {
    api.setToken(null);
    router.push('/login');
  };

  const allItems = [...primaryNav, ...moreNav];
  const searchResults = searchQuery.trim()
    ? allItems.filter((i) => i.name.toLowerCase().includes(searchQuery.toLowerCase()))
    : allItems;

  const currentPage = primaryNav.find((n) => pathname.startsWith(n.href))?.name ?? 'Dashboard';

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <div className="flex flex-col items-center gap-3 animate-fadeIn">
          <Logo />
          <div className="h-1.5 w-32 overflow-hidden rounded-full bg-sand-200">
            <div className="h-full w-1/2 animate-shimmer rounded-full bg-gradient-to-r from-transparent via-primary-500 to-transparent bg-[length:200%_100%]" />
          </div>
        </div>
      </div>
    );
  }

  const SidebarContent = ({ compact }: { compact: boolean }) => (
    <>
      <nav className="thin-scrollbar relative flex-1 space-y-6 overflow-y-auto px-3 py-5">
        <div className="space-y-0.5">
          {[
            ...primaryNav,
            ...(process.env.NEXT_PUBLIC_DEMO_PRESENTATION_MODE === 'true'
              ? [presentationNav]
              : []),
          ].map((item) => {
            const active = pathname.startsWith(item.href);
            const isPresentation = item.href === '/presentation';
            const Icon = item.icon;
            return (
              <Link
                key={item.href}
                href={item.href}
                title={item.name}
                className={clsx(
                  'group relative flex items-center gap-3 rounded-xl px-3 py-2.5 text-[13.5px] font-medium transition-all duration-150',
                  active
                    ? isPresentation
                      ? 'bg-gold-500/15 text-gold-200 shadow-[inset_0_1px_0_rgba(255,255,255,0.08)]'
                      : 'bg-white/[0.09] text-white shadow-[inset_0_1px_0_rgba(255,255,255,0.08)]'
                    : 'text-white/55 hover:bg-white/[0.05] hover:text-white/90',
                  !compact && 'justify-center px-0'
                )}
              >
                {active && (
                  <span
                    className={clsx(
                      'absolute left-0 top-1/2 h-5 w-[3px] -translate-y-1/2 rounded-r-full',
                      isPresentation
                        ? 'bg-gold-400'
                        : 'bg-gradient-to-b from-primary-300 to-primary-500'
                    )}
                  />
                )}
                <Icon
                  className={clsx(
                    'h-[18px] w-[18px] shrink-0',
                    active
                      ? isPresentation
                        ? 'text-gold-300'
                        : 'text-primary-300'
                      : 'text-white/40 group-hover:text-white/70'
                  )}
                />
                {!compact && <span className="truncate">{item.name}</span>}
              </Link>
            );
          })}
        </div>

        {/* Mais */}
        <div>
          <button
            onClick={() => setMoreOpen(!moreOpen)}
            className={clsx(
              'flex w-full items-center gap-3 rounded-xl px-3 py-2 text-[12px] font-semibold uppercase tracking-[0.14em] text-white/30 transition-colors hover:text-white/60',
              !compact && 'justify-center px-0'
            )}
            title="Mais"
          >
            {!compact && (
              <>
                <span className="flex-1 text-left">Mais</span>
                <ChevronDown
                  className={clsx('h-3.5 w-3.5 transition-transform', moreOpen && 'rotate-180')}
                />
              </>
            )}
          </button>
          {(moreOpen || compact) && (
            <div className="mt-1 space-y-0.5">
              {moreNav.map((item) => {
                const active = pathname.startsWith(item.href);
                const Icon = item.icon;
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    title={item.name}
                    className={clsx(
                      'group flex items-center gap-3 rounded-lg px-3 py-2 text-[13px] transition-colors',
                      active
                        ? 'bg-white/[0.07] text-white'
                        : 'text-white/40 hover:bg-white/[0.04] hover:text-white/75',
                      !compact && 'justify-center px-0'
                    )}
                  >
                    <Icon className="h-4 w-4 shrink-0 text-white/35 group-hover:text-white/60" />
                    {!compact && <span className="truncate">{item.name}</span>}
                  </Link>
                );
              })}
            </div>
          )}
        </div>
      </nav>

      <div className="relative border-t border-white/[0.06] p-3">
        <div className="flex items-center gap-3 rounded-xl bg-white/[0.04] p-2.5">
          <Avatar name={user?.name} size="sm" />
          <div className={clsx('min-w-0 flex-1', compact && 'hidden')}>
            <p className="truncate text-[13px] font-medium text-white">{user?.name}</p>
            <p className="truncate text-[11px] text-white/45">
              {user?.role === 'ADMIN' ? 'Administrador' : 'Operador'}
            </p>
          </div>
          <button
            onClick={handleLogout}
            className={clsx(
              'inline-flex h-8 w-8 items-center justify-center rounded-lg text-white/40 transition-colors hover:bg-red-500/20 hover:text-red-300',
              compact && 'hidden'
            )}
            title="Sair"
          >
            <LogOut className="h-4 w-4" />
          </button>
        </div>
      </div>
    </>
  );

  return (
    <div className="min-h-screen bg-background">
      {/* ── Sidebar ──────────────────────────────── */}
      <aside
        className={clsx(
          'fixed inset-y-0 left-0 z-40 hidden flex-col bg-[linear-gradient(180deg,#16201a_0%,#121a15_55%,#0e130f_100%)] text-white lg:flex',
          sidebarOpen ? 'w-64' : 'w-[74px]',
          'transition-[width] duration-300'
        )}
      >
        <div
          className="pointer-events-none absolute inset-0 opacity-70"
          style={{
            backgroundImage:
              'radial-gradient(700px 320px at -10% -10%, hsl(156 24% 40% / 0.32), transparent 60%), radial-gradient(500px 300px at 110% 110%, hsl(38 45% 55% / 0.08), transparent 60%)',
          }}
        />
        <div className="relative flex h-16 shrink-0 items-center justify-between border-b border-white/[0.07] px-5">
          <Logo inverted compact={!sidebarOpen} />
          <button
            onClick={() => setSidebarOpen(!sidebarOpen)}
            className="ml-2 inline-flex h-7 w-7 items-center justify-center rounded-lg text-white/40 transition-colors hover:bg-white/10 hover:text-white"
            aria-label={sidebarOpen ? 'Recolher menu' : 'Expandir menu'}
          >
            {sidebarOpen ? <ChevronsLeft className="h-4 w-4" /> : <Menu className="h-4 w-4" />}
          </button>
        </div>
        <SidebarContent compact={!sidebarOpen} />
      </aside>

      {/* Sidebar mobile */}
      {mobileOpen && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={() => setMobileOpen(false)} />
          <aside className="absolute inset-y-0 left-0 w-72 bg-[linear-gradient(180deg,#16201a_0%,#121a15_55%,#0e130f_100%)] p-4 shadow-2xl animate-slideIn">
            <div className="mb-6 flex items-center justify-between">
              <Logo inverted />
              <button
                onClick={() => setMobileOpen(false)}
                className="inline-flex h-8 w-8 items-center justify-center rounded-lg text-white/40 hover:bg-white/10 hover:text-white"
                aria-label="Fechar menu"
              >
                <ChevronLeft className="h-5 w-5" />
              </button>
            </div>
            <SidebarContent compact={false} />
          </aside>
        </div>
      )}

      {/* ── Conteúdo ─────────────────────────────── */}
      <div className={clsx('flex min-h-screen flex-col transition-[padding] duration-300', sidebarOpen ? 'lg:pl-64' : 'lg:pl-[74px]')}>
        <header className="sticky top-0 z-30 flex h-14 shrink-0 items-center gap-3 border-b border-border/60 bg-background/80 px-4 backdrop-blur-xl sm:px-6">
          <button
            onClick={() => setMobileOpen(true)}
            className="inline-flex h-9 w-9 items-center justify-center rounded-lg text-muted-foreground hover:bg-muted lg:hidden"
            aria-label="Abrir menu"
          >
            <Menu className="h-5 w-5" />
          </button>

          <h1 className="text-[15px] font-semibold tracking-tight text-foreground">{currentPage}</h1>

          <div className="ml-auto flex items-center gap-2 sm:gap-2.5">
            <div className="relative hidden md:block" ref={searchRef}>
              <button
                onClick={() => setSearchOpen(!searchOpen)}
                className="flex h-9 w-56 items-center gap-2.5 rounded-lg border border-border bg-white px-3 text-left text-sm text-muted-foreground shadow-sm transition-colors hover:border-primary-300 hover:text-foreground"
              >
                <Search className="h-3.5 w-3.5" />
                <span className="flex-1 truncate text-[13px]">Ir para página…</span>
              </button>
              {searchOpen && (
                <div className="absolute right-0 top-11 w-64 overflow-hidden rounded-xl border border-border bg-white shadow-pop animate-scaleIn">
                  <div className="border-b border-border/70 px-3 py-2.5">
                    <input
                      autoFocus
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      placeholder="Filtrar páginas…"
                      className="w-full text-sm outline-none placeholder:text-muted-foreground/60"
                    />
                  </div>
                  <div className="thin-scrollbar max-h-72 overflow-y-auto p-1.5">
                    {searchResults.map((item) => {
                      const Icon = item.icon;
                      const active = pathname.startsWith(item.href);
                      return (
                        <Link
                          key={item.href}
                          href={item.href}
                          onClick={() => {
                            setSearchOpen(false);
                            setSearchQuery('');
                          }}
                          className={clsx(
                            'flex items-center gap-2.5 rounded-lg px-2.5 py-2 text-sm transition-colors',
                            active ? 'bg-primary-50 text-primary-800' : 'text-foreground hover:bg-muted'
                          )}
                        >
                          <Icon className="h-4 w-4 text-muted-foreground" />
                          {item.name}
                          {active && <Badge variant="sage" className="ml-auto">atual</Badge>}
                        </Link>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>

            <span
              className="hidden items-center gap-1.5 rounded-full border border-gold-200/80 bg-gold-50 px-2.5 py-1 text-[11px] font-medium text-gold-800 lg:inline-flex"
              title="Integrações simuladas em ambiente de demonstração"
            >
              <FlaskConical className="h-3 w-3" />
              Demo
            </span>

            <div className="relative" ref={notifRef}>
              <button
                onClick={toggleNotifications}
                className="relative inline-flex h-9 w-9 items-center justify-center rounded-lg border border-border bg-white text-muted-foreground shadow-sm transition-colors hover:border-primary-300 hover:text-primary-700"
                aria-label="Notificações"
              >
                <Bell className="h-[17px] w-[17px]" />
                {unreadCount > 0 && (
                  <span className="absolute -right-1 -top-1 flex h-4 min-w-[16px] items-center justify-center rounded-full bg-gradient-to-b from-gold-400 to-gold-600 px-1 text-[10px] font-bold text-white shadow-sm ring-2 ring-background">
                    {unreadCount > 9 ? '9+' : unreadCount}
                  </span>
                )}
              </button>
              {notifOpen && (
                <div className="absolute right-0 top-11 w-80 overflow-hidden rounded-xl border border-border bg-white shadow-pop animate-scaleIn">
                  <div className="flex items-center justify-between border-b border-border/70 px-4 py-3">
                    <p className="text-sm font-semibold text-foreground">Notificações</p>
                    {unreadCount > 0 && (
                      <button onClick={markAllRead} className="text-xs font-medium text-primary-700 hover:underline">
                        Marcar todas como lidas
                      </button>
                    )}
                  </div>
                  <div className="thin-scrollbar max-h-96 overflow-y-auto">
                    {notifLoading && (
                      <div className="space-y-3 p-4">
                        {[0, 1, 2].map((i) => (
                          <div key={i} className="h-10 animate-pulse rounded-lg bg-sand-100" />
                        ))}
                      </div>
                    )}
                    {!notifLoading && notifications.length === 0 && (
                      <p className="px-4 py-8 text-center text-sm text-muted-foreground">
                        Sem notificações por agora.
                      </p>
                    )}
                    {!notifLoading &&
                      notifications.slice(0, 8).map((n) => (
                        <button
                          key={n.id}
                          onClick={() => {
                            if (!n.read) {
                              api.readNotification(n.id).catch(() => null);
                              setNotifications((prev) =>
                                prev.map((p) => (p.id === n.id ? { ...p, read: true } : p))
                              );
                            }
                          }}
                          className={clsx(
                            'flex w-full gap-3 border-b border-border/50 px-4 py-3 text-left transition-colors last:border-0 hover:bg-muted/60',
                            !n.read && 'bg-primary-50/40'
                          )}
                        >
                          <span
                            className={clsx(
                              'mt-1.5 h-2 w-2 shrink-0 rounded-full',
                              n.level === 'critical' ? 'bg-red-500' : n.level === 'warning' ? 'bg-amber-500' : 'bg-primary-500'
                            )}
                          />
                          <span className="min-w-0">
                            <span className="block text-[13px] font-medium leading-snug text-foreground">{n.title}</span>
                            <span className="mt-0.5 block text-xs leading-snug text-muted-foreground">{n.message}</span>
                            <span className="mt-1 block text-[11px] text-muted-foreground/70">
                              {formatRelative(n.createdAt)}
                            </span>
                          </span>
                        </button>
                      ))}
                  </div>
                </div>
              )}
            </div>

            <div className="flex items-center gap-2.5 rounded-lg border border-border bg-white py-1.5 pl-1.5 pr-3 shadow-sm">
              <Avatar name={user?.name} size="sm" />
              <div className="hidden sm:block">
                <p className="text-[13px] font-medium leading-tight text-foreground">{user?.name}</p>
                <p className="text-[11px] leading-tight text-muted-foreground">
                  {user?.role === 'ADMIN' ? 'Administrador' : 'Operador'}
                </p>
              </div>
            </div>
          </div>
        </header>

        <main className="mx-auto w-full max-w-[1440px] flex-1 px-4 py-7 sm:px-6 lg:px-8">{children}</main>

        <footer className="border-t border-border/50 px-6 py-4">
          <p className="text-center text-xs text-muted-foreground/70">
            Longevity Platform — Gestão de Saúde & Longevidade
          </p>
        </footer>
      </div>
    </div>
  );
}
