<script lang="ts">
	import { Card, CardHeader, CardTitle } from '$lib/components/ui/card';
	import type { Col, Key, Player } from '$lib/types';
	import { Button } from '$lib/components/ui/button';
	import { goto } from '$app/navigation';
	import { createEventDispatcher } from 'svelte';

	export let players: Player[] = [];
	export let visibleCols: Col[] = [];
	export let sortKey: Key;
	export let sortAsc: boolean;
	export let groupByRank: boolean = false;
	export let selectedPlayer: Player | null = null;
	export let selectedPeriod: string = 'alltime';

	const dispatch = createEventDispatcher<{
		sort: { key: Key };
		select: { player: Player };
		toggleGroupByRank: { value: boolean };
	}>();

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
		const base =
			(row as any).id ??
			(row as any).player_id ??
			`${row.player ?? ''}-${(row as any).dataset_id ?? ''}`;
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

	// Sorting is now handled by parent
	$: sorted = players;

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

		const seen = new Set<string>();
		const agents: Array<{ name: string; url?: string }> = [];

		for (const rawName of s.split(/\s+/)) {
			const cleanName = rawName.trim();
			if (!cleanName) continue;

			const key = normKey(cleanName);
			if (seen.has(key)) continue;
			seen.add(key);

			agents.push({
				name: cleanName,
				url: iconsByName[key]
			});
		}

		return agents;
	}

	const rankIconModules = import.meta.glob('../../assets/ranks/*_Rank.png', {
		eager: true,
		import: 'default'
	}) as Record<string, string>;

	function resolveRankIcon(rank: string | null | undefined): string | undefined {
		if (!rank) return;

		const lower = rank.toLowerCase().trim();

		// ---------------------------------------
		// 1. Radiant (single icon)
		// ---------------------------------------
		if (lower.startsWith('radiant')) {
			for (const [path, url] of Object.entries(rankIconModules)) {
				if (path.toLowerCase().includes('radiant_rank')) return url;
			}
			return;
		}

		// ---------------------------------------
		// 2. IMMORTAL (tier is based on RR number)
		// ---------------------------------------
		if (lower.startsWith('immortal')) {
			// Extract any number (0,100,200,250,300,300+, etc.)
			const match = lower.match(/(\d+)/);
			const rr = match ? parseInt(match[1], 10) : 0;

			let tier = 1;
			if (rr >= 300) tier = 3;
			else if (rr >= 100) tier = 2;

			const target = `immortal_${tier}_rank`;

			for (const [path, url] of Object.entries(rankIconModules)) {
				if (path.toLowerCase().includes(target)) return url;
			}
			return;
		}

		// ---------------------------------------
		// 3. Standard tiers (Bronze, Silver, Gold, Plat, Diamond, Ascendant)
		//    Example: "Silver 1" → "silver_1_rank"
		// ---------------------------------------
		const normalized = lower
			.replace(/rr/g, '') // remove "RR"
			.replace(/[^a-z0-9]+/g, '_') // spaces/punctuation → underscores
			.replace(/_+$/, ''); // trim trailing underscores

		// Look for something like "bronze_1", "diamond_3", etc.
		for (const [path, url] of Object.entries(rankIconModules)) {
			if (path.toLowerCase().includes(normalized)) return url;
		}

		return undefined;
	}
</script>

