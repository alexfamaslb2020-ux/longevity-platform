import { ButtonHTMLAttributes, forwardRef } from 'react';
import { clsx } from 'clsx';

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost' | 'soft' | 'danger' | 'gold';
  size?: 'sm' | 'md' | 'lg';
  loading?: boolean;
}

const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = 'primary', size = 'md', loading, children, disabled, ...props }, ref) => {
    const baseStyles =
      'inline-flex items-center justify-center gap-2 rounded-lg font-medium transition-all duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/50 focus-visible:ring-offset-2 focus-visible:ring-offset-background disabled:pointer-events-none disabled:opacity-45 active:scale-[0.98]';

    const variants: Record<string, string> = {
      primary:
        'bg-gradient-to-b from-primary-500 to-primary-700 text-white shadow-[0_1px_2px_rgba(26,32,28,0.25),0_4px_14px_-2px_hsl(157_25%_34%/0.5)] ring-1 ring-inset ring-white/10 hover:from-primary-400 hover:to-primary-600 hover:shadow-[0_2px_4px_rgba(26,32,28,0.2),0_8px_20px_-4px_hsl(157_25%_34%/0.55)]',
      secondary: 'bg-secondary text-secondary-foreground hover:bg-secondary/80',
      outline:
        'border border-border bg-white text-foreground shadow-sm hover:border-primary-300 hover:bg-primary-50/60 hover:text-primary-800',
      ghost: 'text-muted-foreground hover:bg-muted hover:text-foreground',
      soft: 'bg-primary-50 text-primary-800 border border-primary-200/70 hover:bg-primary-100',
      danger: 'bg-destructive text-white hover:bg-destructive/90',
      gold: 'bg-gradient-to-b from-gold-500 to-gold-600 text-white shadow-[0_1px_2px_rgba(26,32,28,0.2),0_4px_14px_-2px_hsl(38_45%_50%/0.5)] ring-1 ring-inset ring-white/15 hover:from-gold-400 hover:to-gold-600',
    };

    const sizes: Record<string, string> = {
      sm: 'h-9 px-3 text-xs [&>svg]:h-3.5 [&>svg]:w-3.5',
      md: 'h-10 px-4 text-sm [&>svg]:h-4 [&>svg]:w-4',
      lg: 'h-11 px-6 text-sm [&>svg]:h-4 [&>svg]:w-4',
    };

    return (
      <button
        ref={ref}
        className={clsx(baseStyles, variants[variant], sizes[size], className)}
        disabled={disabled || loading}
        {...props}
      >
        {loading && (
          <svg className="h-4 w-4 animate-spin" viewBox="0 0 24 24" fill="none" aria-hidden>
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
            <path
              className="opacity-80"
              fill="currentColor"
              d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
            />
          </svg>
        )}
        {children}
      </button>
    );
  }
);

Button.displayName = 'Button';

export { Button };
