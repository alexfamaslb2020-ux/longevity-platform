import { HTMLAttributes, forwardRef } from 'react';
import { clsx } from 'clsx';

type BadgeVariant =
  | 'sage'
  | 'neutral'
  | 'gold'
  | 'amber'
  | 'red'
  | 'blue'
  | 'outline'
  | 'soft';

interface BadgeProps extends HTMLAttributes<HTMLSpanElement> {
  variant?: BadgeVariant;
  dot?: boolean;
  size?: 'xs' | 'sm';
}

const badgeStyles: Record<BadgeVariant, string> = {
  sage: 'bg-primary-50 text-primary-800 border-primary-200/70',
  neutral: 'bg-sand-100 text-sand-800 border-sand-200',
  gold: 'bg-gold-50 text-gold-800 border-gold-200',
  amber: 'bg-amber-50 text-amber-800 border-amber-200',
  red: 'bg-red-50 text-red-700 border-red-200',
  blue: 'bg-sky-50 text-sky-800 border-sky-200',
  outline: 'bg-white text-muted-foreground border-border',
  soft: 'bg-muted text-muted-foreground border-transparent',
};

const Badge = forwardRef<HTMLSpanElement, BadgeProps>(
  ({ className, variant = 'neutral', dot, size = 'xs', children, ...props }, ref) => (
    <span
      ref={ref}
      className={clsx(
        'inline-flex items-center gap-1.5 rounded-full border font-medium leading-none',
        size === 'xs' ? 'px-2 py-1 text-[11px]' : 'px-2.5 py-1 text-xs',
        badgeStyles[variant],
        className
      )}
      {...props}
    >
      {dot && <span className="h-1.5 w-1.5 rounded-full bg-current opacity-70" />}
      {children}
    </span>
  )
);
Badge.displayName = 'Badge';

export { Badge };
export type { BadgeVariant };
