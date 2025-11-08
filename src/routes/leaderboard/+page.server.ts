// src/routes/leaderboard/+page.server.ts
import { supabaseAdmin } from '$lib/server/supabaseAdmin';

export const load = async () => {
  console.log('📥 Loading leaderboard data from Supabase...');

  // Query player_stats joined with player name
  const { data, error } = await supabaseAdmin
    .from('player_stats')
    .select(`
      id,
      dataset_id,
      player_id,
      team_id,
      acs,
      kd,
      adr,
      kast_pct,
      kills,
      deaths,
      assists,
      fk,
      fd,
      hs_pct,
      econ_rating,
      games,
      games_won,
      games_lost,
      rounds,
      rounds_won,
      rounds_lost,
      kpg,
      kpr,
      dpg,
      dpr,
      apg,
      apr,
      fkpg,
      fdpg,
      plants,
      plants_per_game,
      defuses,
      defuses_per_game,
      agents,
      players!player_stats_player_id_fkey(name)
    `);

  if (error) {
    console.error('❌ Failed to load player stats:', error);
    return { players: [] };
  }

  // Flatten player name into top-level object for your Svelte leaderboard
  const players = (data ?? []).map((row: any) => ({
    ...row,
    player: row.players?.name ?? '(Unknown Player)'
  }));

  console.log(`✅ Loaded ${players.length} player rows`);
  return { players };
};
