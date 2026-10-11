import { createClient, SupabaseClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config();

// Supabase project credentials
// Checks both backend and client env var names for seamless resolution in all environments
const supabaseUrl = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL || '';
const supabaseServiceKey =
  process.env.SUPABASE_SECRET_KEY ||
  process.env.SUPABASE_SERVICE_ROLE_KEY ||
  process.env.SUPABASE_ANON_KEY ||
  process.env.VITE_SUPABASE_ANON_KEY ||
  '';

export const isSupabaseConfigured = Boolean(supabaseUrl && supabaseServiceKey);

if (!isSupabaseConfigured) {
  console.warn(
    '[FinTrack Backend] SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY is not configured in environment variables. ' +
    'Backend is running with persistent in-memory database adapter for local/preview development. ' +
    'Configure backend/.env for production Supabase PostgreSQL connection.'
  );
}

// Service role client: has elevated privileges to verify JWTs and perform authorized DB queries.
// IMPORTANT: Never expose the service role key to frontend clients.
export const supabaseAdmin: SupabaseClient | null = isSupabaseConfigured
  ? createClient(supabaseUrl, supabaseServiceKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    })
  : null;
