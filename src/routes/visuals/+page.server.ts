import { supabaseAdmin } from '$lib/server/supabaseAdmin';
import type { Player } from '$lib/types';

type TimePeriod = 'alltime' | 'playoffs';

const getViewName = (period: TimePeriod): string => {
	return period === 'playoffs' ? 'v_player_stats_playoffs' : 'v_player_stats_alltime';
};

export const load = async ({ url }) => {
	const period = (url.searchParams.get('period') as TimePeriod) || 'alltime';
	const viewName = getViewName(period);

	const { data, error } = await supabaseAdmin
		.from(viewName)
		.select('*')
		.order('acs', { ascending: false });

	if (error) {
		console.error('Failed to load visuals data', error);
		return { players: [] as Player[], period };
	}

	let players = (data ?? []) as Player[];

	// Merge rank metadata from the `players` table (rank_label, rank_color, rank_value)
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
		console.warn('Failed to merge player rank metadata:', e);
	}

	console.log('Loaded visuals data:', players.length, 'players');
	if (players.length > 0) {
		console.log('Sample player:', players[0]);
	}

	return { players, period };
};
