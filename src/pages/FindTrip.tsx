import * as React from 'react';
import { ArrowRight, Package2, Search, SlidersHorizontal } from 'lucide-react';
import { motion } from 'motion/react';
import { useSearchParams } from 'react-router-dom';

import Button from '@/components/ui/Button';
import Card from '@/components/ui/Card';
import EmptyState from '@/components/ui/EmptyState';
import ErrorBanner from '@/components/ui/ErrorBanner';
import PageLoader from '@/components/ui/PageLoader';
import StatusBadge from '@/components/ui/StatusBadge';
import { CITIES } from '@/constants';
import { useAuth } from '@/context/AuthContext';
import { useDocumentMeta } from '@/hooks/useDocumentMeta';
import { formatCurrency, formatDate } from '@/lib/format';
import { acceptParcelRequest, getParcels } from '@/services/mockApi';
import type { Parcel } from '@/types';

function getStatusTone(status: Parcel['status']) {
  if (status === 'delivered') {
    return 'success' as const;
  }

  if (status === 'in_transit' || status === 'matched') {
    return 'warning' as const;
  }

  return 'muted' as const;
}

export default function FindTrip() {
  const [searchParams] = useSearchParams();
  const { session } = useAuth();
  const [parcels, setParcels] = React.useState<Parcel[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState('');
  const [acceptMessage, setAcceptMessage] = React.useState('');
  const [acceptError, setAcceptError] = React.useState('');
  const [acceptingParcelId, setAcceptingParcelId] = React.useState('');
  const [fromCity, setFromCity] = React.useState(searchParams.get('from') ?? '');
  const [toCity, setToCity] = React.useState(searchParams.get('to') ?? '');
  const [query, setQuery] = React.useState('');
  const [maxWeight, setMaxWeight] = React.useState('15');
  const [selectedParcelId, setSelectedParcelId] = React.useState('');
  const deferredQuery = React.useDeferredValue(query);

  useDocumentMeta(
    'Find parcels to carry',
    'Browse parcel requests by city pair, reward, and weight capacity, then accept the ones that match your route.',
  );

  React.useEffect(() => {
    let active = true;

    async function loadParcels() {
      try {
        setLoading(true);
        const nextParcels = await getParcels();
        if (active) {
          setParcels(nextParcels.filter((item) => item.status !== 'delivered'));
        }
      } catch {
        if (active) {
          setError('We could not load parcel requests right now.');
        }
      } finally {
        if (active) {
          setLoading(false);
        }
      }
    }

    void loadParcels();

    return () => {
      active = false;
    };
  }, []);

  const filteredParcels = parcels.filter((parcel) => {
    const matchesFromCity = !fromCity || parcel.fromCity === fromCity;
    const matchesToCity = !toCity || parcel.toCity === toCity;
    const matchesQuery =
      !deferredQuery ||
      `${parcel.parcelCategory} ${parcel.description} ${parcel.fromCity} ${parcel.toCity}`
        .toLowerCase()
        .includes(deferredQuery.toLowerCase());
    const matchesWeight = parcel.weight <= Number(maxWeight || 15);

    return matchesFromCity && matchesToCity && matchesQuery && matchesWeight;
  });

  async function handleAccept(parcelId: string) {
    setAcceptMessage('');
    setAcceptError('');
    setAcceptingParcelId(parcelId);

    try {
      const travelerName = session?.user.name ?? 'Current Traveler';
      const nextParcels = await acceptParcelRequest(parcelId, travelerName);
      setParcels(nextParcels.filter((item) => item.status !== 'delivered'));
      setSelectedParcelId(parcelId);
      setAcceptMessage(`You accepted ${parcelId}. The user has been notified that ${travelerName} is assigned.`);
    } catch (submissionError) {
      setAcceptError(submissionError instanceof Error ? submissionError.message : 'Unable to accept this request right now.');
    } finally {
      setAcceptingParcelId('');
    }
  }

  return (
    <div className="px-4 py-12 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-7xl space-y-8">
        <div className="space-y-4">
          <p className="text-sm uppercase tracking-[0.25em] text-amber-200">Traveler marketplace</p>
          <h1 className="text-4xl font-semibold text-white">Find parcel requests that match your route and capacity.</h1>
          <p className="max-w-3xl text-sm leading-7 text-slate-300">
            Filtering now works predictably on the client with empty, loading, and error handling for each state.
          </p>
        </div>

        <div className="grid gap-8 lg:grid-cols-[0.34fr_0.66fr]">
          <Card className="space-y-5">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold text-white">Filters</h2>
              <SlidersHorizontal className="h-4 w-4 text-amber-300" />
            </div>

            <div className="space-y-4">
              <label className="space-y-2 text-sm text-slate-300">
                <span className="block font-medium">Keyword</span>
                <div className="flex items-center gap-3 rounded-2xl border border-white/10 bg-white/5 px-4 py-3">
                  <Search className="h-4 w-4 text-amber-300" />
                  <input
                    value={query}
                    onChange={(event) => setQuery(event.target.value)}
                    placeholder="Search category or route"
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
                <span className="block font-medium">Max weight: {maxWeight} kg</span>
                <input
                  min="1"
                  max="15"
                  step="1"
                  type="range"
                  value={maxWeight}
                  onChange={(event) => setMaxWeight(event.target.value)}
                  className="w-full accent-amber-400"
                />
              </label>
            </div>
          </Card>

          <div className="space-y-5">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <h2 className="text-2xl font-semibold text-white">Open parcel requests</h2>
                <p className="text-sm text-slate-400">{filteredParcels.length} matching requests</p>
              </div>
              {selectedParcelId ? (
                <StatusBadge tone="success">Traveler assigned for {selectedParcelId}</StatusBadge>
              ) : null}
            </div>

            {error ? <ErrorBanner message={error} /> : null}
            {acceptError ? <ErrorBanner message={acceptError} /> : null}
            {acceptMessage ? <StatusBadge tone="success">{acceptMessage}</StatusBadge> : null}
            {loading ? <PageLoader label="Loading parcel marketplace" /> : null}

            {!loading && filteredParcels.length === 0 ? (
              <EmptyState
                icon={Package2}
                title="No parcel requests match these filters"
                description="Adjust the city pair or weight slider to reveal more route opportunities."
              />
            ) : null}

            <div className="grid gap-5">
              {filteredParcels.map((parcel, index) => (
                <motion.div
                  key={parcel.id}
                  initial={{ opacity: 0, y: 16 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.04 }}
                >
                  <Card className="space-y-5">
                    <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                      <div className="space-y-3">
                        <div className="flex flex-wrap items-center gap-3">
                          <StatusBadge tone={getStatusTone(parcel.status)}>{parcel.status.replace('_', ' ')}</StatusBadge>
                          <span className="text-xs uppercase tracking-[0.2em] text-slate-500">Request ID {parcel.id}</span>
                        </div>
                        <h3 className="text-2xl font-semibold text-white">{parcel.parcelCategory}</h3>
                        <p className="text-sm leading-7 text-slate-300">{parcel.description}</p>
                      </div>

                      <div className="rounded-2xl border border-amber-400/20 bg-amber-500/10 px-4 py-3 text-right">
                        <p className="text-xs uppercase tracking-[0.2em] text-amber-100">Reward</p>
                        <p className="mt-1 text-2xl font-semibold text-white">{formatCurrency(parcel.reward)}</p>
                      </div>
                    </div>

                    <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
                      <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
                        <p className="text-xs uppercase tracking-[0.2em] text-slate-500">Route</p>
                        <p className="mt-2 text-sm font-medium text-white">
                          {parcel.fromCity} -&gt; {parcel.toCity}
                        </p>
                      </div>
                      <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
                        <p className="text-xs uppercase tracking-[0.2em] text-slate-500">Weight</p>
                        <p className="mt-2 text-sm font-medium text-white">{parcel.weight} kg</p>
                      </div>
                        <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
                          <p className="text-xs uppercase tracking-[0.2em] text-slate-500">Pickup date</p>
                          <p className="mt-2 text-sm font-medium text-white">{formatDate(parcel.pickupDate)}</p>
                        </div>
                        <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
                          <p className="text-xs uppercase tracking-[0.2em] text-slate-500">Size</p>
                          <p className="mt-2 text-sm font-medium text-white">{parcel.dimensions}</p>
                        </div>
                      </div>

                      <div className="flex flex-col gap-3 sm:flex-row sm:justify-end">
                        <Button variant="secondary">View details</Button>
                        {parcel.status === 'posted' ? (
                          <Button onClick={() => void handleAccept(parcel.id)} disabled={acceptingParcelId === parcel.id}>
                            {acceptingParcelId === parcel.id ? 'Accepting...' : 'Accept request'}
                            <ArrowRight className="h-4 w-4" />
                          </Button>
                        ) : (
                          <Button variant="secondary" onClick={() => setSelectedParcelId(parcel.id)}>
                            Assigned to {parcel.travelerName ?? 'traveler'}
                          </Button>
                        )}
                      </div>
                    </Card>
                  </motion.div>
                ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
