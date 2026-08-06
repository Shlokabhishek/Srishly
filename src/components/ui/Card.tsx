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
        'rounded-[1.5rem] border border-zinc-800 bg-zinc-900/75 p-6 shadow-lg shadow-black/20 backdrop-blur',
        highlighted && 'border-zinc-700 bg-zinc-900 shadow-xl shadow-black/25',
        className,
      )}
      {...props}
    >
      {children}
    </div>
  );
}
