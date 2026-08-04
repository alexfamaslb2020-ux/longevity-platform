import { ReactNode } from 'react';
import { Avatar } from '@/components/ui/avatar';

export function ProfileBanner({
  name,
  subtitle,
  badges,
  actions,
  backHref,
}: {
  name: string;
  subtitle?: ReactNode;
  badges?: ReactNode;
  actions?: ReactNode;
  backHref?: string;
}) {
  return (
    <div className="relative overflow-hidden rounded-2xl border border-border/60 bg-[linear-gradient(135deg,#18231c_0%,#1c2a21_55%,#243527_100%)] shadow-card">
      <div
        className="pointer-events-none absolute inset-0"
        style={{
          backgroundImage:
            'radial-gradient(700px 300px at 85% -30%, hsl(156 24% 42% / 0.35), transparent 60%), radial-gradient(450px 260px at -5% 115%, hsl(38 45% 50% / 0.12), transparent 60%), radial-gradient(hsl(156 20% 85% / 0.04) 1px, transparent 1px)',
          backgroundSize: 'auto, auto, 22px 22px',
        }}
      />
      <div className="relative flex flex-wrap items-center gap-5 px-6 py-6 sm:px-8">
        <Avatar name={name} size="xl" className="ring-4 ring-white/15" />
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <h1 className="text-xl font-semibold tracking-tight text-white sm:text-2xl">{name}</h1>
            {badges}
          </div>
          {subtitle && <div className="mt-1.5 text-sm text-white/55">{subtitle}</div>}
        </div>
        {actions && <div className="flex shrink-0 flex-wrap items-center gap-2">{actions}</div>}
      </div>
    </div>
  );
}
