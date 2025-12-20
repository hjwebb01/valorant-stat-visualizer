// src/routes/+page.server.ts
import type { PageServerLoad } from './$types';
import { supabaseAdmin } from '$lib/server/supabaseAdmin';

type TimePeriod = 'week1' | 'week2' | 'week3' | 'week4' | 'week5' | 'week6' | 'week7' | 'alltime';

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
		case 'alltime':
		default:
			return 'v_player_stats_alltime';
	}
};

export const load: PageServerLoad = async ({ url }) => {
	const period = (url.searchParams.get('period') as TimePeriod) || 'alltime';
	const viewName = getViewName(period);

	const { data, error } = await supabaseAdmin
		.from(viewName)
		.select('*')
		.order('acs', { ascending: false });

	if (error) {
		console.error(`Error fetching data from ${viewName}:`, error);
		return { players: [], period };
	}

	return { players: data ?? [], period };
};
