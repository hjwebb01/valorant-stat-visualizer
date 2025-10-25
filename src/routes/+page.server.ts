// src/routes/all-time/+page.server.ts
import type { PageServerLoad } from './$types';
import { supabaseAdmin } from '$lib/server/supabaseAdmin';

export const load: PageServerLoad = async () => {
	const { data, error } = await supabaseAdmin
		.from('valorant_players')
		.select('*')
		.limit(20)
		.order('acs', { ascending: false });
	if (error) console.error(error);
	return { players: data ?? [] };
};
