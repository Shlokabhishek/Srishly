import * as React from 'react';
import { CheckCircle2, Search, ShieldAlert, ShieldCheck, UserRoundX } from 'lucide-react';
import { motion } from 'motion/react';

import Button from '@/components/ui/Button';
import Card from '@/components/ui/Card';
import EmptyState from '@/components/ui/EmptyState';
import ErrorBanner from '@/components/ui/ErrorBanner';
import PageLoader from '@/components/ui/PageLoader';
import StatusBadge from '@/components/ui/StatusBadge';
import { useDocumentMeta } from '@/hooks/useDocumentMeta';
import { formatDateTime } from '@/lib/format';
import { getVerificationCases, reviewVerificationCase } from '@/services/mockApi';
import type { ReviewAction, VerificationCase } from '@/types';

export default function VerificationHub() {
  const [cases, setCases] = React.useState<VerificationCase[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState('');
  const [query, setQuery] = React.useState('');
  const [auditLog, setAuditLog] = React.useState<string[]>([]);
  const deferredQuery = React.useDeferredValue(query);

  useDocumentMeta(
    'Verification hub',
    'Review pending traveler identity checks with searchable queues and auditable approve or reject actions.',
  );

  React.useEffect(() => {
    let active = true;

    async function loadVerificationCases() {
      try {
        setLoading(true);
        const nextCases = await getVerificationCases();
        if (active) {
          setCases(nextCases);
          setAuditLog(nextCases.map((item) => `Loaded case ${item.id} for ${item.travelerName}`));
        }
      } catch {
        if (active) {
          setError('We could not load the verification queue right now.');
        }
      } finally {
        if (active) {
          setLoading(false);
        }
      }
    }

    void loadVerificationCases();

    return () => {
      active = false;
    };
  }, []);

  const filteredCases = cases.filter((item) =>
    !deferredQuery
      ? true
      : `${item.travelerName} ${item.route} ${item.city}`.toLowerCase().includes(deferredQuery.toLowerCase()),
  );

  async function handleReview(id: string, action: ReviewAction) {
    try {
      const nextCases = await reviewVerificationCase(id, action);
      setCases(nextCases);

      const reviewedCase = nextCases.find((item) => item.id === id);
      setAuditLog((current) => [
        `${action === 'approved' ? 'Approved' : 'Rejected'} ${reviewedCase?.travelerName ?? id} at ${new Date().toLocaleTimeString('en-IN')}`,
        ...current,
      ]);
    } catch {
      setError('Unable to update the review status.');
    }
  }

  const pendingCount = cases.filter((item) => item.status === 'pending').length;

  return (
    <div className="px-4 py-12 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-7xl space-y-8">
        <div className="space-y-4">
          <p className="text-sm uppercase tracking-[0.25em] text-amber-200">Verification operations</p>
          <h1 className="text-4xl font-semibold text-white">Review traveler onboarding requests without losing audit visibility.</h1>
          <p className="max-w-3xl text-sm leading-7 text-slate-300">
            This internal-style admin page now behaves like a real queue with persistent review state, search, and audit
            logging instead of static mock tiles.
          </p>
        </div>

        <div className="grid gap-5 md:grid-cols-3">
          <MetricCard label="Pending cases" value={String(pendingCount)} icon={ShieldAlert} />
          <MetricCard label="Approved today" value={String(cases.filter((item) => item.status === 'approved').length)} icon={CheckCircle2} />
          <MetricCard label="Rejected today" value={String(cases.filter((item) => item.status === 'rejected').length)} icon={UserRoundX} />
        </div>

        <div className="grid gap-8 lg:grid-cols-[0.65fr_0.35fr]">
          <div className="space-y-5">
            <Card className="space-y-4">
              <div className="flex items-center justify-between gap-4">
                <div>
                  <h2 className="text-2xl font-semibold text-white">Review queue</h2>
                  <p className="text-sm text-slate-400">{filteredCases.length} visible cases</p>
                </div>
                <div className="flex items-center gap-3 rounded-2xl border border-white/10 bg-white/5 px-4 py-3">
                  <Search className="h-4 w-4 text-amber-300" />
                  <input
                    value={query}
                    onChange={(event) => setQuery(event.target.value)}
                    placeholder="Search queue"
                    className="bg-transparent text-sm text-white outline-none"
                  />
                </div>
              </div>

              {error ? <ErrorBanner message={error} /> : null}
              {loading ? <PageLoader label="Loading verification queue" /> : null}

              {!loading && filteredCases.length === 0 ? (
                <EmptyState
                  icon={ShieldCheck}
                  title="No cases match the current search"
                  description="Try a different traveler name or city to narrow the queue."
                />
              ) : null}

              <div className="space-y-4">
                {filteredCases.map((item, index) => (
                  <motion.div
                    key={item.id}
                    initial={{ opacity: 0, y: 16 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.04 }}
                  >
                    <Card className="space-y-4 bg-white/5">
                      <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                        <div className="space-y-2">
                          <div className="flex flex-wrap items-center gap-3">
                            <h3 className="text-xl font-semibold text-white">{item.travelerName}</h3>
                            <StatusBadge tone={item.status === 'pending' ? 'warning' : item.status === 'approved' ? 'success' : 'danger'}>
                              {item.status}
                            </StatusBadge>
                          </div>
                          <p className="text-sm text-slate-300">{item.route}</p>
                          <p className="text-sm text-slate-400">
                            {item.idType} submitted from {item.city}
                          </p>
                        </div>

                        <div className="text-sm text-slate-400">{formatDateTime(item.submittedAt)}</div>
                      </div>

                      <div className="flex flex-col gap-3 sm:flex-row sm:justify-end">
                        <Button variant="secondary">View submitted files</Button>
                        <Button
                          onClick={() => void handleReview(item.id, 'approved')}
                          disabled={item.status !== 'pending'}
                        >
                          Approve
                        </Button>
                        <Button
                          onClick={() => void handleReview(item.id, 'rejected')}
                          disabled={item.status !== 'pending'}
                          variant="danger"
                        >
                          Reject
                        </Button>
                      </div>
                    </Card>
                  </motion.div>
                ))}
              </div>
            </Card>
          </div>

          <div className="space-y-5">
            <Card highlighted>
              <h2 className="text-xl font-semibold text-white">Review checklist</h2>
              <ul className="mt-4 space-y-3 text-sm leading-7 text-slate-300">
                <li>Confirm route identity and city metadata are coherent.</li>
                <li>Reject incomplete or mismatched document submissions.</li>
                <li>Only approve records ready to appear in the public traveler feed.</li>
              </ul>
            </Card>

            <Card>
              <div className="flex items-center justify-between">
                <h2 className="text-xl font-semibold text-white">Audit log</h2>
                <StatusBadge tone="muted">Latest first</StatusBadge>
              </div>
              <div className="mt-4 space-y-3">
                {auditLog.slice(0, 8).map((entry) => (
                  <div key={entry} className="rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-slate-300">
                    {entry}
                  </div>
                ))}
              </div>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}

function MetricCard({
  icon: Icon,
  label,
  value,
}: {
  icon: typeof ShieldCheck;
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
