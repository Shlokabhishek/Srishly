import * as React from 'react';
import {
  Bell,
  CheckCircle2,
  CircleDollarSign,
  LocateFixed,
  MessageSquareText,
  Package2,
  Repeat2,
  Route,
  ShieldCheck,
  TriangleAlert,
  Truck,
  Users2,
} from 'lucide-react';
import { motion } from 'motion/react';
import { Link, useSearchParams } from 'react-router-dom';

import ShipmentMap from '@/components/ShipmentMap';
import Button from '@/components/ui/Button';
import Card from '@/components/ui/Card';
import EmptyState from '@/components/ui/EmptyState';
import ErrorBanner from '@/components/ui/ErrorBanner';
import PageLoader from '@/components/ui/PageLoader';
import StatusBadge from '@/components/ui/StatusBadge';
import { ROUTES } from '@/constants';
import { useAuth } from '@/context/AuthContext';
import { useMode } from '@/context/ModeContext';
import { seedDeliveryThreads } from '@/data/mockData';
import { useDocumentMeta } from '@/hooks/useDocumentMeta';
import { formatCurrency, formatDate, formatDateTime } from '@/lib/format';
import { completeParcelDelivery, getDashboardSnapshot } from '@/services/mockApi';
import type { AssignmentNotification, DeliveryChatMessage, DeliveryThread, Parcel, Trip, VerificationCase } from '@/types';

function getParcelTone(status: Parcel['status']) {
  if (status === 'delivered') {
    return 'success' as const;
  }

  if (status === 'in_transit' || status === 'matched') {
    return 'warning' as const;
  }

  return 'muted' as const;
}

function getCheckpointTone(status: DeliveryThread['checkpoints'][number]['status']) {
  if (status === 'completed') {
    return 'success' as const;
  }

  if (status === 'active') {
    return 'warning' as const;
  }

  return 'muted' as const;
}

