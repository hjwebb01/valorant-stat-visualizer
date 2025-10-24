// src/routes/all-time/+page.server.ts
import type { PageServerLoad } from './$types';
import { supabaseAdmin } from '$lib/server/supabaseAdmin';

export const load: PageServerLoad = async () => {
	const { data, error } = await supabaseAdmin
		.from('v_player_stats_alltime')
		.select('*')
		.order('acs', { ascending: false });
	if (error) console.error(error);
	return { players: data ?? [] };
};
