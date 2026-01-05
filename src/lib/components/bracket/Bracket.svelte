<script lang="ts">
	import Match from './Match.svelte';
	import { matches, champion, setWinner } from '$lib/bracket_store/bracketStore';
	import { calculateBracketScore } from '$lib/bracket_store/bracketComparison';
	import { applyWinnerToState, createInitialMatches } from '$lib/bracket_store/bracketHelpers';
	import { MATCH_ORDER, REFERENCE_WINNERS } from '$lib/bracket_store/bracketConstants';
	import type { MatchState } from '$lib/bracket_store/bracketTypes';

	import { Button } from '$lib/components/ui/button';
	import { RefreshCw, Trophy } from '@lucide/svelte';

	// Import all team logos
	import powLogo from '$lib/assets/teams/pokeballofwonders.png';
	import horLogo from '$lib/assets/teams/hooters.png';
	import ttrLogo from '$lib/assets/teams/terenceterencerence.png';
	import tbbLogo from '$lib/assets/teams/thebigblack.png';
	import jtrrLogo from '$lib/assets/teams/jtrebuildrebuild.png';
	import chudLogo from '$lib/assets/teams/chud.png';
	import stdLogo from '$lib/assets/teams/std.png';
	import tbcLogo from '$lib/assets/teams/tbc.png';

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
	
	let showLive = $state(false);
	let predictionBracket = $derived($matches);
	let liveBracket = $derived(buildLiveBracketFromReferenceWinners());
	let displayedBracket = $derived(showLive ? liveBracket : predictionBracket);
	
	let championName = $derived(displayedBracket['GF']?.winner?.name ?? null);
	let championTag = $derived(displayedBracket['GF']?.winner?.tag ?? null);
	let score = $derived(calculateBracketScore($matches));

	function getChampionLogo(): string | null {
		if (!championTag) return null;
		return teamLogos[championTag] || null;
	}

	function revealLiveBracket(): void {
		showLive = !showLive;
	}

	function buildLiveBracketFromReferenceWinners(): MatchState {
		let state = createInitialMatches();
		
		for (const matchId of MATCH_ORDER) {
			const winnerTag = REFERENCE_WINNERS[matchId];
			if (winnerTag === 'tbd') continue;
			
			const match = state[matchId];
			if (!match?.team1 || !match?.team2) continue;
			
			const team = match.team1.tag === winnerTag 
				? match.team1 
				: match.team2.tag === winnerTag 
					? match.team2 
					: null;
			
			if (!team) continue;
			
			const newState = applyWinnerToState(state, matchId, team);
			if (newState) state = newState;
		}
		
		return state;
	}
</script>

