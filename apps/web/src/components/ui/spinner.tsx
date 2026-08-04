import { clsx } from 'clsx';

export function Spinner({ className }: { className?: string }) {
  return (
    <svg
      className={clsx('h-5 w-5 animate-spin text-primary-600', className)}
      viewBox="0 0 24 24"
      fill="none"
      aria-label="A carregar"
    >
      <circle className="opacity-20" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
      <path
        className="opacity-90"
        fill="currentColor"
        d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
      />
    </svg>
  );
}

export function FullPageSpinner({ label = 'A carregar…' }: { label?: string }) {
  return (
    <div className="flex min-h-[50vh] flex-col items-center justify-center gap-3 animate-fadeIn">
      <Spinner className="h-8 w-8" />
      <p className="text-sm text-muted-foreground">{label}</p>
    </div>
  );
}
