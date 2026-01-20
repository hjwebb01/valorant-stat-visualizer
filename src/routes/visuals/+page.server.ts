import { supabaseAdmin } from '$lib/server/supabaseAdmin';
import type { Player } from '$lib/types';
import { calculateLeagueStats } from '$lib/utils/statsHelpers';

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

	// Fetch performance delta data for all players who have both regular season and playoff stats
	let performanceDeltas: any[] = [];
	try {
		// Get all regular season stats
		const { data: regularStats } = await supabaseAdmin
			.from('v_player_stats_alltime')
			.select('player_id, player, acs, kast_pct');

		// Get all playoff stats
		const { data: playoffStats } = await supabaseAdmin
			.from('v_player_stats_playoffs')
			.select('player_id, player, acs, kast_pct');

		if (regularStats && playoffStats && regularStats.length > 0) {
			// Calculate league stats from regular season
			const leagueStats = calculateLeagueStats(
				regularStats
					.filter((s: any) => s.acs != null && s.kast_pct != null)
					.map((s: any) => ({
						acs: s.acs,
						kastPct: s.kast_pct
					}))
			);

			// Create map of playoff stats by player_id
			const playoffMap = new Map(
				playoffStats
					.filter((p: any) => p.player_id && p.acs != null && p.kast_pct != null)
					.map((p: any) => [p.player_id, p])
			);

			// Calculate deltas for players who have both regular and playoff stats
			performanceDeltas = regularStats
				.filter(
					(r: any) =>
						r.player_id && r.acs != null && r.kast_pct != null && playoffMap.has(r.player_id)
				)
				.map((r: any) => {
					const p = playoffMap.get(r.player_id);

					// Calculate Z-scores
					const acsRegularZ = (r.acs - leagueStats.acs.mean) / leagueStats.acs.stdDev;
					const acsPlayoffZ = (p.acs - leagueStats.acs.mean) / leagueStats.acs.stdDev;
					const kastRegularZ = (r.kast_pct - leagueStats.kast.mean) / leagueStats.kast.stdDev;
					const kastPlayoffZ = (p.kast_pct - leagueStats.kast.mean) / leagueStats.kast.stdDev;

					const acsZDelta = acsPlayoffZ - acsRegularZ;
					const kastZDelta = kastPlayoffZ - kastRegularZ;

					// Combined z-score delta (average of both metrics)
					const combinedZDelta = (acsZDelta + kastZDelta) / 2;

					return {
						playerId: r.player_id,
						playerName: r.player,
						combinedZDelta,
						acsZDelta,
						kastZDelta,
						regularSeasonStats: {
							acs: r.acs,
							kastPct: r.kast_pct
						},
						playoffStats: {
							acs: p.acs,
							kastPct: p.kast_pct
						}
					};
				})
				.sort((a: any, b: any) => b.combinedZDelta - a.combinedZDelta);
		}
	} catch (e) {
		console.warn('Failed to load performance deltas:', e);
	}

	return { players, period, performanceDeltas };
};
