import { createClient } from '@supabase/supabase-js';

export const SUPABASE_URL = 'https://tmdeaktnwlelicvastlb.supabase.co';
export const SUPABASE_ANON_KEY = 'sb_publishable_xOnU6mfsGCha7WNRajRgQw_T6oX1EqM';

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
  },
});

export const PROJECT_ID = 'tmdeaktnwlelicvastlb';
export const REGION = 'ap-southeast-1';
