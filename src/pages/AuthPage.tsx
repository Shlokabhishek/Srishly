import * as React from 'react';
import { Camera, LoaderCircle, Lock, Mail, Phone, ScanLine, UserRound, WalletCards } from 'lucide-react';
import { useLocation, useNavigate } from 'react-router-dom';

import Button from '@/components/ui/Button';
import Card from '@/components/ui/Card';
import ErrorBanner from '@/components/ui/ErrorBanner';
import FormField from '@/components/ui/FormField';
import StatusBadge from '@/components/ui/StatusBadge';
import { ROUTES } from '@/constants';
import { useAuth } from '@/context/AuthContext';
import { useDocumentMeta } from '@/hooks/useDocumentMeta';
import { isShardaEmail, normalizeName, normalizePhone, normalizeStudentId, parseIdCardText, validateRegistrationInput } from '@/lib/auth';
import type { ParsedIdCard } from '@/types';

type AuthMode = 'login' | 'register';

export default function AuthPage() {
  const { login, register, session } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const redirectTo = (location.state as { from?: string } | null)?.from || ROUTES.dashboard;

  const [mode, setMode] = React.useState<AuthMode>('register');
  const [email, setEmail] = React.useState('');
  const [password, setPassword] = React.useState('');
  const [phone, setPhone] = React.useState('');
  const [name, setName] = React.useState('');
  const [studentIdNumber, setStudentIdNumber] = React.useState('');
  const [idCardImageName, setIdCardImageName] = React.useState('');
  const [ocrResult, setOcrResult] = React.useState<ParsedIdCard | null>(null);
  const [ocrLoading, setOcrLoading] = React.useState(false);
  const [submitting, setSubmitting] = React.useState(false);
  const [error, setError] = React.useState('');

  useDocumentMeta(
    'Sharda authentication',
    'Sign in with your @sharda.ac.in account, upload your student ID card, and autofill profile details securely.',
  );

  React.useEffect(() => {
    if (session) {
      navigate(redirectTo, { replace: true });
    }
  }, [navigate, redirectTo, session]);

  async function handleIdCardUpload(file: File | null) {
    if (!file) {
      return;
    }

    setError('');
    setOcrLoading(true);

    try {
      const { createWorker } = await import('tesseract.js');
      const worker = await createWorker('eng');
      const {
        data: { text },
      } = await worker.recognize(file);
      await worker.terminate();

      const parsed = parseIdCardText(text);
      setOcrResult(parsed);
      setIdCardImageName(file.name);

      if (parsed.extractedName) {
        setName(parsed.extractedName);
      }

      if (parsed.extractedStudentId) {
        setStudentIdNumber(parsed.extractedStudentId);
      }

      if (parsed.extractedEmail && !email) {
        setEmail(parsed.extractedEmail);
      }

      if (parsed.confidence < 40) {
        setError('We could not confidently verify the uploaded card. Please use a clearer Sharda ID image.');
      }
    } catch {
      setError('We could not read the ID card. Try a clearer image with the full card visible.');
    } finally {
      setOcrLoading(false);
    }
  }

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError('');

    try {
      setSubmitting(true);

      if (mode === 'login') {
        await login({ email, password });
        navigate(redirectTo, { replace: true });
        return;
      }

      const registrationErrors = validateRegistrationInput({
        email,
        password,
        phone,
        name,
        studentIdNumber,
        idCardImageName,
      });

      const firstError = Object.values(registrationErrors)[0];
      if (firstError) {
        setError(firstError);
        return;
      }

      if (!ocrResult || ocrResult.confidence < 40 || !ocrResult.rawText.toUpperCase().includes('SHARDA')) {
        setError('Upload a valid Sharda University ID card image before continuing.');
        return;
      }

      await register({
        email,
        password,
        phone: normalizePhone(phone),
        name: normalizeName(name),
        studentIdNumber: normalizeStudentId(studentIdNumber),
        idCardImageName,
      });

      navigate(redirectTo, { replace: true });
    } catch (submissionError) {
      setError(submissionError instanceof Error ? submissionError.message : 'Authentication failed.');
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="px-4 py-12 sm:px-6 lg:px-8">
      <div className="mx-auto grid max-w-6xl gap-8 lg:grid-cols-[0.9fr_1.1fr]">
        <Card highlighted className="space-y-5">
          <p className="text-sm uppercase tracking-[0.25em] text-amber-200">Student authentication</p>
          <h1 className="text-4xl font-semibold text-white">Sharda-only access with ID-card assisted onboarding.</h1>
          <p className="text-sm leading-7 text-slate-300">
            Register using your official <code>@sharda.ac.in</code> email, upload your university ID card, let OCR prefill
            your name and student ID, then confirm your phone number.
          </p>
          <ul className="space-y-3 text-sm leading-7 text-slate-300">
            <li>Email domain is restricted to Sharda accounts.</li>
            <li>ID card OCR looks for Sharda branding, your name, and student identifier text.</li>
            <li>Accounts are managed by Supabase Auth with persistent browser sessions.</li>
          </ul>
          {ocrResult ? (
            <div className="space-y-3 rounded-2xl border border-white/10 bg-white/5 p-4">
              <div className="flex items-center justify-between">
                <span className="text-sm font-semibold text-white">OCR result</span>
                <StatusBadge tone={ocrResult.confidence >= 60 ? 'success' : 'warning'}>
                  confidence {ocrResult.confidence}%
                </StatusBadge>
              </div>
              <p className="text-sm text-slate-300">Name: {ocrResult.extractedName || 'Not found'}</p>
              <p className="text-sm text-slate-300">Student ID: {ocrResult.extractedStudentId || 'Not found'}</p>
              <p className="text-sm text-slate-400">Detected email: {ocrResult.extractedEmail || 'Not found'}</p>
            </div>
          ) : null}
        </Card>

        <Card className="space-y-6">
          <div className="inline-flex rounded-full border border-white/10 bg-white/5 p-1">
            <button
              type="button"
              onClick={() => setMode('register')}
              className={`rounded-full px-5 py-2 text-sm font-semibold transition ${mode === 'register' ? 'bg-amber-500 text-slate-950' : 'text-slate-300'}`}
            >
              Register
            </button>
            <button
              type="button"
              onClick={() => setMode('login')}
              className={`rounded-full px-5 py-2 text-sm font-semibold transition ${mode === 'login' ? 'bg-amber-500 text-slate-950' : 'text-slate-300'}`}
            >
              Login
            </button>
          </div>

          {error ? <ErrorBanner message={error} /> : null}

          <form className="space-y-5" onSubmit={handleSubmit}>
            <FormField htmlFor="auth-email" label="Sharda email">
              <div className="flex items-center gap-3 rounded-2xl border border-white/10 bg-white/5 px-4 py-3">
                <Mail className="h-4 w-4 text-amber-300" />
                <input
                  id="auth-email"
                  type="email"
                  value={email}
                  onChange={(event) => setEmail(event.target.value)}
                  placeholder="your.name@sharda.ac.in"
                  className="w-full bg-transparent text-white outline-none"
                />
              </div>
            </FormField>

            <FormField htmlFor="auth-password" label="Password">
              <div className="flex items-center gap-3 rounded-2xl border border-white/10 bg-white/5 px-4 py-3">
                <Lock className="h-4 w-4 text-amber-300" />
                <input
                  id="auth-password"
                  type="password"
                  value={password}
                  onChange={(event) => setPassword(event.target.value)}
                  placeholder="At least 8 characters"
                  className="w-full bg-transparent text-white outline-none"
                />
              </div>
            </FormField>

            {mode === 'register' ? (
              <>
                <FormField
                  htmlFor="auth-id-card"
                  label="Student ID card image"
                  description="Upload a clear front image of your Sharda ID card so we can read the printed details."
                >
                  <label className="flex cursor-pointer items-center justify-between gap-4 rounded-2xl border border-dashed border-white/15 bg-white/5 px-4 py-4 text-sm text-slate-300 transition hover:border-amber-300/40">
                    <div className="flex items-center gap-3">
                      <Camera className="h-5 w-5 text-amber-300" />
                      <span>{idCardImageName || 'Choose ID card image'}</span>
                    </div>
                    {ocrLoading ? <LoaderCircle className="h-4 w-4 animate-spin text-amber-300" /> : <ScanLine className="h-4 w-4 text-amber-300" />}
                    <input
                      id="auth-id-card"
                      type="file"
                      accept="image/*"
                      className="sr-only"
                      onChange={(event) => void handleIdCardUpload(event.target.files?.[0] ?? null)}
                    />
                  </label>
                </FormField>

                <div className="grid gap-5 md:grid-cols-2">
                  <FormField htmlFor="auth-name" label="Full name">
                    <div className="flex items-center gap-3 rounded-2xl border border-white/10 bg-white/5 px-4 py-3">
                      <UserRound className="h-4 w-4 text-amber-300" />
                      <input
                        id="auth-name"
                        value={name}
                        onChange={(event) => setName(event.target.value)}
                        placeholder="Autofilled from ID card"
                        className="w-full bg-transparent text-white outline-none"
                      />
                    </div>
                  </FormField>

                  <FormField htmlFor="auth-student-id" label="Student ID number">
                    <div className="flex items-center gap-3 rounded-2xl border border-white/10 bg-white/5 px-4 py-3">
                      <WalletCards className="h-4 w-4 text-amber-300" />
                      <input
                        id="auth-student-id"
                        value={studentIdNumber}
                        onChange={(event) => setStudentIdNumber(event.target.value)}
                        placeholder="Autofilled from ID card"
                        className="w-full bg-transparent text-white outline-none"
                      />
                    </div>
                  </FormField>
                </div>

                <FormField htmlFor="auth-phone" label="Phone number">
                  <div className="flex items-center gap-3 rounded-2xl border border-white/10 bg-white/5 px-4 py-3">
                    <Phone className="h-4 w-4 text-amber-300" />
                    <input
                      id="auth-phone"
                      value={phone}
                      onChange={(event) => setPhone(event.target.value)}
                      placeholder="10-digit mobile number"
                      className="w-full bg-transparent text-white outline-none"
                    />
                  </div>
                </FormField>
              </>
            ) : null}

            {!isShardaEmail(email) && email ? (
              <p className="text-sm text-red-300">Only Sharda University email addresses are allowed.</p>
            ) : null}

            <Button className="w-full" size="lg" type="submit" disabled={submitting || ocrLoading}>
              {submitting ? 'Processing...' : mode === 'register' ? 'Create account' : 'Login'}
            </Button>
          </form>
        </Card>
      </div>
    </div>
  );
}
