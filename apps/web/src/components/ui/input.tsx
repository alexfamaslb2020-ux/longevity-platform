import { InputHTMLAttributes, forwardRef } from 'react';
import { clsx } from 'clsx';

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  error?: boolean;
}

const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ className, error, ...props }, ref) => (
    <input
      ref={ref}
      className={clsx('input-base', error && 'border-destructive ring-2 ring-destructive/15', className)}
      {...props}
    />
  )
);
Input.displayName = 'Input';

export { Input };
