import { ReactNode } from 'react';
import { clsx } from 'clsx';
import { TrendingUp, TrendingDown } from 'lucide-react';

export function MetricCard({
  label,
  value,
  icon,
  sub,
  trend,
  trendLabel,
  accent = 'sage',
  className,
}: {
  label: string;
  value: string | number | ReactNode;
  icon?: ReactNode;
  sub?: string;
  trend?: 'up' | 'down';
  trendLabel?: string;
  accent?: 'sage' | 'gold' | 'amber' | 'red' | 'blue' | 'neutral';
  className?: string;
}) {
  const accents: Record<string, string> = {
    sage: 'bg-gradient-to-br from-primary-50 to-primary-100/70 text-primary-700 ring-primary-200/70',
    gold: 'bg-gradient-to-br from-gold-50 to-gold-100/70 text-gold-700 ring-gold-200/80',
    amber: 'bg-gradient-to-br from-amber-50 to-amber-100/70 text-amber-700 ring-amber-200/80',
    red: 'bg-gradient-to-br from-red-50 to-red-100/60 text-red-600 ring-red-200/80',
    blue: 'bg-gradient-to-br from-sky-50 to-sky-100/70 text-sky-700 ring-sky-200/80',
    neutral: 'bg-gradient-to-br from-sand-100 to-sand-200/70 text-sand-700 ring-sand-200',
  };

  const glows: Record<string, string> = {
    sage: 'from-primary-200/40',
    gold: 'from-gold-200/50',
    amber: 'from-amber-200/50',
    red: 'from-red-200/50',
    blue: 'from-sky-200/50',
    neutral: 'from-sand-200/50',
  };

  return (
    <div
      className={clsx(
        'card-surface card-hover group relative overflow-hidden p-5',
        className
      )}
    >
      <div
        className={clsx(
          'pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r via-border/60 to-transparent',
          'from-transparent'
        )}
      />
      <div className="flex items-start justify-between gap-3">
        <p className="text-[13px] font-medium text-muted-foreground">{label}</p>
        {icon && (
          <span
            className={clsx(
              'inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-xl ring-1 transition-transform duration-200 group-hover:scale-105 [&>svg]:h-[18px] [&>svg]:w-[18px]',
              accents[accent]
            )}
          >
            {icon}
          </span>
        )}
      </div>
      <div className="mt-2.5 flex items-baseline gap-2">
        <p className="text-[28px] font-semibold leading-none tracking-tight text-foreground">{value}</p>
        {trend && (
          <span
            className={clsx(
              'inline-flex items-center gap-1 rounded-full px-1.5 py-0.5 text-[11px] font-semibold',
              trend === 'up' ? 'bg-primary-50 text-primary-700' : 'bg-red-50 text-red-600'
            )}
          >
            {trend === 'up' ? <TrendingUp className="h-3 w-3" /> : <TrendingDown className="h-3 w-3" />}
            {trendLabel}
          </span>
        )}
      </div>
      {sub && <p className="mt-1.5 text-xs text-muted-foreground">{sub}</p>}
    </div>
  );
}
