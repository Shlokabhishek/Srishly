import * as React from 'react';
import { Camera, LoaderCircle, Lock, Mail, Phone, ScanLine, ShieldCheck, UserRound, WalletCards } from 'lucide-react';
import { useLocation, useNavigate } from 'react-router-dom';

import Button from '@/components/ui/Button';
import Card from '@/components/ui/Card';
import ErrorBanner from '@/components/ui/ErrorBanner';
import FormField from '@/components/ui/FormField';
import StatusBadge from '@/components/ui/StatusBadge';
import { ROUTES } from '@/constants';
import { useAuth } from '@/context/AuthContext';
import { useDocumentMeta } from '@/hooks/useDocumentMeta';
import { isSupabaseConfigured } from '@/lib/supabase';
import { isValidEmail, normalizeName, normalizePhone, normalizeStudentId, parseIdCardText, validateRegistrationInput } from '@/lib/auth';
import type { ParsedIdCard } from '@/types';

type AuthMode = 'login' | 'register' | 'admin';

export default function AuthPage() {
  const { login, register, refreshSession, requestPasswordReset, session } = useAuth();
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
  const [notice, setNotice] = React.useState('');
  const [emailTouched, setEmailTouched] = React.useState(false);
  const [awaitingVerification, setAwaitingVerification] = React.useState(false);
  const [verificationEmail, setVerificationEmail] = React.useState('');
  const [showReset, setShowReset] = React.useState(false);
  const [resetEmail, setResetEmail] = React.useState('');
  const [resetPasswordValue, setResetPasswordValue] = React.useState('');
  const [resetConfirmValue, setResetConfirmValue] = React.useState('');

  useDocumentMeta(
    'Account access',
    'Register, sign in, reset your password, or access the admin approval flow.',
  );

  React.useEffect(() => {
    if (session) {
      navigate(session.user.isAdmin ? ROUTES.verificationHub : awaitingVerification ? ROUTES.home : redirectTo, { replace: true });
    }
  }, [awaitingVerification, navigate, redirectTo, session]);

  React.useEffect(() => {
    setError('');
    setNotice('');
    setAwaitingVerification(false);
    setVerificationEmail('');
    setShowReset(false);
  }, [mode]);

  React.useEffect(() => {
    if (!awaitingVerification || session) {
      return;
    }

    const interval = window.setInterval(() => {
      void refreshSession();
    }, 4000);

    return () => {
      window.clearInterval(interval);
    };
  }, [awaitingVerification, refreshSession, session]);

  const normalizedEmail = email.trim().toLowerCase();
  const emailLooksValid = isValidEmail(normalizedEmail);
  const shouldShowEmailError = emailTouched && normalizedEmail.length > 0 && !emailLooksValid;
  const isRegisterMode = mode === 'register';
  const isAdminMode = mode === 'admin';
  const isSubmitDisabled =
    submitting ||
    ocrLoading ||
    (isRegisterMode
      ? !emailLooksValid || !password || !phone || !name || !studentIdNumber
      : !emailLooksValid || !password);

  async function handleIdCardUpload(file: File | null) {
    if (!file) {
      return;
    }

    setError('');
    setNotice('');
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
        setEmailTouched(true);
      }

      setNotice(parsed.confidence >= 40 ? 'ID proof scanned. You can still edit the fields.' : 'ID proof uploaded. Fill any missing details manually.');
    } catch {
      setError('We could not read the ID image. You can still fill the fields manually.');
      setIdCardImageName(file.name);
    } finally {
      setOcrLoading(false);
    }
  }

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError('');
    setNotice('');

    try {
      setSubmitting(true);

      if (!isRegisterMode) {
        const nextSession = await login({ email, password });
        navigate(nextSession.user.isAdmin ? ROUTES.verificationHub : redirectTo, { replace: true });
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

      const result = await register({
        email,
        password,
        phone: normalizePhone(phone),
        name: normalizeName(name),
        studentIdNumber: normalizeStudentId(studentIdNumber),
        idCardImageName,
      });

      if (result.requiresEmailVerification) {
        setAwaitingVerification(true);
        setVerificationEmail(result.email);
        return;
      }

      navigate(redirectTo, { replace: true });
    } catch (submissionError) {
      setError(submissionError instanceof Error ? submissionError.message : 'Authentication failed.');
    } finally {
      setSubmitting(false);
    }
  }

  async function handlePasswordReset(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError('');
    setNotice('');

    const targetEmail = (resetEmail || email).trim().toLowerCase();
    if (!isValidEmail(targetEmail)) {
      setError('Enter a valid email to reset the password.');
      return;
    }

    if (!isSupabaseConfigured) {
      if (resetPasswordValue.length < 8) {
        setError('New password must be at least 8 characters.');
        return;
      }

      if (resetPasswordValue !== resetConfirmValue) {
        setError('Passwords do not match.');
        return;
      }
    }

    try {
      setSubmitting(true);
      const message = await requestPasswordReset(targetEmail, resetPasswordValue);
      setNotice(message);
      setShowReset(false);
      setResetEmail('');
      setResetPasswordValue('');
      setResetConfirmValue('');
    } catch (submissionError) {
      setError(submissionError instanceof Error ? submissionError.message : 'Password reset failed.');
    } finally {
      setSubmitting(false);
    }
  }

  function switchMode(nextMode: AuthMode) {
    setMode(nextMode);

    if (nextMode === 'admin') {
      setEmail('');
      setPassword('');
      setEmailTouched(false);
      return;
    }

    if (mode === 'admin') {
      setEmail('');
      setPassword('');
      setEmailTouched(false);
    }
  }

  return (
    <div className="px-4 py-12 sm:px-6 lg:px-8">
      <div className="mx-auto grid max-w-6xl gap-8 lg:grid-cols-[0.9fr_1.1fr]">
        <Card highlighted className="space-y-5">
          <p className="text-sm uppercase tracking-[0.25em] text-zinc-400">Account access</p>
          <h1 className="text-4xl font-semibold text-zinc-50">Access your account without the extra noise.</h1>
          <p className="text-sm leading-7 text-zinc-300">
            Create an account, sign back in, or request a password reset from one place. ID proof is optional, but it helps speed up trust approval.
          </p>
          <div className="grid gap-3 sm:grid-cols-3">
            <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
              <p className="text-sm font-semibold text-white">Register</p>
              <p className="mt-2 text-sm leading-6 text-slate-300">Create a trusted account with your basic details and optional ID proof.</p>
            </div>
            <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
              <p className="text-sm font-semibold text-white">Reset</p>
              <p className="mt-2 text-sm leading-6 text-slate-300">Recover access directly from the login screen whenever you need it.</p>
            </div>
            <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
              <p className="text-sm font-semibold text-white">Admin</p>
              <p className="mt-2 text-sm leading-6 text-slate-300">Authorized admins can review verification requests after signing in.</p>
            </div>
          </div>
          <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
            <div className="flex items-center justify-between gap-3">
              <p className="text-sm font-semibold text-white">Authentication status</p>
              <StatusBadge tone={isSupabaseConfigured ? 'success' : 'warning'}>
                {isSupabaseConfigured ? 'Supabase live' : 'Local demo auth'}
              </StatusBadge>
            </div>
            <p className="mt-3 text-sm leading-6 text-slate-300">
              Demo and live auth are both supported here, but administrator credentials are intentionally hidden from the public interface.
            </p>
          </div>
          {ocrResult ? (
            <div className="space-y-3 rounded-2xl border border-white/10 bg-white/5 p-4">
              <div className="flex items-center justify-between">
                <span className="text-sm font-semibold text-white">ID scan</span>
                <StatusBadge tone={ocrResult.confidence >= 60 ? 'success' : 'warning'}>
                  {ocrResult.confidence}% match
                </StatusBadge>
              </div>
              <p className="text-sm text-slate-300">Name: {ocrResult.extractedName || 'Not found'}</p>
              <p className="text-sm text-slate-300">Student ID: {ocrResult.extractedStudentId || 'Not found'}</p>
              <p className="text-sm text-slate-400">Detected email: {ocrResult.extractedEmail || 'Not found'}</p>
            </div>
          ) : null}
        </Card>

        <Card className="space-y-6">
          <div className="inline-flex rounded-full border border-zinc-800 bg-zinc-950/50 p-1">
            <button
              type="button"
              onClick={() => switchMode('register')}
              className={`rounded-full px-5 py-2 text-sm font-semibold transition ${mode === 'register' ? 'bg-zinc-100 text-zinc-950' : 'text-zinc-300'}`}
            >
              Register
            </button>
            <button
              type="button"
              onClick={() => switchMode('login')}
              className={`rounded-full px-5 py-2 text-sm font-semibold transition ${mode === 'login' ? 'bg-zinc-100 text-zinc-950' : 'text-zinc-300'}`}
            >
              Login
            </button>
            <button
              type="button"
              onClick={() => switchMode('admin')}
              className={`rounded-full px-5 py-2 text-sm font-semibold transition ${mode === 'admin' ? 'bg-zinc-100 text-zinc-950' : 'text-zinc-300'}`}
            >
              Admin
            </button>
          </div>

          {error ? <ErrorBanner message={error} /> : null}
          {notice ? <StatusBadge tone="success">{notice}</StatusBadge> : null}
          {awaitingVerification ? (
            <div className="space-y-3 rounded-2xl border border-emerald-400/20 bg-emerald-500/10 px-4 py-4 text-sm text-emerald-100">
              <div className="flex items-center justify-between gap-3">
                <p className="font-semibold text-white">Verify your email to continue</p>
                <StatusBadge tone="success">waiting</StatusBadge>
              </div>
              <p>
                We sent a verification link to <span className="font-medium text-white">{verificationEmail || normalizedEmail}</span>.
              </p>
            </div>
          ) : null}

          <form className="space-y-5" onSubmit={handleSubmit}>
            <FormField htmlFor="auth-email" label={isAdminMode ? 'Admin email' : 'Email'}>
              <div className="flex items-center gap-3 rounded-2xl border border-white/10 bg-white/5 px-4 py-3">
                <Mail className="h-4 w-4 text-amber-300" />
                <input
                  id="auth-email"
                  type="email"
                  value={email}
                  onChange={(event) => setEmail(event.target.value)}
                  onBlur={() => setEmailTouched(true)}
                  placeholder={isAdminMode ? 'Enter your admin email' : 'name@example.com'}
                  className="w-full bg-transparent text-white outline-none"
                  autoComplete={mode === 'register' ? 'email' : 'username'}
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
                  placeholder={isAdminMode ? 'Enter admin password' : 'At least 8 characters'}
                  className="w-full bg-transparent text-white outline-none"
                  autoComplete={mode === 'register' ? 'new-password' : 'current-password'}
                />
              </div>
            </FormField>

            {isRegisterMode ? (
              <>
                <FormField
                  htmlFor="auth-id-card"
                  label="ID proof image"
                  description="Optional, but recommended for faster admin trust approval."
                >
                  <label className="flex cursor-pointer items-center justify-between gap-4 rounded-2xl border border-dashed border-white/15 bg-white/5 px-4 py-4 text-sm text-slate-300 transition hover:border-amber-300/40">
                    <div className="flex items-center gap-3">
                      <Camera className="h-5 w-5 text-amber-300" />
                      <span>{idCardImageName || 'Choose ID image'}</span>
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
                        placeholder="Your full name"
                        className="w-full bg-transparent text-white outline-none"
                      />
                    </div>
                  </FormField>

                  <FormField htmlFor="auth-student-id" label="Student ID / ID number">
                    <div className="flex items-center gap-3 rounded-2xl border border-white/10 bg-white/5 px-4 py-3">
                      <WalletCards className="h-4 w-4 text-amber-300" />
                      <input
                        id="auth-student-id"
                        value={studentIdNumber}
                        onChange={(event) => setStudentIdNumber(event.target.value)}
                        placeholder="ID number"
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

            {shouldShowEmailError ? <p className="text-sm text-red-300">Enter a valid email address.</p> : null}

            <Button className="w-full" size="lg" type="submit" disabled={awaitingVerification || isSubmitDisabled}>
              {submitting ? 'Processing...' : awaitingVerification ? 'Waiting for verification...' : isRegisterMode ? 'Create account' : isAdminMode ? 'Login as admin' : 'Login'}
            </Button>
          </form>

          {!isRegisterMode ? (
            <div className="space-y-4 rounded-2xl border border-white/10 bg-white/5 p-4">
              <div className="flex items-center justify-between gap-3">
                <p className="text-sm font-semibold text-white">Reset password</p>
                <button
                  type="button"
                  onClick={() => setShowReset((current) => !current)}
                  className="text-sm font-medium text-amber-200 transition hover:text-amber-100"
                >
                  {showReset ? 'Hide' : 'Open'}
                </button>
              </div>

              {showReset ? (
                <form className="space-y-4" onSubmit={handlePasswordReset}>
                  <FormField htmlFor="reset-email" label="Email">
                    <input
                      id="reset-email"
                      type="email"
                      value={resetEmail}
                      onChange={(event) => setResetEmail(event.target.value)}
                      placeholder="name@example.com"
                      className="w-full rounded-2xl border border-white/10 bg-slate-950/40 px-4 py-3 text-white outline-none"
                    />
                  </FormField>

                  {!isSupabaseConfigured ? (
                    <>
                      <FormField htmlFor="reset-password" label="New password">
                        <input
                          id="reset-password"
                          type="password"
                          value={resetPasswordValue}
                          onChange={(event) => setResetPasswordValue(event.target.value)}
                          placeholder="At least 8 characters"
                          className="w-full rounded-2xl border border-white/10 bg-slate-950/40 px-4 py-3 text-white outline-none"
                        />
                      </FormField>

                      <FormField htmlFor="reset-confirm" label="Confirm password">
                        <input
                          id="reset-confirm"
                          type="password"
                          value={resetConfirmValue}
                          onChange={(event) => setResetConfirmValue(event.target.value)}
                          placeholder="Repeat password"
                          className="w-full rounded-2xl border border-white/10 bg-slate-950/40 px-4 py-3 text-white outline-none"
                        />
                      </FormField>
                    </>
                  ) : null}

                  <Button type="submit" variant="secondary" disabled={submitting}>
                    {isSupabaseConfigured ? 'Send reset email' : 'Update password'}
                  </Button>
                </form>
              ) : (
                <p className="text-sm text-slate-400">
                  {isSupabaseConfigured ? 'Send yourself a reset email.' : 'Set a new password directly for the local demo account.'}
                </p>
              )}
            </div>
          ) : null}

          {isAdminMode ? (
            <div className="rounded-2xl border border-amber-400/20 bg-amber-500/10 p-4 text-sm text-amber-100">
              After login, the admin is sent to the trust approval queue to approve or reject user verification requests.
            </div>
          ) : null}
        </Card>
      </div>
    </div>
  );
}
