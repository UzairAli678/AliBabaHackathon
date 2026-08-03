import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL?.trim();
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY?.trim();
export const hasSupabaseConfig = Boolean(supabaseUrl && supabaseAnonKey);

if (!hasSupabaseConfig) {
	console.warn('Missing Supabase environment variables. Add VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY to your .env file.');
}

export function getAuthRedirectUrl(path = '/dashboard') {
	if (typeof window === 'undefined') {
		return path.startsWith('/') ? path : `/${path}`;
	}

	const normalizedPath = path.startsWith('/') ? path : `/${path}`;
	return `${window.location.origin}${normalizedPath}`;
}

export const supabase = hasSupabaseConfig
	? createClient(supabaseUrl, supabaseAnonKey, {
		auth: {
			persistSession: true,
			autoRefreshToken: true,
			detectSessionInUrl: true
		}
	})
	: null;
