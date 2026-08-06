import * as React from 'react';
import { CalendarDays, Compass, Lock, MapPinned, Phone, Search, ShieldCheck, Star, Users2 } from 'lucide-react';
import { motion } from 'motion/react';
import { Link, useSearchParams } from 'react-router-dom';

import Button from '@/components/ui/Button';
import Card from '@/components/ui/Card';
import EmptyState from '@/components/ui/EmptyState';
import ErrorBanner from '@/components/ui/ErrorBanner';
import PageLoader from '@/components/ui/PageLoader';
import StatusBadge from '@/components/ui/StatusBadge';
import { CITIES, ROUTES } from '@/constants';
import { useAuth } from '@/context/AuthContext';
import { useDocumentMeta } from '@/hooks/useDocumentMeta';
import { maskPhone, formatDate } from '@/lib/format';
import {
  getTravelModeLabel,
  getTrustScore,
  getVerificationLabel,
  getVerificationTone,
  isApprovedVerification,
  isViewerVerified,
} from '@/lib/orderFlow';
import { getTrips } from '@/services/mockApi';
import type { Trip } from '@/types';

export default function FindTraveler() {
  const [searchParams] = useSearchParams();
  const { session } = useAuth();
  const [trips, setTrips] = React.useState<Trip[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState('');
  const [fromCity, setFromCity] = React.useState(searchParams.get('from') ?? '');
  const [toCity, setToCity] = React.useState(searchParams.get('to') ?? '');
  const [query, setQuery] = React.useState('');
  const [verifiedOnly, setVerifiedOnly] = React.useState(true);
  const [minRating, setMinRating] = React.useState('4.0');
  const [viewMode, setViewMode] = React.useState<'list' | 'map'>('list');
  const [selectedTripId, setSelectedTripId] = React.useState('');
  const deferredQuery = React.useDeferredValue(query);
  const viewerVerified = isViewerVerified(session);

  useDocumentMeta(
    'Find verified travelers',
    'Search travelers by route, trust score, verification status, and available space with privacy-first access controls.',
  );

  React.useEffect(() => {
    let active = true;

    async function loadTrips() {
      try {
        setLoading(true);
        const nextTrips = await getTrips();
        if (active) {
          setError('');
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
    const matchesVerification = !verifiedOnly || isApprovedVerification(trip.verificationStatus);
    const matchesRating = trip.rating >= Number(minRating);
    const matchesQuery =
      !deferredQuery ||
      `${trip.travelerName} ${trip.fromCity} ${trip.toCity} ${trip.mode} ${trip.verificationStatus}`
        .toLowerCase()
        .includes(deferredQuery.toLowerCase());

    return matchesFromCity && matchesToCity && matchesVerification && matchesRating && matchesQuery;
  });

  const verifiedCount = filteredTrips.filter((trip) => isApprovedVerification(trip.verificationStatus)).length;
  const averageRating = filteredTrips.length
    ? (filteredTrips.reduce((sum, trip) => sum + trip.rating, 0) / filteredTrips.length).toFixed(1)
    : '0.0';
  const routeLabel =
    fromCity && toCity ? `${filteredTrips.length} travelers available from ${fromCity} to ${toCity}` : `${filteredTrips.length} travelers across active routes`;

  return (
    <div className="px-4 py-10 sm:px-6 lg:px-8 lg:py-12">
      <div className="mx-auto max-w-7xl space-y-8">
        <div className="space-y-4">
          <p className="text-sm uppercase tracking-[0.25em] text-zinc-400">Trust-gated traveler search</p>
          <h1 className="text-4xl font-semibold text-zinc-50">See route availability first, then unlock verified traveler details.</h1>
          <p className="max-w-3xl text-sm leading-7 text-zinc-300">
            Route counts stay public, but names, contact details, and booking actions unlock only after login and verification.
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
                  placeholder="Search traveler, route, or mode"
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

            <label className="space-y-2 text-sm text-slate-300">
              <span className="block font-medium">Minimum rating</span>
              <select
                value={minRating}
                onChange={(event) => setMinRating(event.target.value)}
                className="w-full rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-white outline-none"
              >
                <option value="0">Any rating</option>
                <option value="4.0">4.0+</option>
                <option value="4.5">4.5+</option>
                <option value="4.8">4.8+</option>
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
                setMinRating('4.0');
              }}
            >
              Reset filters
            </Button>
          </Card>

          <div className="space-y-5">
            <div className="grid gap-4 md:grid-cols-3">
              <Card className="bg-white/5">
                <p className="text-xs uppercase tracking-[0.2em] text-slate-500">Route availability</p>
                <p className="mt-3 text-2xl font-semibold text-white">{filteredTrips.length}</p>
                <p className="mt-2 text-sm text-slate-400">Travelers visible on the selected route.</p>
              </Card>
              <Card className="bg-white/5">
                <p className="text-xs uppercase tracking-[0.2em] text-slate-500">Verified supply</p>
                <p className="mt-3 text-2xl font-semibold text-white">{verifiedCount}</p>
                <p className="mt-2 text-sm text-slate-400">Profiles with student or Aadhaar checks complete.</p>
              </Card>
              <Card className="bg-white/5">
                <p className="text-xs uppercase tracking-[0.2em] text-slate-500">Average rating</p>
                <p className="mt-3 text-2xl font-semibold text-white">{averageRating}/5</p>
                <p className="mt-2 text-sm text-slate-400">Combined traveler feedback for this result set.</p>
              </Card>
            </div>

            <Card highlighted className="space-y-4 border-amber-400/20 bg-amber-500/10">
              <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
                <div>
                  <p className="text-sm uppercase tracking-[0.25em] text-amber-100">Gatekeeper wall</p>
                  <h2 className="mt-2 text-2xl font-semibold text-white">{routeLabel}</h2>
                  <p className="mt-2 text-sm leading-7 text-slate-100">
                    {viewerVerified
                      ? 'Verification complete. Traveler names, trust details, and contact workflows are now unlocked.'
                      : 'Traveler names, phone numbers, and booking controls stay hidden until your account is logged in and verified.'}
                  </p>
                </div>
                <StatusBadge tone={viewerVerified ? 'success' : 'warning'}>
                  {viewerVerified ? 'Full access unlocked' : 'Verification required'}
                </StatusBadge>
              </div>

              {!viewerVerified ? (
                <div className="grid gap-4 md:grid-cols-2">
                  <Card className="border-white/10 bg-slate-950/40">
                    <p className="text-xs uppercase tracking-[0.2em] text-slate-500">I am a Student</p>
                    <h3 className="mt-3 text-xl font-semibold text-white">Verify with college ID and official email</h3>
                    <p className="mt-3 text-sm leading-7 text-slate-300">
                      Upload your college ID and finish university email verification to unlock booking, contact, and live order views.
                    </p>
                    <Link
                      className="mt-5 inline-flex items-center justify-center rounded-2xl bg-amber-500 px-5 py-3 text-sm font-semibold text-slate-950 transition hover:bg-amber-400"
                      to={ROUTES.auth}
                    >
                      Start student signup
                    </Link>
                  </Card>

                  <Card className="border-white/10 bg-slate-950/40">
                    <p className="text-xs uppercase tracking-[0.2em] text-slate-500">I am a Professional</p>
                    <h3 className="mt-3 text-xl font-semibold text-white">Continue with Aadhaar OTP verification</h3>
                    <p className="mt-3 text-sm leading-7 text-slate-300">
                      Review the trust policy and verification workflow before unlocking professional traveler identity details.
                    </p>
                    <div className="mt-5 flex flex-wrap gap-3">
                      <Link
                        className="inline-flex items-center justify-center rounded-2xl bg-white/10 px-5 py-3 text-sm font-semibold text-white transition hover:bg-white/15"
                        to={ROUTES.trustCenter}
                      >
                        Review trust policy
                      </Link>
                      <Link
                        className="inline-flex items-center justify-center rounded-2xl border border-white/10 bg-slate-950/40 px-5 py-3 text-sm font-semibold text-white transition hover:bg-white/10"
                        to={ROUTES.verificationHub}
                      >
                        Open verification path
                      </Link>
                    </div>
                  </Card>
                </div>
              ) : null}
            </Card>

            {error ? <ErrorBanner message={error} /> : null}
            {loading ? <PageLoader label="Loading traveler routes" /> : null}

            {!loading && filteredTrips.length === 0 ? (
              <EmptyState
                icon={Users2}
                title="No travelers available on this route"
                description="Try widening the route filters or reduce the minimum rating threshold."
              />
            ) : null}

            {!loading && filteredTrips.length > 0 && !viewerVerified ? (
              <div className="grid gap-5">
                {filteredTrips.map((trip, index) => (
                  <motion.div
                    key={trip.id}
                    initial={{ opacity: 0, y: 16 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.04 }}
                  >
                    <Card className="space-y-5 border-white/10 bg-white/5">
                      <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                        <div className="space-y-3">
                          <div className="flex flex-wrap items-center gap-3">
                            <div className="inline-flex h-12 w-12 items-center justify-center rounded-2xl bg-amber-500/10 text-amber-200">
                              <Lock className="h-5 w-5" />
                            </div>
                            <div>
                              <h3 className="text-xl font-semibold text-white">Traveler details locked</h3>
                              <p className="text-sm text-slate-400">Verify to reveal name, phone number, and booking access.</p>
                            </div>
                          </div>
                          <div className="flex flex-wrap items-center gap-3">
                            <StatusBadge tone={getVerificationTone(trip.verificationStatus)}>
                              {getVerificationLabel(trip.verificationStatus)}
                            </StatusBadge>
                            <StatusBadge tone="muted">{getTravelModeLabel(trip.mode)}</StatusBadge>
                          </div>
                        </div>
                        <div className="rounded-2xl border border-white/10 bg-slate-950/40 px-4 py-3 text-right">
                          <p className="text-xs uppercase tracking-[0.2em] text-slate-500">Trust score</p>
                          <p className="mt-1 text-2xl font-semibold text-white">{getTrustScore(trip.rating, trip.successfulDeliveries)}</p>
                        </div>
                      </div>

                      <div className="grid gap-4 md:grid-cols-3">
                        <MetricPanel icon={CalendarDays} label="Travel date" value={formatDate(trip.date)} />
                        <MetricPanel icon={Star} label="Rating" value={`${trip.rating.toFixed(1)}/5`} />
                        <MetricPanel icon={MapPinned} label="Route" value={`${trip.fromCity} to ${trip.toCity}`} />
                      </div>
                    </Card>
                  </motion.div>
                ))}
              </div>
            ) : null}

            {!loading && viewerVerified && viewMode === 'list' ? (
              <div className="grid gap-5">
                {filteredTrips.map((trip, index) => (
                  <motion.div
                    key={trip.id}
                    initial={{ opacity: 0, y: 16 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.04 }}
                  >
                    <Card highlighted={selectedTripId === trip.id} className="space-y-5">
                      <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                        <div className="space-y-3">
                          <div className="flex flex-wrap items-center gap-3">
                            <h3 className="text-2xl font-semibold text-white">{trip.travelerName}</h3>
                            <StatusBadge tone={getVerificationTone(trip.verificationStatus)}>
                              {getVerificationLabel(trip.verificationStatus)}
                            </StatusBadge>
                            <StatusBadge tone="muted">{getTravelModeLabel(trip.mode)}</StatusBadge>
                          </div>
                          <p className="text-sm leading-7 text-slate-300">
                            {trip.fromCity} to {trip.toCity} with {trip.availableSpace} kg available. {trip.successfulDeliveries} successful deliveries and a {trip.rating.toFixed(1)}/5 rating.
                          </p>
                        </div>
                        <div className="rounded-2xl border border-amber-400/20 bg-amber-500/10 px-4 py-3 text-right">
                          <p className="text-xs uppercase tracking-[0.2em] text-amber-100">Trust score</p>
                          <p className="mt-1 text-2xl font-semibold text-white">{getTrustScore(trip.rating, trip.successfulDeliveries)}</p>
                        </div>
                      </div>

                      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
                        <MetricPanel icon={CalendarDays} label="Travel date" value={formatDate(trip.date)} />
                        <MetricPanel icon={Star} label="Rating" value={`${trip.rating.toFixed(1)}/5`} />
                        <MetricPanel icon={ShieldCheck} label="Verification" value={getVerificationLabel(trip.verificationStatus)} />
                        <MetricPanel icon={Phone} label="Phone" value={viewerVerified ? trip.travelerPhone : maskPhone(trip.travelerPhone)} />
                      </div>

                      <div className="flex flex-col gap-3 sm:flex-row sm:justify-end">
                        <Link
                          className="inline-flex items-center justify-center rounded-2xl border border-white/10 bg-white/5 px-5 py-3 text-sm font-semibold text-white transition hover:bg-white/10"
                          to={ROUTES.trustCenter}
                        >
                          Verify
                        </Link>
                        <Link
                          className="inline-flex items-center justify-center rounded-2xl border border-white/10 bg-white/5 px-5 py-3 text-sm font-semibold text-white transition hover:bg-white/10"
                          to={ROUTES.dashboard}
                        >
                          Contact
                        </Link>
                        <Link
                          className="inline-flex items-center justify-center rounded-2xl bg-amber-500 px-5 py-3 text-sm font-semibold text-slate-950 transition hover:bg-amber-400"
                          to={`${ROUTES.sendParcel}?from=${encodeURIComponent(trip.fromCity)}&to=${encodeURIComponent(trip.toCity)}`}
                        >
                          Book
                        </Link>
                      </div>
                    </Card>
                  </motion.div>
                ))}
              </div>
            ) : null}

            {!loading && viewerVerified && viewMode === 'map' ? (
              <Card className="relative min-h-[420px] overflow-hidden p-0">
                <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(245,158,11,0.16),transparent_25%),radial-gradient(circle_at_bottom_right,rgba(56,189,248,0.16),transparent_30%),linear-gradient(180deg,rgba(15,23,42,0.98),rgba(2,6,23,0.98))]" />
                <div className="absolute inset-0 bg-[linear-gradient(to_right,rgba(148,163,184,0.08)_1px,transparent_1px),linear-gradient(to_bottom,rgba(148,163,184,0.08)_1px,transparent_1px)] bg-[size:36px_36px]" />
                <div className="relative z-10 flex h-full flex-col justify-between p-6">
                  <div className="flex items-center justify-between gap-4">
                    <div className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-slate-950/60 px-4 py-2 text-xs uppercase tracking-[0.25em] text-slate-300">
                      <MapPinned className="h-4 w-4 text-amber-300" />
                      Verified route clusters
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
                          <span className={`h-3 w-3 rounded-full ${isApprovedVerification(trip.verificationStatus) ? 'bg-emerald-300' : 'bg-amber-300'}`} />
                          <span className="text-sm font-semibold text-white">{trip.travelerName}</span>
                        </div>
                        <p className="mt-2 text-xs uppercase tracking-[0.2em] text-slate-400">
                          {trip.fromCity} to {trip.toCity}
                        </p>
                      </button>
                    ))}
                  </div>

                  {selectedTripId ? (
                    <div className="rounded-2xl border border-amber-400/20 bg-amber-500/10 p-4 text-sm text-slate-50">
                      Selected route: {filteredTrips.find((trip) => trip.id === selectedTripId)?.fromCity ?? 'Origin'} to{' '}
                      {filteredTrips.find((trip) => trip.id === selectedTripId)?.toCity ?? 'Destination'}
                    </div>
                  ) : null}
                </div>
              </Card>
            ) : null}
          </div>
        </div>
      </div>
    </div>
  );
}

function MetricPanel({
  icon: Icon,
  label,
  value,
}: {
  icon: typeof CalendarDays;
  label: string;
  value: string;
}) {
  return (
    <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
      <p className="text-xs uppercase tracking-[0.2em] text-slate-500">{label}</p>
      <p className="mt-2 flex items-center gap-2 text-sm font-medium text-white">
        <Icon className="h-4 w-4 text-amber-300" />
        {value}
      </p>
    </div>
  );
}
