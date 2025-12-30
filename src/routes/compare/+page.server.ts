import { supabaseAdmin } from '$lib/server/supabaseAdmin';
import type { Player } from '$lib/types';

export const load = async () => {
	try {
		const { data, error } = await supabaseAdmin
			.from('v_player_stats_alltime')
			.select('*')
			.order('acs', { ascending: false });

		if (error) throw error;
		const players = (data ?? []) as Player[];

		// Try merging rank metadata from `players` table (best-effort)
		try {
			const { data: meta, error: pmErr } = await supabaseAdmin
				.from('players')
				.select('name, rank_label, rank_color, rank_value');
			if (!pmErr && Array.isArray(meta)) {
				const map = new Map<string, any>();
				for (const m of meta) {
					if (m?.name) map.set(String(m.name).toLowerCase().trim(), m);
				}
				return {
					players: players.map((p) => {
						try {
							const key = String(p.player ?? '')
								.toLowerCase()
								.trim();
							const mm = map.get(key);
							if (mm) {
								return {
									...p,
									rank_label: p.rank_label ?? mm.rank_label ?? null,
									rank_color: p.rank_color ?? mm.rank_color ?? null,
									rank_value: p.rank_value ?? mm.rank_value ?? null
								} as Player;
							}
						} catch (e) {}
						return p;
					})
				};
			}
		} catch (e) {
			// ignore merge errors
		}

		return { players };
	} catch (err) {
		console.error('Failed to load compare players', err);
		return { players: [] };
	}
};
