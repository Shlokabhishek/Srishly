import type { ReactNode } from 'react';

interface FormFieldProps {
  label: string;
  htmlFor: string;
  children: ReactNode;
  description?: string;
  error?: string;
}

export default function FormField({ children, description, error, htmlFor, label }: FormFieldProps) {
  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between gap-3">
        <label className="text-sm font-medium text-slate-200" htmlFor={htmlFor}>
          {label}
        </label>
        {error ? <span className="text-xs font-medium text-red-300">{error}</span> : null}
      </div>
      {children}
      {description ? <p className="text-xs leading-6 text-slate-400">{description}</p> : null}
    </div>
  );
}
