import { createContext, useContext, useEffect, useMemo, useState } from 'react';
import { hasSupabaseConfig, supabase } from '../lib/supabase';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [session, setSession] = useState(null);
  const [loading, setLoading] = useState(true);
  const [profileImage, setProfileImageState] = useState('');

  useEffect(() => {
    if (!user?.id) {
      setProfileImageState('');
      return;
    }
    try {
      setProfileImageState(window.localStorage.getItem(`careledger-profile-image-${user.id}`) || '');
    } catch {
      setProfileImageState('');
    }
  }, [user?.id]);

  useEffect(() => {
    if (!hasSupabaseConfig || !supabase) {
      setLoading(false);
      return undefined;
    }

    let mounted = true;

    supabase.auth.getSession().then(({ data }) => {
      if (!mounted) {
        return;
      }

      setSession(data.session ?? null);
      setUser(data.session?.user ?? null);
      setLoading(false);
    });

    const { data } = supabase.auth.onAuthStateChange((_event, nextSession) => {
      setSession(nextSession);
      setUser(nextSession?.user ?? null);
      setLoading(false);
    });

    return () => {
      mounted = false;
      data.subscription.unsubscribe();
    };
  }, []);

  const value = useMemo(
    () => ({
      user,
      session,
      loading,
      profileImage,
      updateProfile: async (metadata) => {
        if (!supabase) return { error: new Error('Supabase is not configured.') };
        const result = await supabase.auth.updateUser({ data: metadata });
        if (result.data?.user) setUser(result.data.user);
        return result;
      },
      saveProfileImage: (imageData) => {
        if (!user?.id) return;
        const key = `careledger-profile-image-${user.id}`;
        if (imageData) window.localStorage.setItem(key, imageData);
        else window.localStorage.removeItem(key);
        setProfileImageState(imageData || '');
      },
      signOut: () => (supabase ? supabase.auth.signOut() : Promise.resolve())
    }),
    [user, session, loading, profileImage]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);

  if (!context) {
    throw new Error('useAuth must be used within AuthProvider');
  }

  return context;
}
