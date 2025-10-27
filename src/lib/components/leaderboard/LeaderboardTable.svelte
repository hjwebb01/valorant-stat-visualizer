<script lang="ts">
  import { Card, CardHeader, CardTitle, CardContent } from '$lib/components/ui/card';
  import { Table, TableHeader, TableRow, TableHead, TableBody, TableCell, TableCaption } from '$lib/components/ui/table';
  import type { Col, Key, Player } from '$lib/types';
  import { createEventDispatcher } from 'svelte';

  export let players: Player[] = [];
  export let cols: Col[] = [];
  export let visibleCols: Col[] = [];
  export let sortKey: Key;
  export let sortAsc: boolean;

  const dispatch = createEventDispatcher<{ sort: { key: Key } }>();

  const fmtNum = (v: unknown, d = 2) =>
    (typeof v === 'number' && Number.isFinite(v))
      ? new Intl.NumberFormat(undefined, { minimumFractionDigits: d, maximumFractionDigits: d }).format(v)
      : String(v ?? '');

  const fmtPct = (v: unknown, d = 1) => v == null ? '' : `${(Number(v)).toFixed(d)}%`;

  const fmt = (c: Col, r: any) =>
    c.percent ? fmtPct(r[c.key], c.digits ?? 1)
    : typeof r[c.key] === 'number' ? fmtNum(r[c.key], c.digits ?? 2)
    : c.key === 'created_at' ? new Date(r[c.key] as string).toLocaleString()
    : String(r[c.key] ?? '');

  $: sorted = [...players].sort((a, b) => {
    const va: any = a[sortKey], vb: any = b[sortKey];
    const na = typeof va === 'number' ? va : NaN, nb = typeof vb === 'number' ? vb : NaN;
    const cmp = Number.isNaN(na) || Number.isNaN(nb)
      ? String(va ?? '').localeCompare(String(vb ?? ''), undefined, { numeric: true })
      : na - nb;
    return sortAsc ? cmp : -cmp;
  });
</script>

<section class="min-h-0 h-full">
  <Card class="flex h-full min-h-0 flex-col">
    <CardHeader class="shrink-0">
      <CardTitle class="text-center text-3xl">Leaderboard</CardTitle>
    </CardHeader>

    <CardContent class="min-h-0 flex-1 overflow-hidden">
      <div class="h-full w-full overflow-y-auto overflow-x-scroll pb-4" style="scrollbar-gutter: stable both-edges;">
        <Table class="border rounded-xl w-full">
          <TableCaption>{sorted.length} players. Scroll inside this card to view more.</TableCaption>

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
                    on:click={() => dispatch('sort', { key: c.key })}
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
