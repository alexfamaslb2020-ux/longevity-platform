import { clsx } from 'clsx';

export function Tabs<T extends string>({
  tabs,
  active,
  onChange,
  className,
}: {
  tabs: { key: T; label: string; count?: number }[];
  active: T;
  onChange: (key: T) => void;
  className?: string;
}) {
  return (
    <div
      className={clsx(
        'inline-flex items-center gap-1 rounded-xl border border-border/70 bg-muted/50 p-1',
        className
      )}
      role="tablist"
    >
      {tabs.map((tab) => {
        const isActive = tab.key === active;
        return (
          <button
            key={tab.key}
            role="tab"
            aria-selected={isActive}
            onClick={() => onChange(tab.key)}
            className={clsx(
              'inline-flex items-center gap-1.5 rounded-lg px-3.5 py-1.5 text-[13px] font-medium transition-all',
              isActive
                ? 'bg-white text-foreground shadow-sm ring-1 ring-border/70'
                : 'text-muted-foreground hover:text-foreground'
            )}
          >
            {tab.label}
            {typeof tab.count === 'number' && tab.count > 0 && (
              <span
                className={clsx(
                  'rounded-full px-1.5 py-0.5 text-[10px] font-semibold leading-none',
                  isActive ? 'bg-primary-50 text-primary-700' : 'bg-muted text-muted-foreground'
                )}
              >
                {tab.count}
              </span>
            )}
          </button>
        );
      })}
    </div>
  );
}
