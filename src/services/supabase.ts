import { createClient, SupabaseClient } from '@supabase/supabase-js';

// Read public client configuration from Vite environment
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || '';
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || '';

export const isLiveSupabaseAvailable = Boolean(supabaseUrl && supabaseAnonKey);

if (!isLiveSupabaseAvailable) {
  console.info(
    '[FinTrack Auth] Running in Local Development Auth Mode.\n' +
    'To connect live Supabase Auth, add VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY in your .env file.'
  );
}

// Public Supabase client instance (safe for frontend use)
export const supabase: SupabaseClient | null = isLiveSupabaseAvailable
  ? createClient(supabaseUrl, supabaseAnonKey, {
      auth: {
        persistSession: true,
        autoRefreshToken: true,
        detectSessionInUrl: true,
      },
    })
  : null;
