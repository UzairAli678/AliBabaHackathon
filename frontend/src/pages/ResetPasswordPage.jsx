import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import AuthLayout from '../components/AuthLayout';
import TextField from '../components/TextField';
import { hasSupabaseConfig, supabase } from '../lib/supabase';

const minimumPasswordLength = 6;

export default function ResetPasswordPage() {
  const [form, setForm] = useState({ password: '', confirmPassword: '' });
  const [errors, setErrors] = useState({});
  const [recoveryReady, setRecoveryReady] = useState(false);
  const [checkingSession, setCheckingSession] = useState(true);
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [message, setMessage] = useState('');

  useEffect(() => {
    if (!hasSupabaseConfig || !supabase) {
      setMessage('Supabase is not configured. Add VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY to frontend/.env.');
      setCheckingSession(false);
      return undefined;
    }

    let mounted = true;
    const recoveryInUrl = new URLSearchParams(window.location.search).get('type') === 'recovery'
      || new URLSearchParams(window.location.hash.replace(/^#/, '')).get('type') === 'recovery';

    const { data: authListener } = supabase.auth.onAuthStateChange((event, session) => {
      if (!mounted) return;
      if (event === 'PASSWORD_RECOVERY') {
        setRecoveryReady(Boolean(session));
        setMessage('');
        setCheckingSession(false);
      }
    });

    supabase.auth.getSession().then(({ data, error }) => {
      if (!mounted) return;
      if (error) {
        setMessage(error.message);
      } else if (recoveryInUrl && data.session) {
        setRecoveryReady(true);
      } else if (!data.session) {
        setMessage('This reset link is invalid or has expired. Request a new password reset email.');
      } else {
        setMessage('Open this page from the password recovery link in your email.');
      }
      setCheckingSession(false);
    });

    return () => {
      mounted = false;
      authListener.subscription.unsubscribe();
    };
  }, []);

  const validate = () => {
    const nextErrors = {};
    if (form.password.length < minimumPasswordLength) {
      nextErrors.password = `Password must be at least ${minimumPasswordLength} characters.`;
    }
    if (!form.confirmPassword) {
      nextErrors.confirmPassword = 'Please confirm your new password.';
    } else if (form.password !== form.confirmPassword) {
      nextErrors.confirmPassword = 'Passwords do not match.';
    }
    setErrors(nextErrors);
    return Object.keys(nextErrors).length === 0;
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setMessage('');
    if (!validate() || !supabase || !recoveryReady) return;

    setLoading(true);
    const { error } = await supabase.auth.updateUser({ password: form.password });
    setLoading(false);

    if (error) {
      setMessage(error.message);
      return;
    }

    await supabase.auth.signOut();
    setSuccess(true);
    setForm({ password: '', confirmPassword: '' });
  };

  return (
    <AuthLayout title="Set a new password" subtitle="Choose a secure new password for your CareLedger AI account.">
      {success ? (
        <div className="space-y-5 text-center">
          <div className="rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-4 text-sm leading-6 text-positive">
            Your password has been updated successfully.
          </div>
          <Link to="/signin" className="inline-flex w-full items-center justify-center rounded-2xl bg-primary px-5 py-3.5 text-sm font-medium text-white transition hover:opacity-90">
            Continue to Sign In
          </Link>
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="space-y-5">
          <TextField
            label="New password"
            type="password"
            autoComplete="new-password"
            placeholder="At least 6 characters"
            value={form.password}
            error={errors.password}
            disabled={!recoveryReady || checkingSession}
            onChange={(event) => setForm((current) => ({ ...current, password: event.target.value }))}
          />
          <TextField
            label="Confirm new password"
            type="password"
            autoComplete="new-password"
            placeholder="Enter the password again"
            value={form.confirmPassword}
            error={errors.confirmPassword}
            disabled={!recoveryReady || checkingSession}
            onChange={(event) => setForm((current) => ({ ...current, confirmPassword: event.target.value }))}
          />

          {checkingSession ? <div className="rounded-2xl border border-border bg-slate-50 px-4 py-3 text-sm text-muted">Verifying your recovery link...</div> : null}
          {message ? <div className="rounded-2xl border border-critical/20 bg-rose-50 px-4 py-3 text-sm text-critical">{message}</div> : null}

          <button
            type="submit"
            disabled={loading || checkingSession || !recoveryReady}
            className="inline-flex w-full items-center justify-center rounded-2xl bg-primary px-5 py-3.5 text-sm font-medium text-white transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {loading ? 'Updating password...' : 'Update password'}
          </button>

          {!recoveryReady && !checkingSession ? <p className="text-center text-sm text-muted"><Link to="/forgot-password" className="font-medium text-primary hover:underline">Request a new reset link</Link></p> : null}
        </form>
      )}
    </AuthLayout>
  );
}
