import { Home, SearchX } from 'lucide-react';
import { Link } from 'react-router-dom';

import Card from '@/components/ui/Card';
import { ROUTES } from '@/constants';
import { useDocumentMeta } from '@/hooks/useDocumentMeta';

export default function NotFound() {
  useDocumentMeta('Page not found', 'The requested route could not be found.');

  return (
    <div className="px-4 py-20 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-3xl">
        <Card highlighted className="text-center">
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full border border-zinc-800 bg-zinc-950/60 text-sky-300">
            <SearchX className="h-8 w-8" />
          </div>
          <h1 className="mt-6 text-4xl font-semibold text-zinc-50">This route does not exist.</h1>
          <p className="mx-auto mt-4 max-w-xl text-sm leading-7 text-zinc-300">
            The deployment now supports SPA rewrites, but this specific page is not part of the current product surface.
          </p>
          <div className="mt-8 flex flex-col justify-center gap-3 sm:flex-row">
            <Link
              to={ROUTES.home}
              className="inline-flex items-center justify-center gap-2 rounded-2xl bg-zinc-100 px-5 py-3 text-sm font-semibold text-zinc-950 transition hover:bg-white"
            >
              <Home className="h-4 w-4" />
              Go home
            </Link>
            <Link
              to={ROUTES.dashboard}
              className="inline-flex items-center justify-center rounded-2xl border border-zinc-800 bg-zinc-900 px-5 py-3 text-sm font-semibold text-zinc-100 transition hover:bg-zinc-800"
            >
              Open dashboard
            </Link>
          </div>
        </Card>
      </div>
    </div>
  );
}
