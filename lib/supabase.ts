
import { createClient } from '@supabase/supabase-js';

// NOTE: In a real app, these should be in .env.local
// You need to replace these with your actual Supabase URL and Anon Key

// Safely access env to avoid "Cannot read properties of undefined" if env is missing
const env = (import.meta as any).env || {};

// We use a dummy HTTPS URL as fallback so createClient doesn't throw an error immediately 
// if the environment variables are not set. Requests will fail, but the app will load.
const SUPABASE_URL = env.VITE_SUPABASE_URL || 'https://psjestluejtbpwlmeowk.supabase.co';
const SUPABASE_KEY = env.VITE_SUPABASE_ANON_KEY || 'sb_publishable_Clx9nrYcEVyYGv_p39V0-Q_vrWYMvHG';

export const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);
