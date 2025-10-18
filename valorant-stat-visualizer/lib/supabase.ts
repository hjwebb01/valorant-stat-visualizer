import { createClient } from '@supabase/supabase-js'
import type { Player, Match, MatchStat, Team, TeamMember } from '@/types/database'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

if (!supabaseUrl || !supabaseKey) {
  throw new Error('Missing Supabase environment variables')
}

export const supabase = createClient(supabaseUrl, supabaseKey)

// Re-export types for convenience
export type { Player, Match, MatchStat, Team, TeamMember }