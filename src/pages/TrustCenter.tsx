import { CheckCircle2, LockKeyhole, ShieldCheck, UserRoundCheck } from 'lucide-react';
import { Link } from 'react-router-dom';

import Card from '@/components/ui/Card';
import { ROUTES } from '@/constants';
import { useDocumentMeta } from '@/hooks/useDocumentMeta';

const controls = [
  {
    title: 'Identity checks',
    description: 'Traveler approval includes student ID or Aadhaar-backed verification before names and phones are revealed.',
    icon: UserRoundCheck,
  },
  {
    title: 'OTP-secured handoff',
    description: 'A 4-digit OTP appears after pickup and must be verified before the order can be marked delivered.',
    icon: LockKeyhole,
  },
  {
    title: 'Operational transparency',
    description: 'Dashboard surfaces trust badges, live tracking, receiver details, and status transitions instead of hiding state changes.',
    icon: ShieldCheck,
  },
];

const commitments = [
  'Visible Verified Student and Aadhaar Verified badges.',
  'Phone numbers masked until the viewer is logged in and verified.',
  'Sanitized form input before persistence.',
  'Consistent loading, error, and empty states across route-level pages.',
];

const visibleTrustSignals = [
  'Trust score and rating cues',
  'Pickup-to-delivered timeline',
  'Receiver details with OTP visibility',
  'Prohibited-items disclosure in send flow',
];

export default function TrustCenter() {
  useDocumentMeta(
    'Trust center',
    'Understand the verification, escrow, and application security decisions behind the Srishly frontend.',
  );

  return (
    <div className="px-4 py-12 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-7xl space-y-10">
        <div className="max-w-3xl space-y-4">
          <p className="text-sm uppercase tracking-[0.25em] text-amber-200">Trust center</p>
          <h1 className="text-4xl font-semibold text-white">Security, verification, and delivery safeguards are part of the product experience.</h1>
          <p className="text-sm leading-7 text-slate-300">
            This application now treats trust as a first-class frontend concern by removing client secrets, validating inputs,
            strengthening routing, gating traveler identity, and exposing safer delivery state transitions.
          </p>
        </div>

        <div className="grid gap-6 lg:grid-cols-3">
          {controls.map((control) => (
            <Card key={control.title}>
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-amber-500/10 text-amber-200">
                <control.icon className="h-6 w-6" />
              </div>
              <h2 className="mt-5 text-xl font-semibold text-white">{control.title}</h2>
              <p className="mt-3 text-sm leading-7 text-slate-300">{control.description}</p>
            </Card>
          ))}
        </div>

        <div className="grid gap-6 lg:grid-cols-[1fr_1fr]">
          <Card className="space-y-4">
            <p className="text-sm uppercase tracking-[0.25em] text-amber-200">Release hardening</p>
            <h2 className="text-2xl font-semibold text-white">What changed in the production pass</h2>
            <ul className="space-y-3 text-sm leading-7 text-slate-300">
              {commitments.map((commitment) => (
                <li key={commitment} className="flex items-start gap-3">
                  <CheckCircle2 className="mt-1 h-4 w-4 flex-none text-emerald-300" />
                  <span>{commitment}</span>
                </li>
              ))}
            </ul>
          </Card>

          <Card highlighted className="space-y-4">
            <p className="text-sm uppercase tracking-[0.25em] text-amber-200">Visible trust signals</p>
            <h2 className="text-2xl font-semibold text-white">Make security obvious before a user books or contacts.</h2>
            <p className="text-sm leading-7 text-slate-300">
              The product experience now shows trust badges, OTP checkpoints, identity gating, and delivery transparency instead of burying them in internal logic.
            </p>
            <ul className="space-y-3 text-sm leading-7 text-slate-300">
              {visibleTrustSignals.map((signal) => (
                <li key={signal} className="flex items-start gap-3">
                  <CheckCircle2 className="mt-1 h-4 w-4 flex-none text-emerald-300" />
                  <span>{signal}</span>
                </li>
              ))}
            </ul>
            <div className="flex flex-col gap-3 sm:flex-row">
              <Link
                to={ROUTES.verificationHub}
                className="inline-flex items-center justify-center rounded-2xl bg-amber-500 px-5 py-3 text-sm font-semibold text-slate-950 transition hover:bg-amber-400"
              >
                Open verification hub
              </Link>
              <Link
                to={ROUTES.sendParcel}
                className="inline-flex items-center justify-center rounded-2xl border border-white/10 bg-white/5 px-5 py-3 text-sm font-semibold text-white transition hover:bg-white/10"
              >
                Create a request
              </Link>
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}
