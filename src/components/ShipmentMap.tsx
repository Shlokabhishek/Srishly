import { motion } from 'motion/react';
import { LocateFixed, MapPinned, Package2, ShieldCheck } from 'lucide-react';

import Card from '@/components/ui/Card';
import { formatDateTime } from '@/lib/format';

interface ShipmentMapProps {
  activeRouteId?: string;
  currentLocation?: string;
  progress?: number;
  lastUpdated?: string;
}

const ROUTE_MAP = {
  'trip-001': {
    id: 'trip-001',
    from: 'Noida',
    to: 'Kanpur',
    start: { x: 120, y: 115 },
    end: { x: 510, y: 180 },
    traveler: 'Amit R.',
  },
  'trip-002': {
    id: 'trip-002',
    from: 'Delhi',
    to: 'Mumbai',
    start: { x: 160, y: 90 },
    end: { x: 330, y: 250 },
    traveler: 'Suresh K.',
  },
  'trip-003': {
    id: 'trip-003',
    from: 'Bangalore',
    to: 'Chennai',
    start: { x: 310, y: 240 },
    end: { x: 420, y: 245 },
    traveler: 'Priya M.',
  },
  'trip-004': {
    id: 'trip-004',
    from: 'Jaipur',
    to: 'Delhi',
    start: { x: 100, y: 120 },
    end: { x: 170, y: 90 },
    traveler: 'Aditya N.',
  },
  'parcel-route-001': {
    id: 'parcel-route-001',
    from: 'Delhi',
    to: 'Lucknow',
    start: { x: 150, y: 98 },
    end: { x: 375, y: 128 },
    traveler: 'Amit R.',
  },
  'parcel-route-002': {
    id: 'parcel-route-002',
    from: 'Noida',
    to: 'Bangalore',
    start: { x: 160, y: 100 },
    end: { x: 305, y: 246 },
    traveler: 'Rahul S.',
  },
} as const;

function getControlPoint(start: { x: number; y: number }, end: { x: number; y: number }) {
  return {
    x: (start.x + end.x) / 2,
    y: Math.max(start.y, end.y) - 90,
  };
}

function getQuadraticPoint(
  start: { x: number; y: number },
  control: { x: number; y: number },
  end: { x: number; y: number },
  t: number,
) {
  const inverse = 1 - t;

  return {
    x: inverse * inverse * start.x + 2 * inverse * t * control.x + t * t * end.x,
    y: inverse * inverse * start.y + 2 * inverse * t * control.y + t * t * end.y,
  };
}

