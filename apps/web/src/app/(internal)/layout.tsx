'use client';

import { useState, useEffect } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import Link from 'next/link';
import { api } from '@/lib/api';
import { clsx } from 'clsx';

const navigation = [
  { name: 'Dashboard', href: '/dashboard', icon: '📊' },
  { name: 'Leads', href: '/leads', icon: '👥' },
  { name: 'Clientes', href: '/customers', icon: '👤' },
  { name: 'Pipeline', href: '/pipeline', icon: '📋' },
  { name: 'WhatsApp', href: '/whatsapp', icon: '💬' },
  { name: 'Check-ins', href: '/checkins', icon: '✅' },
  { name: 'Chamadas', href: '/calls', icon: '📞' },
];

export default function InternalLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const [user, setUser] = useState<{ name: string; email: string; role: string } | null>(null);
  const [loading, setLoading] = useState(true);
  const [sidebarOpen, setSidebarOpen] = useState(true);

  useEffect(() => {
    const token = api.getToken();
    if (!token) {
      router.push('/login');
      return;
    }
    api.me()
      .then(setUser)
      .catch(() => router.push('/login'))
      .finally(() => setLoading(false));
  }, [router]);

  const handleLogout = () => {
    api.setToken(null);
    router.push('/login');
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin h-8 w-8 border-4 border-primary-500 border-t-transparent rounded-full" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <aside className={clsx(
        'fixed top-0 left-0 z-40 h-full bg-white border-r transition-all duration-200',
        sidebarOpen ? 'w-64' : 'w-16'
      )}>
        <div className="h-16 flex items-center px-4 border-b">
          <button onClick={() => setSidebarOpen(!sidebarOpen)} className="text-xl">
            {sidebarOpen ? '✕' : '☰'}
          </button>
          {sidebarOpen && <span className="ml-3 font-bold text-primary-700">Longevidade</span>}
        </div>
        <nav className="p-2 space-y-1">
          {navigation.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className={clsx(
                'flex items-center px-3 py-2 rounded-lg text-sm transition-colors',
                pathname.startsWith(item.href)
                  ? 'bg-primary-50 text-primary-700 font-medium'
                  : 'text-gray-600 hover:bg-gray-100'
              )}
            >
              <span className="text-lg">{item.icon}</span>
              {sidebarOpen && <span className="ml-3">{item.name}</span>}
            </Link>
          ))}
        </nav>
      </aside>

      <div className={clsx('transition-all duration-200', sidebarOpen ? 'ml-64' : 'ml-16')}>
        <header className="h-16 bg-white border-b flex items-center justify-between px-6">
          <h1 className="text-lg font-semibold text-gray-800">
            {navigation.find((n) => pathname.startsWith(n.href))?.name || 'Dashboard'}
          </h1>
          <div className="flex items-center gap-4">
            {user && (
              <div className="text-sm text-gray-600">
                <span className="font-medium">{user.name}</span>
                <span className="ml-2 px-2 py-0.5 bg-gray-100 rounded text-xs">{user.role}</span>
              </div>
            )}
            <button onClick={handleLogout} className="text-sm text-red-600 hover:underline">
              Sair
            </button>
          </div>
        </header>
        <main className="p-6">
          {children}
        </main>
      </div>
    </div>
  );
}
