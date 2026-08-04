import { ReactNode } from 'react';
import { clsx } from 'clsx';

export function Timeline({
  items,
}: {
  items: {
    id?: string | number;
    icon?: ReactNode;
    iconClass?: string;
    title: ReactNode;
    description?: ReactNode;
    meta?: ReactNode;
    badge?: ReactNode;
  }[];
}) {
  return (
    <ol className="relative space-y-1">
      {items.map((item, i) => (
        <li key={item.id ?? i} className="relative flex gap-3.5 pb-5 last:pb-0">
          {i < items.length - 1 && (
            <span
              aria-hidden
              className="absolute left-[17px] top-9 bottom-0 w-px bg-border"
            />
          )}
          <span
            className={clsx(
              'z-10 inline-flex h-[34px] w-[34px] shrink-0 items-center justify-center rounded-full ring-4 ring-background [&>svg]:h-4 [&>svg]:w-4',
              item.iconClass ?? 'bg-sand-100 text-sand-600'
            )}
          >
            {item.icon ?? (
              <span className="h-2 w-2 rounded-full bg-current" aria-hidden />
            )}
          </span>
          <div className="min-w-0 flex-1 pt-0.5">
            <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
              <p className="text-sm font-medium text-foreground">{item.title}</p>
              {item.badge}
            </div>
            {item.description && (
              <div className="mt-1 text-[13px] leading-relaxed text-muted-foreground">
                {item.description}
              </div>
            )}
            {item.meta && <div className="mt-1.5 text-xs text-muted-foreground/80">{item.meta}</div>}
          </div>
        </li>
      ))}
    </ol>
  );
}
