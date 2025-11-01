<script lang="ts">
	import { Card, CardHeader, CardTitle, CardContent } from '$lib/components/ui/card';

	export let percentiles: Record<string, number> = {};
	// eslint-disable-next-line @typescript-eslint/no-explicit-any
	export let player: Record<string, any> | null = null;

	// Top 5 stats to display
	const topStats = [
		{ key: 'acs', label: 'ACS (Avg Combat Score)' },
		{ key: 'kd', label: 'K/D (Kill/Death Ratio)' },
		{ key: 'adr', label: 'ADR (Avg Damage/Round)' },
		{ key: 'kast_pct', label: 'KAST%' },
		{ key: 'hs_pct', label: 'HS% (Headshot %)' }
	];

	function getPercentileColor(percentile: number): string {
		if (percentile >= 90) return 'bg-green-500';
		if (percentile >= 75) return 'bg-blue-500';
		if (percentile >= 50) return 'bg-yellow-500';
		if (percentile >= 25) return 'bg-orange-500';
		return 'bg-red-500';
	}

	function getPercentileTextColor(percentile: number): string {
		if (percentile >= 90) return 'text-green-600';
		if (percentile >= 75) return 'text-blue-600';
		if (percentile >= 50) return 'text-yellow-600';
		if (percentile >= 25) return 'text-orange-600';
		return 'text-red-600';
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
		{#if player && Object.keys(percentiles).length > 0}
			<div class="space-y-4">
				<div class="text-muted-foreground mb-4 text-center text-sm">
					Showing {player.player}'s ranking among all players
				</div>
				{#each topStats as stat (stat.key)}
					{#if percentiles[stat.key] !== undefined}
						<div class="space-y-2">
							<div class="flex items-center justify-between">
								<span class="text-sm font-medium">{stat.label}</span>
								<div class="flex items-center gap-2">
									<span class="text-muted-foreground text-xs">
										{formatValue(player[stat.key])}
									</span>
									<span
										class={`text-sm font-bold ${getPercentileTextColor(percentiles[stat.key])}`}
									>
										Top {percentiles[stat.key]}%
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
