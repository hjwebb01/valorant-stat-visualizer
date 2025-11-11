<script lang="ts">
	import { Card, CardHeader, CardTitle } from '$lib/components/ui/card';
	import type { Col, Key, Player } from '$lib/types';
	import { createEventDispatcher } from 'svelte';

	export let players: Player[] = [];
	export let visibleCols: Col[] = [];
	export let sortKey: Key;
	export let sortAsc: boolean;
	export let selectedPlayer: Player | null = null;

	const dispatch = createEventDispatcher<{ sort: { key: Key }; select: { player: Player } }>();

	const fmtNum = (v: unknown, d = 2) =>
		typeof v === 'number' && Number.isFinite(v)
			? new Intl.NumberFormat(undefined, {
					minimumFractionDigits: d,
					maximumFractionDigits: d
				}).format(v)
			: String(v ?? '');

	const fmtPct = (v: unknown, d = 1) => (v == null ? '' : `${Number(v).toFixed(d)}%`);

	const fmt = (c: Col, r: any) =>
		c.percent
			? fmtPct(r[c.key], c.digits ?? 1)
			: typeof r[c.key] === 'number'
				? fmtNum(r[c.key], c.digits ?? 2)
				: c.key === 'created_at'
					? new Date(r[c.key] as string).toLocaleString()
					: String(r[c.key] ?? '');

	const resolveKey = (row: Player & Record<string, any>): string => {
		const base = (row as any).id ?? (row as any).player_id ?? `${row.player ?? ''}-${(row as any).dataset_id ?? ''}`;
		return base?.toString?.() ?? '';
	};

	const rowKey = (row: Player & Record<string, any>, index: number): string => {
		const key = resolveKey(row);
		return key || `${index}`;
	};

	const isSelected = (row: Player & Record<string, any>): boolean => {
		if (!selectedPlayer) return false;
		return resolveKey(row) === resolveKey(selectedPlayer as Player & Record<string, any>);
	};

	$: sorted = [...players].sort((a, b) => {
		const va: any = a[sortKey],
			vb: any = b[sortKey];
		const na = typeof va === 'number' ? va : NaN,
			nb = typeof vb === 'number' ? vb : NaN;
		const cmp = Number.isNaN(na) || Number.isNaN(nb)
			? String(va ?? '').localeCompare(String(vb ?? ''), undefined, { numeric: true })
			: na - nb;
		return sortAsc ? cmp : -cmp;
	});

	// Preload all agent icons and index by agent name (case-insensitive)
	const iconModules = import.meta.glob('../../assets/agents/*_icon.png', {
		eager: true,
		import: 'default'
	}) as Record<string, string>;

	const iconsByName: Record<string, string> = {};
	for (const [path, url] of Object.entries(iconModules)) {
		const m = path.match(/\/([^/]+)_icon\.png$/);
		if (m) iconsByName[m[1].toLowerCase()] = url as unknown as string;
	}

	function normKey(name: string): string {
		let k = name.toLowerCase();
		k = k.replace(/\//g, ''); // e.g., KAY/O -> KAYO
		if (k === 'harbour') k = 'harbor';
		return k;
	}

	function agentListToIcons(list: unknown): Array<{ name: string; url?: string }> {
		const s = String(list ?? '').trim();
		if (!s) return [];
		return s.split(/\s+/).filter(Boolean).map((name) => {
			const key = normKey(name);
			return { name, url: iconsByName[key] };
		});
	}
</script>

<section class="h-full min-h-0">
	<Card class="flex h-full min-h-0 flex-col">
		<CardHeader class="shrink-0">
			<CardTitle class="text-center text-3xl">Leaderboard</CardTitle>
		</CardHeader>

		<div class="leaderboard-wrapper h-full w-full overflow-auto">
			<table class="leaderboard-table w-full border-collapse">
				<thead class="leaderboard-header border-b sticky top-0 z-20 bg-slate-800/95 supports-backdrop-filter:bg-slate-800/80 backdrop-blur-sm shadow-md">
					<tr class="bg-background/95 supports-backdrop-filter:bg-background/75 top-0 z-10 shadow-sm backdrop-blur">
						<th class="w-12 border-r text-right px-3 py-3 font-semibold text-sm">#</th>
						{#each visibleCols as c}
							<th
								class={`select-none ${c.align === 'right' ? 'text-right' : 'text-left'} ${c.widthClass ?? ''} border-r last:border-r-0 px-3 py-3 font-semibold text-sm`}
								title={`Sort by ${c.label}`}
							>
								<button
									type="button"
									class={`inline-flex w-full cursor-pointer items-center gap-1 ${c.align === 'right' ? 'justify-end' : 'justify-start'}`}
									onclick={() => dispatch('sort', { key: c.key })}
								>
									<span class="inline-flex items-center gap-1">
										{c.label}
										{#if sortKey === c.key}
											<span class="font-mono text-xs">{sortAsc ? '▲' : '▼'}</span>
										{/if}
									</span>
								</button>
							</th>
						{/each}
					</tr>
				</thead>

				<tbody>
					{#each sorted as p, i (rowKey(p, i))}
						<tr
							class={`leaderboard-row cursor-pointer transition-all duration-150 odd:bg-(--leaderboard-row-odd) even:bg-(--leaderboard-row-even) hover:bg-(--leaderboard-row-hover) focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-(--leaderboard-row-hover) ${
								isSelected(p) ? 'bg-primary/10 selected-row' : ''
							}`}
							tabindex={0}
							aria-selected={selectedPlayer?.id === p.id}
							onclick={() => dispatch('select', { player: p })}
						>
							<td class={`border-r text-right font-mono px-3 py-3 text-sm ${isSelected(p) ? 'text-primary' : ''}`}>
								{i + 1}
							</td>
							{#each visibleCols as c}
								<td class={`${c.align === 'right' ? 'text-right' : 'text-left'} ${c.widthClass ?? ''} border-r last:border-r-0 px-3 py-3 text-sm`}>
									{#if c.key === 'agents'}
										<div class="flex min-w-50 flex-wrap items-center gap-1 whitespace-nowrap">
											{#each agentListToIcons(p.agents) as a}
												{#if a.url}
													<img
														src={a.url}
														alt={a.name}
														class="h-7 w-7 shrink-0 rounded"
														loading="lazy"
													/>
												{:else}
													<span class="text-muted-foreground max-w-full truncate text-xs">{a.name}</span>
												{/if}
											{/each}
										</div>
									{:else}
										{fmt(c, p)}
									{/if}
								</td>
							{/each}
						</tr>
					{/each}
				</tbody>
			</table>
		</div>
	</Card>
</section>

<style>
	.leaderboard-wrapper {
		scrollbar-gutter: stable both-edges;
	}

	.leaderboard-table {
		border-color: var(--leaderboard-border);
		background: var(--background);
	}

	.leaderboard-header {
		border-color: var(--leaderboard-border);
		background-color: var(--leaderboard-row-odd);
	}

	.leaderboard-row {
		border-bottom: 1px solid var(--leaderboard-border);
	}

	.leaderboard-row:last-child {
		border-bottom: none;
	}

	.selected-row {
		position: relative;
	}

	.selected-row::after {
		content: '';
		position: absolute;
		inset: 2px;
		border: 2px solid var(--color-primary);
		border-radius: 0.75rem;
		pointer-events: none;
	}
</style>
