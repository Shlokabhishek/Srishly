import type { LucideIcon } from 'lucide-react';

import Button from '@/components/ui/Button';

interface EmptyStateProps {
  title: string;
  description: string;
  icon: LucideIcon;
  actionLabel?: string;
  onAction?: () => void;
}

export default function EmptyState({ actionLabel, description, icon: Icon, onAction, title }: EmptyStateProps) {
  return (
    <div className="rounded-[2rem] border border-dashed border-white/10 bg-slate-900/40 p-10 text-center">
      <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-amber-500/10 text-amber-300">
        <Icon className="h-7 w-7" />
      </div>
      <h3 className="mb-2 text-xl font-semibold text-white">{title}</h3>
      <p className="mx-auto max-w-lg text-sm leading-7 text-slate-300">{description}</p>
      {actionLabel && onAction ? (
        <div className="mt-6">
          <Button onClick={onAction} variant="secondary">
            {actionLabel}
          </Button>
        </div>
      ) : null}
    </div>
  );
}
