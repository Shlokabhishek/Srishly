import * as React from 'react';
import { Bell, CheckCircle2, MapPinned, MessageSquareText, Package2, ShieldCheck, Truck, Users2 } from 'lucide-react';
import { Link, useSearchParams } from 'react-router-dom';

import ShipmentMap from '@/components/ShipmentMap';
import Button from '@/components/ui/Button';
import Card from '@/components/ui/Card';
import EmptyState from '@/components/ui/EmptyState';
import ErrorBanner from '@/components/ui/ErrorBanner';
import PageLoader from '@/components/ui/PageLoader';
import StatusBadge from '@/components/ui/StatusBadge';
import { ROUTES, TRAVELER_CANCELLATION_FINE } from '@/constants';
import { useAuth } from '@/context/AuthContext';
import { useMode } from '@/context/ModeContext';
import { useDocumentMeta } from '@/hooks/useDocumentMeta';
import { formatCurrency, formatDate, formatDateTime } from '@/lib/format';
import {
  getOrderTimeline,
  getParcelStatusLabel,
  getParcelStatusTone,
  getVerificationLabel,
  getVerificationTone,
  isApprovedVerification,
  isViewerVerified,
} from '@/lib/orderFlow';
import { completeParcelDelivery, cancelParcelAssignment, getDashboardSnapshot, updateParcelStatus } from '@/services/mockApi';
import type { AssignmentNotification, DeliveryChatMessage, DeliveryThread, Parcel, Trip, VerificationCase } from '@/types';

function getCheckpointTone(status: DeliveryThread['checkpoints'][number]['status']) {
  if (status === 'completed') return 'success' as const;
  if (status === 'active') return 'warning' as const;
  return 'muted' as const;
}