<div class="mx-auto max-w-7xl p-6">
	<div class="mb-6 flex items-center justify-between">
		{#if showLive}
			<h1 class="text-foreground text-2xl font-bold">Live Tournament Bracket</h1>
		{:else}
			<h1 class="text-foreground text-2xl font-bold">Predicted Tournament Bracket</h1>
		{/if}
		<Button variant="toggle" data-state={showLive ? 'active' : 'inactive'} onclick={revealLiveBracket}>
			{showLive ? 'Show My Predictions' : 'Show Live Results'}
		</Button>
	</div>

	<!-- Score summary -->
	{#if score.total > 0}
		<div class="bg-muted mb-6 rounded-lg p-4">
			<h3 class="text-foreground mb-2 font-semibold">Your Bracket Score</h3>
			<div class="grid grid-cols-4 gap-4 text-center">
				<div>
					<div class="text-2xl font-bold text-green-500">{score.correct}</div>
					<div class="text-muted-foreground text-xs">Correct</div>
				</div>
				<div>
					<div class="text-2xl font-bold text-red-500">{score.incorrect}</div>
					<div class="text-muted-foreground text-xs">Incorrect</div>
				</div>
				<div>
					<div class="text-muted-foreground text-2xl font-bold">{score.pending}</div>
					<div class="text-muted-foreground text-xs">Pending</div>
				</div>
				<div>
					<div class="text-primary text-2xl font-bold">{score.accuracy.toFixed(1)}%</div>
					<div class="text-muted-foreground text-xs">Accuracy</div>
				</div>
			</div>
		</div>
	{/if}

	{#if championName}
		<div
			class="bg-primary text-primary-foreground mb-8 flex items-center justify-center gap-3 rounded-lg p-4 text-center"
		>
			<Trophy size={24} />
			<span class="text-lg font-semibold">Your Rivals 3 Champion:</span>
			<div class="flex items-center gap-2">
				{#if getChampionLogo()}
					<img src={getChampionLogo()} alt={championName} class="h-6 w-6 object-cover" />
				{/if}
				<span class="text-lg font-semibold">{championName}</span>
			</div>
		</div>
	{/if}

	<div class="overflow-x-auto">
		<div class="grid min-w-[1200px] grid-cols-[3fr_1fr]">
			<div class="flex flex-col gap-12">
				<div class="pl-1">
					<h2 class="text-muted-foreground mb-4 text-sm font-semibold uppercase">Upper Bracket</h2>
					<div class="flex items-center gap-16">
						<div class="flex flex-col gap-8">
							<Match match={displayedBracket['U1']} userPrediction={showLive ? predictionBracket['U1'] : undefined} onSetWinner={setWinner} />
							<Match match={displayedBracket['U2']} userPrediction={showLive ? predictionBracket['U2'] : undefined} onSetWinner={setWinner} />
							<Match match={displayedBracket['U3']} userPrediction={showLive ? predictionBracket['U3'] : undefined} onSetWinner={setWinner} />
							<Match match={displayedBracket['U4']} userPrediction={showLive ? predictionBracket['U4'] : undefined} onSetWinner={setWinner} />
						</div>
						<div class="flex flex-col gap-32">
							<Match match={displayedBracket['U5']} userPrediction={showLive ? predictionBracket['U5'] : undefined} onSetWinner={setWinner} />
							<Match match={displayedBracket['U6']} userPrediction={showLive ? predictionBracket['U6'] : undefined} onSetWinner={setWinner} />
						</div>
						<div class="flex flex-col justify-center">
							<Match match={displayedBracket['U7']} userPrediction={showLive ? predictionBracket['U7'] : undefined} onSetWinner={setWinner} />
						</div>
						<div class="relative ml-8 flex flex-col justify-center">
							<h2
								class="text-muted-foreground absolute -top-8 left-0 text-sm font-semibold uppercase"
							>
								Grand Final
							</h2>
							<Match match={displayedBracket['GF']} userPrediction={showLive ? predictionBracket['GF'] : undefined} onSetWinner={setWinner} />
						</div>
					</div>
				</div>

				<div class="pl-1">
					<h2 class="text-muted-foreground mb-4 text-sm font-semibold uppercase">Lower Bracket</h2>
					<div class="flex items-center gap-16">
						<div class="flex flex-col gap-4">
							<Match match={displayedBracket['L1']} userPrediction={showLive ? predictionBracket['L1'] : undefined} onSetWinner={setWinner} />
							<Match match={displayedBracket['L2']} userPrediction={showLive ? predictionBracket['L2'] : undefined} onSetWinner={setWinner} />
						</div>
						<div class="-mt-16 flex flex-col gap-4">
							<Match match={displayedBracket['L3']} userPrediction={showLive ? predictionBracket['L3'] : undefined} onSetWinner={setWinner} />
							<Match match={displayedBracket['L4']} userPrediction={showLive ? predictionBracket['L4'] : undefined} onSetWinner={setWinner} />
						</div>
						<div class="-mt-20 flex flex-col justify-center">
							<Match match={displayedBracket['L5']} userPrediction={showLive ? predictionBracket['L5'] : undefined} onSetWinner={setWinner} />
						</div>
						<div class="-mt-28 ml-8 flex flex-col justify-center">
							<Match match={displayedBracket['L8']} userPrediction={showLive ? predictionBracket['L8'] : undefined} onSetWinner={setWinner} />
						</div>
					</div>
				</div>
			</div>
		</div>
	</div>
</div>
