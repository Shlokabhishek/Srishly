import * as React from 'react';
import { ArrowRight, Package2, Search, ShieldCheck, SlidersHorizontal, Star, Truck } from 'lucide-react';
import { motion } from 'motion/react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';

import Button from '@/components/ui/Button';
import Card from '@/components/ui/Card';
import EmptyState from '@/components/ui/EmptyState';
import ErrorBanner from '@/components/ui/ErrorBanner';
import PageLoader from '@/components/ui/PageLoader';
import StatusBadge from '@/components/ui/StatusBadge';
import { CITIES, ROUTES } from '@/constants';
import { useAuth } from '@/context/AuthContext';
import { useMode } from '@/context/ModeContext';
import { useDocumentMeta } from '@/hooks/useDocumentMeta';
import { formatCurrency, formatDate, maskPhone } from '@/lib/format';
import { getOrderTimeline, getParcelStatusLabel, getParcelStatusTone, getVerificationLabel, isViewerVerified } from '@/lib/orderFlow';
import { acceptParcelRequest, getParcels, updateParcelStatus } from '@/services/mockApi';
import type { Parcel } from '@/types';

export default function FindTrip() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { session } = useAuth();
  const { mode, setMode } = useMode();
  const [parcels, setParcels] = React.useState<Parcel[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState('');
  const [acceptMessage, setAcceptMessage] = React.useState('');
  const [acceptError, setAcceptError] = React.useState('');
  const [actingParcelId, setActingParcelId] = React.useState('');
  const [fromCity, setFromCity] = React.useState(searchParams.get('from') ?? '');
  const [toCity, setToCity] = React.useState(searchParams.get('to') ?? '');
  const [query, setQuery] = React.useState('');
  const [maxWeight, setMaxWeight] = React.useState('15');
  const [handoffDrafts, setHandoffDrafts] = React.useState<Record<string, { pickupPoint: string; dropPoint: string }>>({});
  const deferredQuery = React.useDeferredValue(query);
  const viewerVerified = isViewerVerified(session);

  const loadParcels = React.useCallback(async () => {
    try {
      setError('');
      setLoading(true);
      const nextParcels = await getParcels();
      setParcels(nextParcels.filter((item) => item.status !== 'delivered'));
    } catch {
      setError('We could not load parcel requests right now.');
    } finally {
      setLoading(false);
    }
  }, []);

  useDocumentMeta(
    'Find parcels to carry',
    'Browse parcel requests by city pair, reward, and weight capacity, then move accepted requests into pickup and transit workflows.',
  );

  React.useEffect(() => {
    void loadParcels();
  }, [loadParcels]);

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

  if (mode !== 'traveler') {
    return (
      <div className="px-4 py-10 sm:px-6 lg:px-8 lg:py-12">
        <div className="mx-auto max-w-3xl">
          <Card highlighted className="space-y-5">
            <p className="text-sm uppercase tracking-[0.25em] text-amber-200">Traveler mode only</p>
            <h1 className="text-3xl font-semibold text-white">Switch to Traveler mode to find parcels to carry.</h1>
            <p className="text-sm leading-7 text-slate-300">
              Browsing parcel requests belongs to the traveler flow. User mode is reserved for posting and tracking your own parcels.
            </p>
            <div className="flex flex-col gap-3 sm:flex-row">
              <Button onClick={() => setMode('traveler')}>Switch to Traveler mode</Button>
              <Button variant="secondary" onClick={() => navigate(ROUTES.dashboard)}>
                Open traveler dashboard
              </Button>
            </div>
          </Card>
        </div>
      </div>
    );
  }

  async function handleAccept(parcelId: string) {
    setAcceptMessage('');
    setAcceptError('');

    if (!session) {
      setAcceptError('Sign in as a traveler before accepting a parcel request.');
      return;
    }

    if (!viewerVerified) {
      setAcceptError('Complete account verification before accepting a parcel request.');
      return;
    }

    const handoffDraft = handoffDrafts[parcelId] ?? { pickupPoint: '', dropPoint: '' };
    if (handoffDraft.pickupPoint.trim().length < 8 || handoffDraft.dropPoint.trim().length < 8) {
      setAcceptError('Choose both pickup and drop points before accepting the request.');
      return;
    }

    setActingParcelId(parcelId);

    try {
      const travelerName = session.user.name;
      const updatedParcel = await acceptParcelRequest(parcelId, travelerName, handoffDraft.pickupPoint, handoffDraft.dropPoint);
      setParcels((current) => current.map((parcel) => (parcel.id === updatedParcel.id ? updatedParcel : parcel)));
      setAcceptMessage(`You accepted ${parcelId}. Sender and traveler notifications are now active.`);
    } catch (submissionError) {
      setAcceptError(submissionError instanceof Error ? submissionError.message : 'Unable to accept this request right now.');
    } finally {
      setActingParcelId('');
    }
  }

  async function handleStatusAdvance(parcel: Parcel, nextStatus: Extract<Parcel['status'], 'picked' | 'in_transit'>) {
    setAcceptMessage('');
    setAcceptError('');
    setActingParcelId(parcel.id);

    try {
      const nextParcels = await updateParcelStatus(parcel.id, nextStatus);
      setParcels(nextParcels.filter((item) => item.status !== 'delivered'));
      setAcceptMessage(
        nextStatus === 'picked'
          ? `Pickup confirmed for ${parcel.id}. OTP is now visible to sender, traveler, and receiver.`
          : `Live transit tracking started for ${parcel.id}.`,
      );
    } catch (submissionError) {
      setAcceptError(submissionError instanceof Error ? submissionError.message : 'Unable to update this order.');
    } finally {
      setActingParcelId('');
    }
  }

  return (
    <div className="px-4 py-10 sm:px-6 lg:px-8 lg:py-12">
      <div className="mx-auto max-w-7xl space-y-8">
        <div className="space-y-4">
          <p className="text-sm uppercase tracking-[0.25em] text-amber-200">Traveler marketplace</p>
          <h1 className="text-4xl font-semibold text-white">Accept route-matching requests and move them into delivery operations.</h1>
          <p className="max-w-3xl text-sm leading-7 text-slate-300">
            Open requests become active orders after acceptance, pickup generates the OTP, and transit starts live tracking.
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

            <Card className="border-white/10 bg-slate-950/40">
              <div className="flex items-center gap-3">
                <ShieldCheck className="h-5 w-5 text-amber-300" />
                <div>
                  <p className="text-sm font-semibold text-white">{viewerVerified ? 'Traveler verified' : 'Verification required'}</p>
                  <p className="text-sm text-slate-400">
                    {viewerVerified
                      ? 'You can accept requests and manage active delivery stages.'
                      : 'Login plus verification is required before you can accept a parcel.'}
                  </p>
                </div>
              </div>
            </Card>
          </Card>

          <div className="space-y-5">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <h2 className="text-2xl font-semibold text-white">Active parcel flow</h2>
                <p className="text-sm text-slate-400">{filteredParcels.length} matching requests</p>
              </div>
              <StatusBadge tone="warning">{filteredParcels.filter((parcel) => parcel.status === 'requested').length} open requests</StatusBadge>
            </div>

            {error ? (
              <div className="space-y-3">
                <ErrorBanner message={error} />
                <Button variant="secondary" onClick={() => void loadParcels()}>
                  Retry loading requests
                </Button>
              </div>
            ) : null}
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
                          <StatusBadge tone={getParcelStatusTone(parcel.status)}>{getParcelStatusLabel(parcel.status)}</StatusBadge>
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
                      <MetricPanel label="Route" value={`${parcel.fromCity} -> ${parcel.toCity}`} />
                      <MetricPanel label="Weight" value={`${parcel.weight} kg`} />
                      <MetricPanel label="Pickup date" value={formatDate(parcel.pickupDate)} />
                      <MetricPanel label="Pickup point" value={parcel.pickupLocation} />
                    </div>

                    <div className="grid gap-5 xl:grid-cols-[0.58fr_0.42fr]">
                      <Card className="border-white/10 bg-white/5">
                        <p className="text-xs uppercase tracking-[0.2em] text-slate-500">Delivery status timeline</p>
                        <div className="mt-4 grid gap-3 sm:grid-cols-5">
                          {getOrderTimeline(parcel).map((stage) => (
                            <div key={stage.key} className="rounded-2xl border border-white/10 bg-slate-950/40 p-3">
                              <p className="text-sm font-semibold text-white">{stage.label}</p>
                              <p className="mt-2 text-xs uppercase tracking-[0.2em] text-slate-500">{stage.state}</p>
                            </div>
                          ))}
                        </div>
                      </Card>

                      <Card className="border-white/10 bg-white/5">
                        <p className="text-xs uppercase tracking-[0.2em] text-slate-500">Receiver details</p>
                        <div className="mt-4 space-y-2 text-sm text-slate-300">
                          <p><span className="text-slate-500">Name:</span> {parcel.receiverName}</p>
                          <p><span className="text-slate-500">Phone:</span> {viewerVerified ? parcel.receiverPhone : maskPhone(parcel.receiverPhone)}</p>
                          <p><span className="text-slate-500">Address:</span> {parcel.receiverAddress}</p>
                          <p><span className="text-slate-500">OTP:</span> {parcel.otpCode ?? 'Generated after pickup'}</p>
                        </div>
                      </Card>
                    </div>

                    {parcel.travelerName ? (
                      <div className="grid gap-4 md:grid-cols-2">
                        <Card className="border-white/10 bg-white/5">
                          <p className="text-xs uppercase tracking-[0.2em] text-slate-500">Active traveler</p>
                          <div className="mt-4 space-y-2 text-sm text-slate-300">
                            <p><span className="text-slate-500">Name:</span> {parcel.travelerName}</p>
                            <p><span className="text-slate-500">Verification:</span> {parcel.travelerVerificationStatus ? getVerificationLabel(parcel.travelerVerificationStatus) : 'Pending'}</p>
                            <p><span className="text-slate-500">Rating:</span> {parcel.travelerRating ? `${parcel.travelerRating.toFixed(1)}/5` : 'Not rated yet'}</p>
                          </div>
                        </Card>

                        <Card className="border-white/10 bg-white/5">
                          <p className="text-xs uppercase tracking-[0.2em] text-slate-500">Workflow actions</p>
                          <div className="mt-4 flex flex-col gap-3">
                            {parcel.status === 'accepted' ? (
                              <Button onClick={() => void handleStatusAdvance(parcel, 'picked')} disabled={actingParcelId === parcel.id}>
                                {actingParcelId === parcel.id ? 'Updating...' : 'Mark picked up + generate OTP'}
                              </Button>
                            ) : null}
                            {parcel.status === 'picked' ? (
                              <Button onClick={() => void handleStatusAdvance(parcel, 'in_transit')} disabled={actingParcelId === parcel.id}>
                                {actingParcelId === parcel.id ? 'Updating...' : 'Start transit tracking'}
                              </Button>
                            ) : null}
                            {parcel.status === 'in_transit' ? (
                              <Link
                                className="inline-flex items-center justify-center rounded-2xl border border-white/10 bg-white/5 px-5 py-3 text-sm font-semibold text-white transition hover:bg-white/10"
                                to={ROUTES.dashboard}
                              >
                                Open order dashboard
                              </Link>
                            ) : null}
                          </div>
                        </Card>
                      </div>
                    ) : null}

                    {parcel.status === 'requested' ? (
                      <div className="grid gap-4 md:grid-cols-2">
                        <label className="space-y-2 text-sm text-slate-300">
                          <span className="block font-medium">Traveler pickup point</span>
                          <input
                            value={handoffDrafts[parcel.id]?.pickupPoint ?? ''}
                            onChange={(event) =>
                              setHandoffDrafts((current) => ({
                                ...current,
                                [parcel.id]: {
                                  pickupPoint: event.target.value,
                                  dropPoint: current[parcel.id]?.dropPoint ?? '',
                                },
                              }))
                            }
                            placeholder="Example: Metro Gate 2, Delhi at 7:30 PM"
                            className="w-full rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-white outline-none"
                          />
                        </label>

                        <label className="space-y-2 text-sm text-slate-300">
                          <span className="block font-medium">Traveler drop point</span>
                          <input
                            value={handoffDrafts[parcel.id]?.dropPoint ?? ''}
                            onChange={(event) =>
                              setHandoffDrafts((current) => ({
                                ...current,
                                [parcel.id]: {
                                  pickupPoint: current[parcel.id]?.pickupPoint ?? '',
                                  dropPoint: event.target.value,
                                },
                              }))
                            }
                            placeholder="Example: Station exit gate, Mumbai"
                            className="w-full rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-white outline-none"
                          />
                        </label>
                      </div>
                    ) : null}

                    <div className="flex flex-col gap-3 sm:flex-row sm:justify-end">
                      <Button variant="secondary">View details</Button>
                      {parcel.status === 'requested' ? (
                        <Button onClick={() => void handleAccept(parcel.id)} disabled={actingParcelId === parcel.id}>
                          {actingParcelId === parcel.id ? 'Accepting...' : session ? 'Accept request' : 'Sign in to accept'}
                          <ArrowRight className="h-4 w-4" />
                        </Button>
                      ) : (
                        <Button variant="secondary">
                          <Truck className="h-4 w-4" />
                          Active order
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

function MetricPanel({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
      <p className="text-xs uppercase tracking-[0.2em] text-slate-500">{label}</p>
      <p className="mt-2 text-sm font-medium text-white">{value}</p>
    </div>
  );
}
