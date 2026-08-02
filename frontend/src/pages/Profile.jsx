import { useAuth } from '../context/AuthContext';

export default function ProfilePage() {
  const { user } = useAuth();
  const name = user?.user_metadata?.full_name || user?.email?.split('@')[0] || 'User';

  return (
    <section className="rounded-[28px] border border-border bg-white p-6 shadow-card sm:p-8">
      <h2 className="text-2xl font-medium tracking-tight text-heading">Profile</h2>
      <p className="mt-3 text-sm leading-7 text-muted">
        Signed in as {name}. Account management will expand here next.
      </p>
      <div className="mt-6 rounded-2xl bg-slate-50 p-4 text-sm text-muted">
        {user?.email}
      </div>
    </section>
  );
}
