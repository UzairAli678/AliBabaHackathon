import { useRef, useState } from 'react';
import { CameraIcon, CheckCircleIcon, TrashIcon, UserCircleIcon } from '@heroicons/react/24/outline';
import { useAuth } from '../context/AuthContext';

const inputClass = 'w-full rounded-2xl border border-border bg-background px-4 py-3 text-sm text-heading outline-none transition placeholder:text-muted/70 focus:border-primary focus:ring-4 focus:ring-primary/10';

export default function ProfilePage() {
  const { user, profileImage, updateProfile, saveProfileImage } = useAuth();
  const metadata = user?.user_metadata || {};
  const [form, setForm] = useState({
    full_name: metadata.full_name || '',
    phone: metadata.phone || '',
    date_of_birth: metadata.date_of_birth || '',
    city: metadata.city || '',
    bio: metadata.bio || ''
  });
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const fileInputRef = useRef(null);

  const handleChange = (event) => {
    const { name, value } = event.target;
    setForm((current) => ({ ...current, [name]: value }));
  };

  const handleImage = (event) => {
    const file = event.target.files?.[0];
    setError('');
    setMessage('');
    if (!file) return;
    if (!['image/jpeg', 'image/png', 'image/webp'].includes(file.type)) {
      setError('Choose a JPG, PNG, or WebP image.');
      return;
    }
    if (file.size > 1.5 * 1024 * 1024) {
      setError('Profile picture must be smaller than 1.5 MB.');
      return;
    }
    const reader = new FileReader();
    reader.onload = () => {
      try {
        saveProfileImage(String(reader.result || ''));
        setMessage('Profile picture updated.');
      } catch {
        setError('The browser could not save this image. Try a smaller file.');
      }
    };
    reader.onerror = () => setError('Unable to read this image.');
    reader.readAsDataURL(file);
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setLoading(true);
    setError('');
    setMessage('');
    const cleanedProfile = Object.fromEntries(Object.entries(form).map(([key, value]) => [key, value.trim()]));
    const { error: updateError } = await updateProfile({ ...metadata, ...cleanedProfile });
    setLoading(false);
    if (updateError) {
      setError(updateError.message);
      return;
    }
    setMessage('Your profile details have been saved.');
  };

  const fallbackName = form.full_name || user?.email?.split('@')[0] || 'User';

  return (
    <section className="space-y-6">
      <div className="rounded-[28px] border border-border bg-white p-6 shadow-card sm:p-8">
        <div className="flex flex-col gap-6 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <div className="text-sm font-medium uppercase tracking-[0.2em] text-primary">Account profile</div>
            <h2 className="mt-2 text-3xl font-medium tracking-tight text-heading">Your personal details</h2>
            <p className="mt-2 text-sm leading-7 text-muted">Add only what you’re comfortable sharing. All fields below are optional.</p>
          </div>
          <div className="flex items-center gap-4">
            <div className="flex h-20 w-20 overflow-hidden rounded-[24px] border border-border bg-teal-50 text-primary shadow-card">
              {profileImage ? <img src={profileImage} alt={`${fallbackName}'s profile`} className="h-full w-full object-cover" /> : <UserCircleIcon className="m-auto h-10 w-10" />}
            </div>
            <div className="space-y-2">
              <input ref={fileInputRef} type="file" accept="image/jpeg,image/png,image/webp" onChange={handleImage} className="hidden" />
              <button type="button" onClick={() => fileInputRef.current?.click()} className="flex items-center gap-2 rounded-xl bg-primary px-4 py-2.5 text-sm font-medium text-white"><CameraIcon className="h-4 w-4" />Choose photo</button>
              {profileImage ? <button type="button" onClick={() => { saveProfileImage(''); setMessage('Profile picture removed.'); }} className="flex items-center gap-2 px-2 text-xs font-medium text-critical"><TrashIcon className="h-4 w-4" />Remove photo</button> : null}
            </div>
          </div>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="rounded-[28px] border border-border bg-white p-6 shadow-card sm:p-8">
        <div className="grid gap-5 md:grid-cols-2">
          <label className="text-sm"><span className="mb-2 block font-medium text-heading">Full name</span><input name="full_name" value={form.full_name} onChange={handleChange} placeholder="Your full name" className={inputClass} /></label>
          <label className="text-sm"><span className="mb-2 block font-medium text-heading">Email</span><input value={user?.email || ''} disabled className={`${inputClass} cursor-not-allowed bg-slate-100 text-muted`} /></label>
          <label className="text-sm"><span className="mb-2 block font-medium text-heading">Phone number</span><input name="phone" type="tel" value={form.phone} onChange={handleChange} placeholder="Optional phone number" className={inputClass} /></label>
          <label className="text-sm"><span className="mb-2 block font-medium text-heading">Date of birth</span><input name="date_of_birth" type="date" value={form.date_of_birth} onChange={handleChange} className={inputClass} /></label>
          <label className="text-sm md:col-span-2"><span className="mb-2 block font-medium text-heading">City</span><input name="city" value={form.city} onChange={handleChange} placeholder="e.g. Karachi" className={inputClass} /></label>
          <label className="text-sm md:col-span-2"><span className="mb-2 block font-medium text-heading">About you</span><textarea name="bio" rows="4" maxLength="300" value={form.bio} onChange={handleChange} placeholder="Optional short introduction or care preferences" className={`${inputClass} resize-none`} /><span className="mt-1 block text-right text-xs text-muted">{form.bio.length}/300</span></label>
        </div>

        {error ? <div className="mt-5 rounded-2xl border border-critical/20 bg-rose-50 px-4 py-3 text-sm text-critical">{error}</div> : null}
        {message ? <div className="mt-5 flex items-center gap-2 rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-positive"><CheckCircleIcon className="h-5 w-5" />{message}</div> : null}

        <button type="submit" disabled={loading} className="mt-6 inline-flex items-center justify-center rounded-2xl bg-primary px-6 py-3 text-sm font-medium text-white shadow-soft transition hover:opacity-90 disabled:opacity-60">{loading ? 'Saving profile...' : 'Save profile'}</button>
      </form>
    </section>
  );
}
