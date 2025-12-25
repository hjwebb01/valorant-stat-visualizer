<script lang="ts">
	import type { Team, Match } from '$lib/stores/bracketStore';

	let { match, onSetWinner }: { match: Match; onSetWinner: (matchId: string, team: Team) => void } =
		$props();

	function handleTeamClick(team: Team) {
		if (!match.team1 || !match.team2) return;
		if (match.winner && match.winner.name === team.name) return;
		onSetWinner(match.id, team);
	}

	function getTeamClass(team: Team | null): string {
		if (!team) return '';
		if (match.winner && match.winner.name === team.name)
			return 'border-primary ring-2 ring-primary';
		if (match.winner) return 'opacity-50';
		return 'hover:bg-accent cursor-pointer';
	}
</script>

<div class="bg-card border-border flex w-48 flex-col gap-2 rounded-lg border p-3">
	<button
		type="button"
		class="border-border bg-card flex w-full items-center justify-between gap-2 rounded-md border p-2 text-left {getTeamClass(
			match.team1
		)}"
		onclick={() => match.team1 && handleTeamClick(match.team1)}
		disabled={!match.team1 || (match.winner && match.winner.name === match.team1?.name)}
	>
		{#if match.team1}
			<span class="text-foreground text-sm font-medium">{match.team1.tag}</span>
			<span class="text-muted-foreground text-xs">({match.team1.seed})</span>
		{:else}
			<span class="text-muted-foreground text-sm italic">TBD</span>
		{/if}
	</button>
	<button
		type="button"
		class="border-border bg-card flex w-full items-center justify-between gap-2 rounded-md border p-2 text-left {getTeamClass(
			match.team2
		)}"
		onclick={() => match.team2 && handleTeamClick(match.team2)}
		disabled={!match.team2 || (match.winner && match.winner.name === match.team2?.name)}
	>
		{#if match.team2}
			<span class="text-foreground text-sm font-medium">{match.team2.tag}</span>
			<span class="text-muted-foreground text-xs">({match.team2.seed})</span>
		{:else}
			<span class="text-muted-foreground text-sm italic">TBD</span>
		{/if}
	</button>
</div>
