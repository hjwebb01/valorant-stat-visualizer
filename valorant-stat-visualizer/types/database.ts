// Database types generated from Supabase schema
// These types correspond to the actual database schema

export type Player = {
  id: string
  name: string
  tracker_id: string | null
  created_at: string | null
  // Individual player statistics
  total_matches: number | null
  total_kills: number | null
  total_deaths: number | null
  total_assists: number | null
  total_acs: number | null
  total_headshot_percent: number | null
  total_first_bloods: number | null
  total_plants: number | null
  total_defuses: number | null
  // Calculated averages
  avg_kd_ratio: number | null
  avg_acs: number | null
  avg_headshot_percent: number | null
  // Rank information
  current_rank: string | null
  rank_rating: number | null
  peak_rank: string | null
  peak_rank_rating: number | null
  // Most played agent
  favorite_agent: string | null
  // Win/loss tracking
  wins: number | null
  losses: number | null
  win_rate: number | null
}

export type Match = {
  id: string
  tracker_url: string
  match_date: string | null
  map: string | null
  scraped_at: string | null
}

export type MatchStat = {
  id: string
  match_id: string | null
  player_id: string | null
  team_side: string | null
  agent: string
  kills: number
  deaths: number
  assists: number
  acs: number | null
  headshot_percent: number | null
  first_bloods: number | null
  plants: number | null
  defuses: number | null
}

export type Team = {
  id: string
  name: string
  created_at: string | null
}

export type TeamMember = {
  id: string
  team_id: string | null
  player_id: string | null
  joined_at: string | null
}

// Additional utility types for API responses
export type MatchWithStats = Match & {
  match_stats: MatchStat[]
}

export type PlayerWithStats = Player & {
  match_stats: MatchStat[]
}

export type TeamWithMembers = Team & {
  team_members: (TeamMember & {
    players: Player
  })[]
}