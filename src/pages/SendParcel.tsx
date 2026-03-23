import * as React from 'react';
import { ArrowLeft, ArrowRight, CheckCircle2, ImagePlus, Package2 } from 'lucide-react';
import { motion } from 'motion/react';
import { useNavigate } from 'react-router-dom';

import Button from '@/components/ui/Button';
import Card from '@/components/ui/Card';
import ErrorBanner from '@/components/ui/ErrorBanner';
import FormField from '@/components/ui/FormField';
import { CATEGORIES, CITIES, DECLARED_VALUES, DIMENSIONS, INITIAL_PARCEL_DRAFT, ROUTES } from '@/constants';
import { useDocumentMeta } from '@/hooks/useDocumentMeta';
import { isStepValid, validateParcelDraft } from '@/lib/validation';
import { createParcel } from '@/services/mockApi';
import type { FieldErrors, ParcelDraftInput } from '@/types';

const stepLabels = [
  { id: 1, title: 'Parcel details' },
  { id: 2, title: 'Route and pickup' },
  { id: 3, title: 'Reward and review' },
];

export default function SendParcel() {
  const navigate = useNavigate();
  const [step, setStep] = React.useState(1);
  const [draft, setDraft] = React.useState<ParcelDraftInput>(INITIAL_PARCEL_DRAFT);
  const [errors, setErrors] = React.useState<FieldErrors<keyof ParcelDraftInput>>({});
  const [submitting, setSubmitting] = React.useState(false);
  const [formError, setFormError] = React.useState('');

  useDocumentMeta(
    'Post a parcel request',
    'Create a secure delivery request with validation, escrow messaging, and route-based matching.',
  );

  function updateField<K extends keyof ParcelDraftInput>(field: K, value: ParcelDraftInput[K]) {
    setDraft((current) => ({
      ...current,
      [field]: value,
    }));

    setErrors((current) => ({
      ...current,
      [field]: undefined,
    }));
  }

  function runValidation() {
    const nextErrors = validateParcelDraft(draft);
    setErrors(nextErrors);
    return nextErrors;
  }

  function handleNextStep() {
    const nextErrors = runValidation();
    if (isStepValid(step, nextErrors)) {
      setStep((current) => Math.min(current + 1, 3));
    }
  }

  function handlePreviousStep() {
    setStep((current) => Math.max(current - 1, 1));
  }

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setFormError('');
    const nextErrors = runValidation();

    if (Object.keys(nextErrors).length > 0) {
      const failingStep = [1, 2, 3].find((candidate) => !isStepValid(candidate, nextErrors));
      if (failingStep) {
        setStep(failingStep);
      }
      return;
    }

    try {
      setSubmitting(true);
      const parcel = await createParcel(draft);
      React.startTransition(() => {
        navigate(`${ROUTES.dashboard}?created=${encodeURIComponent(parcel.id)}`);
      });
    } catch (error) {
      setFormError(error instanceof Error ? error.message : 'Unable to create the parcel request.');
    } finally {
      setSubmitting(false);
    }
  }

  const today = new Date().toISOString().split('T')[0];

  return (
    <div className="px-4 py-12 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-5xl space-y-8">
        <div className="space-y-4">
          <p className="text-sm uppercase tracking-[0.25em] text-amber-200">Sender workflow</p>
          <h1 className="text-4xl font-semibold text-white">Post a delivery request with validation built in.</h1>
          <p className="max-w-3xl text-sm leading-7 text-slate-300">
            This flow now validates every major field before submission, stores data safely, and redirects to the dashboard
            after a successful request.
          </p>
        </div>

        <div className="grid gap-8 lg:grid-cols-[1.1fr_0.9fr]">
          <form className="space-y-6" onSubmit={handleSubmit} noValidate>
            <Card className="space-y-6">
              <div className="grid gap-4 sm:grid-cols-3">
                {stepLabels.map((item) => {
                  const active = step === item.id;
                  const completed = step > item.id;

                  return (
                    <div
                      key={item.id}
                      className={`rounded-2xl border px-4 py-4 transition ${
                        active
                          ? 'border-amber-400/30 bg-amber-500/10'
                          : completed
                            ? 'border-emerald-400/30 bg-emerald-500/10'
                            : 'border-white/10 bg-white/5'
                      }`}
                    >
                      <div className="flex items-center justify-between gap-3">
                        <span className="text-xs uppercase tracking-[0.25em] text-slate-300">Step {item.id}</span>
                        {completed ? <CheckCircle2 className="h-4 w-4 text-emerald-300" /> : null}
                      </div>
                      <p className="mt-2 text-base font-semibold text-white">{item.title}</p>
                    </div>
                  );
                })}
              </div>

              {formError ? <ErrorBanner message={formError} /> : null}

              {step === 1 ? (
                <motion.div initial={{ opacity: 0, x: 18 }} animate={{ opacity: 1, x: 0 }} className="grid gap-5">
                  <div className="grid gap-5 md:grid-cols-2">
                    <FormField error={errors.parcelCategory} htmlFor="parcelCategory" label="Parcel category">
                      <select
                        id="parcelCategory"
                        value={draft.parcelCategory}
                        onChange={(event) => updateField('parcelCategory', event.target.value)}
                        className="w-full rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-white outline-none"
                      >
                        <option value="">Select category</option>
                        {CATEGORIES.map((category) => (
                          <option key={category} value={category}>
                            {category}
                          </option>
                        ))}
                      </select>
                    </FormField>

                    <FormField error={errors.weight} htmlFor="weight" label="Weight (kg)">
                      <input
                        id="weight"
                        min="0.1"
                        max="15"
                        step="0.1"
                        type="number"
                        value={draft.weight}
                        onChange={(event) => updateField('weight', event.target.value)}
                        className="w-full rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-white outline-none"
                      />
                    </FormField>
                  </div>

                  <div className="grid gap-5 md:grid-cols-2">
                    <FormField error={errors.dimensions} htmlFor="dimensions" label="Parcel size">
                      <select
                        id="dimensions"
                        value={draft.dimensions}
                        onChange={(event) => updateField('dimensions', event.target.value)}
                        className="w-full rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-white outline-none"
                      >
                        <option value="">Select size</option>
                        {DIMENSIONS.map((dimension) => (
                          <option key={dimension} value={dimension}>
                            {dimension}
                          </option>
                        ))}
                      </select>
                    </FormField>

                    <FormField error={errors.declaredValue} htmlFor="declaredValue" label="Declared value">
                      <select
                        id="declaredValue"
                        value={draft.declaredValue}
                        onChange={(event) => updateField('declaredValue', event.target.value)}
                        className="w-full rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-white outline-none"
                      >
                        <option value="">Select declared value</option>
                        {DECLARED_VALUES.map((value) => (
                          <option key={value} value={value}>
                            {value}
                          </option>
                        ))}
                      </select>
                    </FormField>
                  </div>

                  <FormField
                    description="Optional context for the traveler. React safely escapes this content before rendering."
                    error={errors.description}
                    htmlFor="description"
                    label="Parcel notes"
                  >
                    <textarea
                      id="description"
                      rows={4}
                      value={draft.description}
                      onChange={(event) => updateField('description', event.target.value)}
                      className="w-full rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-white outline-none"
                      placeholder="Example: fragile, keep upright, or pickup landmark"
                    />
                  </FormField>

                  <FormField
                    description="Image names are stored as references only in this client-only demo."
                    error={errors.photoNames}
                    htmlFor="photos"
                    label="Reference photos"
                  >
                    <label className="flex cursor-pointer flex-col items-center justify-center gap-3 rounded-[1.75rem] border border-dashed border-white/15 bg-white/5 px-6 py-10 text-center text-sm text-slate-300 transition hover:border-amber-300/40 hover:bg-white/10">
                      <ImagePlus className="h-8 w-8 text-amber-300" />
                      <span>Upload up to 4 supporting images</span>
                      <input
                        id="photos"
                        type="file"
                        multiple
                        accept="image/*"
                        className="sr-only"
                        onChange={(event) => {
                          const photoNames = Array.from(event.target.files ?? [])
                            .slice(0, 4)
                            .map((file) => file.name);
                          updateField('photoNames', photoNames);
                        }}
                      />
                    </label>
                    {draft.photoNames.length > 0 ? (
                      <div className="flex flex-wrap gap-2">
                        {draft.photoNames.map((name) => (
                          <span key={name} className="rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs text-slate-300">
                            {name}
                          </span>
                        ))}
                      </div>
                    ) : null}
                  </FormField>
                </motion.div>
              ) : null}

              {step === 2 ? (
                <motion.div initial={{ opacity: 0, x: 18 }} animate={{ opacity: 1, x: 0 }} className="grid gap-5">
                  <div className="grid gap-5 md:grid-cols-2">
                    <FormField error={errors.fromCity} htmlFor="fromCity" label="From city">
                      <select
                        id="fromCity"
                        value={draft.fromCity}
                        onChange={(event) => updateField('fromCity', event.target.value)}
                        className="w-full rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-white outline-none"
                      >
                        <option value="">Select origin city</option>
                        {CITIES.map((city) => (
                          <option key={city} value={city}>
                            {city}
                          </option>
                        ))}
                      </select>
                    </FormField>

                    <FormField error={errors.toCity} htmlFor="toCity" label="To city">
                      <select
                        id="toCity"
                        value={draft.toCity}
                        onChange={(event) => updateField('toCity', event.target.value)}
                        className="w-full rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-white outline-none"
                      >
                        <option value="">Select destination city</option>
                        {CITIES.map((city) => (
                          <option key={city} value={city}>
                            {city}
                          </option>
                        ))}
                      </select>
                    </FormField>
                  </div>

                  <FormField error={errors.pickupAddress} htmlFor="pickupAddress" label="Pickup address">
                    <textarea
                      id="pickupAddress"
                      rows={4}
                      value={draft.pickupAddress}
                      onChange={(event) => updateField('pickupAddress', event.target.value)}
                      className="w-full rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-white outline-none"
                      placeholder="Apartment, landmark, and contact-safe handoff instructions"
                    />
                  </FormField>

                  <FormField error={errors.dropoffAddress} htmlFor="dropoffAddress" label="Drop-off address">
                    <textarea
                      id="dropoffAddress"
                      rows={4}
                      value={draft.dropoffAddress}
                      onChange={(event) => updateField('dropoffAddress', event.target.value)}
                      className="w-full rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-white outline-none"
                      placeholder="Receiver address and the best delivery window"
                    />
                  </FormField>

                  <FormField error={errors.pickupDate} htmlFor="pickupDate" label="Pickup date">
                    <input
                      id="pickupDate"
                      min={today}
                      type="date"
                      value={draft.pickupDate}
                      onChange={(event) => updateField('pickupDate', event.target.value)}
                      className="w-full rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-white outline-none"
                    />
                  </FormField>
                </motion.div>
              ) : null}

              {step === 3 ? (
                <motion.div initial={{ opacity: 0, x: 18 }} animate={{ opacity: 1, x: 0 }} className="space-y-5">
                  <FormField
                    description="Rewards are shown to travelers and held until the final delivery confirmation step."
                    error={errors.reward}
                    htmlFor="reward"
                    label="Traveler reward (Rs)"
                  >
                    <input
                      id="reward"
                      min="100"
                      max="5000"
                      step="50"
                      type="number"
                      value={draft.reward}
                      onChange={(event) => updateField('reward', event.target.value)}
                      className="w-full rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-white outline-none"
                    />
                  </FormField>

                  <Card className="space-y-4 bg-white/5">
                    <div className="flex items-center gap-3">
                      <Package2 className="h-5 w-5 text-amber-300" />
                      <h2 className="text-lg font-semibold text-white">Submission summary</h2>
                    </div>
                    <div className="grid gap-3 text-sm text-slate-300 sm:grid-cols-2">
                      <p><span className="text-slate-500">Route:</span> {draft.fromCity || 'Origin'} -&gt; {draft.toCity || 'Destination'}</p>
                      <p><span className="text-slate-500">Category:</span> {draft.parcelCategory || 'Pending selection'}</p>
                      <p><span className="text-slate-500">Pickup date:</span> {draft.pickupDate || 'Not set'}</p>
                      <p><span className="text-slate-500">Reward:</span> {draft.reward ? `Rs ${draft.reward}` : 'Not set'}</p>
                    </div>
                  </Card>

                  <label className="flex items-start gap-3 rounded-2xl border border-white/10 bg-white/5 p-4 text-sm text-slate-300">
                    <input
                      checked={draft.termsAccepted}
                      onChange={(event) => updateField('termsAccepted', event.target.checked)}
                      type="checkbox"
                      className="mt-1 h-4 w-4 rounded border-white/20 bg-slate-950 text-amber-400"
                    />
                    <span>
                      I confirm the parcel details are accurate, the contents are lawful, and the reward should remain in escrow until delivery is confirmed.
                    </span>
                  </label>
                  {errors.termsAccepted ? <p className="text-xs text-red-300">{errors.termsAccepted}</p> : null}
                </motion.div>
              ) : null}

              <div className="flex flex-col gap-3 border-t border-white/10 pt-4 sm:flex-row sm:justify-between">
                <Button onClick={handlePreviousStep} size="lg" variant="ghost" disabled={step === 1}>
                  <ArrowLeft className="h-4 w-4" />
                  Back
                </Button>

                {step < 3 ? (
                  <Button onClick={handleNextStep} size="lg">
                    Next
                    <ArrowRight className="h-4 w-4" />
                  </Button>
                ) : (
                  <Button size="lg" type="submit" disabled={submitting}>
                    {submitting ? 'Posting request...' : 'Post delivery request'}
                  </Button>
                )}
              </div>
            </Card>
          </form>

          <div className="space-y-6">
            <Card highlighted>
              <p className="text-sm uppercase tracking-[0.25em] text-amber-200">Why this is safer</p>
              <ul className="mt-4 space-y-3 text-sm leading-7 text-slate-300">
                <li>Validated city pairs reduce broken matches and inconsistent route data.</li>
                <li>Sanitized notes and address fields avoid unsafe client-rendered content.</li>
                <li>Submission errors are surfaced clearly before anything is stored.</li>
              </ul>
            </Card>

            <Card>
              <h2 className="text-xl font-semibold text-white">What happens after submission?</h2>
              <ol className="mt-4 space-y-3 text-sm leading-7 text-slate-300">
                <li>1. Your request is saved to persistent local data for dashboard review.</li>
                <li>2. Travelers see the route in the marketplace views.</li>
                <li>3. Final delivery confirmation happens through the dashboard OTP flow.</li>
              </ol>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}
