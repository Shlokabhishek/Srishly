import * as React from 'react';
import { ArrowRight, MapPin, Search } from 'lucide-react';

import Button from '@/components/ui/Button';
import FormField from '@/components/ui/FormField';
import { CITIES } from '@/constants';
import { validateRouteSelection } from '@/lib/validation';

interface RouteSearchProps {
  onSearch: (fromCity: string, toCity: string) => void | Promise<void>;
  submitLabel?: string;
  helperText?: string;
  initialFrom?: string;
  initialTo?: string;
}

export default function RouteSearch({
  helperText = 'Choose a route to see matching travelers and parcels.',
  initialFrom = '',
  initialTo = '',
  onSearch,
  submitLabel = 'Find route',
}: RouteSearchProps) {
  const [fromCity, setFromCity] = React.useState(initialFrom);
  const [toCity, setToCity] = React.useState(initialTo);
  const [submitting, setSubmitting] = React.useState(false);
  const [errors, setErrors] = React.useState<{ fromCity?: string; toCity?: string }>({});

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const nextErrors = validateRouteSelection(fromCity, toCity);
    setErrors(nextErrors);

    if (Object.keys(nextErrors).length > 0) {
      return;
    }

    try {
      setSubmitting(true);
      await onSearch(fromCity, toCity);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <form className="w-full" onSubmit={handleSubmit}>
      <div className="grid gap-4 rounded-[2rem] border border-white/10 bg-slate-900/80 p-4 shadow-2xl shadow-black/30 backdrop-blur lg:grid-cols-[1fr_1fr_auto]">
        <FormField error={errors.fromCity} htmlFor="route-search-from" label="From city">
          <div className="flex items-center gap-3 rounded-2xl border border-white/10 bg-white/5 px-4 py-3">
            <MapPin className="h-4 w-4 text-amber-300" />
            <select
              id="route-search-from"
              value={fromCity}
              onChange={(event) => setFromCity(event.target.value)}
              className="w-full bg-transparent text-sm text-white outline-none"
            >
              <option value="">Select origin</option>
              {CITIES.map((city) => (
                <option key={city} value={city}>
                  {city}
                </option>
              ))}
            </select>
          </div>
        </FormField>

        <FormField error={errors.toCity} htmlFor="route-search-to" label="To city">
          <div className="flex items-center gap-3 rounded-2xl border border-white/10 bg-white/5 px-4 py-3">
            <MapPin className="h-4 w-4 text-amber-300" />
            <select
              id="route-search-to"
              value={toCity}
              onChange={(event) => setToCity(event.target.value)}
              className="w-full bg-transparent text-sm text-white outline-none"
            >
              <option value="">Select destination</option>
              {CITIES.map((city) => (
                <option key={city} value={city}>
                  {city}
                </option>
              ))}
            </select>
          </div>
        </FormField>

        <div className="flex flex-col justify-end">
          <Button className="w-full rounded-2xl lg:w-auto" size="lg" type="submit" disabled={submitting}>
            {submitting ? <Search className="h-4 w-4 animate-pulse" /> : <ArrowRight className="h-4 w-4" />}
            {submitting ? 'Searching' : submitLabel}
          </Button>
        </div>
      </div>
      <p className="mt-3 text-sm text-slate-400">{helperText}</p>
    </form>
  );
}
