<script lang="ts">
	import PercentileCard from '$lib/components/PercentileCard.svelte';
	import type { Player } from '$lib/types';
	import { percentileRank, toPercent } from '$lib/utils';

	export let data: { players: Player[] };
	let players: Player[] = data.players ?? [];

	const playerKey = (p: any) => {
		if (!p) return '';
		return (p.id ?? `${p.player ?? ''}-${p.dataset_id ?? ''}`).toString();
	};

	// Sorted copy used for percentile calculations
	$: sortedPlayers = (players ?? []).slice().sort((a, b) => (b.acs ?? 0) - (a.acs ?? 0));

	const percentileExclude = new Set(['id', 'player', 'agents', 'created_at', 'dataset_id', 'rank']);

	function computeSelectedPercentiles(sel: Player, arr: Player[]): Record<string, number> {
		const out: Record<string, number> = {};
		for (const [k, v] of Object.entries(sel as any)) {
			if (percentileExclude.has(k)) continue;
			const val = typeof v === 'number' ? v : Number(v);
			if (!Number.isFinite(val)) continue;
			const series = arr
				.map((p) => {
					const vv = (p as any)[k];
					return typeof vv === 'number' ? vv : Number(vv);
				})
				.filter((n) => Number.isFinite(n)) as number[];
			if (series.length === 0) continue;
			const p = percentileRank(series, val);
			const pct = toPercent(p);
			if (Number.isFinite(pct)) out[k] = pct;
		}
		return out;
	}

	let selected1: Player | null = null;
	let selected2: Player | null = null;

	$: percentiles1 = selected1 ? computeSelectedPercentiles(selected1, sortedPlayers) : {};
	$: percentiles2 = selected2 ? computeSelectedPercentiles(selected2, sortedPlayers) : {};

	function handleSelect1(e: Event) {
		const v = (e.target as HTMLSelectElement).value;
		selected1 = players.find((p) => playerKey(p) === v) ?? null;
	}

	function handleSelect2(e: Event) {
		const v = (e.target as HTMLSelectElement).value;
		selected2 = players.find((p) => playerKey(p) === v) ?? null;
	}

	// Searchable dropdown state
	let query1 = '';
	let query2 = '';
	let open1 = false;
	let open2 = false;

	$: filtered1 = (() => {
		const q = (query1 ?? '').toLowerCase().trim();
		if (!q) return sortedPlayers.slice(0, 100);
		return sortedPlayers.filter((p) => (p.player ?? '').toLowerCase().includes(q)).slice(0, 100);
	})();

	$: filtered2 = (() => {
		const q = (query2 ?? '').toLowerCase().trim();
		if (!q) return sortedPlayers.slice(0, 100);
		return sortedPlayers.filter((p) => (p.player ?? '').toLowerCase().includes(q)).slice(0, 100);
	})();

	function selectPlayer1(p: Player) {
		selected1 = p;
		query1 = p.player ?? '';
		open1 = false;
	}

	function selectPlayer2(p: Player) {
		selected2 = p;
		query2 = p.player ?? '';
		open2 = false;
	}

	// Keys to compare and highlight when one player has a higher metric
	const compareKeys = ['acs', 'kd', 'adr', 'kast_pct', 'hs_pct'];

	$: highlights1 = {};
	$: highlights2 = {};
	$: if (selected1 && selected2) {
		const h1: Record<string, boolean> = {};
		const h2: Record<string, boolean> = {};
		for (const k of compareKeys) {
			const v1 = Number((selected1 as any)[k]);
			const v2 = Number((selected2 as any)[k]);
			if (Number.isFinite(v1) && Number.isFinite(v2)) {
				if (v1 > v2) {
					h1[k] = true;
					h2[k] = false;
				} else if (v2 > v1) {
					h1[k] = false;
					h2[k] = true;
				} else {
					h1[k] = false;
					h2[k] = false;
				}
			} else {
				h1[k] = false;
				h2[k] = false;
			}
		}
		highlights1 = h1;
		highlights2 = h2;
	} else {
		highlights1 = {};
		highlights2 = {};
	}