export default function Dashboard() {
  const { mode, setMode } = useMode();
  const { session } = useAuth();
  const [searchParams] = useSearchParams();
  const [parcels, setParcels] = React.useState<Parcel[]>([]);
  const [trips, setTrips] = React.useState<Trip[]>([]);
  const [verificationCases, setVerificationCases] = React.useState<VerificationCase[]>([]);
  const [notifications, setNotifications] = React.useState<AssignmentNotification[]>([]);
  const [threads, setThreads] = React.useState<DeliveryThread[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState('');
  const [message, setMessage] = React.useState('');
  const [actionError, setActionError] = React.useState('');
  const [otpValues, setOtpValues] = React.useState<Record<string, string>>({});
  const [selectedThreadId, setSelectedThreadId] = React.useState('');
  const viewerVerified = isViewerVerified(session);

  const loadDashboard = React.useCallback(async () => {
    try {
      setLoading(true);
      setError('');
      const snapshot = await getDashboardSnapshot();
      setParcels(snapshot.parcels);
      setTrips(snapshot.trips);
      setVerificationCases(snapshot.verificationCases);
      setNotifications(snapshot.assignmentNotifications);
      setThreads(snapshot.deliveryThreads);
      setSelectedThreadId((current) => current || snapshot.deliveryThreads[0]?.id || '');
    } catch {
      setError('We could not load dashboard data right now.');
    } finally {
      setLoading(false);
    }
  }, []);

  React.useEffect(() => {
    void loadDashboard();
  }, [loadDashboard]);

  useDocumentMeta(
    'Dashboard',
    'Track live orders, view contacts, and finish delivery with OTP from one dashboard.',
  );

  const activeOrders = parcels.filter((parcel) => parcel.status !== 'delivered');
  const deliveredOrders = parcels.filter((parcel) => parcel.status === 'delivered');
  const travelerOrders = activeOrders.filter((parcel) => (session ? parcel.travelerName === session.user.name : false));
  const activeThread = threads.find((thread) => thread.id === selectedThreadId) ?? threads[0];
  const visibleNotifications = notifications.filter((notification) => (notification.audience ? notification.audience === mode : true));
  const averageReward = parcels.length
    ? formatCurrency(Math.round(parcels.reduce((sum, parcel) => sum + parcel.reward, 0) / parcels.length))
    : formatCurrency(0);

  async function advance(parcelId: string, status: Extract<Parcel['status'], 'picked' | 'in_transit'>) {
    try {
      setActionError('');
      setMessage('');
      await updateParcelStatus(parcelId, status);
      setMessage(status === 'picked' ? `Pickup confirmed for ${parcelId}. OTP generated.` : `Transit started for ${parcelId}.`);
      await loadDashboard();
    } catch (submissionError) {
      setActionError(submissionError instanceof Error ? submissionError.message : 'Unable to update this order.');
    }
  }

  async function complete(parcelId: string) {
    try {
      setActionError('');
      setMessage('');
      await completeParcelDelivery(parcelId, otpValues[parcelId] ?? '');
      setMessage(`Parcel ${parcelId} marked as delivered after OTP verification.`);
      await loadDashboard();
    } catch (submissionError) {
      setActionError(submissionError instanceof Error ? submissionError.message : 'Unable to complete delivery.');
    }
  }

  async function cancel(parcel: Parcel) {
    try {
      setActionError('');
      setMessage('');
      await cancelParcelAssignment(parcel);
      setMessage(`Order ${parcel.id} canceled. Fine Rs ${TRAVELER_CANCELLATION_FINE}.`);
      await loadDashboard();
    } catch (submissionError) {
      setActionError(submissionError instanceof Error ? submissionError.message : 'Unable to cancel this order.');
    }
  }

  return (
    <div className="px-4 py-10 sm:px-6 lg:px-8 lg:py-12">
      <div className="mx-auto max-w-7xl space-y-8">
        <div className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
          <div className="space-y-4">
            <p className="text-sm uppercase tracking-[0.25em] text-amber-200">Operations dashboard</p>
            <h1 className="text-4xl font-semibold text-white">Track orders and finish delivery with OTP.</h1>
            <p className="max-w-3xl text-sm text-slate-300">Live status, contacts, and chat in one place.</p>
            <div className="flex flex-wrap items-center gap-3 text-sm text-slate-400">
              {session ? <span>{session.user.name}</span> : null}
              <StatusBadge tone={viewerVerified ? 'success' : 'warning'}>
                {viewerVerified ? 'Verified access' : 'Verification pending'}
              </StatusBadge>
            </div>
          </div>

          <div className="inline-flex rounded-full border border-white/10 bg-white/5 p-1">
            <button
              type="button"
              onClick={() => setMode('sender')}
              className={`rounded-full px-5 py-2 text-sm font-semibold transition ${mode === 'sender' ? 'bg-amber-500 text-slate-950' : 'text-slate-300'}`}
            >
              Sender
            </button>
            <button
              type="button"
              onClick={() => setMode('traveler')}
              className={`rounded-full px-5 py-2 text-sm font-semibold transition ${mode === 'traveler' ? 'bg-amber-500 text-slate-950' : 'text-slate-300'}`}
            >
              Traveler
            </button>
          </div>
        </div>

        <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-4">
          <Metric icon={Package2} label="Active orders" value={String(activeOrders.length)} />
          <Metric icon={CheckCircle2} label="Delivered" value={String(deliveredOrders.length)} />
          <Metric icon={Users2} label="Verified travelers" value={String(trips.filter((trip) => isApprovedVerification(trip.verificationStatus)).length)} />
          <Metric icon={ShieldCheck} label="Average reward" value={averageReward} />
        </div>

        {searchParams.get('created') ? <StatusBadge tone="success">Parcel request created successfully.</StatusBadge> : null}
        {message ? <StatusBadge tone="success">{message}</StatusBadge> : null}
        {actionError ? <ErrorBanner message={actionError} /> : null}
        {error ? <ErrorBanner message={error} /> : null}
        {loading ? <PageLoader label="Loading dashboard" /> : null}

        {!loading ? (
          <div className="grid gap-8 lg:grid-cols-[0.68fr_0.32fr]">
            <div className="space-y-6">
              <ShipmentMap
                activeRouteId={activeThread?.routeId}
                currentLocation={activeThread?.currentLocation}
                progress={activeThread?.progress}
                lastUpdated={activeThread?.lastUpdated}
                fromCity={activeThread?.fromCity}
                toCity={activeThread?.toCity}
                travelerName={activeThread?.travelerName}
              />

              <Card className="space-y-5">
                <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
                  <div>
                    <h2 className="text-2xl font-semibold text-white">{mode === 'sender' ? 'Your parcels' : 'Accepted orders'}</h2>
                    <p className="text-sm text-slate-400">{mode === 'sender' ? 'Live orders first. Delivered orders below.' : 'Pickup, track, deliver, or cancel here.'}</p>
                  </div>
                  <Link
                    to={mode === 'sender' ? ROUTES.sendParcel : ROUTES.findTrip}
                    className="inline-flex items-center justify-center rounded-2xl bg-amber-500 px-5 py-3 text-sm font-semibold text-slate-950 transition hover:bg-amber-400"
                  >
                    {mode === 'sender' ? 'Send parcel' : 'Browse requests'}
                  </Link>
                </div>

                {(mode === 'sender' ? activeOrders : travelerOrders).length === 0 ? (
                  <EmptyState
                    icon={mode === 'sender' ? Package2 : Truck}
                    title="No active orders"
                    description="Active accepted and in-transit orders will appear here."
                  />
                ) : (
                  <div className="space-y-4">
                    {(mode === 'sender' ? activeOrders : travelerOrders).map((parcel) => (
                      <div key={parcel.id} className="rounded-[1.75rem] border border-white/10 bg-white/5 p-5">
                        <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                          <div className="space-y-3">
                            <div className="flex flex-wrap items-center gap-3">
                              <h3 className="text-xl font-semibold text-white">{parcel.parcelCategory}</h3>
                              <StatusBadge tone={getParcelStatusTone(parcel.status)}>{getParcelStatusLabel(parcel.status)}</StatusBadge>
                            </div>
                            <p className="text-sm text-slate-300">
                              {parcel.fromCity} to {parcel.toCity} on {formatDate(parcel.pickupDate)}
                            </p>
                            <p className="text-sm text-slate-400">Pickup point: {parcel.pickupLocation}</p>
                          </div>
                          <div className="rounded-2xl border border-white/10 bg-slate-950/40 px-4 py-3">
                            <p className="text-xs uppercase tracking-[0.2em] text-slate-500">Delivery OTP</p>
                            <p className="mt-2 text-lg font-semibold text-white">{parcel.otpCode ?? 'Generated after pickup'}</p>
                          </div>
                        </div>

                        <div className="mt-5 grid gap-5 xl:grid-cols-2">
                          <Card className="border-white/10 bg-slate-950/40">
                            <p className="text-xs uppercase tracking-[0.2em] text-slate-500">{mode === 'sender' ? 'Traveler' : 'Sender'}</p>
                            {mode === 'sender' ? (
                              <div className="mt-4 space-y-2 text-sm text-slate-300">
                                <p><span className="text-slate-500">Name:</span> {parcel.travelerName ?? 'Awaiting assignment'}</p>
                                <p><span className="text-slate-500">Phone:</span> {parcel.travelerPhone ?? 'After acceptance'}</p>
                                <p><span className="text-slate-500">Verification:</span> {parcel.travelerVerificationStatus ? getVerificationLabel(parcel.travelerVerificationStatus) : 'Pending'}</p>
                                <p><span className="text-slate-500">Rating:</span> {parcel.travelerRating ? `${parcel.travelerRating.toFixed(1)}/5` : 'Not rated yet'}</p>
                              </div>
                            ) : (
                              <div className="mt-4 space-y-2 text-sm text-slate-300">
                                <p><span className="text-slate-500">Name:</span> {parcel.senderName}</p>
                                <p><span className="text-slate-500">Phone:</span> {parcel.senderPhone}</p>
                                <p><span className="text-slate-500">Pickup:</span> {parcel.pickupLocation}</p>
                              </div>
                            )}
                          </Card>

                          <Card className="border-white/10 bg-slate-950/40">
                            <p className="text-xs uppercase tracking-[0.2em] text-slate-500">Receiver</p>
                            <div className="mt-4 space-y-2 text-sm text-slate-300">
                              <p><span className="text-slate-500">Name:</span> {parcel.receiverName}</p>
                              <p><span className="text-slate-500">Phone:</span> {parcel.receiverPhone}</p>
                              <p><span className="text-slate-500">Address:</span> {parcel.receiverAddress}</p>
                            </div>
                          </Card>
                        </div>

                        <div
                          className="mt-5 grid gap-3"
                          style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(120px, 1fr))' }}
                        >
                          {getOrderTimeline(parcel).map((stage) => (
                            <div key={stage.key} className="min-w-0 rounded-2xl border border-white/10 bg-slate-950/40 p-3">
                              <p className="text-sm font-semibold leading-snug text-white break-words">{stage.label}</p>
                              <p className="mt-2 text-xs uppercase tracking-[0.2em] text-slate-500 break-words">{stage.state}</p>
                            </div>
                          ))}
                        </div>

                        {mode === 'traveler' && parcel.travelerName ? (
                          <div className="mt-5 flex flex-col gap-3 sm:flex-row sm:justify-end">
                            {parcel.status === 'accepted' ? <Button onClick={() => void advance(parcel.id, 'picked')}>Mark picked up</Button> : null}
                            {parcel.status === 'accepted' ? (
                              <Button variant="secondary" onClick={() => void cancel(parcel)}>
                                Cancel order
                              </Button>
                            ) : null}
                            {parcel.status === 'picked' ? <Button onClick={() => void advance(parcel.id, 'in_transit')}>Start live tracking</Button> : null}
                            {parcel.status === 'in_transit' ? (
                              <>
                                <input
                                  maxLength={4}
                                  value={otpValues[parcel.id] ?? ''}
                                  onChange={(event) =>
                                    setOtpValues((current) => ({
                                      ...current,
                                      [parcel.id]: event.target.value.replace(/\D/g, '').slice(0, 4),
                                    }))
                                  }
                                  placeholder="Enter 4-digit OTP"
                                  className="w-full rounded-2xl border border-white/10 bg-slate-950/60 px-4 py-3 text-white outline-none sm:max-w-[220px]"
                                />
                                <Button onClick={() => void complete(parcel.id)}>Verify OTP and complete</Button>
                              </>
                            ) : null}
                          </div>
                        ) : null}
                        {mode === 'traveler' && parcel.status === 'accepted' ? (
                          <p className="mt-3 text-sm text-amber-200">Cancel after accept: fine Rs {TRAVELER_CANCELLATION_FINE}</p>
                        ) : null}
                      </div>
                    ))}
                  </div>
                )}

                {mode === 'sender' ? (
                  <div className="space-y-4 border-t border-white/10 pt-6">
                    <div>
                      <h3 className="text-xl font-semibold text-white">Previous parcels</h3>
                      <p className="text-sm text-slate-400">Your delivered parcel history.</p>
                    </div>

                    {deliveredOrders.length === 0 ? (
                      <EmptyState
                        icon={CheckCircle2}
                        title="No previous parcels yet"
                        description="Delivered parcels will appear here once a trip is completed."
                      />
                    ) : (
                      <div className="space-y-4">
                        {deliveredOrders.map((parcel) => (
                          <div key={parcel.id} className="rounded-[1.75rem] border border-white/10 bg-slate-950/40 p-5">
                            <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                              <div className="space-y-2">
                                <div className="flex flex-wrap items-center gap-3">
                                  <h4 className="text-lg font-semibold text-white">{parcel.parcelCategory}</h4>
                                  <StatusBadge tone="success">Delivered</StatusBadge>
                                </div>
                                <p className="text-sm text-slate-300">
                                  {parcel.fromCity} to {parcel.toCity} on {formatDate(parcel.pickupDate)}
                                </p>
                                <p className="text-sm text-slate-400">
                                  Receiver {parcel.receiverName} | Traveler {parcel.travelerName ?? 'Assigned traveler'}
                                </p>
                              </div>
                              <div className="rounded-2xl border border-white/10 bg-white/5 px-4 py-3">
                                <p className="text-xs uppercase tracking-[0.2em] text-slate-500">Completed</p>
                                <p className="mt-2 text-sm font-medium text-white">
                                  {parcel.deliveredAt ? formatDateTime(parcel.deliveredAt) : 'Delivered'}
                                </p>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                ) : null}
              </Card>
            </div>

            <div className="space-y-6">
              <Card>
                <div className="flex items-center gap-3">
                  <Bell className="h-5 w-5 text-amber-300" />
                  <h2 className="text-xl font-semibold text-white">Notifications</h2>
                </div>
                <div className="mt-4 space-y-3">
                  {visibleNotifications.length > 0 ? (
                    visibleNotifications.map((notification) => (
                      <div key={notification.id} className="rounded-2xl border border-white/10 bg-white/5 p-4 text-sm text-slate-300">
                        <div className="flex items-center justify-between gap-3">
                          <p className="font-medium text-white">{notification.travelerName}</p>
                          <StatusBadge tone="success">{notification.audience}</StatusBadge>
                        </div>
                        <p className="mt-2">{notification.message}</p>
                        <p className="mt-2 text-xs uppercase tracking-[0.2em] text-slate-500">{formatDateTime(notification.createdAt)}</p>
                      </div>
                    ))
                  ) : (
                    <EmptyState icon={Bell} title="No notifications yet" description="Acceptance notifications appear here for sender and traveler." />
                  )}
                </div>
              </Card>

              <Card>
                <div className="flex items-center gap-3">
                  <MessageSquareText className="h-5 w-5 text-amber-300" />
                  <h2 className="text-xl font-semibold text-white">Active chat</h2>
                </div>
                {activeThread ? (
                  <div className="mt-4 space-y-4">
                    <div className="flex flex-wrap gap-2">
                      {threads.map((thread) => (
                        <button
                          key={thread.id}
                          type="button"
                          onClick={() => setSelectedThreadId(thread.id)}
                          className={`rounded-full border px-4 py-2 text-sm font-medium transition ${
                            selectedThreadId === thread.id ? 'border-amber-400/30 bg-amber-500/10 text-white' : 'border-white/10 bg-white/5 text-slate-300'
                          }`}
                        >
                          {thread.parcelId}
                        </button>
                      ))}
                    </div>

                    <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
                      <p className="text-sm text-white">{activeThread.securityGroupTag}</p>
                      <p className="mt-2 text-sm text-slate-400">{activeThread.currentLocation}</p>
                    </div>

                    <div className="space-y-3">
                      {activeThread.chat.map((entry) => (
                        <ChatBubble key={entry.id} message={entry} />
                      ))}
                    </div>

                    <div className="space-y-3">
                      {activeThread.checkpoints.map((checkpoint) => (
                        <div key={checkpoint.id} className="rounded-2xl border border-white/10 bg-white/5 p-4 text-sm text-slate-300">
                          <div className="flex items-center justify-between gap-3">
                            <p className="font-medium text-white">{checkpoint.label}</p>
                            <StatusBadge tone={getCheckpointTone(checkpoint.status)}>{checkpoint.status}</StatusBadge>
                          </div>
                          <p className="mt-2">{checkpoint.location}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                ) : (
                  <EmptyState icon={MessageSquareText} title="No coordination thread yet" description="Threads appear once a traveler accepts a request." />
                )}
              </Card>

              <Card>
                <div className="flex items-center gap-3">
                  <MapPinned className="h-5 w-5 text-amber-300" />
                  <h2 className="text-xl font-semibold text-white">Trust and history</h2>
                </div>
                <div className="mt-4 space-y-3 text-sm text-slate-300">
                  <p>Pending verification cases: {verificationCases.filter((item) => item.status === 'pending').length}</p>
                  <p>Average reward: {averageReward}</p>
                  <p>Delivered orders: {deliveredOrders.length}</p>
                  <div className="space-y-3">
                    {trips.slice(0, 3).map((trip) => (
                      <div key={trip.id} className="rounded-2xl border border-white/10 bg-white/5 p-4">
                        <div className="flex items-center justify-between gap-3">
                          <p className="font-medium text-white">{trip.travelerName}</p>
                          <StatusBadge tone={getVerificationTone(trip.verificationStatus)}>{getVerificationLabel(trip.verificationStatus)}</StatusBadge>
                        </div>
                        <p className="mt-2 text-slate-400">{trip.fromCity} to {trip.toCity} | {trip.rating.toFixed(1)}/5</p>
                      </div>
                    ))}
                  </div>
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

function Metric({ icon: Icon, label, value }: { icon: typeof Package2; label: string; value: string }) {
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

function ChatBubble({ message }: { message: DeliveryChatMessage }) {
  const isUser = message.actor === 'user';
  const isSystem = message.actor === 'system';

  return (
    <div className={`flex ${isUser ? 'justify-end' : 'justify-start'}`}>
      <div
        className={`max-w-[90%] rounded-[1.5rem] px-4 py-3 text-sm leading-7 ${
          isSystem ? 'border border-emerald-400/20 bg-emerald-500/10 text-emerald-50' : isUser ? 'bg-amber-500 text-slate-950' : 'border border-white/10 bg-white/5 text-slate-100'
        }`}
      >
        <p className="text-xs uppercase tracking-[0.2em] opacity-75">
          {isSystem ? 'System' : isUser ? 'Sender' : 'Traveler'} | {formatDateTime(message.sentAt)}
        </p>
        <p className="mt-2">{message.text}</p>
      </div>
    </div>
  );
}