<section class="h-full min-h-0">
	<Card class="flex h-full min-h-0 flex-col">
		<CardHeader class="shrink-0">
			<div class="flex items-center justify-center gap-3">
				<div
					role="button"
					tabindex={0}
					class="inline-block"
					on:click={() => {
						const next = !groupByRank;
						dispatch('toggleGroupByRank', { value: next });
					}}
					on:keydown={(e: KeyboardEvent) => {
						if (e.key === 'Enter' || e.key === ' ') {
							e.preventDefault();
							const next = !groupByRank;
							dispatch('toggleGroupByRank', { value: next });
						}
					}}
				>
					<Button variant="toggle" size="sm" data-state={groupByRank ? 'active' : 'inactive'}>
						Group by Rank
					</Button>
				</div>
				<CardTitle class="text-center text-3xl">Leaderboard</CardTitle>
				<div class="week-toggle-group">
					<label for="period-select" class="sr-only">Select period</label>
					<div class="relative inline-block">
						<select
							id="period-select"
							class="border-border bg-card text-foreground focus:ring-primary focus:border-primary appearance-none rounded-md border px-3 py-1 pr-8 text-sm shadow-sm focus:ring-2 focus:outline-none"
							value={selectedPeriod}
							on:change={(e) => goto(`?period=${(e.currentTarget as HTMLSelectElement).value}`)}
							aria-label="Select period"
						>
							<option value="week1">Week 1</option>
							<option value="week2">Week 2</option>
							<option value="week3">Week 3</option>
							<option value="week4">Week 4</option>
							<option value="week5">Week 5</option>
							<option value="week6">Week 6</option>
							<option value="week7">Week 7</option>
							<option value="week8">Week 8</option>
							<option value="alltime">Regular Season</option>
							<option value="playoffs">Playoffs</option>
						</select>

						<svg
							xmlns="http://www.w3.org/2000/svg"
							viewBox="0 0 20 20"
							fill="currentColor"
							class="text-muted-foreground pointer-events-none absolute top-1/2 right-2 h-4 w-4 -translate-y-1/2"
							aria-hidden="true"
						>
							<path
								fill-rule="evenodd"
								d="M5.23 7.21a.75.75 0 011.06.02L10 10.94l3.71-3.71a.75.75 0 111.06 1.06l-4.24 4.24a.75.75 0 01-1.06 0L5.21 8.29a.75.75 0 01.02-1.08z"
								clip-rule="evenodd"
							/>
						</svg>
					</div>
				</div>
			</div>
		</CardHeader>

		<div class="leaderboard-wrapper h-full w-full overflow-auto">
			<table class="leaderboard-table w-full border-collapse">
				<thead
					class="leaderboard-header sticky top-0 z-20 border-b bg-slate-800/95 shadow-md backdrop-blur-sm supports-backdrop-filter:bg-slate-800/80"
				>
					<tr
						class="bg-background/95 supports-backdrop-filter:bg-background/75 top-0 z-10 shadow-sm backdrop-blur"
					>
						<th class="w-12 border-r px-3 py-3 text-right text-sm font-semibold">#</th>
						{#each visibleCols as c}
							<th
								class={`select-none ${c.align === 'right' ? 'text-right' : 'text-left'} ${c.widthClass ?? ''} border-r px-3 py-3 text-sm font-semibold last:border-r-0`}
								title={`Sort by ${c.label}`}
							>
								<button
									type="button"
									class={`inline-flex w-full cursor-pointer items-center gap-1 ${c.align === 'right' ? 'justify-end' : 'justify-start'}`}
									on:click={() => dispatch('sort', { key: c.key })}
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
					{#if sorted.length === 0}
						<tr>
							<td
								colspan={visibleCols.length + 1}
								class="text-muted-foreground border-r px-3 py-8 text-center"
							>
								No players found
							</td>
						</tr>
					{:else}
						{#each sorted as p, i (rowKey(p, i))}
							<tr
								class={`leaderboard-row cursor-pointer transition-all duration-150 odd:bg-(--leaderboard-row-odd) even:bg-(--leaderboard-row-even) hover:bg-(--leaderboard-row-hover) focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-(--leaderboard-row-hover) ${
									isSelected(p) ? 'bg-primary/10 selected-row' : ''
								}`}
								tabindex={0}
								aria-selected={selectedPlayer?.id === p.id}
								on:click={() => dispatch('select', { player: p })}
							>
								<td
									class={`border-r px-3 py-3 text-right font-mono text-sm ${isSelected(p) ? 'text-primary' : ''}`}
								>
									{(p as any).rank ?? i + 1}
								</td>
								{#each visibleCols as c}
									<td
										class={`${c.align === 'right' ? 'text-right' : 'text-left'} ${c.widthClass ?? ''} border-r px-3 py-3 text-sm last:border-r-0`}
									>
										{#if c.key === 'player'}
											<div class="flex items-center gap-2">
												{#if resolveRankIcon(p.rank_label)}
													<img
														src={resolveRankIcon(p.rank_label)}
														alt={p.rank_label}
														class="h-6 w-6 shrink-0"
														loading="lazy"
													/>
												{/if}
												<span>{p.player}</span>
											</div>
										{:else if c.key === 'agents'}
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
														<span class="text-muted-foreground max-w-full truncate text-xs"
															>{a.name}</span
														>
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
					{/if}
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
