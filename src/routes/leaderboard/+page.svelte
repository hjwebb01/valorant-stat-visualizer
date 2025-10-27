<script lang="ts">
  import ColumnsFilter from '$lib/components/leaderboard/ColumnsFilter.svelte';
  import LeaderboardTable from '$lib/components/leaderboard/LeaderboardTable.svelte';
  import type { Col, Key, Player } from '$lib/types';
  import { onMount } from 'svelte';

  export let data: { players: Player[] };
  let players = data.players ?? [];

  const cols: Col[] = [
    { key: 'player', label: 'Player', align: 'left', widthClass: 'min-w-0 truncate whitespace-nowrap' },
    { key: 'agents', label: 'Agents', align: 'left', widthClass: 'min-w-0 truncate whitespace-nowrap' },
    { key: 'games', label: 'G', align: 'right', digits: 0, hidden: true },
    { key: 'games_won', label: 'W', align: 'right', digits: 0 },
    { key: 'games_lost', label: 'L', align: 'right', digits: 0 },
    { key: 'rounds', label: 'Rnds', align: 'right', digits: 0, hidden: true },
    { key: 'rounds_won', label: 'Rnds W', align: 'right', digits: 0 },
    { key: 'rounds_lost', label: 'Rnds L', align: 'right', digits: 0 },
    { key: 'acs', label: 'ACS', align: 'right', digits: 1 },
    { key: 'kd', label: 'K/D', align: 'right', digits: 2 },
    { key: 'kast_pct', label: 'KAST', align: 'right', digits: 1, percent: true },
    { key: 'adr', label: 'ADR', align: 'right', digits: 1 },
    { key: 'kills', label: 'K', align: 'right', digits: 0, hidden: true },
    { key: 'kpg', label: 'K/G', align: 'right', digits: 2 },
    { key: 'kpr', label: 'K/R', align: 'right', digits: 3, hidden: true },
    { key: 'deaths', label: 'D', align: 'right', digits: 0, hidden: true },
    { key: 'dpg', label: 'D/G', align: 'right', digits: 2 },
    { key: 'dpr', label: 'D/R', align: 'right', digits: 3, hidden: true },
    { key: 'assists', label: 'A', align: 'right', digits: 0, hidden: true },
    { key: 'apg', label: 'A/G', align: 'right', digits: 2 },
    { key: 'apr', label: 'A/R', align: 'right', digits: 3, hidden: true },
    { key: 'fk', label: 'FK', align: 'right', digits: 0 },
    { key: 'fkpg', label: 'FK/G', align: 'right', digits: 2, hidden: true },
    { key: 'fd', label: 'FD', align: 'right', digits: 0 },
    { key: 'fdpg', label: 'FD/G', align: 'right', digits: 2, hidden: true },
    { key: 'hs_pct', label: 'HS%', align: 'right', digits: 1, percent: true },
    { key: 'plants', label: 'Plants', align: 'right', digits: 0, hidden: true },
    { key: 'plants_per_game', label: 'Plants/G', align: 'right', digits: 2, hidden: true },
    { key: 'defuses', label: 'Defuses', align: 'right', digits: 0, hidden: true },
    { key: 'defuses_per_game', label: 'Defuses/G', align: 'right', digits: 2, hidden: true },
    { key: 'econ_rating', label: 'Econ', align: 'right', digits: 1, hidden: true }
  ];

  // Column visibility
  const STORAGE_KEY = 'leaderboard.visibleCols.v1';
  let visibleSet = new Set<Key>(cols.filter(c => !c.hidden).map(c => c.key));
  onMount(() => {
    try { const raw = localStorage.getItem(STORAGE_KEY); if (raw) visibleSet = new Set(JSON.parse(raw)); } catch {}
  });
  $: { try { localStorage.setItem(STORAGE_KEY, JSON.stringify([...visibleSet])); } catch {} }
  $: visibleCols = cols.filter(c => visibleSet.has(c.key));

  function toggleColumn(k: Key) {
    if (visibleSet.has(k)) visibleSet.delete(k); else visibleSet.add(k);
    visibleSet = new Set(visibleSet);
  }
  function showAll() { visibleSet = new Set(cols.map(c => c.key)); }
  function hideAll() { visibleSet = new Set<Key>(['player']); }
  function resetDefaults() { visibleSet = new Set<Key>(cols.filter(c => !c.hidden).map(c => c.key)); }

  // Sorting
  let sortKey: Key = 'acs', sortAsc = false;
  function sortBy(k: Key) {
    if (sortKey === k) sortAsc = !sortAsc;
    else {
      sortKey = k;
      const descPref = new Set<Key>([
        'acs','kd','adr','kast_pct','kills','kpg','kpr','deaths','dpg','dpr','assists','apg','apr','fk','fkpg','fd','fdpg','hs_pct','econ_rating',
        'games','games_won','games_lost','rounds','rounds_won','rounds_lost','plants','plants_per_game','defuses','defuses_per_game'
      ]);
      sortAsc = !descPref.has(k);
    }
  }
</script>

<!-- FULL-VIEWPORT WRAPPER: no page scroll -->
<div class="fixed inset-0 h-dvh overflow-hidden bg-background">
  <div class="grid h-full min-h-0 w-full grid-cols-1 gap-3 p-3 md:grid-cols-[clamp(160px,22vw,220px)_minmax(0,1fr)] lg:grid-cols-[clamp(200px,18vw,260px)_minmax(0,1fr)] xl:grid-cols-[280px_minmax(0,1fr)]">
    <ColumnsFilter
      {cols}
      {visibleSet}
      on:toggle={(e) => toggleColumn(e.detail.key)}
      on:showAll={showAll}
      on:hideAll={hideAll}
      on:reset={resetDefaults}
    />
    <LeaderboardTable
      {players}
      {cols}
      {visibleCols}
      {sortKey}
      {sortAsc}
      on:sort={(e) => sortBy(e.detail.key)}
    />
  </div>
</div>
