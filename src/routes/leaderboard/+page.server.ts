// src/routes/leaderboard/+page.server.ts
import { supabaseAdmin } from '$lib/server/supabaseAdmin';
import type { Player } from '$lib/types';

type TimePeriod = 'week1' | 'week2' | 'week3' | 'alltime';

const getViewName = (period: TimePeriod): string => {
  switch (period) {
    case 'week1':
      return 'v_player_stats_week1';
    case 'week2':
      return 'v_player_stats_week2';
    case 'week3':
      return 'v_player_stats_week3';
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

    console.log(`✅ Loaded ${players.length} player rows from ${viewName}`);
    return { players, datasets, selectedLabel: label, period };
  } catch (err: unknown) {
    const errorMessage = err instanceof Error ? err.message : String(err);
    console.error('❌ Failed to load leaderboard:', err);
    return { players: [], datasets, selectedLabel: label, period, error: errorMessage };
  }
};
