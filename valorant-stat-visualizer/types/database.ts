// Database types for the Valorant Match Tracker
// These types correspond to the Supabase database schema

export type Player = {
  id: string
  name: string
  tracker_id: string | null
  created_at: string
  // Individual player statistics
  total_matches: number
  total_kills: number
  total_deaths: number
  total_assists: number
  total_acs: number
  total_headshot_percent: number
  total_first_bloods: number
  total_plants: number
  total_defuses: number
  // Calculated averages
  avg_kd_ratio: number
  avg_acs: number
  avg_headshot_percent: number
  // Rank information
  current_rank: string | null
  rank_rating: number | null
  peak_rank: string | null
  peak_rank_rating: number | null
  // Most played agent
  favorite_agent: string | null
  // Win/loss tracking
  wins: number
  losses: number
  win_rate: number
}

export type Match = {
  id: string
  tracker_url: string
  match_date: string | null
  map: string | null
  scraped_at: string
}

export type MatchStat = {
  id: string
  match_id: string
  player_id: string
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
  created_at: string
}

export type TeamMember = {
  id: string
  team_id: string
  player_id: string
  joined_at: string
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