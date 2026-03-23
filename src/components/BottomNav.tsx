import { Compass, Home, Package2, UserRound } from 'lucide-react';
import { Link, useLocation } from 'react-router-dom';

import { ROUTES } from '@/constants';
import { cn } from '@/lib/utils';

const items = [
  { label: 'Home', path: ROUTES.home, icon: Home },
  { label: 'Send', path: ROUTES.sendParcel, icon: Package2 },
  { label: 'Explore', path: ROUTES.findTraveler, icon: Compass },
  { label: 'Dashboard', path: ROUTES.dashboard, icon: UserRound },
];

export default function BottomNav() {
  const location = useLocation();

  return (
    <div className="pointer-events-none fixed inset-x-0 bottom-4 z-40 flex justify-center px-4 md:hidden">
      <nav className="pointer-events-auto flex w-full max-w-md items-center justify-between rounded-full border border-white/10 bg-slate-900/90 px-4 py-3 shadow-2xl shadow-black/40 backdrop-blur-xl">
        {items.map((item) => {
          const active = location.pathname === item.path;

          return (
            <Link
              key={item.path}
              className={cn(
                'flex min-w-[68px] flex-col items-center gap-1 rounded-full px-2 py-1 text-[11px] font-medium transition',
                active ? 'text-amber-200' : 'text-slate-400 hover:text-white',
              )}
              to={item.path}
              aria-current={active ? 'page' : undefined}
            >
              <item.icon className={cn('h-5 w-5', active && 'text-amber-300')} />
              <span>{item.label}</span>
            </Link>
          );
        })}
      </nav>
    </div>
  );
}
