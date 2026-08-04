import { clsx } from 'clsx';

const avatarPalettes = [
  'bg-primary-100 text-primary-800',
  'bg-gold-100 text-gold-800',
  'bg-sand-200 text-sand-800',
  'bg-sky-100 text-sky-800',
  'bg-violet-100 text-violet-800',
  'bg-rose-100 text-rose-800',
];

function hashString(str: string) {
  let h = 0;
  for (let i = 0; i < str.length; i++) h = (h * 31 + str.charCodeAt(i)) | 0;
  return Math.abs(h);
}

function initials(name?: string | null) {
  if (!name) return '?';
  const parts = name.trim().split(/\s+/);
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

export function Avatar({
  name,
  size = 'md',
  className,
}: {
  name?: string | null;
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl';
  className?: string;
}) {
  const sizes: Record<string, string> = {
    xs: 'h-6 w-6 text-[9px]',
    sm: 'h-8 w-8 text-[11px]',
    md: 'h-10 w-10 text-xs',
    lg: 'h-12 w-12 text-sm',
    xl: 'h-16 w-16 text-lg',
  };
  const palette = avatarPalettes[hashString(name ?? '') % avatarPalettes.length];

  return (
    <span
      className={clsx(
        'inline-flex shrink-0 select-none items-center justify-center rounded-full font-semibold ring-2 ring-white/80',
        sizes[size],
        palette,
        className
      )}
      aria-hidden
    >
      {initials(name)}
    </span>
  );
}
