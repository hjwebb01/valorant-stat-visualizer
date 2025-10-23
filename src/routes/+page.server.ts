import { supabaseAdmin } from '$lib/server/supabaseAdmin';

export const load = async () => {
  const { data, error } = await supabaseAdmin.from('metrics').select('*').order('metric_date');
  if (error) console.error(error);
  return { metrics: data ?? [] };
};
