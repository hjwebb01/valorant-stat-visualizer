<script lang="ts">
	import type { Team, Match, BracketMatchId } from '$lib/bracket_store/bracketTypes';
	import {
		getPredictionStatus,
		isTeamCorrectlyPredicted,
		isTeamIncorrectlyPredicted
	} from '$lib/bracket_store/bracketComparison';

	// Import all team logos
	import powLogo from '$lib/assets/teams/pokeballofwonders.png';
	import horLogo from '$lib/assets/teams/hooters.png';
	import ttrLogo from '$lib/assets/teams/terenceterencerence.png';
	import tbbLogo from '$lib/assets/teams/thebigblack.png';
	import jtrrLogo from '$lib/assets/teams/jtrebuildrebuild.png';
	import chudLogo from '$lib/assets/teams/chud.png';
	import stdLogo from '$lib/assets/teams/std.png';
	import tbcLogo from '$lib/assets/teams/tbc.png';

	let {
		match,
		userPrediction,
		onSetWinner
	}: {
		match: Match;
		userPrediction?: Match;
		onSetWinner: (matchId: BracketMatchId, team: Team) => boolean;
	} = $props();

	const teamLogos: Record<string, string> = {
		POW: powLogo,
		HOR: horLogo,
		TTR: ttrLogo,
		TBB: tbbLogo,
		JTRR: jtrrLogo,
		CHUD: chudLogo,
		STD: stdLogo,
		TBC: tbcLogo
	};

	function getTeamLogo(team: Team | null): string | null {
		if (!team) return null;
		return teamLogos[team.tag] || null;
	}

	function handleTeamClick(team: Team) {
		// Click functionality has been disabled
	}

	function getTeamClass(team: Team | null): string {
		if (!team) return '';

		if (userPrediction) {
			const actualWinner = match.winner;
			const predictedWinner = userPrediction.winner;

			if (!actualWinner) {
				return '';
			}

			const isThisTeamTheActualWinner = team.name === actualWinner.name;
			const predictionWasCorrect = predictedWinner?.name === actualWinner.name;

			if (isThisTeamTheActualWinner) {
				return predictionWasCorrect
					? 'border-green-500 ring-2 ring-green-500 bg-green-500/10'
					: 'border-red-500 ring-2 ring-red-500 bg-red-500/10';
			}

			return 'opacity-50';
		}

		const predictionStatus = getPredictionStatus(match);

		if (predictionStatus === 'pending') {
			if (match.winner && match.winner.name === team.name)
				return 'border-primary ring-2 ring-primary';
			if (match.winner) return 'opacity-50';
			return 'hover:bg-accent cursor-pointer';
		}

		if (isTeamCorrectlyPredicted(match, team)) {
			return 'border-green-500 ring-2 ring-green-500 bg-green-500/10';
		}

		if (isTeamIncorrectlyPredicted(match, team)) {
			return 'border-red-500 ring-2 ring-red-500 bg-red-500/10';
		}

		return 'opacity-50';
	}
</script>

<div class="bg-card border-border flex w-36 flex-col border">
	<button
		type="button"
		class="flex w-full items-center justify-between gap-2 px-3 py-2 text-left {getTeamClass(
			match.team1
		)}"
		onclick={() => match.team1 && handleTeamClick(match.team1)}
		disabled={!match.team1 || (match.winner && match.winner.name === match.team1?.name)}
	>
		<div class="flex items-center gap-2">
			{#if match.team1}
				{#if getTeamLogo(match.team1)}
					<img src={getTeamLogo(match.team1)} alt={match.team1.name} class="h-5 w-5 object-cover" />
				{/if}
				<span class="text-foreground text-sm font-medium">{match.team1.tag}</span>
			{:else}
				<span class="text-muted-foreground text-sm italic">TBD</span>
			{/if}
		</div>
		{#if match.team1}
			<span class="text-muted-foreground text-xs">({match.team1.seed})</span>
		{/if}
	</button>
	<div class="bg-border h-px"></div>
	<button
		type="button"
		class="flex w-full items-center justify-between gap-2 px-3 py-2 text-left {getTeamClass(
			match.team2
		)}"
		onclick={() => match.team2 && handleTeamClick(match.team2)}
		disabled={!match.team2 || (match.winner && match.winner.name === match.team2?.name)}
	>
		<div class="flex items-center gap-2">
			{#if match.team2}
				{#if getTeamLogo(match.team2)}
					<img src={getTeamLogo(match.team2)} alt={match.team2.name} class="h-5 w-5 object-cover" />
				{/if}
				<span class="text-foreground text-sm font-medium">{match.team2.tag}</span>
			{:else}
				<span class="text-muted-foreground text-sm italic">TBD</span>
			{/if}
		</div>
		{#if match.team2}
			<span class="text-muted-foreground text-xs">({match.team2.seed})</span>
		{/if}
	</button>
</div>
