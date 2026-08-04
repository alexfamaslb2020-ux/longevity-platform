import { clsx } from 'clsx';

export function LogoMark({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 40 40"
      fill="none"
      className={clsx('h-9 w-9', className)}
      aria-hidden
    >
      <circle cx="20" cy="20" r="19" fill="url(#logo-grad)" stroke="rgba(255,255,255,0.14)" />
      <path
        d="M13 27c4.5-11 2.5-13 7-13 3 0 4.5 2 5 6"
        stroke="rgba(255,255,255,0.92)"
        strokeWidth="2.2"
        strokeLinecap="round"
      />
      <path
        d="M10 29h20"
        stroke="rgba(255,255,255,0.35)"
        strokeWidth="1.4"
        strokeLinecap="round"
      />
      <circle cx="14" cy="25.5" r="1.6" fill="hsl(38 60% 66%)" />
      <circle cx="26" cy="25.5" r="1.6" fill="hsl(38 60% 66%)" />
      <defs>
        <linearGradient id="logo-grad" x1="4" y1="4" x2="36" y2="36">
          <stop stopColor="hsl(156 24% 42%)" />
          <stop offset="1" stopColor="hsl(158 26% 24%)" />
        </linearGradient>
      </defs>
    </svg>
  );
}

export function Logo({
  compact = false,
  inverted = false,
  className,
}: {
  compact?: boolean;
  inverted?: boolean;
  className?: string;
}) {
  return (
    <span className={clsx('inline-flex items-center gap-2.5 select-none', className)}>
      <LogoMark className="h-8 w-8" />
      {!compact && (
        <span className="flex flex-col leading-none">
          <span
            className={clsx(
              'text-[15px] font-semibold tracking-tight',
              inverted ? 'text-white' : 'text-foreground'
            )}
          >
            Longevity
          </span>
          <span
            className={clsx(
              'text-[10px] font-medium uppercase tracking-[0.28em]',
              inverted ? 'text-primary-200/80' : 'text-gold-600'
            )}
          >
            Platform
          </span>
        </span>
      )}
    </span>
  );
}
