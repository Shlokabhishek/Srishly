import { ArrowUpRight, Mail, ShieldCheck } from 'lucide-react';
import { Link } from 'react-router-dom';

import { APP_NAME, ROUTES, SUPPORT_EMAIL } from '@/constants';

export default function Footer() {
  return (
    <footer className="border-t border-white/10 bg-slate-950/90 px-4 pb-28 pt-16 md:pb-10">
      <div className="mx-auto grid max-w-7xl gap-10 lg:grid-cols-[1.4fr_1fr_1fr]">
        <div className="space-y-4">
          <div className="inline-flex items-center gap-3 rounded-full border border-white/10 bg-white/5 px-4 py-2 text-sm text-slate-200">
            <ShieldCheck className="h-4 w-4 text-amber-300" />
            Escrow-first route logistics
          </div>
          <h2 className="max-w-lg text-3xl font-semibold tracking-tight text-white">
            {APP_NAME} helps teams ship faster with verified travelers and tighter delivery controls.
          </h2>
          <p className="max-w-xl text-sm leading-7 text-slate-400">
            This frontend is prepared for deployment with validated forms, client-safe persistence, accessibility fixes, and
            hardened Netlify routing.
          </p>
        </div>

        <div>
          <h3 className="mb-4 text-sm font-semibold uppercase tracking-[0.2em] text-slate-300">Product</h3>
          <div className="space-y-3 text-sm text-slate-400">
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
          <h3 className="mb-4 text-sm font-semibold uppercase tracking-[0.2em] text-slate-300">Support</h3>
          <div className="space-y-3 text-sm text-slate-400">
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
              <Mail className="h-4 w-4 text-amber-300" />
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

      <div className="mx-auto mt-12 flex max-w-7xl flex-col gap-3 border-t border-white/10 pt-6 text-xs text-slate-500 sm:flex-row sm:items-center sm:justify-between">
        <p>Copyright {new Date().getFullYear()} {APP_NAME}. All rights reserved.</p>
        <p>Built for scalable SPA deployment on Netlify and Vite.</p>
      </div>
    </footer>
  );
}
