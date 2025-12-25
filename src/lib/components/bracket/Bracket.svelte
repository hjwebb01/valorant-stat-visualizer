<script lang="ts">
	import Match from './Match.svelte';
	import { matches, resetBracket, champion, setWinner } from '$lib/stores/bracketStore';
	import { Button } from '$lib/components/ui/button';
	import { RefreshCw, Trophy } from '@lucide/svelte';

	let championName = $derived($champion?.name ?? null);

	function handleResetBracket() {
		resetBracket();
	}
</script>

<div class="mx-auto max-w-7xl p-6">
	<div class="mb-6 flex items-center justify-between">
		<h1 class="text-foreground text-2xl font-bold">Tournament Bracket</h1>
		<Button variant="outline" onclick={handleResetBracket} class="gap-2">
			<RefreshCw size={16} />
			Reset Bracket
		</Button>
	</div>

	{#if championName}
		<div
			class="bg-primary text-primary-foreground mb-8 flex items-center justify-center gap-3 rounded-lg p-4 text-center"
		>
			<Trophy size={24} />
			<span class="text-lg font-semibold">Champion: {championName}</span>
		</div>
	{/if}

	<div class="overflow-x-auto">
		<div class="min-w-[1000px]">
			<div class="mb-8">
				<h2 class="text-muted-foreground mb-4 text-sm font-semibold uppercase">Upper Bracket</h2>
				<div class="relative flex gap-8">
					<div class="flex gap-8">
						<div class="space-y-16">
							<Match match={$matches['U1']} onSetWinner={setWinner} />
							<Match match={$matches['U3']} onSetWinner={setWinner} />
						</div>
						<div class="space-y-48">
							<Match match={$matches['U2']} onSetWinner={setWinner} />
							<Match match={$matches['U4']} onSetWinner={setWinner} />
						</div>
					</div>
					<div class="flex gap-8">
						<div class="space-y-64">
							<Match match={$matches['U5']} onSetWinner={setWinner} />
						</div>
						<div class="space-y-64">
							<Match match={$matches['U6']} onSetWinner={setWinner} />
						</div>
					</div>
					<div class="flex">
						<div class="space-y-64">
							<Match match={$matches['U7']} onSetWinner={setWinner} />
						</div>
					</div>
				</div>
			</div>

			<div class="mb-8">
				<h2 class="text-muted-foreground mb-4 text-sm font-semibold uppercase">Lower Bracket</h2>
				<div class="relative flex gap-8">
					<div class="flex gap-8">
						<div class="space-y-4">
							<Match match={$matches['L1']} onSetWinner={setWinner} />
						</div>
						<div class="space-y-4">
							<Match match={$matches['L2']} onSetWinner={setWinner} />
						</div>
					</div>
					<div class="flex gap-8">
						<div class="space-y-16">
							<Match match={$matches['L5']} onSetWinner={setWinner} />
						</div>
						<div class="space-y-16">
							<Match match={$matches['L6']} onSetWinner={setWinner} />
						</div>
					</div>
					<div class="flex gap-8">
						<div class="space-y-32">
							<Match match={$matches['L7']} onSetWinner={setWinner} />
						</div>
						<div class="space-y-32">
							<Match match={$matches['L8']} onSetWinner={setWinner} />
						</div>
					</div>
				</div>
			</div>

			<div>
				<h2 class="text-muted-foreground mb-4 text-sm font-semibold uppercase">Grand Final</h2>
				<div class="flex">
					<Match match={$matches['GF']} onSetWinner={setWinner} />
				</div>
			</div>
		</div>
	</div>
</div>
