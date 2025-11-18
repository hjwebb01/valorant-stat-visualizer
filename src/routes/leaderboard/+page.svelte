<script lang="ts">
	import { page } from '$app/stores';
	import ColumnsFilter from '$lib/components/leaderboard/ColumnsFilter.svelte';
	import LeaderboardTable from '$lib/components/leaderboard/LeaderboardTable.svelte';
	import { Card, CardHeader, CardTitle, CardContent } from '$lib/components/ui/card';
	import { Button } from '$lib/components/ui/button';
	import { Input } from '$lib/components/ui/input';
	import type { Col, Key, Player } from '$lib/types';
	import { onMount } from 'svelte';
	import { percentileRank, toPercent } from '$lib/utils';
	import profilePicture from '$lib/assets/fatpig.jpg';
	import './+page.css';

	export let data: { players: Player[]; period?: 'week1' | 'week2' | 'alltime' };
	let players: Player[] = [];
	$: players = data.players ?? [];
	let selectedPeriod = $page.url.searchParams.get('period') || 'alltime';
	let searchQuery = '';

	// Add rank to players based on their original order
	$: playersWithRank = players.map((player, index) => ({ ...player, rank: index + 1 }));

	// Filter players based on search query
	$: filteredPlayers = (() => {
		if (!searchQuery.trim()) {
			return playersWithRank;
		}
		const normalizedQuery = searchQuery.toLowerCase().trim();
		return playersWithRank.filter((player) =>
			player.player?.toLowerCase().trim().includes(normalizedQuery)
		);
	})();

	// Update period when data changes
	$: if (data.period) {
		selectedPeriod = data.period;
		// Reset selected player when period changes
		if (selectedPlayer) {
			selectedPlayer = players.find((p) => p.player === selectedPlayer?.player) || null;
		}
	}

	const playerKey = (p: (Player & Record<string, any>) | Player | null | undefined) => {
		if (!p) return '';
		return (
			(p as any).id ??
			(p as any).player_id ??
			`${p.player ?? ''}-${(p as any).dataset_id ?? ''}`
		).toString();
	};

	let selectedPlayer: Player | null = null;
	$: if (selectedPlayer && !players.some((p) => playerKey(p) === playerKey(selectedPlayer))) {
		selectedPlayer = null;
	}

	const cols: Col[] = [
		{
			key: 'player',
			label: 'Player',
			align: 'left',
			widthClass: 'min-w-0 truncate whitespace-nowrap'
		},
		{
			key: 'agents',
			label: 'Agents',
			align: 'left',
			widthClass: 'min-w-0 whitespace-nowrap'
		},
		{ key: 'games', label: 'Maps', align: 'right', digits: 0 },
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
	let visibleSet = new Set<Key>(cols.filter((c) => !c.hidden).map((c) => c.key));
	onMount(() => {
		try {
			const raw = localStorage.getItem(STORAGE_KEY);
			if (raw) visibleSet = new Set(JSON.parse(raw));
		} catch {}
	});
	$: {
		try {
			localStorage.setItem(STORAGE_KEY, JSON.stringify([...visibleSet]));
		} catch {}
	}
	$: visibleCols = cols.filter((c) => visibleSet.has(c.key));

	function toggleColumn(k: Key) {
		if (visibleSet.has(k)) visibleSet.delete(k);
		else visibleSet.add(k);
		visibleSet = new Set(visibleSet);
	}
	function showAll() {
		visibleSet = new Set(cols.map((c) => c.key));
	}
	function hideAll() {
		visibleSet = new Set<Key>(['player']);
	}
	function resetDefaults() {
		visibleSet = new Set<Key>(cols.filter((c) => !c.hidden).map((c) => c.key));
	}

	// Percentile helpers
	const percentileExclude = new Set(['id', 'player', 'agents', 'created_at', 'dataset_id', 'rank']);
	function computeSelectedPercentiles(sel: Player, arr: Player[]): Record<string, number> {
		const out: Record<string, number> = {};
		for (const [k, v] of Object.entries(sel)) {
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

	let selectedPercentiles: Record<string, number> = {};
	$: selectedPercentiles = selectedPlayer
		? computeSelectedPercentiles(selectedPlayer, filteredPlayers)
		: {};

	// Top stats to display with equal emphasis
	const topStats: Array<{ key: Key; label: string; format: (v: any) => string }> = [
		{ key: 'acs', label: 'ACS', format: (v: any) => fmtNum(v, 1) },
		{ key: 'kd', label: 'K/D', format: (v: any) => fmtNum(v, 2) },
		{ key: 'adr', label: 'ADR', format: (v: any) => fmtNum(v, 1) },
		{ key: 'kast_pct', label: 'KAST%', format: (v: any) => fmtNum(v, 1) },
		{ key: 'hs_pct', label: 'HS%', format: (v: any) => fmtNum(v, 1) }
	];

	const fmtNum = (n: unknown, digits = 2) =>
		typeof n === 'number' && Number.isFinite(n) ? n.toFixed(digits) : String(n ?? '');

	function getTopPercent(percentile: number): number {
		return 100 - percentile;
	}

	function getPercentileColor(percentile: number): string {
		const topPercent = getTopPercent(percentile);
		// Simple blue gradient - professional and subtle
		if (topPercent <= 10) return 'bg-gradient-to-r from-[#3B82F6] to-[#2563EB]'; // Deep blue
		if (topPercent <= 25) return 'bg-gradient-to-r from-[#60A5FA] to-[#3B82F6]'; // Medium blue
		if (topPercent <= 50) return 'bg-gradient-to-r from-[#93C5FD] to-[#60A5FA]'; // Light blue
		if (topPercent <= 75) return 'bg-gradient-to-r from-[#DBEAFE] to-[#93C5FD]'; // Very light blue
		return 'bg-gradient-to-r from-[#E5E7EB] to-[#D1D5DB]'; // Gray
	}

	function getPercentileTextColor(percentile: number): string {
		const topPercent = getTopPercent(percentile);
		// Blue accent for percentile text - clean and professional
		if (topPercent <= 10) return 'text-[#2563EB]'; // Deep blue
		if (topPercent <= 25) return 'text-[#3B82F6]'; // Blue
		if (topPercent <= 50) return 'text-[#60A5FA]'; // Medium blue
		if (topPercent <= 75) return 'text-[#93C5FD]'; // Light blue
		return 'text-[#6B7280]'; // Gray
	}

	// Sorting
	let sortKey: Key = 'acs',
		sortAsc = false;
	function sortBy(k: Key) {
		if (sortKey === k) sortAsc = !sortAsc;
		else {
			sortKey = k;
			const descPref = new Set<Key>([
				'acs',
				'kd',
				'adr',
				'kast_pct',
				'kills',
				'kpg',
				'kpr',
				'deaths',
				'dpg',
				'dpr',
				'assists',
				'apg',
				'apr',
				'fk',
				'fkpg',
				'fd',
				'fdpg',
				'hs_pct',
				'econ_rating',
				'games',
				'games_won',
				'games_lost',
				'rounds',
				'rounds_won',
				'rounds_lost',
				'plants',
				'plants_per_game',
				'defuses',
				'defuses_per_game'
			]);
			sortAsc = !descPref.has(k);
		}
	}

	function handleSelect(event: CustomEvent<{ player: Player }>) {
		selectedPlayer = event.detail.player;
	}

	function clearSelection() {
		selectedPlayer = null;
	}
</script>

<!-- FULL-VIEWPORT WRAPPER: no page scroll -->
<div class="bg-background fixed inset-0 h-dvh pt-20">
	<div class="h-full min-h-0 overflow-y-auto" data-scrollport>
		<div
			class="grid h-full min-h-0 w-full grid-cols-1 grid-rows-[30dvh_minmax(0,1fr)] gap-3 p-3 md:grid-rows-none {selectedPlayer
				? 'md:grid-cols-[clamp(160px,22vw,220px)_minmax(0,1fr)_clamp(300px,25vw,400px)] lg:grid-cols-[clamp(200px,18vw,260px)_minmax(0,1fr)_clamp(320px,22vw,420px)] xl:grid-cols-[280px_minmax(0,1fr)_360px]'
				: 'md:grid-cols-[clamp(160px,22vw,220px)_minmax(0,1fr)] lg:grid-cols-[clamp(200px,18vw,260px)_minmax(0,1fr)] xl:grid-cols-[280px_minmax(0,1fr)]'}"
		>
			<div class="h-full min-h-0 overflow-auto md:overflow-visible">
				<Input
					type="search"
					placeholder="Search players..."
					bind:value={searchQuery}
					class="mb-4"
					aria-label="Search players"
				/>
				<ColumnsFilter
					{cols}
					{visibleSet}
					on:toggle={(e) => toggleColumn(e.detail.key)}
					on:showAll={showAll}
					on:hideAll={hideAll}
					on:reset={resetDefaults}
				/>
			</div>
			<div class="h-full min-h-0">
				<LeaderboardTable
					players={filteredPlayers}
					{visibleCols}
					{sortKey}
					{sortAsc}
					{selectedPlayer}
					{selectedPeriod}
					on:sort={(e) => sortBy(e.detail.key)}
					on:select={handleSelect}
				/>
			</div>
			{#if selectedPlayer}
				<div class="h-full min-h-0 overflow-auto md:overflow-visible">
					<Card
						class="minimal-shadow minimal-shadow-hover border-border flex h-full w-full flex-col rounded-xl border"
					>
						<CardHeader class="shrink-0 pb-6">
							<div
								class="player-header flex items-center justify-center gap-3 {selectedPlayer
									? 'player-header-enter'
									: ''}"
							>
								<CardTitle
									class="font-heading flex-1 text-center text-2xl font-semibold text-[#171717 dark:#f1f2f3]"
								>
									{selectedPlayer.player ?? '(Unknown Player)'}
								</CardTitle>
								<Button
									variant="ghost"
									size="icon"
									onclick={clearSelection}
									class="hover:bg-destructive/10 hover:text-destructive deselect-button ml-2 h-8 w-8 shrink-0 rounded-full"
									aria-label="Deselect player"
								>
									<svg
										xmlns="http://www.w3.org/2000/svg"
										width="16"
										height="16"
										viewBox="0 0 24 24"
										fill="none"
										stroke="currentColor"
										stroke-width="2"
										stroke-linecap="round"
										stroke-linejoin="round"
									>
										<path d="M18 6L6 18" />
										<path d="M6 6l12 12" />
									</svg>
								</Button>
							</div>
						</CardHeader>
						<CardContent class="min-h-0 flex-1 overflow-y-auto">
							{#if Object.keys(selectedPercentiles).length > 0}
								<div class="space-y-6">
									<div class="flex flex-col items-center gap-3 pb-2">
										<img
											src={profilePicture}
											alt={`${selectedPlayer.player}'s profile picture`}
											class="minimal-shadow h-20 w-20 shrink-0 rounded-full border-2 border-[#3B82F6] object-cover md:h-24 md:w-24"
											loading="lazy"
										/>
										<div class="text-muted-foreground text-center text-sm">
											Top 5 stats with percentile rankings
										</div>
									</div>
									{#each topStats as stat (stat.key)}
										{#if selectedPercentiles[stat.key] !== undefined && selectedPlayer[stat.key as keyof Player] != null}
											<div class="space-y-2">
												<div class="flex items-center justify-between">
													<span class="text-sm font-medium">{stat.label}</span>
													<div class="flex items-center gap-4">
														<span class="font-mono text-base font-bold">
															{stat.format(selectedPlayer[stat.key as keyof Player])}
														</span>
														<span
															class={`text-base font-bold ${getPercentileTextColor(selectedPercentiles[stat.key])}`}
														>
															Top {getTopPercent(selectedPercentiles[stat.key])}%
														</span>
													</div>
												</div>
												<div class="h-2 w-full overflow-hidden rounded-full bg-[#E5E7EB]">
													<div
														class={`h-full transition-all duration-300 ${getPercentileColor(selectedPercentiles[stat.key])}`}
														style={`width: ${selectedPercentiles[stat.key]}%`}
													></div>
												</div>
											</div>
										{/if}
									{/each}
								</div>
							{:else}
								<div class="text-muted-foreground text-center text-sm">Loading stats...</div>
							{/if}
						</CardContent>
					</Card>
				</div>
			{/if}
		</div>
	</div>
</div>
