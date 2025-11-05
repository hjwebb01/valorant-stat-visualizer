<script lang="ts">
	import { Card, CardHeader, CardTitle, CardContent } from '$lib/components/ui/card';
	import {
		Table,
		TableHeader,
		TableRow,
		TableHead,
		TableBody,
		TableCell,
		TableCaption
	} from '$lib/components/ui/table';
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

	$: sorted = [...players].sort((a, b) => {
		const va: any = a[sortKey],
			vb: any = b[sortKey];
		const na = typeof va === 'number' ? va : NaN,
			nb = typeof vb === 'number' ? vb : NaN;
		const cmp =
			Number.isNaN(na) || Number.isNaN(nb)
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
		const m = path.match(/\/([^\/]+)_icon\.png$/);
		if (m) iconsByName[m[1].toLowerCase()] = url as unknown as string;
	}

	function normKey(name: string): string {
		let k = name.toLowerCase();
		// Normalize special cases and strip punctuation that doesn't exist in filenames
		k = k.replace(/\//g, ''); // e.g., KAY/O -> KAYO
		if (k === 'harbour') k = 'harbor';
		return k;
	}

	function agentListToIcons(list: unknown): Array<{ name: string; url?: string }> {
		const s = String(list ?? '').trim();
		if (!s) return [];
		return s
			.split(/\s+/)
			.filter(Boolean)
			.map((name) => {
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

		<CardContent class="min-h-0 flex-1 overflow-hidden">
			<div
				class="h-full w-full overflow-x-scroll overflow-y-auto pb-4"
				style="scrollbar-gutter: stable both-edges;"
			>
				<Table class="w-full rounded-xl border">
					<TableCaption>{sorted.length} players. Scroll inside this card to view more.</TableCaption
					>

					<TableHeader>
						<TableRow
							class="bg-background/95 supports-[backdrop-filter]:bg-background/75 sticky top-0 z-10 shadow-sm backdrop-blur"
						>
							<TableHead class="w-12 border-r text-right">#</TableHead>
							{#each visibleCols as c}
								<TableHead
									class={`select-none ${c.align === 'right' ? 'text-right' : 'text-left'} ${c.widthClass ?? ''} border-r last:border-r-0`}
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
								</TableHead>
							{/each}
						</TableRow>
					</TableHeader>

					<TableBody>
						{#each sorted as p, i (p.id)}
							<TableRow
								class={`hover:bg-input/50 odd:bg-muted/10 even:bg-ring cursor-pointer transition-all duration-150 ${
									selectedPlayer?.id === p.id ? 'bg-primary/10 selected-row' : ''
								}`}
								tabindex={0}
								aria-selected={selectedPlayer?.id === p.id}
								onclick={() => dispatch('select', { player: p })}
							>
								<TableCell
									class={`border-r text-right font-mono ${selectedPlayer?.id === p.id ? 'text-primary' : ''}`}
									>{i + 1}</TableCell
								>
								{#each visibleCols as c}
									<TableCell
										class={`${c.align === 'right' ? 'text-right' : 'text-left'} ${c.widthClass ?? ''} border-r last:border-r-0`}
									>
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
														<span class="text-muted-foreground max-w-full truncate text-xs"
															>{a.name}</span
														>
													{/if}
												{/each}
											</div>
										{:else}
											{fmt(c, p)}
										{/if}
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

<style>
	:global(tr[data-slot='table-row']) {
		border-bottom: none;
		border: none;
	}

	:global(.selected-row) {
		position: relative;
	}

	:global(.selected-row::after) {
		content: '';
		position: absolute;
		inset: 2px;
		border: 2px solid var(--color-primary);
		border-radius: 0.75rem;
		pointer-events: none;
	}
</style>
