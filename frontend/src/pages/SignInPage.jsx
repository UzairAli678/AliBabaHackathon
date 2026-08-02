import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { hasSupabaseConfig, supabase } from '../lib/supabase';
import AuthLayout from '../components/AuthLayout';
import AuthDivider from '../components/AuthDivider';
import GoogleIcon from '../components/GoogleIcon';
import TextField from '../components/TextField';

export default function SignInPage() {
  const navigate = useNavigate();
  const [form, setForm] = useState({ email: '', password: '' });
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);
  const [oauthLoading, setOauthLoading] = useState(false);
  const [message, setMessage] = useState('');

  const explainSigninError = (errorMessage) => {
    const lowerMessage = errorMessage.toLowerCase();

    if (lowerMessage.includes('invalid login credentials')) {
      return 'Invalid login credentials. If you just signed up, confirm your email first. If this email was already registered, use Forgot password to reset it.';
    }

    if (lowerMessage.includes('email not confirmed')) {
      return 'Please confirm your email using the verification link sent by Supabase, then sign in again.';
    }

    return errorMessage;
  };

  const validate = () => {
    const nextErrors = {};

    if (!form.email.trim()) nextErrors.email = 'Email is required.';
    if (!form.password.trim()) nextErrors.password = 'Password is required.';

    setErrors(nextErrors);
    return Object.keys(nextErrors).length === 0;
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setMessage('');

    if (!validate()) return;

    if (!hasSupabaseConfig || !supabase) {
      setMessage('Supabase is not configured yet. Add VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY to your .env file.');
      return;
    }

    setLoading(true);
    const { error } = await supabase.auth.signInWithPassword({
      email: form.email,
      password: form.password
    });
    setLoading(false);

    if (error) {
      setMessage(explainSigninError(error.message));
      return;
    }

    navigate('/dashboard');
  };

  const handleGoogle = async () => {
    if (!hasSupabaseConfig || !supabase) {
      setMessage('Supabase is not configured yet. Add VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY to your .env file.');
      return;
    }

    setOauthLoading(true);
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: `${window.location.origin}/dashboard`
      }
    });

    if (error) {
      setMessage(error.message);
      setOauthLoading(false);
    }
  };

  return (
    <AuthLayout title="Sign in" subtitle="Access your CareLedger AI account and continue your care journey.">
      <form onSubmit={handleSubmit} className="space-y-5">
        <TextField
          label="Email"
          type="email"
          placeholder="you@example.com"
          value={form.email}
          error={errors.email}
          onChange={(event) => setForm((current) => ({ ...current, email: event.target.value }))}
        />
        <TextField
          label="Password"
          type="password"
          placeholder="Enter your password"
          value={form.password}
          error={errors.password}
          onChange={(event) => setForm((current) => ({ ...current, password: event.target.value }))}
        />

        <div className="flex items-center justify-between text-sm">
          <Link className="font-medium text-primary hover:underline" to="/forgot-password">
            Forgot password?
          </Link>
        </div>

        {message ? <div className="rounded-2xl border border-critical/20 bg-rose-50 px-4 py-3 text-sm text-critical">{message}</div> : null}

        <button
          type="submit"
          disabled={loading}
          className="inline-flex w-full items-center justify-center rounded-2xl bg-primary px-5 py-3.5 text-sm font-medium text-white transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-70"
        >
          {loading ? 'Signing in...' : 'Sign in'}
        </button>
      </form>

      <AuthDivider />

      <button
        type="button"
        onClick={handleGoogle}
        disabled={oauthLoading || !hasSupabaseConfig}
        className="inline-flex w-full items-center justify-center gap-3 rounded-2xl border border-border bg-white px-5 py-3.5 text-sm font-medium text-heading transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-70"
      >
        <GoogleIcon />
        {oauthLoading ? 'Connecting...' : hasSupabaseConfig ? 'Continue with Google' : 'Configure Supabase to continue'}
      </button>

      <p className="mt-6 text-center text-sm text-muted">
        Need an account?{' '}
        <Link className="font-medium text-primary hover:underline" to="/signup">
          Sign up
        </Link>
      </p>

      <p className="mt-3 text-center text-xs leading-6 text-muted">
        If you already signed up, make sure you have confirmed your email before signing in.
      </p>
    </AuthLayout>
  );
}
