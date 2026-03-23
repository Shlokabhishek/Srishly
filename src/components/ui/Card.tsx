import type { HTMLAttributes, ReactNode } from 'react';

import { cn } from '@/lib/utils';

interface CardProps extends HTMLAttributes<HTMLDivElement> {
  children: ReactNode;
  highlighted?: boolean;
}

export default function Card({ children, className, highlighted = false, ...props }: CardProps) {
  return (
    <div
      className={cn(
        'rounded-[2rem] border border-white/10 bg-slate-900/80 p-6 shadow-2xl shadow-black/30 backdrop-blur',
        highlighted && 'border-amber-400/30 shadow-amber-950/20',
        className,
      )}
      {...props}
    >
      {children}
    </div>
  );
}