export default function ShipmentMap({
  activeRouteId = 'trip-001',
  currentLocation,
  progress = 42,
  lastUpdated,
}: ShipmentMapProps) {
  const route = ROUTE_MAP[activeRouteId as keyof typeof ROUTE_MAP] ?? ROUTE_MAP['trip-001'];
  const controlPoint = getControlPoint(route.start, route.end);
  const shipmentPoint = getQuadraticPoint(route.start, controlPoint, route.end, Math.min(Math.max(progress / 100, 0), 1));

  return (
    <Card className="overflow-hidden p-0">
      <div className="relative h-[320px] overflow-hidden bg-[radial-gradient(circle_at_top_left,rgba(251,191,36,0.12),transparent_35%),radial-gradient(circle_at_bottom_right,rgba(14,165,233,0.12),transparent_30%),linear-gradient(180deg,rgba(15,23,42,0.98),rgba(2,6,23,0.98))]">
        <div className="absolute inset-0 bg-[linear-gradient(to_right,rgba(148,163,184,0.08)_1px,transparent_1px),linear-gradient(to_bottom,rgba(148,163,184,0.08)_1px,transparent_1px)] bg-[size:32px_32px]" />

        <div className="absolute left-6 top-6 z-10 inline-flex items-center gap-2 rounded-full border border-white/10 bg-slate-950/70 px-4 py-2 text-xs uppercase tracking-[0.2em] text-slate-300 backdrop-blur">
          <MapPinned className="h-4 w-4 text-amber-300" />
          Active route visualizer
        </div>

        <svg viewBox="0 0 600 320" className="relative z-[1] h-full w-full">
          <defs>
            <linearGradient id="routeGradient" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#f59e0b" stopOpacity="0.2" />
              <stop offset="50%" stopColor="#f59e0b" stopOpacity="1" />
              <stop offset="100%" stopColor="#38bdf8" stopOpacity="0.6" />
            </linearGradient>
          </defs>

          <motion.path
            d={`M ${route.start.x} ${route.start.y} Q ${controlPoint.x} ${controlPoint.y} ${route.end.x} ${route.end.y}`}
            fill="transparent"
            stroke="url(#routeGradient)"
            strokeDasharray="1000"
            strokeLinecap="round"
            strokeWidth="4"
            initial={{ strokeDashoffset: 1000 }}
            animate={{ strokeDashoffset: 0 }}
            transition={{ duration: 1.3, ease: 'easeInOut' }}
          />

          {[route.start, route.end].map((point, index) => (
            <g key={`${point.x}-${point.y}`} transform={`translate(${point.x}, ${point.y})`}>
              <circle r="7" fill={index === 0 ? '#f59e0b' : '#38bdf8'} />
              <motion.circle
                r="18"
                fill="transparent"
                stroke={index === 0 ? '#f59e0b' : '#38bdf8'}
                strokeWidth="2"
                initial={{ scale: 0.6, opacity: 1 }}
                animate={{ scale: 2.3, opacity: 0 }}
                transition={{ duration: 1.8, repeat: Infinity, delay: index * 0.6 }}
              />
            </g>
          ))}

          <g transform={`translate(${shipmentPoint.x}, ${shipmentPoint.y})`}>
            <motion.circle
              r="18"
              fill="rgba(245, 158, 11, 0.18)"
              stroke="#f59e0b"
              strokeWidth="2"
              initial={{ scale: 0.8, opacity: 0.8 }}
              animate={{ scale: 1.2, opacity: 0.25 }}
              transition={{ duration: 1.2, repeat: Infinity, repeatType: 'reverse' }}
            />
            <circle r="11" fill="#0f172a" stroke="#f59e0b" strokeWidth="2" />
            <path
              d="M -5 -2 h10 v7 h-10 z M -3 -6 h6 v4 h-6 z"
              fill="#f8fafc"
              stroke="#f8fafc"
              strokeWidth="1"
            />
          </g>
        </svg>

        <div className="absolute bottom-6 left-6 z-10 rounded-2xl border border-white/10 bg-slate-950/75 p-4 backdrop-blur">
          <p className="text-xs uppercase tracking-[0.2em] text-slate-400">Current route</p>
          <h3 className="mt-1 text-xl font-semibold text-white">
            {route.from} -&gt; {route.to}
          </h3>
          <div className="mt-3 inline-flex items-center gap-2 rounded-full border border-amber-400/20 bg-amber-500/10 px-3 py-1 text-xs text-amber-100">
            <ShieldCheck className="h-3.5 w-3.5" />
            Verified traveler: {route.traveler}
          </div>
        </div>

        <div className="absolute bottom-6 right-6 z-10 max-w-[240px] rounded-2xl border border-white/10 bg-slate-950/75 p-4 backdrop-blur">
          <div className="flex items-center gap-2 text-xs uppercase tracking-[0.2em] text-slate-400">
            <LocateFixed className="h-3.5 w-3.5 text-amber-300" />
            Live goods location
          </div>
          <p className="mt-2 text-sm font-semibold text-white">{currentLocation ?? 'Tracking will start after pickup confirmation.'}</p>
          <div className="mt-3 h-2 overflow-hidden rounded-full bg-white/10">
            <div className="h-full rounded-full bg-[linear-gradient(90deg,#f59e0b,#38bdf8)]" style={{ width: `${progress}%` }} />
          </div>
          <p className="mt-2 text-xs text-slate-400">
            {progress}% route progress
            {lastUpdated ? ` • Updated ${formatDateTime(lastUpdated)}` : ''}
          </p>
        </div>

        <div className="absolute right-6 top-6 z-10 hidden items-center gap-2 rounded-full border border-white/10 bg-slate-950/70 px-4 py-2 text-xs uppercase tracking-[0.2em] text-slate-300 backdrop-blur sm:inline-flex">
          <Package2 className="h-4 w-4 text-amber-300" />
          Live parcel marker
        </div>
      </div>
    </Card>
  );
}
