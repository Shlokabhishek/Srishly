import { LoaderCircle } from 'lucide-react';

interface PageLoaderProps {
  label?: string;
  fullScreen?: boolean;
}

export default function PageLoader({ fullScreen = false, label = 'Loading' }: PageLoaderProps) {
  return (
    <div className={fullScreen ? 'flex min-h-[70vh] items-center justify-center px-4' : 'flex items-center justify-center px-4 py-10'}>
      <div className="flex items-center gap-3 rounded-full border border-white/10 bg-white/5 px-5 py-3 text-sm text-slate-200 shadow-xl shadow-black/20">
        <LoaderCircle className="h-4 w-4 animate-spin text-amber-300" />
        <span>{label}</span>
      </div>
    </div>
  );
}
