import { FlaskConical } from 'lucide-react';
import { clsx } from 'clsx';

export default function DemoBanner({ compact = false }: { compact?: boolean }) {
  if (compact) {
    return (
      <span className="inline-flex items-center gap-1.5 rounded-full border border-gold-200/80 bg-gold-50 px-2.5 py-1 text-[11px] font-medium text-gold-800 shadow-sm">
        <FlaskConical className="h-3 w-3" />
        Modo Demonstração
      </span>
    );
  }
  return (
    <div
      className={clsx(
        'flex items-center gap-2.5 rounded-xl border border-gold-200/70 bg-gradient-to-r from-gold-50 via-white to-gold-50/60 px-4 py-2.5 text-sm text-gold-800 shadow-sm'
      )}
    >
      <span className="inline-flex h-7 w-7 items-center justify-center rounded-lg bg-gold-100 ring-1 ring-gold-200/80">
        <FlaskConical className="h-3.5 w-3.5" />
      </span>
      <span>
        <span className="font-medium">Modo Demonstração</span>
        <span className="text-gold-700/80"> — integrações simuladas em ambiente de teste</span>
      </span>
    </div>
  );
}
