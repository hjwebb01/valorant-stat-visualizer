<script lang="ts">
	// UI components
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

	// Server-provided data
	export let data: {
		players?: Array<Record<string, any>>;
	} = {};
	let allPlayers: Array<Record<string, any>> = data.players ?? [];
	let renderedPlayers: Array<Record<string, any>> = allPlayers.slice(0, 20);
	let selected: Record<string, any> | null = null;

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
		{ key: 'hs_pct', label: 'HS%', format: (v: any) => fmtNum(v, 1) },
		{ key: 'kpr', label: 'KPR', format: (v: any) => fmtNum(v, 2) },
		{ key: 'econ_rating', label: 'Econ Rating', format: (v: any) => fmtNum(v, 1) }
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
		<Card class="w-full minimal-shadow minimal-shadow-hover border border-[#E5E7EB] rounded-xl bg-white">
			<CardHeader class="pb-6">
				<CardTitle class="text-center text-2xl font-heading text-[#111827] font-semibold">Top 20 Players</CardTitle>
			</CardHeader>
			<CardContent>
				<Table class="w-full border-separate border-spacing-y-2 border-spacing-x-0">
					<TableCaption>{allPlayers.length} players (ordered by ACS)</TableCaption>
					<TableHeader>
						<TableRow>
							<TableHead class="w-12 text-right">#</TableHead>
							{#each cols as c}
								<TableHead class={c.align === 'right' ? 'text-right' : 'text-left'}
									>{c.label}</TableHead
								>
							{/each}
						</TableRow>
					</TableHeader>
					<TableBody>
						{#each renderedPlayers as p, i (p.id ?? i)}
							<TableRow
								class={`relative hover:bg-[#F8F9FA] cursor-pointer focus:outline-none transition-all duration-150 rounded-xl ${selected?.id === p.id ? 'bg-[#EFF6FF] selected-row' : 'bg-white'}`}
								tabindex={0}
								aria-selected={selected?.id === p.id}
								onclick={() => (selected = p)}
							>
								<TableCell class={`text-right font-mono font-medium ${selected?.id === p.id ? 'text-[#3B82F6]' : i === 0 ? 'text-[#3B82F6]' : 'text-[#6B7280]'}`}>{i + 1}</TableCell>
								{#each cols as c}
									<TableCell class={c.align === 'right' ? 'text-right' : 'text-left'}>
										{#if c.key === 'player'}
											<div class="flex items-center gap-3">
												<img
													src={profilePicture}
													alt={`${p.player}'s profile picture`}
													class="h-8 w-8 shrink-0 rounded-full object-cover md:h-10 md:w-10 border {selected?.id === p.id ? 'border-[#3B82F6] border-2' : 'border-[#E5E7EB]'} hover:border-[#3B82F6] transition-colors duration-150"
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
		<Card class="w-full minimal-shadow minimal-shadow-hover border border-[#E5E7EB] rounded-xl bg-white">
			<CardHeader class="pb-6">
				<CardTitle class="text-center text-2xl font-heading text-[#111827] font-semibold">
					{#if selected}
						{selected.player ?? '(Unknown Player)'}
					{:else}
						Player Stats & Rankings
					{/if}
				</CardTitle>
			</CardHeader>
			<CardContent>
				{#if selected && Object.keys(selectedPercentiles).length > 0}
					<div class="space-y-6">
						<div class="flex flex-col items-center gap-3 pb-2">
							<img
								src={profilePicture}
								alt={`${selected.player}'s profile picture`}
								class="h-20 w-20 shrink-0 rounded-full object-cover md:h-24 md:w-24 border-2 border-[#3B82F6] minimal-shadow"
								loading="lazy"
							/>
							<div class="text-muted-foreground text-center text-sm">
								Top 7 stats with percentile rankings
							</div>
						</div>
						{#each topStats as stat (stat.key)}
							{#if selectedPercentiles[stat.key] !== undefined && selected[stat.key] != null}
								<div class="space-y-2">
									<div class="flex items-center justify-between">
										<span class="text-sm font-medium">{stat.label}</span>
										<div class="flex items-center gap-4">
											<span class="text-base font-bold font-mono">
												{stat.format(selected[stat.key])}
											</span>
											<span
												class={`text-base font-bold ${getPercentileTextColor(selectedPercentiles[stat.key])}`}
											>
												Top {getTopPercent(selectedPercentiles[stat.key])}%
											</span>
										</div>
									</div>
									<div class="bg-[#E5E7EB] h-2 w-full overflow-hidden rounded-full">
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

:global(.selected-row) {
	position: relative;
}

:global(.selected-row::after) {
	content: '';
	position: absolute;
	inset: 2px;
	border: 2px solid #3B82F6;
	border-radius: 0.75rem;
	pointer-events: none;
}
</style>
