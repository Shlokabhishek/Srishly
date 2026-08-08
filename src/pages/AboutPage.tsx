import { ArrowRight, ShieldCheck, Sparkles, Truck } from 'lucide-react';
import { Link } from 'react-router-dom';

import Card from '@/components/ui/Card';
import { ROUTES } from '@/constants';
import { useDocumentMeta } from '@/hooks/useDocumentMeta';

const aboutHighlights = [
  {
    title: 'Built for real routes',
    description: 'Srishly is designed for campus and city-to-city delivery where travelers are already going the same way.',
  },
  {
    title: 'Trust stays visible',
    description: 'Verification, approval, and handoff signals stay clear without overwhelming the screen with extra detail.',
  },
  {
    title: 'Cleaner decision flow',
    description: 'Senders can search, compare, and move forward faster with a calmer layout and fewer competing messages.',
  },
];

const principles = [
  {
    title: 'Clarity first',
    description: 'The product is structured so users can understand the route, reward, trust state, and next action at a glance.',
    icon: ShieldCheck,
  },
  {
    title: 'Trust-led design',
    description: 'Verification and approval are treated as core product signals, not hidden backend steps.',
    icon: Sparkles,
  },
  {
    title: 'Flow that matches delivery',
    description: 'The experience follows the natural parcel journey from posting to acceptance, coordination, and handoff.',
    icon: Truck,
  },
];

export default function AboutPage() {
  useDocumentMeta(
    'About Srishly',
    'Learn how Srishly helps senders and travelers coordinate trusted route-based parcel delivery.',
  );

  return (
    <div className="px-4 py-14 sm:px-6 lg:px-8 lg:py-20">
      <div className="mx-auto max-w-7xl space-y-12">
        <section className="grid gap-6 lg:grid-cols-[1fr_0.95fr]">
          <Card className="space-y-5">
            <div className="inline-flex items-center gap-2 rounded-full border border-zinc-800 bg-zinc-950/60 px-4 py-2 text-xs uppercase tracking-[0.25em] text-zinc-300">
              <ShieldCheck className="h-4 w-4 text-sky-300" />
              About Srishly
            </div>
            <h1 className="max-w-3xl text-4xl font-semibold tracking-tight text-zinc-50 sm:text-5xl">
              A simpler way to coordinate trusted parcel delivery.
            </h1>
            <p className="max-w-2xl text-base leading-8 text-zinc-300">
              Srishly connects senders with verified travelers, keeps route matching easy to understand, and reduces friction in the handoff journey.
            </p>
            <p className="max-w-2xl text-sm leading-7 text-zinc-400">
              The experience is built to feel structured and lightweight, so people can focus on who is carrying what, where it is going, and what happens next.
            </p>
          </Card>

          <Card highlighted className="space-y-5">
            <p className="text-sm uppercase tracking-[0.25em] text-zinc-400">What the platform solves</p>
            <h2 className="text-3xl font-semibold text-zinc-50">Route-based delivery should feel easier to trust and easier to use.</h2>
            <p className="text-sm leading-7 text-zinc-300">
              Instead of forcing users through cluttered logistics screens, Srishly keeps the experience centered on route fit, traveler trust, and a clean step-by-step flow.
            </p>
            <Link className="inline-flex items-center gap-2 text-sm font-semibold text-sky-300" to={ROUTES.trustCenter}>
              Explore trust center
              <ArrowRight className="h-4 w-4" />
            </Link>
          </Card>
        </section>

        <section className="grid gap-6 sm:grid-cols-3">
          {aboutHighlights.map((item) => (
            <Card key={item.title}>
              <h2 className="text-lg font-semibold text-zinc-50">{item.title}</h2>
              <p className="mt-3 text-sm leading-7 text-zinc-300">{item.description}</p>
            </Card>
          ))}
        </section>

        <section className="grid gap-6 lg:grid-cols-3">
          {principles.map((item) => {
            const Icon = item.icon;

            return (
              <Card key={item.title} className="space-y-4">
                <div className="inline-flex h-11 w-11 items-center justify-center rounded-2xl border border-zinc-800 bg-zinc-950/60 text-sky-300">
                  <Icon className="h-5 w-5" />
                </div>
                <h2 className="text-xl font-semibold text-zinc-50">{item.title}</h2>
                <p className="text-sm leading-7 text-zinc-300">{item.description}</p>
              </Card>
            );
          })}
        </section>

        <section>
          <Card className="flex flex-col gap-6 bg-[linear-gradient(135deg,rgba(125,211,252,0.08),rgba(15,23,42,0.18))] p-8 sm:p-10 lg:flex-row lg:items-center lg:justify-between">
            <div className="space-y-3">
              <p className="text-sm uppercase tracking-[0.25em] text-zinc-300">Start exploring</p>
              <h2 className="text-3xl font-semibold text-zinc-50">See the full product flow from traveler discovery to secure delivery.</h2>
            </div>
            <div className="flex flex-col gap-3 sm:flex-row">
              <Link
                to={ROUTES.findTraveler}
                className="inline-flex items-center justify-center rounded-2xl bg-zinc-100 px-6 py-4 text-base font-semibold text-zinc-950 transition hover:bg-white"
              >
                Find travelers
              </Link>
              <Link
                to={ROUTES.sendParcel}
                className="inline-flex items-center justify-center rounded-2xl border border-zinc-800 bg-zinc-900 px-6 py-4 text-base font-semibold text-zinc-100 transition hover:bg-zinc-800"
              >
                Send a parcel
              </Link>
            </div>
          </Card>
        </section>
      </div>
    </div>
  );
}
