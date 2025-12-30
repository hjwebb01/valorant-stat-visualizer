<script lang="ts">
	import { Card, CardHeader, CardTitle, CardContent } from '$lib/components/ui/card';
	import profilePicture from '$lib/assets/fatpig.jpg';

	export let percentiles: Record<string, number> = {};
	// eslint-disable-next-line @typescript-eslint/no-explicit-any
	export let player: Record<string, any> | null = null;
	// optional highlights map: key -> true if this player has the higher metric in a comparison
	// e.g. { acs: true, kd: false }
	// eslint-disable-next-line @typescript-eslint/no-explicit-any
	export let highlights: Record<string, any> = {};

	// Top 5 stats to display
	const topStats = [
		{ key: 'acs', label: 'ACS (Avg Combat Score)' },
		{ key: 'kd', label: 'K/D (Kill/Death Ratio)' },
		{ key: 'adr', label: 'ADR (Avg Damage/Round)' },
		{ key: 'kast_pct', label: 'KAST%' },
		{ key: 'hs_pct', label: 'HS% (Headshot %)' }
	];

	// Helper to convert percentile rank to "top X%" value
	// If percentile is 92, player is better than 92% of players, so they're in the top 8%
	function getTopPercent(percentile: number): number {
		return 100 - percentile;
	}

	function getPercentileColor(percentile: number): string {
		const topPercent = getTopPercent(percentile);
		if (topPercent <= 10) return 'bg-gradient-to-r from-[#3B82F6] to-[#2563EB]'; // Deep blue
		if (topPercent <= 25) return 'bg-gradient-to-r from-[#60A5FA] to-[#3B82F6]'; // Medium blue
		if (topPercent <= 50) return 'bg-gradient-to-r from-[#93C5FD] to-[#60A5FA]'; // Light blue
		if (topPercent <= 75) return 'bg-gradient-to-r from-[#DBEAFE] to-[#93C5FD]'; // Very light blue
		return 'bg-gradient-to-r from-[#E5E7EB] to-[#D1D5DB]'; // Gray
	}

	function getPercentileTextColor(percentile: number): string {
		const topPercent = getTopPercent(percentile);
		if (topPercent <= 10) return 'text-[#2563EB]'; // Deep blue
		if (topPercent <= 25) return 'text-[#3B82F6]'; // Blue
		if (topPercent <= 50) return 'text-[#60A5FA]'; // Medium blue
		if (topPercent <= 75) return 'text-[#93C5FD]'; // Light blue
		return 'text-[#6B7280]'; // Gray
	}

	// eslint-disable-next-line @typescript-eslint/no-explicit-any
	function formatValue(value: any): string {
		if (value == null) return '-';
		if (typeof value === 'number') {
			return value.toFixed(2);
		}
		return String(value);
	}
</script>

<Card class="w-full">
	<CardHeader>
		<CardTitle class="text-center text-2xl">Percentile Rankings</CardTitle>
	</CardHeader>
	<CardContent>
		{#if player}
			<div class="flex flex-col items-center gap-3 pb-2">
				<img
					src={player.profile_picture ?? profilePicture}
					alt={`${player.player}'s profile picture`}
					class="minimal-shadow h-20 w-20 shrink-0 rounded-full object-cover md:h-24 md:w-24"
					loading="lazy"
					style={player.rank_color ? `border:2px solid ${player.rank_color}` : ''}
				/>
				<div class="text-muted-foreground text-center text-sm">{player.player}</div>
			</div>
		{/if}

		{#if player && Object.keys(percentiles).length > 0}
			<div class="space-y-4">
				{#each topStats as stat (stat.key)}
					{#if percentiles[stat.key] !== undefined}
						<div
							class="space-y-2 {highlights[stat.key] ? 'border-l-4 border-green-400/60 pl-2' : ''}"
						>
							<div class="flex items-center justify-between">
								<span class="text-sm font-medium">{stat.label}</span>
								<div class="flex items-center gap-2">
									<span class="text-muted-foreground text-xs">
										{formatValue(player[stat.key])}
									</span>
									<span
										class={`text-sm font-bold ${getPercentileTextColor(percentiles[stat.key])}`}
									>
										Top {getTopPercent(percentiles[stat.key])}%
									</span>
								</div>
							</div>
							<div class="bg-muted h-2 w-full overflow-hidden rounded-full">
								<div
									class={`h-full transition-all duration-300 ${getPercentileColor(percentiles[stat.key])}`}
									style={`width: ${percentiles[stat.key]}%`}
								></div>
							</div>
						</div>
					{/if}
				{/each}
			</div>
		{:else}
			<div class="text-muted-foreground text-center text-sm">
				Select a player to see their percentile rankings in the top 5 stats.
			</div>
		{/if}
	</CardContent>
</Card>
