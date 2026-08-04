import { ReactNode } from 'react';
import { X } from 'lucide-react';

export function Drawer({
  open,
  onClose,
  title,
  subtitle,
  children,
  footer,
}: {
  open: boolean;
  onClose: () => void;
  title: string;
  subtitle?: ReactNode;
  children: ReactNode;
  footer?: ReactNode;
}) {
  if (!open) return null;
  return (
    <div
      className="fixed inset-0 z-50 flex justify-end bg-black/45 backdrop-blur-sm"
      onClick={onClose}
    >
      <div
        className="flex h-full w-full max-w-[440px] flex-col border-l border-border/70 bg-card animate-slideIn-right"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-start justify-between gap-4 border-b border-border/70 px-6 py-4">
          <div>
            <h3 className="text-base font-semibold tracking-tight text-foreground">{title}</h3>
            {subtitle && <p className="mt-0.5 text-[13px] text-muted-foreground">{subtitle}</p>}
          </div>
          <button
            onClick={onClose}
            className="rounded-lg p-1.5 text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
            aria-label="Fechar"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
        <div className="thin-scrollbar flex-1 overflow-y-auto p-6">{children}</div>
        {footer && <div className="flex justify-end gap-2.5 border-t border-border/70 px-6 py-4">{footer}</div>}
      </div>
    </div>
  );
}
