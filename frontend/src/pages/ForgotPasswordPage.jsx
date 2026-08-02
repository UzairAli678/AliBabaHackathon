import { useState } from 'react';
import { Link } from 'react-router-dom';
import { hasSupabaseConfig, supabase } from '../lib/supabase';
import AuthLayout from '../components/AuthLayout';
import TextField from '../components/TextField';

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('');
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (event) => {
    event.preventDefault();
    setMessage('');
    setError('');

    if (!email.trim()) {
      setError('Email is required.');
      return;
    }

    if (!hasSupabaseConfig || !supabase) {
      setError('Supabase is not configured yet. Add your VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY values.');
      return;
    }

    setLoading(true);
    const { error: requestError } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/signin`
    });
    setLoading(false);

    if (requestError) {
      setError(requestError.message);
      return;
    }

    setMessage('Password reset link sent if the account exists.');
  };

  return (
    <AuthLayout title="Forgot password" subtitle="Send a reset link to your email address.">
      <form onSubmit={handleSubmit} className="space-y-5">
        <TextField
          label="Email"
          type="email"
          placeholder="you@example.com"
          value={email}
          error={error}
          onChange={(event) => setEmail(event.target.value)}
        />

        {message ? <div className="rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-positive">{message}</div> : null}

        <button
          type="submit"
          disabled={loading}
          className="inline-flex w-full items-center justify-center rounded-2xl bg-primary px-5 py-3.5 text-sm font-medium text-white transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-70"
        >
          {loading ? 'Sending...' : 'Send reset link'}
        </button>
      </form>

      <p className="mt-6 text-center text-sm text-muted">
        Remembered it?{' '}
        <Link className="font-medium text-primary hover:underline" to="/signin">
          Back to sign in
        </Link>
      </p>
    </AuthLayout>
  );
}
