import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { getAuthRedirectUrl, hasSupabaseConfig, supabase } from '../lib/supabase';
import AuthLayout from '../components/AuthLayout';
import AuthDivider from '../components/AuthDivider';
import GoogleIcon from '../components/GoogleIcon';
import TextField from '../components/TextField';

export default function SignUpPage() {
  const navigate = useNavigate();
  const [form, setForm] = useState({ name: '', email: '', password: '' });
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);
  const [oauthLoading, setOauthLoading] = useState(false);
  const [message, setMessage] = useState('');

  const explainSignupError = (errorMessage) => {
    const lowerMessage = errorMessage.toLowerCase();

    if (lowerMessage.includes('email rate limit exceeded')) {
      return 'Supabase is temporarily limiting sign-up emails. Wait a few minutes and try again, or use Sign in if this account was already created.';
    }

    if (lowerMessage.includes('user already registered')) {
      return 'That email is already registered. Use Sign in, or use Forgot password if you need to reset the password.';
    }

    if (lowerMessage.includes('password should be at least')) {
      return 'Password must be at least 6 characters.';
    }

    if (
      lowerMessage.includes('provider not enabled') ||
      lowerMessage.includes('email/password') ||
      lowerMessage.includes('signup is disabled') ||
      lowerMessage.includes('forbidden')
    ) {
      return 'Email/password sign-up is currently unavailable in this Supabase project. Please enable Email/Password in Supabase Auth settings or use Continue with Google.';
    }

    return errorMessage;
  };

  const validate = () => {
    const nextErrors = {};

    if (!form.name.trim()) nextErrors.name = 'Name is required.';
    if (!form.email.trim()) nextErrors.email = 'Email is required.';
    if (form.password.trim().length < 6) nextErrors.password = 'Password must be at least 6 characters.';

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
    const { data, error } = await supabase.auth.signUp({
      email: form.email,
      password: form.password,
      options: {
        data: {
          full_name: form.name
        }
      }
    });
    setLoading(false);

    if (error) {
      setMessage(explainSignupError(error.message));
      return;
    }

    if (data?.session) {
      navigate('/dashboard');
      return;
    }

    setMessage('Account created. Check your email to confirm your account before signing in.');
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
        redirectTo: getAuthRedirectUrl('/dashboard'),
        queryParams: {
          access_type: 'offline',
          prompt: 'consent'
        }
      }
    });

    if (error) {
      setMessage(error.message);
      setOauthLoading(false);
    }
  };

  return (
    <AuthLayout title="Create your account" subtitle="Join CareLedger AI for calm, premium healthcare guidance.">
      <form onSubmit={handleSubmit} className="space-y-5">
        <TextField
          label="Name"
          type="text"
          placeholder="Your name"
          value={form.name}
          error={errors.name}
          onChange={(event) => setForm((current) => ({ ...current, name: event.target.value }))}
        />
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
          placeholder="Create a password"
          value={form.password}
          error={errors.password}
          onChange={(event) => setForm((current) => ({ ...current, password: event.target.value }))}
        />

        {message ? <div className="rounded-2xl border border-critical/20 bg-rose-50 px-4 py-3 text-sm text-critical">{message}</div> : null}

        <button
          type="submit"
          disabled={loading}
          className="inline-flex w-full items-center justify-center rounded-2xl bg-primary px-5 py-3.5 text-sm font-medium text-white transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-70"
        >
          {loading ? 'Creating account...' : 'Create account'}
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
        Already have an account?{' '}
        <Link className="font-medium text-primary hover:underline" to="/signin">
          Sign in
        </Link>
      </p>

      <p className="mt-3 text-center text-xs leading-6 text-muted">
        If email confirmation is enabled in Supabase, account creation does not immediately sign you in.
      </p>
    </AuthLayout>
  );
}
