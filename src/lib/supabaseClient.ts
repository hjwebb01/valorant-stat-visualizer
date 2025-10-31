import { createClient } from '@supabase/supabase-js';
import { SUPABASE_URL, PUBLIC_SUPABASE_ANON_KEY } from '$env/static/public';

export const supabase = createClient(SUPABASE_URL, PUBLIC_SUPABASE_ANON_KEY);
