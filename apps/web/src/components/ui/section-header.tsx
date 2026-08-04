import { ReactNode } from 'react';

export function SectionHeader({
  title,
  subtitle,
  icon,
  actions,
}: {
  title: string;
  subtitle?: string;
  icon?: ReactNode;
  actions?: ReactNode;
}) {
  return (
    <div className="mb-5 flex items-start justify-between gap-4">
      <div className="flex items-start gap-3">
        {icon && (
          <span className="mt-0.5 inline-flex h-9 w-9 items-center justify-center rounded-xl bg-primary-50 text-primary-700 ring-1 ring-primary-100 [&>svg]:h-[18px] [&>svg]:w-[18px]">
            {icon}
          </span>
        )}
        <div>
          <h2 className="text-lg font-semibold tracking-tight text-foreground">{title}</h2>
          {subtitle && <p className="mt-0.5 text-sm text-muted-foreground">{subtitle}</p>}
        </div>
      </div>
      {actions && <div className="flex shrink-0 items-center gap-2">{actions}</div>}
    </div>
  );
}
