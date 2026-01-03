<script lang="ts">
	import Match from './Match.svelte';
	import { matches, champion, setWinner } from '$lib/bracket_store/bracketStore';

	import { Button } from '$lib/components/ui/button';
	import { RefreshCw, Trophy } from '@lucide/svelte';

	// Import all team logos
	import powLogo from '$lib/assets/teams/pokeballofwonders.png';
	import horLogo from '$lib/assets/teams/hooters.png';
	import ttrLogo from '$lib/assets/teams/terenceterencerence.png';
	import tbbLogo from '$lib/assets/teams/thebigblack.png';
	import jtrrLogo from '$lib/assets/teams/jtrebuildrebuild.png';
	import ojsLogo from '$lib/assets/teams/ojenksimpsons.png';
	import stdLogo from '$lib/assets/teams/std.png';
	import tbcLogo from '$lib/assets/teams/tbc.png';

	const teamLogos: Record<string, string> = {
		POW: powLogo,
		HOR: horLogo,
		TTR: ttrLogo,
		TBB: tbbLogo,
		JTRR: jtrrLogo,
		OJS: ojsLogo,
		STD: stdLogo,
		TBC: tbcLogo
	};

	let championName = $derived($champion?.name ?? null);
	let championTag = $derived($champion?.tag ?? null);

	function getChampionLogo(): string | null {
		if (!championTag) return null;
		return teamLogos[championTag] || null;
	}
</script>

<div class="mx-auto max-w-7xl p-6">
	<div class="mb-6 flex items-center justify-between">
		<h1 class="text-foreground text-2xl font-bold">Tournament Bracket</h1>
	</div>

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
							<Match match={$matches['U1']} onSetWinner={setWinner} />
							<Match match={$matches['U2']} onSetWinner={setWinner} />
							<Match match={$matches['U3']} onSetWinner={setWinner} />
							<Match match={$matches['U4']} onSetWinner={setWinner} />
						</div>
						<div class="flex flex-col gap-32">
							<Match match={$matches['U5']} onSetWinner={setWinner} />
							<Match match={$matches['U6']} onSetWinner={setWinner} />
						</div>
						<div class="flex flex-col justify-center">
							<Match match={$matches['U7']} onSetWinner={setWinner} />
						</div>
						<div class="relative ml-8 flex flex-col justify-center">
							<h2
								class="text-muted-foreground absolute -top-8 left-0 text-sm font-semibold uppercase"
							>
								Grand Final
							</h2>
							<Match match={$matches['GF']} onSetWinner={setWinner} />
						</div>
					</div>
				</div>

				<div class="pl-1">
					<h2 class="text-muted-foreground mb-4 text-sm font-semibold uppercase">Lower Bracket</h2>
					<div class="flex items-center gap-16">
						<div class="flex flex-col gap-4">
							<Match match={$matches['L1']} onSetWinner={setWinner} />
							<Match match={$matches['L2']} onSetWinner={setWinner} />
						</div>
						<div class="-mt-16 flex flex-col gap-4">
							<Match match={$matches['L3']} onSetWinner={setWinner} />
							<Match match={$matches['L4']} onSetWinner={setWinner} />
						</div>
						<div class="-mt-20 flex flex-col justify-center">
							<Match match={$matches['L5']} onSetWinner={setWinner} />
						</div>
						<div class="-mt-28 ml-8 flex flex-col justify-center">
							<Match match={$matches['L8']} onSetWinner={setWinner} />
						</div>
					</div>
				</div>
			</div>
		</div>
	</div>
</div>
