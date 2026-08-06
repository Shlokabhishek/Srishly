import { ArrowUpRight, Mail, ShieldCheck } from 'lucide-react';
import { Link } from 'react-router-dom';

import { APP_NAME, ROUTES, SUPPORT_EMAIL } from '@/constants';

export default function Footer() {
  return (
    <footer className="border-t border-zinc-800 bg-zinc-950/90 px-4 pb-28 pt-16 md:pb-10">
      <div className="mx-auto grid max-w-7xl gap-10 lg:grid-cols-[1.4fr_1fr_1fr]">
        <div className="space-y-4">
          <div className="inline-flex items-center gap-3 rounded-full border border-zinc-800 bg-zinc-900 px-4 py-2 text-sm text-zinc-200">
            <ShieldCheck className="h-4 w-4 text-sky-300" />
            Clear route logistics
          </div>
          <h2 className="max-w-lg text-3xl font-semibold tracking-tight text-zinc-50">
            {APP_NAME} keeps route delivery simple, verified, and easy to follow.
          </h2>
          <p className="max-w-xl text-sm leading-7 text-zinc-400">
            The interface is organized around one idea per section, with calmer surfaces, clearer spacing, and predictable
            navigation.
          </p>
        </div>

        <div>
          <h3 className="mb-4 text-sm font-semibold uppercase tracking-[0.2em] text-zinc-300">Product</h3>
          <div className="space-y-3 text-sm text-zinc-400">
            <Link className="block transition hover:text-white" to={ROUTES.sendParcel}>
              Send a parcel
            </Link>
            <Link className="block transition hover:text-white" to={ROUTES.findTrip}>
              Find parcels
            </Link>
            <Link className="block transition hover:text-white" to={ROUTES.findTraveler}>
              Find travelers
            </Link>
            <Link className="block transition hover:text-white" to={ROUTES.dashboard}>
              Dashboard
            </Link>
          </div>
        </div>

        <div>
          <h3 className="mb-4 text-sm font-semibold uppercase tracking-[0.2em] text-zinc-300">Support</h3>
          <div className="space-y-3 text-sm text-zinc-400">
            <Link className="block transition hover:text-white" to={ROUTES.trustCenter}>
              Trust center
            </Link>
            <Link className="block transition hover:text-white" to={ROUTES.verificationHub}>
              Verification hub
            </Link>
            <a
              className="inline-flex items-center gap-2 transition hover:text-white"
              href={`mailto:${SUPPORT_EMAIL}`}
            >
              <Mail className="h-4 w-4 text-sky-300" />
              {SUPPORT_EMAIL}
            </a>
            <a
              className="inline-flex items-center gap-2 transition hover:text-white"
              href="https://www.instagram.com/srishly.team/"
              rel="noreferrer"
              target="_blank"
            >
              Instagram
              <ArrowUpRight className="h-4 w-4 text-amber-300" />
            </a>
          </div>
        </div>
      </div>

      <div className="mx-auto mt-12 flex max-w-7xl flex-col gap-3 border-t border-zinc-800 pt-6 text-xs text-zinc-500 sm:flex-row sm:items-center sm:justify-between">
        <p>Copyright {new Date().getFullYear()} {APP_NAME}. All rights reserved.</p>
        <p>Built for a simple, responsive SPA layout.</p>
      </div>
    </footer>
  );
}
