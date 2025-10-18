'use client'

import { useState, useEffect } from 'react'
import { getPlayerStatsWithRankings } from '@/lib/player-stats'
import type { Player } from '@/types/database'

export default function PlayerStatsDisplay() {
  const [players, setPlayers] = useState<(Player & { rank_position?: number })[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    async function fetchPlayerStats() {
      try {
        const data = await getPlayerStatsWithRankings()
        setPlayers(data)
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to fetch player stats')
      } finally {
        setLoading(false)
      }
    }

    fetchPlayerStats()
  }, [])

  if (loading) {
    return (
      <div className="p-6">
        <div className="animate-pulse">
          <div className="h-4 bg-gray-200 rounded w-1/4 mb-4"></div>
          <div className="space-y-3">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="h-4 bg-gray-200 rounded"></div>
            ))}
          </div>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="p-6">
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
          <p className="font-medium">Error loading player stats:</p>
          <p>{error}</p>
        </div>
      </div>
    )
  }

  if (players.length === 0) {
    return (
      <div className="p-6">
        <div className="bg-blue-50 border border-blue-200 text-blue-700 px-4 py-3 rounded">
          <p className="font-medium">No player data available</p>
          <p>Import some matches to see player statistics.</p>
        </div>
      </div>
    )
  }

  return (
    <div className="p-6">
      <h2 className="text-2xl font-bold mb-6 text-gray-900">Player Statistics</h2>

      <div className="overflow-x-auto">
        <table className="min-w-full bg-white border border-gray-200 rounded-lg">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Rank</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Player</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Matches</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">K/D</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">ACS</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">HS%</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Rank</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Agent</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {players.map((player) => (
              <tr key={player.id} className="hover:bg-gray-50">
                <td className="px-4 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                  #{player.rank_position}
                </td>
                <td className="px-4 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                  {player.name}
                </td>
                <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-500">
                  {player.total_matches}
                </td>
                <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-500">
                  {player.avg_kd_ratio.toFixed(2)}
                </td>
                <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-500">
                  {player.avg_acs.toFixed(1)}
                </td>
                <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-500">
                  {player.avg_headshot_percent.toFixed(1)}%
                </td>
                <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-500">
                  {player.current_rank || 'Unranked'}
                  {player.rank_rating && ` (${player.rank_rating} RR)`}
                </td>
                <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-500">
                  {player.favorite_agent || 'N/A'}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}