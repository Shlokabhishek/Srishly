import type { ReactNode } from 'react';

import { cn } from '@/lib/utils';

interface StatusBadgeProps {
  children: ReactNode;
  tone?: 'success' | 'warning' | 'muted' | 'danger';
}

const toneClasses = {
  success: 'border-emerald-400/20 bg-emerald-500/10 text-emerald-200',
  warning: 'border-sky-400/20 bg-sky-500/10 text-sky-200',
  muted: 'border-zinc-800 bg-zinc-900 text-zinc-300',
  danger: 'border-red-400/20 bg-red-500/10 text-red-200',
};

export default function StatusBadge({ children, tone = 'muted' }: StatusBadgeProps) {
  return (
    <span className={cn('inline-flex rounded-full border px-3 py-1 text-xs font-semibold uppercase tracking-[0.2em]', toneClasses[tone])}>
      {children}
    </span>
  );
}
