import { ArrowRight, ShieldCheck, Sparkles, Truck } from 'lucide-react';
import { motion } from 'motion/react';
import { Link, useNavigate } from 'react-router-dom';

import RouteSearch from '@/components/RouteSearch';
import Card from '@/components/ui/Card';
import { HOME_STATS, ROUTES, TRUST_PILLARS } from '@/constants';
import { useMode } from '@/context/ModeContext';
import { useDocumentMeta } from '@/hooks/useDocumentMeta';

const howItWorks = [
  {
    title: 'Create a delivery request',
    description: 'Users post parcel details, route, weight, size, and the amount they will pay the traveler.',
  },
  {
    title: 'Traveler accepts the route',
    description: 'Travelers keep an eye on matching routes and accept a request only if they are already going the same way.',
  },
  {
    title: 'Notify and coordinate',
    description: 'The sender and traveler both get notified, then pickup, tracking, and OTP handoff move into an active secure order flow.',
  },
];

export default function Home() {
  const navigate = useNavigate();
  const { mode } = useMode();
  useDocumentMeta(
    'Secure peer-to-peer logistics',
    'Find verified travelers, post parcel requests, and manage route-level delivery flows with Srishly.',
  );

  return (
    <div className="overflow-hidden">
      <section className="px-4 pb-20 pt-14 sm:px-6 lg:px-8 lg:pt-24">
        <div className="mx-auto grid max-w-7xl items-center gap-10 lg:grid-cols-[1.2fr_0.8fr]">
          <motion.div
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="space-y-6"
          >
            <div className="inline-flex items-center gap-2 rounded-full border border-zinc-800 bg-zinc-900/80 px-4 py-2 text-xs font-semibold uppercase tracking-[0.25em] text-zinc-200">
              <ShieldCheck className="h-4 w-4" />
              Simple route logistics
            </div>
            <div className="space-y-4">
              <h1 className="max-w-3xl text-4xl font-semibold tracking-tight text-zinc-50 sm:text-6xl">
                Ship with trusted travelers and keep every step easy to read.
              </h1>
              <p className="max-w-2xl text-lg leading-8 text-zinc-300">
                Srishly helps senders and travelers coordinate parcel delivery with clear route search, verification, and
                straightforward dashboard flows.
              </p>
            </div>

            <RouteSearch
              helperText="Search a supported route to see availability first. Full traveler details unlock only after verification."
              onSearch={(fromCity, toCity) => navigate(`${ROUTES.findTraveler}?from=${encodeURIComponent(fromCity)}&to=${encodeURIComponent(toCity)}`)}
              submitLabel="Explore travelers"
            />

            <div className="flex flex-col gap-3 sm:flex-row">
              {mode === 'sender' ? (
                <>
                  <Link
                    to={ROUTES.sendParcel}
                    className="inline-flex items-center justify-center gap-2 rounded-2xl bg-zinc-100 px-6 py-4 text-base font-semibold text-zinc-950 transition hover:bg-white"
                  >
                    Send a parcel
                    <ArrowRight className="h-4 w-4" />
                  </Link>
                  <Link
                    to={ROUTES.dashboard}
                    className="inline-flex items-center justify-center rounded-2xl border border-zinc-800 bg-zinc-900 px-6 py-4 text-base font-semibold text-zinc-100 transition hover:bg-zinc-800"
                  >
                    View your parcels
                  </Link>
                </>
              ) : (
                <>
                  <Link
                    to={ROUTES.findTrip}
                    className="inline-flex items-center justify-center gap-2 rounded-2xl bg-zinc-100 px-6 py-4 text-base font-semibold text-zinc-950 transition hover:bg-white"
                  >
                    Find parcels to carry
                    <ArrowRight className="h-4 w-4" />
                  </Link>
                  <Link
                    to={ROUTES.dashboard}
                    className="inline-flex items-center justify-center rounded-2xl border border-zinc-800 bg-zinc-900 px-6 py-4 text-base font-semibold text-zinc-100 transition hover:bg-zinc-800"
                  >
                    Open traveler dashboard
                  </Link>
                </>
              )}
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, scale: 0.96 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.5, delay: 0.1 }}
            className="grid gap-4"
          >
            {HOME_STATS.map((stat) => (
              <Card key={stat.label} highlighted>
                <p className="text-sm uppercase tracking-[0.25em] text-zinc-400">{stat.label}</p>
                <div className="mt-2 text-4xl font-semibold text-zinc-50">{stat.value}</div>
                <p className="mt-3 text-sm leading-7 text-zinc-300">{stat.description}</p>
              </Card>
            ))}
          </motion.div>
        </div>
      </section>

      <section className="px-4 py-16 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-7xl">
          <div className="mb-10 max-w-2xl">
            <p className="text-sm uppercase tracking-[0.25em] text-zinc-400">How it works</p>
            <h2 className="mt-3 text-3xl font-semibold text-zinc-50">A simple workflow from posting to delivery</h2>
          </div>
          <div className="grid gap-6 lg:grid-cols-3">
            {howItWorks.map((item, index) => (
              <Card key={item.title}>
                <div className="mb-4 inline-flex h-10 w-10 items-center justify-center rounded-2xl border border-zinc-800 bg-zinc-950/60 text-sm font-semibold text-zinc-200">
                  0{index + 1}
                </div>
                <h3 className="text-xl font-semibold text-zinc-50">{item.title}</h3>
                <p className="mt-3 text-sm leading-7 text-zinc-300">{item.description}</p>
              </Card>
            ))}
          </div>
        </div>
      </section>

      <section className="px-4 py-16 sm:px-6 lg:px-8">
        <div className="mx-auto grid max-w-7xl gap-6 lg:grid-cols-[0.9fr_1.1fr]">
          <Card className="space-y-5">
            <div className="inline-flex items-center gap-2 rounded-full border border-zinc-800 bg-zinc-950/60 px-4 py-2 text-xs uppercase tracking-[0.25em] text-zinc-300">
              <Sparkles className="h-4 w-4 text-sky-300" />
              Trust stack
            </div>
            <h2 className="text-3xl font-semibold text-zinc-50">Designed to reduce uncertainty.</h2>
            <p className="text-sm leading-7 text-zinc-300">
              The app keeps trust signals visible without crowding the screen, so users can understand what happens next.
            </p>
            <Link className="inline-flex items-center gap-2 text-sm font-semibold text-sky-300" to={ROUTES.trustCenter}>
              Visit trust center
              <ArrowRight className="h-4 w-4" />
            </Link>
          </Card>

          <div className="grid gap-6 sm:grid-cols-3">
            {TRUST_PILLARS.map((pillar) => (
              <Card key={pillar.title}>
                <h3 className="text-lg font-semibold text-zinc-50">{pillar.title}</h3>
                <p className="mt-3 text-sm leading-7 text-zinc-300">{pillar.description}</p>
              </Card>
            ))}
          </div>
        </div>
      </section>

      <section className="px-4 pb-20 pt-4 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-7xl">
          <Card className="flex flex-col gap-6 bg-[linear-gradient(135deg,rgba(255,255,255,0.04),rgba(15,23,42,0.08))] p-8 sm:p-10 lg:flex-row lg:items-center lg:justify-between">
            <div className="space-y-3">
              <div className="inline-flex items-center gap-2 rounded-full border border-zinc-800 bg-zinc-950/60 px-4 py-2 text-xs uppercase tracking-[0.25em] text-zinc-200">
                <Truck className="h-4 w-4" />
                Ready for a clean launch
              </div>
              <h2 className="text-3xl font-semibold text-zinc-50">Launch with a layout that is clear, calm, and responsive.</h2>
            </div>
            <Link
              to={ROUTES.dashboard}
              className="inline-flex items-center justify-center rounded-2xl bg-zinc-100 px-6 py-4 text-base font-semibold text-zinc-950 transition hover:bg-white"
            >
              Open dashboard
            </Link>
          </Card>
        </div>
      </section>
    </div>
  );
}
