<script lang="ts">
  import { Card, CardHeader, CardTitle, CardContent } from '$lib/components/ui/card';
  import { Table, TableHeader, TableRow, TableHead, TableBody, TableCell, TableCaption } from '$lib/components/ui/table';
  import { onMount } from 'svelte';

  // Server-provided data
  export let data: {
    players: Array<{
      id: number; dataset_id: string; player: string; agents: string;
      games: number; games_won: number; games_lost: number;
      rounds: number; rounds_won: number; rounds_lost: number;
      acs: number; kd: number; kast_pct: number | null; adr: number;
      kills: number; kpg: number; kpr: number;
      deaths: number; dpg: number; dpr: number;
      assists: number; apg: number; apr: number;
      fk: number; fkpg: number; fd: number; fdpg: number;
      hs_pct: number; plants: number; plants_per_game: number;
      defuses: number; defuses_per_game: number; econ_rating: number;
      created_at: string;
    }>;
  };

  let players = data.players ?? [];

  type Align = 'left' | 'right';
  type Key =
    | 'id' | 'dataset_id' | 'player' | 'agents'
    | 'games' | 'games_won' | 'games_lost'
    | 'rounds' | 'rounds_won' | 'rounds_lost'
    | 'acs' | 'kd' | 'kast_pct' | 'adr'
    | 'kills' | 'kpg' | 'kpr'
    | 'deaths' | 'dpg' | 'dpr'
    | 'assists' | 'apg' | 'apr'
    | 'fk' | 'fkpg' | 'fd' | 'fdpg'
    | 'hs_pct'
    | 'plants' | 'plants_per_game'
    | 'defuses' | 'defuses_per_game'
    | 'econ_rating'
    | 'created_at';

  type Col = { key: Key; label: string; align?: Align; hidden?: boolean; widthClass?: string; digits?: number; percent?: boolean; };

  const cols: Col[] = [
    { key: 'player', label: 'Player', align: 'left', widthClass: 'min-w-40' },
    { key: 'agents', label: 'Agents', align: 'left', widthClass: 'min-w-40' },
    { key: 'games', label: 'G', align: 'right', digits: 0 },
    { key: 'games_won', label: 'W', align: 'right', digits: 0 },
    { key: 'games_lost', label: 'L', align: 'right', digits: 0 },
    { key: 'rounds', label: 'Rnds', align: 'right', digits: 0 },
    { key: 'rounds_won', label: 'R W', align: 'right', digits: 0 },
    { key: 'rounds_lost', label: 'R L', align: 'right', digits: 0 },
    { key: 'acs', label: 'ACS', align: 'right', digits: 1 },
    { key: 'kd', label: 'K/D', align: 'right', digits: 2 },
    { key: 'kast_pct', label: 'KAST', align: 'right', digits: 1, percent: true },
    { key: 'adr', label: 'ADR', align: 'right', digits: 1 },
    { key: 'kills', label: 'K', align: 'right', digits: 0 },
    { key: 'kpg', label: 'K/G', align: 'right', digits: 2 },
    { key: 'kpr', label: 'K/R', align: 'right', digits: 3 },
    { key: 'deaths', label: 'D', align: 'right', digits: 0 },
    { key: 'dpg', label: 'D/G', align: 'right', digits: 2 },
    { key: 'dpr', label: 'D/R', align: 'right', digits: 3 },
    { key: 'assists', label: 'A', align: 'right', digits: 0 },
    { key: 'apg', label: 'A/G', align: 'right', digits: 2 },
    { key: 'apr', label: 'A/R', align: 'right', digits: 3 },
    { key: 'fk', label: 'FK', align: 'right', digits: 0 },
    { key: 'fkpg', label: 'FK/G', align: 'right', digits: 2 },
    { key: 'fd', label: 'FD', align: 'right', digits: 0 },
    { key: 'fdpg', label: 'FD/G', align: 'right', digits: 2 },
    { key: 'hs_pct', label: 'HS%', align: 'right', digits: 1, percent: true },
    { key: 'plants', label: 'Plants', align: 'right', digits: 0 },
    { key: 'plants_per_game', label: 'Plants/G', align: 'right', digits: 2 },
    { key: 'defuses', label: 'Defuses', align: 'right', digits: 0 },
    { key: 'defuses_per_game', label: 'Defuses/G', align: 'right', digits: 2 },
    { key: 'econ_rating', label: 'Econ', align: 'right', digits: 1 }
  ];

  // column visibility
  const STORAGE_KEY = 'leaderboard.visibleCols.v1';
  let visibleSet = new Set<Key>(cols.filter(c => !c.hidden).map(c => c.key));
  onMount(() => {
    try { const raw = localStorage.getItem(STORAGE_KEY); if (raw) visibleSet = new Set(JSON.parse(raw)); } catch {}
  });
  $: { try { localStorage.setItem(STORAGE_KEY, JSON.stringify([...visibleSet])); } catch {} }
  $: visibleCols = cols.filter(c => visibleSet.has(c.key));

  function toggleColumn(k: Key) { if (visibleSet.has(k)) visibleSet.delete(k); else visibleSet.add(k); visibleSet = new Set(visibleSet); }
  function showAll() { visibleSet = new Set(cols.map(c => c.key)); }
  function hideAll() { visibleSet = new Set<Key>(['player']); }
  function resetDefaults() { visibleSet = new Set<Key>(cols.filter(c => !c.hidden).map(c => c.key)); }

  // formatting & sorting
  const fmtNum = (v: unknown, d = 2) => (typeof v === 'number' && Number.isFinite(v))
    ? new Intl.NumberFormat(undefined, { minimumFractionDigits: d, maximumFractionDigits: d }).format(v)
    : String(v ?? '');
  const fmtPct = (v: unknown, d = 1) => v == null ? '' : `${(Number(v)).toFixed(d)}%`;
  const fmt = (c: Col, r: any) => c.percent ? fmtPct(r[c.key], c.digits ?? 1)
    : typeof r[c.key] === 'number' ? fmtNum(r[c.key], c.digits ?? 2)
    : c.key === 'created_at' ? new Date(r[c.key] as string).toLocaleString() : String(r[c.key] ?? '');

  let sortKey: Key = 'acs', sortAsc = false;
  function sortBy(k: Key) {
    if (sortKey === k) sortAsc = !sortAsc; else {
      sortKey = k;
      const descPref = new Set<Key>(['acs','kd','adr','kast_pct','kills','kpg','kpr','deaths','dpg','dpr','assists','apg','apr','fk','fkpg','fd','fdpg','hs_pct','econ_rating','games','games_won','games_lost','rounds','rounds_won','rounds_lost','plants','plants_per_game','defuses','defuses_per_game']);
      sortAsc = !descPref.has(k);
    }
  }
  $: sorted = [...players].sort((a, b) => {
    const va: any = a[sortKey], vb: any = b[sortKey];
    const na = typeof va === 'number' ? va : NaN, nb = typeof vb === 'number' ? vb : NaN;
    const cmp = Number.isNaN(na) || Number.isNaN(nb)
      ? String(va ?? '').localeCompare(String(vb ?? ''), undefined, { numeric: true })
      : na - nb;
    return sortAsc ? cmp : -cmp;
  });

  const rankOf = (i: number) => i + 1;
