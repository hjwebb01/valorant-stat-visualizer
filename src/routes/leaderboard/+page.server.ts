// src/routes/leaderboard/+page.server.ts
import { supabaseAdmin } from '$lib/server/supabaseAdmin';
import type { Player } from '$lib/types';

type TimePeriod =
	| 'week1'
	| 'week2'
	| 'week3'
	| 'week4'
	| 'week5'
	| 'week6'
	| 'week7'
	| 'week8'
	| 'alltime';

const getViewName = (period: TimePeriod): string => {
	switch (period) {
		case 'week1':
			return 'v_player_stats_week1';
		case 'week2':
			return 'v_player_stats_week2';
		case 'week3':
			return 'v_player_stats_week3';
		case 'week4':
			return 'v_player_stats_week4';
		case 'week5':
			return 'v_player_stats_week5';
		case 'week6':
			return 'v_player_stats_week6';
		case 'week7':
			return 'v_player_stats_week7';
		case 'week8':
			return 'v_player_stats_week8';
		case 'alltime':
		default:
			return 'v_player_stats_alltime';
	}
};

export const load = async ({ url }) => {
	const period = (url.searchParams.get('period') as TimePeriod) || 'alltime';
	const label = url.searchParams.get('label') ?? 'All-Time';
	console.log(`📥 Loading leaderboard data for period: ${period}, label: ${label}...`);

	let players: any[] = [];
	let datasets: string[] = [];

	// 🗂️ Fetch available dataset labels (plus All-Time)
	const { data: datasetRows, error: dsErr } = await supabaseAdmin
		.from('datasets')
		.select('label')
		.order('created_at', { ascending: true });

	if (dsErr) console.warn('⚠️ Failed to fetch dataset list:', dsErr);
	datasets = ['All-Time', ...(datasetRows?.map((d) => d.label) ?? [])];

	try {
		// Use the new period-based system
		const viewName = getViewName(period);
		const { data, error } = await supabaseAdmin
			.from(viewName)
			.select('*')
			.order('acs', { ascending: false });

		if (error) throw error;
		players = (data ?? []) as Player[];

		// Merge rank metadata from the `players` table (rank_label, rank_color, rank_value)
		// The v_player_stats_* views may not include these columns, so fetch them and merge by player name.
		try {
			const { data: playerMeta, error: pmErr } = await supabaseAdmin
				.from('players')
				.select('name, rank_label, rank_color, rank_value');

			if (!pmErr && Array.isArray(playerMeta)) {
				const metaMap = new Map<string, any>();
				for (const m of playerMeta) {
					if (m?.name) metaMap.set(String(m.name).toLowerCase().trim(), m);
				}

				players = players.map((p: any) => {
					try {
						const key = String(p.player ?? '')
							.toLowerCase()
							.trim();
						const meta = metaMap.get(key);
						if (meta) {
							return {
								...p,
								rank_label: p.rank_label ?? meta.rank_label ?? null,
								rank_color: p.rank_color ?? meta.rank_color ?? null,
								rank_value: p.rank_value ?? meta.rank_value ?? null
							};
						}
					} catch (e) {
						// ignore per-row merge errors
					}
					return p;
				});
			}
		} catch (e) {
			console.warn('⚠️ Failed to merge player rank metadata:', e);
		}

		console.log(`✅ Loaded ${players.length} player rows from ${viewName}`);
		return { players, datasets, selectedLabel: label, period };
	} catch (err: unknown) {
		const errorMessage = err instanceof Error ? err.message : String(err);
		console.error('❌ Failed to load leaderboard:', err);
		return { players: [], datasets, selectedLabel: label, period, error: errorMessage };
	}
};
