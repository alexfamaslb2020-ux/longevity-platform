import { ReactNode } from 'react';
import { clsx } from 'clsx';

export function Modal({
  open,
  onClose,
  title,
  subtitle,
  children,
  footer,
  wide = false,
}: {
  open: boolean;
  onClose: () => void;
  title: string;
  subtitle?: string;
  children: ReactNode;
  footer?: ReactNode;
  wide?: boolean;
}) {
  if (!open) return null;
  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/45 p-4 backdrop-blur-sm"
      onClick={onClose}
    >
      <div
        className={clsx(
          'max-h-[90vh] w-full overflow-y-auto rounded-2xl border border-border/70 bg-white shadow-pop-lg animate-scaleIn',
          wide ? 'max-w-2xl' : 'max-w-md'
        )}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="border-b border-border/70 px-6 py-4">
          <h3 className="text-base font-semibold tracking-tight text-foreground">{title}</h3>
          {subtitle && <p className="mt-0.5 text-[13px] text-muted-foreground">{subtitle}</p>}
        </div>
        <div className="p-6">{children}</div>
        {footer && <div className="flex justify-end gap-2.5 border-t border-border/70 px-6 py-4">{footer}</div>}
      </div>
    </div>
  );
}