</script>

<!-- FULL-VIEWPORT WRAPPER: no page scroll -->
<div class="fixed inset-0 h-dvh overflow-hidden bg-background">
  <!-- Two-column grid fills viewport; min-h-0 allows children to shrink -->
  <div class="grid h-full min-h-0 w-full grid-cols-1 gap-4 p-4 md:grid-cols-[260px_minmax(0,1fr)]">
    <!-- LEFT: Column filter (internal vertical scroll) -->
    <aside class="min-h-0 h-full">
      <Card class="flex h-full min-h-0 flex-col">
        <CardHeader class="shrink-0">
          <CardTitle class="text-xl">Columns</CardTitle>
        </CardHeader>

        <!-- Important trio: min-h-0 on the flex child, then put overflow on the inner div -->
        <CardContent class="min-h-0 flex-1 overflow-hidden space-y-3">
          <div class="flex gap-2">
            <button class="rounded-xl border px-3 py-1 text-sm hover:bg-muted" on:click={showAll}>Show all</button>
            <button class="rounded-xl border px-3 py-1 text-sm hover:bg-muted" on:click={hideAll}>Hide all</button>
            <button class="rounded-xl border px-3 py-1 text-sm hover:bg-muted" on:click={resetDefaults}>Reset</button>
          </div>

          <!-- This container actually scrolls -->
          <div class="h-full overflow-y-auto overscroll-contain pr-1">
            <div class="grid grid-cols-1 gap-2">
              {#each cols as c}
                <label class="flex items-center gap-2 rounded-lg border px-3 py-2 hover:bg-muted/60">
                  <input type="checkbox" checked={visibleSet.has(c.key)} on:change={() => toggleColumn(c.key)} />
                  <span class="text-sm">{c.label}</span>
                </label>
              {/each}
            </div>
          </div>
        </CardContent>
      </Card>
    </aside>


    <!-- RIGHT: Leaderboard card -->
    <section class="min-h-0 h-full">
      <Card class="flex h-full min-h-0 flex-col">
        <CardHeader class="shrink-0">
          <CardTitle class="text-center text-3xl">Leaderboard</CardTitle>
        </CardHeader>

        <!-- Do NOT scroll this wrapper; keep the scroll on the inner div -->
        <CardContent class="min-h-0 flex-1 overflow-hidden">
          <!-- Internal scroller: always show horizontal scrollbar -->
          <div
            class="h-full w-full overflow-y-auto overflow-x-scroll pb-4"
            style="scrollbar-gutter: stable both-edges;"
          >
            <!-- Keep table wide so there’s something to scroll even on big screens -->
            <Table class="min-w-[2000px] border rounded-xl">
              <TableCaption>
                {sorted.length} players. Scroll inside this card to view more.
              </TableCaption>

              <TableHeader>
                <TableRow class="sticky top-0 z-10 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/75 shadow-sm">
                  <TableHead class="w-12 text-right border-r">#</TableHead>
                  {#each visibleCols as c}
                    <TableHead
                      class={`select-none ${c.align === 'right' ? 'text-right' : 'text-left'} ${c.widthClass ?? ''} border-r last:border-r-0`}
                      title={`Sort by ${c.label}`}
                    >
                      <button
                        type="button"
                        class={`w-full cursor-pointer inline-flex items-center gap-1 ${c.align === 'right' ? 'justify-end' : 'justify-start'}`}
                        on:click={() => sortBy(c.key)}
                      >
                        <span class="inline-flex items-center gap-1">
                          {c.label}
                          {#if sortKey === c.key}
                            <span class="font-mono text-xs">{sortAsc ? '▲' : '▼'}</span>
                          {/if}
                        </span>
                      </button>
                    </TableHead>
                  {/each}
                </TableRow>
              </TableHeader>

              <TableBody>
                {#each sorted as p, i (p.id)}
                  <TableRow class="hover:bg-muted/50 odd:bg-muted/20">
                    <TableCell class="text-right font-mono border-r">{i + 1}</TableCell>
                    {#each visibleCols as c}
                      <TableCell class={`${c.align === 'right' ? 'text-right' : 'text-left'} ${c.widthClass ?? ''} border-r last:border-r-0`}>
                        {fmt(c, p)}
                      </TableCell>
                    {/each}
                  </TableRow>
                {/each}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </section>
  </div>
</div>
