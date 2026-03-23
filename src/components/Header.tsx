import * as React from 'react';
import { Menu, ShieldCheck, UserRound, X } from 'lucide-react';
import { Link, useLocation } from 'react-router-dom';

import { APP_NAME, ROUTES } from '@/constants';
import { cn } from '@/lib/utils';

const navItems = [
  { label: 'Send a parcel', path: ROUTES.sendParcel },
  { label: 'Find parcels', path: ROUTES.findTrip },
  { label: 'Find travelers', path: ROUTES.findTraveler },
  { label: 'Trust center', path: ROUTES.trustCenter },
];

export default function Header() {
  const [menuOpen, setMenuOpen] = React.useState(false);
  const location = useLocation();

  React.useEffect(() => {
    setMenuOpen(false);
  }, [location.pathname]);

  return (
    <header className="sticky top-0 z-50 border-b border-white/10 bg-slate-950/85 backdrop-blur-xl">
      <div className="mx-auto flex h-20 w-full max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
        <Link className="flex items-center gap-3" to={ROUTES.home}>
          <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-amber-500/15 text-amber-200 ring-1 ring-amber-400/20">
            <ShieldCheck className="h-5 w-5" />
          </div>
          <div>
            <p className="text-lg font-semibold tracking-tight text-white">{APP_NAME}</p>
            <p className="text-xs uppercase tracking-[0.25em] text-slate-400">Trusted route logistics</p>
          </div>
        </Link>

        <nav className="hidden items-center gap-2 md:flex">
          {navItems.map((item) => {
            const active = location.pathname === item.path;

            return (
              <Link
                key={item.path}
                className={cn(
                  'rounded-full px-4 py-2 text-sm font-medium transition',
                  active ? 'bg-white/10 text-white' : 'text-slate-300 hover:bg-white/5 hover:text-white',
                )}
                to={item.path}
              >
                {item.label}
              </Link>
            );
          })}
        </nav>

        <div className="hidden items-center gap-3 md:flex">
          <Link
            className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-4 py-2 text-sm font-medium text-white transition hover:bg-white/10"
            to={ROUTES.dashboard}
          >
            <UserRound className="h-4 w-4 text-amber-300" />
            Dashboard
          </Link>
        </div>

        <button
          type="button"
          className="inline-flex items-center justify-center rounded-2xl border border-white/10 bg-white/5 p-3 text-slate-200 transition hover:bg-white/10 md:hidden"
          onClick={() => setMenuOpen((value) => !value)}
          aria-expanded={menuOpen}
          aria-label={menuOpen ? 'Close navigation menu' : 'Open navigation menu'}
        >
          {menuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
        </button>
      </div>

      {menuOpen ? (
        <div className="border-t border-white/10 bg-slate-950/95 px-4 py-4 md:hidden">
          <nav className="mx-auto flex max-w-7xl flex-col gap-2">
            {navItems.map((item) => {
              const active = location.pathname === item.path;

              return (
                <Link
                  key={item.path}
                  className={cn(
                    'rounded-2xl px-4 py-3 text-sm font-medium transition',
                    active ? 'bg-white/10 text-white' : 'text-slate-300 hover:bg-white/5 hover:text-white',
                  )}
                  to={item.path}
                >
                  {item.label}
                </Link>
              );
            })}
            <Link
              className="mt-2 inline-flex items-center justify-center rounded-2xl bg-amber-500 px-4 py-3 text-sm font-semibold text-slate-950"
              to={ROUTES.dashboard}
            >
              Open dashboard
            </Link>
          </nav>
        </div>
      ) : null}
    </header>
  );
}
