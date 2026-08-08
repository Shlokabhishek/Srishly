import * as React from 'react';
import { LogOut, Menu, ShieldCheck, UserRound, X } from 'lucide-react';
import { Link, useLocation } from 'react-router-dom';

import { APP_NAME, ROUTES } from '@/constants';
import { useAuth } from '@/context/AuthContext';
import { useMode } from '@/context/ModeContext';
import { cn } from '@/lib/utils';

function getNavItems(mode: 'sender' | 'traveler') {
  return [
    ...(mode === 'sender' ? [{ label: 'Send a parcel', path: ROUTES.sendParcel }] : []),
    ...(mode === 'traveler' ? [{ label: 'Find parcels', path: ROUTES.findTrip }] : []),
    { label: 'Find travelers', path: ROUTES.findTraveler },
    { label: 'Trust center', path: ROUTES.trustCenter },
  ];
}

export default function Header() {
  const [menuOpen, setMenuOpen] = React.useState(false);
  const location = useLocation();
  const { session, logout } = useAuth();
  const { mode, setMode } = useMode();

  React.useEffect(() => {
    setMenuOpen(false);
  }, [location.pathname]);

  const navItems = getNavItems(mode);
  const dashboardLabel = session?.user.isAdmin ? 'Admin panel' : mode === 'sender' ? 'Your parcels' : 'Dashboard';
  const modeButtonClass = (isActive: boolean) =>
    cn(
      'rounded-full px-4 py-2 text-sm font-semibold transition duration-200',
      isActive
        ? 'bg-sky-300 text-slate-950 shadow-[0_10px_30px_rgba(125,211,252,0.22)]'
        : 'bg-transparent text-zinc-400 hover:bg-white/6 hover:text-zinc-100',
    );
  const mobileModeButtonClass = (isActive: boolean) =>
    cn(
      'flex-1 rounded-2xl px-4 py-3 text-sm font-semibold transition duration-200',
      isActive
        ? 'bg-sky-300 text-slate-950 shadow-[0_10px_30px_rgba(125,211,252,0.22)]'
        : 'bg-transparent text-zinc-400 hover:bg-white/6 hover:text-zinc-100',
    );

  return (
    <header className="sticky top-0 z-50 border-b border-zinc-800/80 bg-zinc-950/90 backdrop-blur-xl">
      <div className="mx-auto flex h-20 w-full max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
        <Link className="flex items-center gap-3" to={ROUTES.home}>
          <div className="flex h-11 w-11 items-center justify-center rounded-2xl border border-zinc-800 bg-zinc-900 text-sky-300">
            <ShieldCheck className="h-5 w-5" />
          </div>
          <div>
            <p className="text-lg font-semibold tracking-tight text-zinc-50">{APP_NAME}</p>
            <p className="text-xs uppercase tracking-[0.25em] text-zinc-400">Route logistics made clear</p>
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
                  active ? 'bg-zinc-100 text-zinc-950' : 'text-zinc-300 hover:bg-white/5 hover:text-zinc-50',
                )}
                to={item.path}
              >
                {item.label}
              </Link>
            );
          })}
        </nav>

        <div className="hidden items-center gap-3 md:flex">
          <div className="inline-flex rounded-full border border-sky-400/15 bg-zinc-950/80 p-1 shadow-inner shadow-black/20">
            <button
              type="button"
              onClick={() => setMode('sender')}
              className={modeButtonClass(mode === 'sender')}
            >
              User mode
            </button>
            <button
              type="button"
              onClick={() => setMode('traveler')}
              className={modeButtonClass(mode === 'traveler')}
            >
              Traveler mode
            </button>
          </div>

          {session ? (
            <>
              <span className="rounded-full border border-zinc-800 bg-zinc-900 px-4 py-2 text-sm font-medium text-zinc-100">
                {session.user.name}
              </span>
              {session.user.isAdmin ? (
                <Link
                  className="inline-flex items-center gap-2 rounded-full border border-zinc-800 bg-zinc-900 px-4 py-2 text-sm font-medium text-zinc-100 transition hover:bg-zinc-800"
                  to={ROUTES.verificationHub}
                >
                  <ShieldCheck className="h-4 w-4 text-sky-300" />
                  Approvals
                </Link>
              ) : null}
              <Link
                className="inline-flex items-center gap-2 rounded-full border border-zinc-800 bg-zinc-900 px-4 py-2 text-sm font-medium text-zinc-100 transition hover:bg-zinc-800"
                to={session.user.isAdmin ? ROUTES.verificationHub : ROUTES.dashboard}
              >
                <UserRound className="h-4 w-4 text-sky-300" />
                {dashboardLabel}
              </Link>
              <button
                type="button"
                onClick={() => void logout()}
                className="inline-flex items-center gap-2 rounded-full border border-zinc-800 bg-zinc-900 px-4 py-2 text-sm font-medium text-zinc-100 transition hover:bg-zinc-800"
              >
                <LogOut className="h-4 w-4 text-sky-300" />
                Logout
              </button>
            </>
          ) : (
            <Link
              className="inline-flex items-center gap-2 rounded-full border border-zinc-800 bg-zinc-900 px-4 py-2 text-sm font-medium text-zinc-100 transition hover:bg-zinc-800"
              to={ROUTES.auth}
            >
              <UserRound className="h-4 w-4 text-sky-300" />
              Sign in
            </Link>
          )}
        </div>

        <button
          type="button"
          className="inline-flex items-center justify-center rounded-2xl border border-zinc-800 bg-zinc-900 p-3 text-zinc-200 transition hover:bg-zinc-800 md:hidden"
          onClick={() => setMenuOpen((value) => !value)}
          aria-expanded={menuOpen}
          aria-label={menuOpen ? 'Close navigation menu' : 'Open navigation menu'}
        >
          {menuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
        </button>
      </div>

      {menuOpen ? (
        <div className="border-t border-zinc-800 bg-zinc-950/95 px-4 py-4 md:hidden">
          <nav className="mx-auto flex max-w-7xl flex-col gap-2">
            <div className="mb-2 inline-flex rounded-2xl border border-sky-400/15 bg-zinc-950/80 p-1 shadow-inner shadow-black/20">
              <button
                type="button"
                onClick={() => setMode('sender')}
                className={mobileModeButtonClass(mode === 'sender')}
              >
                User mode
              </button>
              <button
                type="button"
                onClick={() => setMode('traveler')}
                className={mobileModeButtonClass(mode === 'traveler')}
              >
                Traveler mode
              </button>
            </div>

            {navItems.map((item) => {
              const active = location.pathname === item.path;

              return (
                <Link
                  key={item.path}
                  className={cn(
                    'rounded-2xl px-4 py-3 text-sm font-medium transition',
                    active ? 'bg-zinc-100 text-zinc-950' : 'text-zinc-300 hover:bg-white/5 hover:text-zinc-50',
                  )}
                  to={item.path}
                >
                  {item.label}
                </Link>
              );
            })}
            {session ? (
              <>
                {session.user.isAdmin ? (
                  <Link
                    className="mt-2 inline-flex items-center justify-center rounded-2xl border border-zinc-800 bg-zinc-900 px-4 py-3 text-sm font-semibold text-zinc-100 transition hover:bg-zinc-800"
                    to={ROUTES.verificationHub}
                  >
                    Approvals
                  </Link>
                ) : null}
                <Link
                  className="mt-2 inline-flex items-center justify-center rounded-2xl bg-zinc-100 px-4 py-3 text-sm font-semibold text-zinc-950"
                  to={session.user.isAdmin ? ROUTES.verificationHub : ROUTES.dashboard}
                >
                  {dashboardLabel}
                </Link>
                <button
                  type="button"
                  onClick={() => void logout()}
                  className="inline-flex items-center justify-center rounded-2xl border border-zinc-800 bg-zinc-900 px-4 py-3 text-sm font-semibold text-zinc-100 transition hover:bg-zinc-800"
                >
                  Logout
                </button>
              </>
            ) : (
              <Link
                className="mt-2 inline-flex items-center justify-center rounded-2xl bg-zinc-100 px-4 py-3 text-sm font-semibold text-zinc-950"
                to={ROUTES.auth}
              >
                Sign in
              </Link>
            )}
          </nav>
        </div>
      ) : null}
    </header>
  );
}
