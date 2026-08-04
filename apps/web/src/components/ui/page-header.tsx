import { ReactNode } from 'react';

export function PageHeader({
  title,
  subtitle,
  actions,
  breadcrumb,
}: {
  title: string;
  subtitle?: ReactNode;
  actions?: ReactNode;
  breadcrumb?: string[];
}) {
  return (
    <div className="mb-7">
      {breadcrumb && (
        <nav className="mb-2.5 flex items-center gap-1.5 text-xs text-muted-foreground" aria-label="Navegação">
          {breadcrumb.map((c, i) => (
            <span key={i} className="flex items-center gap-1.5">
              {i > 0 && <span aria-hidden>›</span>}
              <span className={i === breadcrumb.length - 1 ? 'font-medium text-foreground/80' : ''}>
                {c}
              </span>
            </span>
          ))}
        </nav>
      )}
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-[26px] font-semibold tracking-tight text-foreground">{title}</h1>
          {subtitle && <p className="mt-1.5 text-sm text-muted-foreground">{subtitle}</p>}
        </div>
        {actions && <div className="flex shrink-0 items-center gap-2">{actions}</div>}
      </div>
    </div>
  );
}
