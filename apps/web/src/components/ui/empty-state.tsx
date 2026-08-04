import { ReactNode } from 'react';
import { clsx } from 'clsx';

export function EmptyState({
  icon,
  title,
  description,
  action,
  className,
}: {
  icon?: ReactNode;
  title: string;
  description?: string;
  action?: ReactNode;
  className?: string;
}) {
  return (
    <div
      className={clsx(
        'flex flex-col items-center justify-center gap-2 px-6 py-14 text-center',
        className
      )}
    >
      {icon && (
        <span className="relative mb-1 inline-flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-muted to-secondary text-muted-foreground ring-1 ring-border [&>svg]:h-6 [&>svg]:w-6">
          <span className="absolute inset-0 rounded-2xl bg-[radial-gradient(80px_40px_at_30%_20%,hsl(157_25%_45%_/_0.12),transparent)]" />
          {icon}
        </span>
      )}
      <p className="mt-1 text-sm font-semibold text-foreground">{title}</p>
      {description && <p className="max-w-sm text-[13px] leading-relaxed text-muted-foreground">{description}</p>}
      {action && <div className="mt-4">{action}</div>}
    </div>
  );
}
