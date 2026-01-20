// src/routes/api/leaderboard/+server.ts
import { json } from '@sveltejs/kit';
import { supabaseAdmin } from '$lib/server/supabaseAdmin';

export async function GET({ url }) {
	const label = url.searchParams.get('label') ?? 'Regular Season';
	console.log(`📊 API: fetching leaderboard for ${label}`);

	try {
		let players: any[] = [];

		if (label === 'Regular Season' || label === 'All-Time') {
			// Use the aggregated all-time view
			const { data, error } = await supabaseAdmin
				.from('v_player_stats_alltime')
				.select('*')
				.order('acs', { ascending: false });

			if (error) throw error;
			players = data ?? [];
		} else {
			// Load rows for a specific dataset/week
			const { data, error } = await supabaseAdmin
				.from('player_stats')
				.select(
					`
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
          players!player_stats_player_id_fkey(name),
          datasets!player_stats_dataset_id_fkey(label)
        `
				)
				.eq('datasets.label', label)
				.order('acs', { ascending: false });

			if (error) throw error;

			players = (data ?? []).map((row: any) => ({
				...row,
				player: row.players?.name ?? '(Unknown Player)',
				dataset: row.datasets?.label ?? '(Unknown Dataset)'
			}));
		}

		return json({ ok: true, players });
	} catch (err: any) {
		console.error('❌ Failed to fetch leaderboard:', err);
		return json({ ok: false, error: err.message ?? String(err) }, { status: 500 });
	}
}