export default function Dashboard() {
  const { mode, setMode } = useMode();
  const { session } = useAuth();
  const [searchParams] = useSearchParams();
  const [parcels, setParcels] = React.useState<Parcel[]>([]);
  const [trips, setTrips] = React.useState<Trip[]>([]);
  const [verificationCases, setVerificationCases] = React.useState<VerificationCase[]>([]);
  const [assignmentNotifications, setAssignmentNotifications] = React.useState<AssignmentNotification[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState('');
  const [actionMessage, setActionMessage] = React.useState('');
  const [actionError, setActionError] = React.useState('');
  const [otpValues, setOtpValues] = React.useState<Record<string, string>>({});
  const [activeTripId, setActiveTripId] = React.useState('trip-001');
  const [selectedThreadId, setSelectedThreadId] = React.useState(seedDeliveryThreads[0]?.id ?? '');
  const [routeQuery, setRouteQuery] = React.useState('');
  const deferredRouteQuery = React.useDeferredValue(routeQuery);

  useDocumentMeta(
    'Dashboard',
    'Review parcel requests, assignment notifications, secure handoff chat, and traveler routing from one dashboard.',
  );

  React.useEffect(() => {
    let active = true;

    async function loadDashboard() {
      try {
        setLoading(true);
        const snapshot = await getDashboardSnapshot();
        if (active) {
          setParcels(snapshot.parcels);
          setTrips(snapshot.trips);
          setVerificationCases(snapshot.verificationCases);
          setAssignmentNotifications(snapshot.assignmentNotifications);
          setActiveTripId(snapshot.trips[0]?.id ?? 'trip-001');
        }
      } catch {
        if (active) {
          setError('We could not load dashboard data right now.');
        }
      } finally {
        if (active) {
          setLoading(false);
        }
      }
    }

    void loadDashboard();

    return () => {
      active = false;
    };
  }, []);

  const createdId = searchParams.get('created');
  const visibleTrips = trips.filter((trip) =>
    !deferredRouteQuery
      ? true
      : `${trip.travelerName} ${trip.fromCity} ${trip.toCity}`.toLowerCase().includes(deferredRouteQuery.toLowerCase()),
  );
  const activeThread = seedDeliveryThreads.find((thread) => thread.id === selectedThreadId) ?? seedDeliveryThreads[0];
  const activeMapRouteId = mode === 'sender' ? activeThread?.routeId ?? activeTripId : activeTripId;
  const latestNotification = assignmentNotifications[0];

  async function handleComplete(parcelId: string) {
    setActionMessage('');
    setActionError('');

    try {
      const nextParcels = await completeParcelDelivery(parcelId, otpValues[parcelId] ?? '');
      setParcels(nextParcels);
      setActionMessage(`Parcel ${parcelId} marked as delivered.`);
    } catch (submissionError) {
      setActionError(submissionError instanceof Error ? submissionError.message : 'Unable to complete delivery.');
    }
  }

  function openThread(thread: DeliveryThread) {
    setSelectedThreadId(thread.id);
  }

  const activeDeliveries = parcels.filter((parcel) => parcel.status !== 'delivered').length;
  const completedDeliveries = parcels.filter((parcel) => parcel.status === 'delivered').length;
  const pendingReviews = verificationCases.filter((item) => item.status === 'pending').length;
  const averageReward = parcels.length
    ? formatCurrency(Math.round(parcels.reduce((sum, parcel) => sum + parcel.reward, 0) / parcels.length))
    : formatCurrency(0);

  return (
    <div className="px-4 py-12 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-7xl space-y-8">
        <div className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
          <div className="space-y-4">
            <p className="text-sm uppercase tracking-[0.25em] text-amber-200">Operations dashboard</p>
            <h1 className="text-4xl font-semibold text-white">Request, assign, coordinate, and deliver from one place.</h1>
            <p className="max-w-3xl text-sm leading-7 text-slate-300">
              Users post parcel details with route, kg, size, and reward. Travelers accept only if they are already going
              that way, and the sender gets an assignment notification plus a secure coordination thread.
            </p>
            {session ? (
              <p className="text-sm text-slate-400">
                Signed in as {session.user.name} with {session.user.email}. Phone: {session.user.phone}
              </p>
            ) : null}
          </div>

          <div className="inline-flex rounded-full border border-white/10 bg-white/5 p-1">
            <button
              type="button"
              onClick={() => setMode('sender')}
              className={`rounded-full px-5 py-2 text-sm font-semibold transition ${mode === 'sender' ? 'bg-amber-500 text-slate-950' : 'text-slate-300'}`}
            >
              User mode
            </button>
            <button
              type="button"
              onClick={() => setMode('traveler')}
              className={`rounded-full px-5 py-2 text-sm font-semibold transition ${mode === 'traveler' ? 'bg-amber-500 text-slate-950' : 'text-slate-300'}`}
            >
              Traveler mode
            </button>
          </div>
        </div>

        <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-4">
          <MetricCard icon={Package2} label="Active deliveries" value={String(activeDeliveries)} />
          <MetricCard icon={CheckCircle2} label="Completed deliveries" value={String(completedDeliveries)} />
          <MetricCard icon={Users2} label="Active routes" value={String(trips.length)} />
          <MetricCard icon={ShieldCheck} label="Pending reviews" value={String(pendingReviews)} />
        </div>

        {createdId ? <StatusBadge tone="success">Parcel request {createdId} created successfully.</StatusBadge> : null}
        {latestNotification ? <StatusBadge tone="success">{latestNotification.message}</StatusBadge> : null}
        {actionMessage ? <StatusBadge tone="success">{actionMessage}</StatusBadge> : null}
        {actionError ? <ErrorBanner message={actionError} /> : null}
        {error ? <ErrorBanner message={error} /> : null}
        {loading ? <PageLoader label="Loading dashboard" /> : null}

        {!loading ? (
          <div className="grid gap-8 lg:grid-cols-[0.67fr_0.33fr]">
            <div className="space-y-6">
              <ShipmentMap
                activeRouteId={activeMapRouteId}
                currentLocation={mode === 'sender' ? activeThread?.currentLocation : undefined}
                progress={mode === 'sender' ? activeThread?.progress : undefined}
                lastUpdated={mode === 'sender' ? activeThread?.lastUpdated : undefined}
              />

              <Card className="space-y-6">
                <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
                  <div>
                    <div className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-4 py-2 text-xs uppercase tracking-[0.2em] text-slate-300">
                      <MessageSquareText className="h-4 w-4 text-amber-300" />
                      Secure coordination
                    </div>
                    <h2 className="mt-4 text-2xl font-semibold text-white">Chat, security tag, pickup point, and drop point.</h2>
                    <p className="mt-2 max-w-3xl text-sm leading-7 text-slate-400">
                      Travelers share pickup and drop details in chat after the security-group tag is matched, and the live map
                      keeps the user aware of the parcel location during transfer.
                    </p>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {seedDeliveryThreads.map((thread) => (
                      <button
                        key={thread.id}
                        type="button"
                        onClick={() => openThread(thread)}
                        className={`rounded-full border px-4 py-2 text-sm font-medium transition ${
                          selectedThreadId === thread.id
                            ? 'border-amber-400/30 bg-amber-500/10 text-white'
                            : 'border-white/10 bg-white/5 text-slate-300'
                        }`}
                      >
                        {thread.parcelId}
                      </button>
                    ))}
                  </div>
                </div>

                {activeThread ? (
                  <>
                    <div className="grid gap-4 md:grid-cols-3">
                      <InfoPanel
                        icon={ShieldCheck}
                        label="Security group tag"
                        value={activeThread.securityGroupTag}
                        description="Both user and traveler verify this tag before handoff."
                      />
                      <InfoPanel
                        icon={LocateFixed}
                        label="Pickup point"
                        value={activeThread.pickupSummary}
                        description="Traveler shares the exact pickup plan in chat."
                      />
                      <InfoPanel
                        icon={Route}
                        label="Drop point"
                        value={activeThread.dropoffSummary}
                        description="Final handoff stays inside the same secure thread."
                      />
                    </div>

                    <div className="grid gap-6 xl:grid-cols-[0.62fr_0.38fr]">
                      <div className="space-y-3">
                        {activeThread.chat.map((message) => (
                          <ChatBubble key={message.id} message={message} />
                        ))}
                      </div>

                      <div className="space-y-4">
                        <div className="rounded-[1.75rem] border border-white/10 bg-white/5 p-5">
                          <div className="flex items-center gap-2">
                            <Bell className="h-4 w-4 text-amber-300" />
                            <h3 className="text-lg font-semibold text-white">Tracking checkpoints</h3>
                          </div>
                          <div className="mt-4 space-y-3">
                            {activeThread.checkpoints.map((checkpoint) => (
                              <div key={checkpoint.id} className="rounded-2xl border border-white/10 bg-slate-950/40 p-4">
                                <div className="flex items-center justify-between gap-3">
                                  <p className="font-medium text-white">{checkpoint.label}</p>
                                  <StatusBadge tone={getCheckpointTone(checkpoint.status)}>{checkpoint.status}</StatusBadge>
                                </div>
                                <p className="mt-2 text-sm text-slate-300">{checkpoint.location}</p>
                                <p className="mt-1 text-xs uppercase tracking-[0.2em] text-slate-500">{checkpoint.etaLabel}</p>
                              </div>
                            ))}
                          </div>
                        </div>

                        <div className="rounded-[1.75rem] border border-amber-400/20 bg-amber-500/10 p-5">
                          <div className="flex items-center gap-2">
                            <TriangleAlert className="h-4 w-4 text-amber-200" />
                            <h3 className="text-lg font-semibold text-white">Responsibility</h3>
                          </div>
                          <p className="mt-3 text-sm leading-7 text-slate-100">{activeThread.responsibilitySummary}</p>
                          <p className="mt-3 text-xs uppercase tracking-[0.2em] text-amber-100">
                            {activeThread.isHighValue ? 'High-value protocol active' : 'Standard sealed handoff'}
                          </p>
                        </div>
                      </div>
                    </div>
                  </>
                ) : (
                  <EmptyState
                    icon={MessageSquareText}
                    title="No active coordination thread"
                    description="A secure chat appears here once a traveler is assigned to a request."
                  />
                )}
              </Card>

              {mode === 'sender' ? (
                <Card className="space-y-5">
                  <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
                    <div>
                      <h2 className="text-2xl font-semibold text-white">User requests</h2>
                      <p className="text-sm text-slate-400">
                        Post a request with route, kg, size, and reward. Once a traveler accepts, you get notified here.
                      </p>
                    </div>
                    <Link
                      to={ROUTES.sendParcel}
                      className="inline-flex items-center justify-center rounded-2xl bg-amber-500 px-5 py-3 text-sm font-semibold text-slate-950 transition hover:bg-amber-400"
                    >
                      New request
                    </Link>
                  </div>

                  {parcels.length === 0 ? (
                    <EmptyState
                      icon={Package2}
                      title="No parcel requests yet"
                      description="Create a delivery request to begin matching with route-ready travelers."
                    />
                  ) : (
                    <div className="space-y-4">
                      {parcels.map((parcel) => {
                        const parcelThread = seedDeliveryThreads.find((thread) => thread.parcelId === parcel.id);

                        return (
                          <div key={parcel.id} className="rounded-[1.75rem] border border-white/10 bg-white/5 p-5">
                            <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                              <div className="space-y-3">
                                <div className="flex flex-wrap items-center gap-3">
                                  <h3 className="text-xl font-semibold text-white">{parcel.parcelCategory}</h3>
                                  <StatusBadge tone={getParcelTone(parcel.status)}>{parcel.status.replace('_', ' ')}</StatusBadge>
                                </div>
                                <p className="text-sm text-slate-300">
                                  {parcel.fromCity} -&gt; {parcel.toCity} on {formatDate(parcel.pickupDate)}
                                </p>
                                <p className="text-sm text-slate-400">
                                  Weight {parcel.weight} kg. Size {parcel.dimensions}. Reward {formatCurrency(parcel.reward)}.
                                </p>
                                <p className="text-sm text-slate-400">
                                  {parcel.travelerName
                                    ? `Assigned traveler ${parcel.travelerName}.`
                                    : 'Waiting for a traveler who is already going on the same route.'}
                                </p>
                                {parcelThread ? (
                                  <p className="text-xs uppercase tracking-[0.2em] text-amber-100">
                                    Security tag {parcelThread.securityGroupTag}
                                  </p>
                                ) : null}
                              </div>

                              <div className="space-y-3 text-right">
                                <div>
                                  <p className="text-xs uppercase tracking-[0.2em] text-slate-500">Delivery code</p>
                                  <p className="mt-1 text-lg font-semibold text-white">{parcel.otpCode ?? 'Pending'}</p>
                                </div>
                                {parcelThread ? (
                                  <Button variant="secondary" onClick={() => openThread(parcelThread)}>
                                    Open secure chat
                                  </Button>
                                ) : null}
                              </div>
                            </div>

                            {parcel.status === 'in_transit' ? (
                              <div className="mt-5 flex flex-col gap-3 rounded-2xl border border-amber-400/20 bg-amber-500/10 p-4 sm:flex-row sm:items-center">
                                <input
                                  maxLength={4}
                                  value={otpValues[parcel.id] ?? ''}
                                  onChange={(event) =>
                                    setOtpValues((current) => ({
                                      ...current,
                                      [parcel.id]: event.target.value.replace(/\D/g, ''),
                                    }))
                                  }
                                  placeholder="Enter 4-digit code"
                                  className="w-full rounded-2xl border border-white/10 bg-slate-950/60 px-4 py-3 text-white outline-none sm:max-w-[220px]"
                                />
                                <Button onClick={() => void handleComplete(parcel.id)}>Complete delivery</Button>
                              </div>
                            ) : null}
                          </div>
                        );
                      })}
                    </div>
                  )}
                </Card>
              ) : (
                <Card className="space-y-5">
                  <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
                    <div>
                      <h2 className="text-2xl font-semibold text-white">Traveler opportunities</h2>
                      <p className="text-sm text-slate-400">
                        Keep an eye on routes you already travel, then open parcel requests and accept the ones that fit.
                      </p>
                    </div>
                    <div className="flex flex-wrap gap-3">
                      <div className="flex items-center gap-3 rounded-2xl border border-white/10 bg-white/5 px-4 py-3">
                        <Route className="h-4 w-4 text-amber-300" />
                        <input
                          value={routeQuery}
                          onChange={(event) => setRouteQuery(event.target.value)}
                          placeholder="Search route or traveler"
                          className="bg-transparent text-sm text-white outline-none"
                        />
                      </div>
                      <Link
                        to={ROUTES.findTrip}
                        className="inline-flex items-center justify-center rounded-2xl bg-amber-500 px-5 py-3 text-sm font-semibold text-slate-950 transition hover:bg-amber-400"
                      >
                        Open parcel requests
                      </Link>
                    </div>
                  </div>

                  {visibleTrips.length === 0 ? (
                    <EmptyState
                      icon={Truck}
                      title="No trips match this route search"
                      description="Try a broader search term or switch back to user mode to manage parcel requests."
                    />
                  ) : (
                    <div className="space-y-4">
                      {visibleTrips.map((trip, index) => (
                        <motion.div
                          key={trip.id}
                          initial={{ opacity: 0, y: 16 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ delay: index * 0.04 }}
                        >
                          <div
                            className={`rounded-[1.75rem] border p-5 transition ${
                              activeTripId === trip.id ? 'border-amber-400/30 bg-amber-500/10' : 'border-white/10 bg-white/5'
                            }`}
                          >
                            <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
                              <div className="space-y-3">
                                <div className="flex flex-wrap items-center gap-3">
                                  <h3 className="text-xl font-semibold text-white">{trip.travelerName}</h3>
                                  {trip.isVerified ? <StatusBadge tone="success">Verified</StatusBadge> : <StatusBadge>Pending review</StatusBadge>}
                                </div>
                                <p className="text-sm text-slate-300">
                                  {trip.fromCity} -&gt; {trip.toCity} on {formatDate(trip.date)} by {trip.mode}
                                </p>
                                <p className="text-sm text-slate-400">
                                  Trust score {trip.trustScore}. Capacity {trip.availableSpace} kg.
                                </p>
                              </div>
                              <Button variant={activeTripId === trip.id ? 'primary' : 'secondary'} onClick={() => setActiveTripId(trip.id)}>
                                Focus map route
                              </Button>
                            </div>
                          </div>
                        </motion.div>
                      ))}
                    </div>
                  )}
                </Card>
              )}
            </div>

            <div className="space-y-6">
              <Card highlighted>
                <div className="flex items-center gap-3">
                  <CircleDollarSign className="h-5 w-5 text-amber-300" />
                  <h2 className="text-xl font-semibold text-white">{mode === 'sender' ? 'User summary' : 'Traveler summary'}</h2>
                </div>
                <div className="mt-5 space-y-4 text-sm leading-7 text-slate-300">
                  {mode === 'sender' ? (
                    <>
                      <p>Total requests: {parcels.length}</p>
                      <p>Currently in transit: {parcels.filter((parcel) => parcel.status === 'in_transit').length}</p>
                      <p>Average reward: {averageReward}</p>
                    </>
                  ) : (
                    <>
                      <p>Active route supply: {trips.length}</p>
                      <p>Verified travelers: {trips.filter((trip) => trip.isVerified).length}</p>
                      <p>Open parcel marketplace: {parcels.filter((parcel) => parcel.status === 'posted').length} requests</p>
                    </>
                  )}
                </div>
              </Card>

              <Card>
                <div className="flex items-center gap-3">
                  <Bell className="h-5 w-5 text-amber-300" />
                  <h2 className="text-xl font-semibold text-white">Assignment notifications</h2>
                </div>
                <div className="mt-4 space-y-3">
                  {assignmentNotifications.length > 0 ? (
                    assignmentNotifications.slice(0, 3).map((notification) => (
                      <div key={notification.id} className="rounded-2xl border border-white/10 bg-white/5 p-4 text-sm text-slate-300">
                        <div className="flex items-center justify-between gap-3">
                          <p className="font-medium text-white">{notification.travelerName} assigned</p>
                          <StatusBadge tone="success">Notified</StatusBadge>
                        </div>
                        <p className="mt-2">{notification.message}</p>
                        <p className="mt-2 text-xs uppercase tracking-[0.2em] text-slate-500">
                          {notification.route} • {formatDateTime(notification.createdAt)}
                        </p>
                      </div>
                    ))
                  ) : (
                    <EmptyState
                      icon={Bell}
                      title="No assignment notifications yet"
                      description="When a traveler accepts a route-matching request, the sender is notified here."
                    />
                  )}
                </div>
              </Card>

              <Card>
                <div className="flex items-center gap-3">
                  <Repeat2 className="h-5 w-5 text-amber-300" />
                  <h2 className="text-xl font-semibold text-white">Role switching</h2>
                </div>
                <div className="mt-4 space-y-3 text-sm leading-7 text-slate-300">
                  <p>The same account can switch between user mode and traveler mode without signing out.</p>
                  <p>Use user mode to create parcel requests. Use traveler mode to watch routes and accept requests when you are traveling the same way.</p>
                </div>
              </Card>

              <Card>
                <div className="flex items-center gap-3">
                  <ShieldCheck className="h-5 w-5 text-amber-300" />
                  <h2 className="text-xl font-semibold text-white">Verification queue</h2>
                </div>
                <div className="mt-4 space-y-3">
                  {verificationCases.slice(0, 3).map((item) => (
                    <div key={item.id} className="rounded-2xl border border-white/10 bg-white/5 p-4 text-sm text-slate-300">
                      <div className="flex items-center justify-between gap-3">
                        <p className="font-medium text-white">{item.travelerName}</p>
                        <StatusBadge tone={item.status === 'pending' ? 'warning' : item.status === 'approved' ? 'success' : 'danger'}>
                          {item.status}
                        </StatusBadge>
                      </div>
                      <p className="mt-2 text-slate-400">{item.route}</p>
                    </div>
                  ))}
                  <Link
                    to={ROUTES.verificationHub}
                    className="inline-flex w-full items-center justify-center rounded-2xl border border-white/10 bg-white/5 px-5 py-3 text-sm font-semibold text-white transition hover:bg-white/10"
                  >
                    Open verification hub
                  </Link>
                </div>
              </Card>
            </div>
          </div>
        ) : null}
      </div>
    </div>
  );
}

function MetricCard({
  icon: Icon,
  label,
  value,
}: {
  icon: typeof Package2;
  label: string;
  value: string;
}) {
  return (
    <Card>
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-sm uppercase tracking-[0.2em] text-slate-500">{label}</p>
          <p className="mt-3 text-3xl font-semibold text-white">{value}</p>
        </div>
        <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-amber-500/10 text-amber-200">
          <Icon className="h-5 w-5" />
        </div>
      </div>
    </Card>
  );
}

function InfoPanel({
  icon: Icon,
  label,
  value,
  description,
}: {
  icon: typeof ShieldCheck;
  label: string;
  value: string;
  description: string;
}) {
  return (
    <div className="rounded-[1.75rem] border border-white/10 bg-white/5 p-5">
      <div className="flex items-center gap-2 text-xs uppercase tracking-[0.2em] text-slate-400">
        <Icon className="h-4 w-4 text-amber-300" />
        {label}
      </div>
      <p className="mt-3 text-sm leading-7 text-white">{value}</p>
      <p className="mt-3 text-xs leading-6 text-slate-400">{description}</p>
    </div>
  );
}

function ChatBubble({ message }: { message: DeliveryChatMessage }) {
  const isUser = message.actor === 'user';
  const isSystem = message.actor === 'system';

  return (
    <div className={`flex ${isUser ? 'justify-end' : 'justify-start'}`}>
      <div
        className={`max-w-[90%] rounded-[1.5rem] px-4 py-3 text-sm leading-7 ${
          isSystem
            ? 'border border-emerald-400/20 bg-emerald-500/10 text-emerald-50'
            : isUser
              ? 'bg-amber-500 text-slate-950'
              : 'border border-white/10 bg-white/5 text-slate-100'
        }`}
      >
        <p className="text-xs uppercase tracking-[0.2em] opacity-75">
          {isSystem ? 'System' : isUser ? 'User' : 'Traveler'} • {formatDateTime(message.sentAt)}
        </p>
        <p className="mt-2">{message.text}</p>
      </div>
    </div>
  );
}
