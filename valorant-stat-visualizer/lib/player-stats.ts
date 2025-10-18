import { supabase } from '@/lib/supabase'
import type { Player, MatchStat } from '@/lib/supabase'

/**
 * Calculate aggregated statistics for a player from their match stats
 */
export function calculatePlayerStats(matchStats: MatchStat[]): Partial<Player> {
  if (matchStats.length === 0) {
    return {
      total_matches: 0,
      total_kills: 0,
      total_deaths: 0,
      total_assists: 0,
      total_acs: 0,
      total_headshot_percent: 0,
      total_first_bloods: 0,
      total_plants: 0,
      total_defuses: 0,
      avg_kd_ratio: 0,
      avg_acs: 0,
      avg_headshot_percent: 0,
      wins: 0,
      losses: 0,
      win_rate: 0,
    }
  }

  const totalMatches = matchStats.length
  const totalKills = matchStats.reduce((sum, stat) => sum + stat.kills, 0)
  const totalDeaths = matchStats.reduce((sum, stat) => sum + stat.deaths, 0)
  const totalAssists = matchStats.reduce((sum, stat) => sum + stat.assists, 0)
  const totalAcs = matchStats.reduce((sum, stat) => sum + (stat.acs || 0), 0)
  const totalHeadshotPercent = matchStats.reduce((sum, stat) => sum + (stat.headshot_percent || 0), 0)
  const totalFirstBloods = matchStats.reduce((sum, stat) => sum + (stat.first_bloods || 0), 0)
  const totalPlants = matchStats.reduce((sum, stat) => sum + (stat.plants || 0), 0)
  const totalDefuses = matchStats.reduce((sum, stat) => sum + (stat.defuses || 0), 0)

  // Calculate averages
  const avgKdRatio = totalDeaths > 0 ? totalKills / totalDeaths : totalKills
  const avgAcs = totalMatches > 0 ? totalAcs / totalMatches : 0
  const avgHeadshotPercent = totalMatches > 0 ? totalHeadshotPercent / totalMatches : 0

  // Find most played agent
  const agentCounts = matchStats.reduce((counts, stat) => {
    counts[stat.agent] = (counts[stat.agent] || 0) + 1
    return counts
  }, {} as Record<string, number>)

  const favoriteAgent = (Object.entries(agentCounts) as [string, number][])
    .sort(([, countA], [, countB]) => countB - countA)[0]?.[0] || null

  // For now, we'll set wins/losses to 0 since we don't have match outcome data yet
  // This would need to be calculated based on match results
  const wins = 0
  const losses = 0
  const winRate = 0

  return {
    total_matches: totalMatches,
    total_kills: totalKills,
    total_deaths: totalDeaths,
    total_assists: totalAssists,
    total_acs: totalAcs,
    total_headshot_percent: totalHeadshotPercent,
    total_first_bloods: totalFirstBloods,
    total_plants: totalPlants,
    total_defuses: totalDefuses,
    avg_kd_ratio: Number(avgKdRatio.toFixed(2)),
    avg_acs: Number(avgAcs.toFixed(1)),
    avg_headshot_percent: Number(avgHeadshotPercent.toFixed(1)),
    favorite_agent: favoriteAgent,
    wins,
    losses,
    win_rate: winRate,
  }
}

/**
 * Update a player's aggregated statistics in the database
 */
export async function updatePlayerStats(playerId: string): Promise<void> {
  try {
    // Get all match stats for this player
    const { data: matchStats, error: fetchError } = await supabase
      .from('match_stats')
      .select('*')
      .eq('player_id', playerId)

    if (fetchError) {
      throw fetchError
    }

    // Calculate new stats
    const stats = calculatePlayerStats(matchStats || [])

    // Update player record
    const { error: updateError } = await supabase
      .from('players')
      .update(stats)
      .eq('id', playerId)

    if (updateError) {
      throw updateError
    }
  } catch (error) {
    console.error('Error updating player stats:', error)
    throw error
  }
}

/**
 * Update rank information for a player
 */
export async function updatePlayerRank(
  playerId: string,
  currentRank: string,
  rankRating: number,
  peakRank?: string,
  peakRankRating?: number
): Promise<void> {
  try {
    const updateData: Partial<Pick<Player, 'current_rank' | 'rank_rating' | 'peak_rank' | 'peak_rank_rating'>> = {
      current_rank: currentRank,
      rank_rating: rankRating,
    }

    if (peakRank !== undefined) updateData.peak_rank = peakRank
    if (peakRankRating !== undefined) updateData.peak_rank_rating = peakRankRating

    const { error } = await supabase
      .from('players')
      .update(updateData)
      .eq('id', playerId)

    if (error) {
      throw error
    }
  } catch (error) {
    console.error('Error updating player rank:', error)
    throw error
  }
}

/**
 * Get player statistics with rankings
 */
export async function getPlayerStatsWithRankings(): Promise<(Player & { rank_position?: number })[]> {
  try {
    const { data, error } = await supabase
      .from('players')
      .select('*')
      .order('avg_kd_ratio', { ascending: false })

    if (error) {
      throw error
    }

    // Add rank positions based on KD ratio
    return (data || []).map((player, index) => ({
      ...player,
      rank_position: index + 1,
    }))
  } catch (error) {
    console.error('Error fetching player stats with rankings:', error)
    throw error
  }
}