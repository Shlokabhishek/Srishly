import * as React from 'react';
import { CalendarDays, Compass, MapPinned, Search, Users2 } from 'lucide-react';
import { motion } from 'motion/react';
import { Link, useSearchParams } from 'react-router-dom';

import Button from '@/components/ui/Button';
import Card from '@/components/ui/Card';
import EmptyState from '@/components/ui/EmptyState';
import ErrorBanner from '@/components/ui/ErrorBanner';
import PageLoader from '@/components/ui/PageLoader';
import StatusBadge from '@/components/ui/StatusBadge';
import { CITIES, ROUTES } from '@/constants';
import { useDocumentMeta } from '@/hooks/useDocumentMeta';
import { formatDate } from '@/lib/format';
import { getTrips } from '@/services/mockApi';
import type { Trip } from '@/types';

export default function FindTraveler() {
  const [searchParams] = useSearchParams();
  const [trips, setTrips] = React.useState<Trip[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState('');
  const [fromCity, setFromCity] = React.useState(searchParams.get('from') ?? '');
  const [toCity, setToCity] = React.useState(searchParams.get('to') ?? '');
  const [query, setQuery] = React.useState('');
  const [verifiedOnly, setVerifiedOnly] = React.useState(true);
  const [viewMode, setViewMode] = React.useState<'list' | 'map'>('list');
  const [selectedTripId, setSelectedTripId] = React.useState('');
  const deferredQuery = React.useDeferredValue(query);

  useDocumentMeta(
    'Find verified travelers',
    'Search travelers by route, trust score, and available space with responsive list and map-style views.',
  );

  React.useEffect(() => {
    let active = true;

    async function loadTrips() {
      try {
        setLoading(true);
        const nextTrips = await getTrips();
        if (active) {
          setTrips(nextTrips);
          setSelectedTripId(nextTrips[0]?.id ?? '');
        }
      } catch {
        if (active) {
          setError('We could not load traveler routes right now.');
        }
      } finally {
        if (active) {
          setLoading(false);
        }
      }
    }

    void loadTrips();

    return () => {
      active = false;
    };
  }, []);

  const filteredTrips = trips.filter((trip) => {
    const matchesFromCity = !fromCity || trip.fromCity === fromCity;
    const matchesToCity = !toCity || trip.toCity === toCity;
    const matchesVerification = !verifiedOnly || trip.isVerified;
    const matchesQuery =
      !deferredQuery ||
      `${trip.travelerName} ${trip.fromCity} ${trip.toCity} ${trip.mode}`
        .toLowerCase()
        .includes(deferredQuery.toLowerCase());

    return matchesFromCity && matchesToCity && matchesVerification && matchesQuery;
  });

  return (
    <div className="px-4 py-12 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-7xl space-y-8">
        <div className="space-y-4">
          <p className="text-sm uppercase tracking-[0.25em] text-amber-200">Sender matching</p>
          <h1 className="text-4xl font-semibold text-white">Search verified travelers before you post a parcel.</h1>
          <p className="max-w-3xl text-sm leading-7 text-slate-300">
            The route explorer now supports query params from the home page, view mode toggles, and predictable filtering.
          </p>
        </div>

        <div className="grid gap-8 lg:grid-cols-[0.35fr_0.65fr]">
          <Card className="space-y-5">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold text-white">Search filters</h2>
              <Compass className="h-4 w-4 text-amber-300" />
            </div>

            <label className="space-y-2 text-sm text-slate-300">
              <span className="block font-medium">Keyword</span>
              <div className="flex items-center gap-3 rounded-2xl border border-white/10 bg-white/5 px-4 py-3">
                <Search className="h-4 w-4 text-amber-300" />
                <input
                  value={query}
                  onChange={(event) => setQuery(event.target.value)}
                  placeholder="Search traveler or route"
                  className="w-full bg-transparent text-white outline-none"
                />
              </div>
            </label>

            <label className="space-y-2 text-sm text-slate-300">
              <span className="block font-medium">From city</span>
              <select
                value={fromCity}
                onChange={(event) => setFromCity(event.target.value)}
                className="w-full rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-white outline-none"
              >
                <option value="">Any origin</option>
                {CITIES.map((city) => (
                  <option key={city} value={city}>
                    {city}
                  </option>
                ))}
              </select>
            </label>

            <label className="space-y-2 text-sm text-slate-300">
              <span className="block font-medium">To city</span>
              <select
                value={toCity}
                onChange={(event) => setToCity(event.target.value)}
                className="w-full rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-white outline-none"
              >
                <option value="">Any destination</option>
                {CITIES.map((city) => (
                  <option key={city} value={city}>
                    {city}
                  </option>
                ))}
              </select>
            </label>

            <label className="flex items-start gap-3 rounded-2xl border border-white/10 bg-white/5 p-4 text-sm text-slate-300">
              <input
                checked={verifiedOnly}
                onChange={(event) => setVerifiedOnly(event.target.checked)}
                type="checkbox"
                className="mt-1 h-4 w-4 rounded border-white/20 bg-slate-950 text-amber-400"
              />
              <span>Show verified travelers only</span>
            </label>

            <div className="grid grid-cols-2 gap-3">
              <Button onClick={() => setViewMode('list')} variant={viewMode === 'list' ? 'primary' : 'secondary'}>
                List
              </Button>
              <Button onClick={() => setViewMode('map')} variant={viewMode === 'map' ? 'primary' : 'secondary'}>
                Route view
              </Button>
            </div>

            <Button
              variant="ghost"
              onClick={() => {
                setFromCity('');
                setToCity('');
                setQuery('');
                setVerifiedOnly(true);
              }}
            >
              Reset filters
            </Button>
          </Card>

          <div className="space-y-5">
            <div className="flex items-center justify-between gap-4">
              <div>
                <h2 className="text-2xl font-semibold text-white">Traveler results</h2>
                <p className="text-sm text-slate-400">{filteredTrips.length} matching routes</p>
              </div>
              <StatusBadge tone="warning">{verifiedOnly ? 'Verified only' : 'All travelers'}</StatusBadge>
            </div>

            {error ? <ErrorBanner message={error} /> : null}
            {loading ? <PageLoader label="Loading traveler routes" /> : null}

            {!loading && filteredTrips.length === 0 ? (
              <EmptyState
                icon={Users2}
                title="No travelers available on this route"
                description="Try widening the search area or disable the verified-only filter to inspect the full route supply."
              />
            ) : null}

            {!loading && viewMode === 'list' ? (
              <div className="grid gap-5">
                {filteredTrips.map((trip, index) => (
                  <motion.div
                    key={trip.id}
                    initial={{ opacity: 0, y: 16 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.04 }}
                  >
                    <Card highlighted={selectedTripId === trip.id} className="space-y-5">
                      <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
                        <div className="space-y-3">
                          <div className="flex flex-wrap items-center gap-3">
                            <h3 className="text-2xl font-semibold text-white">{trip.travelerName}</h3>
                            {trip.isVerified ? <StatusBadge tone="success">Verified</StatusBadge> : <StatusBadge>Pending review</StatusBadge>}
                          </div>
                          <p className="text-sm leading-7 text-slate-300">
                            Route {trip.fromCity} -&gt; {trip.toCity} by {trip.mode}. Trust score {trip.trustScore}.
                          </p>
                        </div>
                        <Button onClick={() => setSelectedTripId(trip.id)} variant="secondary">
                          Focus route
                        </Button>
                      </div>

                      <div className="grid gap-4 md:grid-cols-3">
                        <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
                          <p className="text-xs uppercase tracking-[0.2em] text-slate-500">Date</p>
                          <p className="mt-2 flex items-center gap-2 text-sm font-medium text-white">
                            <CalendarDays className="h-4 w-4 text-amber-300" />
                            {formatDate(trip.date)}
                          </p>
                        </div>
                        <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
                          <p className="text-xs uppercase tracking-[0.2em] text-slate-500">Space</p>
                          <p className="mt-2 text-sm font-medium text-white">{trip.availableSpace} kg available</p>
                        </div>
                        <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
                          <p className="text-xs uppercase tracking-[0.2em] text-slate-500">Next action</p>
                          <p className="mt-2 text-sm font-medium text-white">Contact traveler after request review</p>
                        </div>
                      </div>
                    </Card>
                  </motion.div>
                ))}
              </div>
            ) : null}

            {!loading && viewMode === 'map' ? (
              <Card className="relative min-h-[420px] overflow-hidden p-0">
                <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(245,158,11,0.16),transparent_25%),radial-gradient(circle_at_bottom_right,rgba(56,189,248,0.16),transparent_30%),linear-gradient(180deg,rgba(15,23,42,0.98),rgba(2,6,23,0.98))]" />
                <div className="absolute inset-0 bg-[linear-gradient(to_right,rgba(148,163,184,0.08)_1px,transparent_1px),linear-gradient(to_bottom,rgba(148,163,184,0.08)_1px,transparent_1px)] bg-[size:36px_36px]" />
                <div className="relative z-10 flex h-full flex-col justify-between p-6">
                  <div className="flex items-center justify-between">
                    <div className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-slate-950/60 px-4 py-2 text-xs uppercase tracking-[0.25em] text-slate-300">
                      <MapPinned className="h-4 w-4 text-amber-300" />
                      Route clusters
                    </div>
                    <Button variant="secondary" onClick={() => setViewMode('list')}>
                      Back to list
                    </Button>
                  </div>

                  <div className="relative h-[260px]">
                    {filteredTrips.map((trip, index) => (
                      <button
                        key={trip.id}
                        type="button"
                        onClick={() => setSelectedTripId(trip.id)}
                        className="absolute rounded-2xl border border-white/10 bg-slate-950/80 px-4 py-3 text-left shadow-xl shadow-black/30 backdrop-blur transition hover:border-amber-300/40"
                        style={{
                          top: `${18 + index * 14}%`,
                          left: `${14 + (index % 3) * 25}%`,
                        }}
                      >
                        <div className="flex items-center gap-2">
                          <span className={`h-3 w-3 rounded-full ${trip.isVerified ? 'bg-emerald-300' : 'bg-amber-300'}`} />
                          <span className="text-sm font-semibold text-white">{trip.travelerName}</span>
                        </div>
                        <p className="mt-2 text-xs uppercase tracking-[0.2em] text-slate-400">
                          {trip.fromCity} -&gt; {trip.toCity}
                        </p>
                      </button>
                    ))}
                  </div>

                  {selectedTripId ? (
                    <div className="rounded-2xl border border-amber-400/20 bg-amber-500/10 p-4 text-sm text-slate-50">
                      Selected route: {filteredTrips.find((trip) => trip.id === selectedTripId)?.fromCity ?? 'Origin'} -&gt;{' '}
                      {filteredTrips.find((trip) => trip.id === selectedTripId)?.toCity ?? 'Destination'}
                    </div>
                  ) : null}
                </div>
              </Card>
            ) : null}

            <Card className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <p className="text-sm uppercase tracking-[0.25em] text-amber-200">Next step</p>
                <h3 className="mt-2 text-xl font-semibold text-white">Found a traveler you trust?</h3>
                <p className="mt-2 text-sm leading-7 text-slate-300">
                  Move to the request flow and create a parcel with route details already in mind.
                </p>
              </div>
              <Link
                className="inline-flex items-center justify-center rounded-2xl bg-amber-500 px-5 py-3 text-sm font-semibold text-slate-950 transition hover:bg-amber-400"
                to={ROUTES.sendParcel}
              >
                Post a parcel request
              </Link>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}