</script>

<div class="px-4 py-3 max-w-5xl mx-auto">
	<h1 class="mb-3 text-xl font-semibold">Compare Players</h1>

	<div class="mb-4 grid gap-2 md:grid-cols-2 items-start">
		<div class="flex-1 relative">
			<label for="player1-input" class="block text-sm font-medium text-muted-foreground mb-1">Player 1</label>
			<input
				id="player1-input"
				type="search"
				bind:value={query1}
				on:focus={() => (open1 = true)}
				on:input={() => (open1 = true)}
				placeholder="Search players..."
				class="border-input bg-background dark:bg-input/30 text-foreground w-full rounded-md border px-2 py-1 text-sm h-9 shadow-xs transition-[color,box-shadow] outline-none disabled:cursor-not-allowed disabled:opacity-50"
				aria-autocomplete="list"
				aria-controls="player1-listbox"
				aria-expanded={open1}
				autocomplete="off"
			/>

			{#if open1 && filtered1.length > 0}
				<ul
					id="player1-listbox"
					role="listbox"
					class="absolute z-50 mt-1 max-h-56 w-full overflow-auto rounded-md border border-border bg-card shadow-lg"
				>
					{#each filtered1 as p}
						<li
							role="option"
							aria-selected={(selected1 && playerKey(selected1) === playerKey(p))}
							class="cursor-pointer px-2 py-1 hover:bg-accent/10 dark:hover:bg-input/50 text-foreground text-sm"
							on:mousedown|preventDefault={() => selectPlayer1(p)}
						>
							{p.player}
						</li>
					{/each}
				</ul>
			{:else if open1}
				<div class="absolute z-50 mt-1 w-full rounded-md border border-border bg-card px-2 py-1 text-sm text-muted-foreground">
					No results
				</div>
			{/if}
		</div>

		<div class="flex-1 relative">
			<label for="player2-input" class="block text-sm font-medium text-muted-foreground mb-1">Player 2</label>
			<input
				id="player2-input"
				type="search"
				bind:value={query2}
				on:focus={() => (open2 = true)}
				on:input={() => (open2 = true)}
				placeholder="Search players..."
				class="border-input bg-background dark:bg-input/30 text-foreground w-full rounded-md border px-2 py-1 text-sm h-9 shadow-xs transition-[color,box-shadow] outline-none disabled:cursor-not-allowed disabled:opacity-50"
				aria-autocomplete="list"
				aria-controls="player2-listbox"
				aria-expanded={open2}
				autocomplete="off"
			/>

			{#if open2 && filtered2.length > 0}
				<ul
					id="player2-listbox"
					role="listbox"
					class="absolute z-50 mt-1 max-h-56 w-full overflow-auto rounded-md border border-border bg-card shadow-lg"
				>
					{#each filtered2 as p}
						<li
							role="option"
							aria-selected={(selected2 && playerKey(selected2) === playerKey(p))}
							class="cursor-pointer px-2 py-1 hover:bg-accent/10 dark:hover:bg-input/50 text-foreground text-sm"
							on:mousedown|preventDefault={() => selectPlayer2(p)}
						>
							{p.player}
						</li>
					{/each}
				</ul>
			{:else if open2}
				<div class="absolute z-50 mt-1 w-full rounded-md border border-border bg-card px-2 py-1 text-sm text-muted-foreground">
					No results
				</div>
			{/if}
		</div>
	</div>

	<div class="grid grid-cols-1 gap-4 md:grid-cols-2 md:items-start">
		<div class="w-full md:max-w-md md:mx-auto">
				<div class="min-h-0">
					<PercentileCard percentiles={percentiles1} player={selected1} highlights={highlights1} />
				</div>
		</div>
		<div class="w-full md:max-w-md md:mx-auto">
				<div class="min-h-0">
					<PercentileCard percentiles={percentiles2} player={selected2} highlights={highlights2} />
				</div>
		</div>
	</div>
</div>

