<script lang="ts">
	import { page } from '$app/stores';
	import { goto } from '$app/navigation';
	import { enhance } from '$app/forms';
	import './+page.css';

	// UI components
	import { Card, CardHeader, CardTitle, CardContent } from '$lib/components/ui/card';
	import { Button } from '$lib/components/ui/button';
	import {
		Table,
		TableHeader,
		TableRow,
		TableHead,
		TableBody,
		TableCell,
		TableCaption
	} from '$lib/components/ui/table';

	// Server-provided data
	export let data: {
		players?: Array<Record<string, any>>;
		period?: 'week1' | 'week2' | 'week3' | 'week4' | 'week5' | 'alltime';
	} = {};

	let allPlayers: Array<Record<string, any>> = data.players ?? [];
	let renderedPlayers: Array<Record<string, any>> = allPlayers.slice(0, 20);
	let selected: Record<string, any> | null = null;
	let selectedPeriod = $page.url.searchParams.get('period') || 'alltime';

	// Update data when period changes
	$: if (data.period) {
		selectedPeriod = data.period;
		allPlayers = data.players ?? [];
		renderedPlayers = allPlayers.slice(0, 20);
		// Reset selected player when period changes
		if (selected) {
			selected = allPlayers.find((p) => p.player === selected?.player) || null;
		}
	}

	const cols: Array<{
		key: 'player' | 'acs' | 'kd' | 'adr';
		label: string;
		align?: 'left' | 'right';
	}> = [
		{ key: 'player', label: 'Player', align: 'left' },
		{ key: 'acs', label: 'ACS', align: 'right' },
		{ key: 'kd', label: 'K/D', align: 'right' },
		{ key: 'adr', label: 'ADR', align: 'right' }
	];

	const fmtNum = (n: unknown, digits = 2) =>
		typeof n === 'number' && Number.isFinite(n) ? n.toFixed(digits) : String(n ?? '');

	// Percentile helpers
	import { percentileRank, toPercent } from '$lib/utils';
	const percentileExclude = new Set(['id', 'player']);
	function computeSelectedPercentiles(
		sel: Record<string, any>,
		arr: Array<Record<string, any>>
	): Record<string, number> {
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
	$: selectedPercentiles = selected ? computeSelectedPercentiles(selected, allPlayers) : {};

	// Top 7 stats to display with equal emphasis
	const topStats = [
		{ key: 'acs', label: 'ACS', format: (v: any) => fmtNum(v, 1) },
		{ key: 'kd', label: 'K/D', format: (v: any) => fmtNum(v, 2) },
		{ key: 'adr', label: 'ADR', format: (v: any) => fmtNum(v, 1) },
		{ key: 'kast_pct', label: 'KAST%', format: (v: any) => fmtNum(v, 1) },
		{ key: 'hs_pct', label: 'HS%', format: (v: any) => fmtNum(v, 1) }
		// { key: 'kpr', label: 'KPR', format: (v: any) => fmtNum(v, 2) },
		// { key: 'econ_rating', label: 'Econ Rating', format: (v: any) => fmtNum(v, 1) }
	];

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

	// Layout components
	import DashboardCenter from '$lib/components/layout/DashboardCenter.svelte';
	import DashboardGrid from '$lib/components/layout/DashboardGrid.svelte';

	// Profile picture placeholder
	import profilePicture from '$lib/assets/fatpig.jpg';
</script>

<DashboardCenter max="max-w-7xl" vertical="center">
	<DashboardGrid cols="md:grid-cols-2" gap="gap-8">
		<Card
			class="minimal-shadow minimal-shadow-hover border-border bg-card w-full rounded-xl border"
		>
			<CardHeader class="pb-1">
				<div class="flex w-full items-center justify-between">
					<CardTitle class="font-heading text-foreground text-2xl font-semibold"
						>Top 20 Players</CardTitle
					>
					<div class="week-toggle-group">
						<label for="period-select" class="sr-only">Select period</label>
						<div class="relative inline-block">
							<select
								id="period-select"
								class="appearance-none rounded-md border border-border bg-card px-3 py-1 text-sm text-foreground shadow-sm focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary pr-8"
								bind:value={selectedPeriod}
								on:change={() => goto(`?period=${selectedPeriod}`)}
								aria-label="Select period"
							>
								<option value="week1">Week 1</option>
								<option value="week2">Week 2</option>
								<option value="week3">Week 3</option>
								<option value="week4">Week 4</option>
								<option value="week5">Week 5</option>
								<option value="alltime">All Time</option>
							</select>

							<!-- chevron icon -->
							<svg
								xmlns="http://www.w3.org/2000/svg"
								viewBox="0 0 20 20"
								fill="currentColor"
								class="pointer-events-none absolute right-2 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground"
								aria-hidden="true"
							>
								<path fill-rule="evenodd" d="M5.23 7.21a.75.75 0 011.06.02L10 10.94l3.71-3.71a.75.75 0 111.06 1.06l-4.24 4.24a.75.75 0 01-1.06 0L5.21 8.29a.75.75 0 01.02-1.08z" clip-rule="evenodd" />
							</svg>
						</div>
					</div>
				</div>
			</CardHeader>
			<CardContent class="period-transition">
				<Table class="w-full border-separate border-spacing-x-0 border-spacing-y-2">
					<TableCaption>{allPlayers.length} players (ordered by ACS)</TableCaption>
					<TableHeader>
						<TableRow>
							<TableHead class="w-12 text-right">#</TableHead>
							{#each cols as c}
								<TableHead
									class={`${c.align === 'right' ? 'text-right' : 'text-left'} ${c.key === 'player' ? 'w-44 md:w-48' : 'px-4'} last:pr-2 md:last:pr-4`}
								>
									{c.label}
								</TableHead>
							{/each}
						</TableRow>
					</TableHeader>
					<TableBody>
						{#each renderedPlayers as p, i (p.id ?? i)}
							<TableRow
								class={`hover:bg-accent relative cursor-pointer rounded-xl transition-all duration-150 focus:outline-none ${selected?.id === p.id ? 'bg-accent selected-row' : 'bg-card'}`}
								tabindex={0}
								aria-selected={selected?.id === p.id}
								onclick={() => (selected = p)}
							>
								<TableCell
									class={`text-right font-mono font-medium ${selected?.id === p.id ? 'text-[#3B82F6]' : 'text-[#6B7280]'}`}
									>{i + 1}</TableCell
								>
								{#each cols as c}
									<TableCell
										class={`${c.align === 'right' ? 'text-right' : 'text-left'} ${c.key === 'player' ? 'w-44 md:w-48' : 'px-4'} last:pr-2 md:last:pr-4`}
									>
										{#if c.key === 'player'}
											<div class="flex items-center gap-3">
												<img
													src={profilePicture}
													alt={`${p.player}'s profile picture`}
													class="h-8 w-8 shrink-0 rounded-full border object-cover md:h-10 md:w-10 {selected?.id ===
													p.id
														? 'border-primary border-2'
														: 'border-border'} hover:border-primary transition-colors duration-150"
													loading="lazy"
												/>
												<span>{p.player}</span>
											</div>
										{:else if c.key === 'acs'}
											{fmtNum(p.acs, 1)}
										{:else if c.key === 'kd'}
											{fmtNum(p.kd, 2)}
										{:else if c.key === 'adr'}
											{fmtNum(p.adr, 1)}
										{/if}
									</TableCell>
								{/each}
							</TableRow>
						{/each}
					</TableBody>
				</Table>
			</CardContent>
		</Card>
		<Card
			class="minimal-shadow minimal-shadow-hover border-border bg-card w-full rounded-xl border"
		>
			<CardHeader class="pb-6">
				<div
					class="player-header flex items-center justify-center gap-3 {selected
						? 'player-header-enter'
						: ''}"
				>
					<CardTitle class="font-heading text-foreground text-center text-2xl font-semibold">
						{#if selected}
							{selected.player ?? '(Unknown Player)'}
						{:else}
							Player Stats & Rankings
						{/if}
					</CardTitle>
					{#if selected}
						<Button
							variant="ghost"
							size="icon"
							class="hover:bg-destructive/10 hover:text-destructive deselect-button h-8 w-8 rounded-full"
							onclick={() => (selected = null)}
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
								<path d="M18 6L6 18M6 6l12 12" />
							</svg>
						</Button>
					{/if}
				</div>
			</CardHeader>
			<CardContent>
				{#if selected && Object.keys(selectedPercentiles).length > 0}
					<div class="space-y-6">
						<div class="flex flex-col items-center gap-3 pb-2">
							<img
								src={profilePicture}
								alt={`${selected.player}'s profile picture`}
								class="border-primary minimal-shadow h-20 w-20 shrink-0 rounded-full border-2 object-cover md:h-24 md:w-24"
								loading="lazy"
							/>
							<div class="text-muted-foreground text-center text-sm">
								Top 5 stats with percentile rankings
							</div>
						</div>
						{#each topStats as stat (stat.key)}
							{#if selectedPercentiles[stat.key] !== undefined && selected[stat.key] != null}
								<div class="space-y-2">
									<div class="flex items-center justify-between">
										<span class="text-sm font-medium">{stat.label}</span>
										<div class="flex items-center gap-4">
											<span class="font-mono text-base font-bold">
												{stat.format(selected[stat.key])}
											</span>
											<span
												class={`text-base font-bold ${getPercentileTextColor(selectedPercentiles[stat.key])}`}
											>
												Top {getTopPercent(selectedPercentiles[stat.key])}%
											</span>
										</div>
									</div>
									<div class="bg-muted h-2 w-full overflow-hidden rounded-full">
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
					<div class="text-muted-foreground text-center text-sm">
						Click a row to see player stats and percentile rankings here.
					</div>
				{/if}
			</CardContent>
		</Card>
	</DashboardGrid>
</DashboardCenter>

<style>
	:global(tr[data-slot='table-row']) {
		border-bottom: none;
		border: none;
	}

	/* Removed inner rounded selection outline to avoid mismatch */
</style>
