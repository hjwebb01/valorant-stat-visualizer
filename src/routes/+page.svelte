<script lang="ts">
	import { onMount } from 'svelte';
	import { supabase } from '../lib/supabaseClient';

	// shadcn-svelte components (generated under this path by `npx shadcn-svelte add table card badge`).
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
	import { Badge } from '$lib/components/ui/badge';

	// Expect server to pass initial rows as `data.players`
	export let data: { players?: Record<string, any>[] } = {};
	let players: Record<string, any>[] = data.players ?? [];

	// Derive visible columns (exclude created_at) and impose a nice display order when possible.
	const preferredOrder = [
		'rank',
		'display_name',
		'name',
		'username',
		'tag',
		'region',
		'team',
		'mmr',
		'rating',
		'elo',
		'rr',
		'wins',
		'losses',
		'win_rate',
		'kd',
		'acs',
		'last_update',
		'updated_at',
		'ts',
		'id' // keep id last if shown
	];

	function visibleCols(): string[] {
		if (players.length === 0) return [];
		const keys = Object.keys(players[0]).filter((k) => k !== 'created_at');
		const orderIndex = new Map(preferredOrder.map((k, i) => [k, i]));
		return keys.sort((a, b) => (orderIndex.get(a) ?? 999) - (orderIndex.get(b) ?? 999));
	}

	// Choose a leaderboard score column if present; otherwise fall back to the first numeric field.
	function pickScoreKey(cols: string[]): string | null {
		const candidates = ['mmr', 'rating', 'elo', 'rr', 'acs', 'win_rate', 'kd', 'score'];
		for (const c of candidates) if (cols.includes(c)) return c;
		// fallback: first numeric column
		for (const c of cols) {
			const v = players[0]?.[c];
			if (typeof v === 'number') return c;
			if (typeof v === 'string' && !Number.isNaN(Number(v))) return c;
		}
		return null;
	}

	// Sort players descending by the score key for leaderboard ranking.
	$: cols = visibleCols();
	$: scoreKey = pickScoreKey(cols);
	$: leaderboard = [...players].sort((a, b) => {
		if (!scoreKey) return 0;
		const av = Number(a[scoreKey] ?? 0);
		const bv = Number(b[scoreKey] ?? 0);
		return bv - av;
	});

	function formatHeader(k: string): string {
		return k
			.replace(/_/g, ' ')
			.replace(/\b\w/g, (m) => m.toUpperCase()); // Title Case
	}

	function formatCell(val: any): string {
		// Simple date-ish formatting
		if (typeof val === 'string' && /\d{4}-\d{2}-\d{2}T/.test(val)) {
			const d = new Date(val);
			if (!Number.isNaN(d.valueOf())) return d.toLocaleString();
		}
		return String(val);
	}

	// Realtime subscription
	onMount(() => {
		const ch = supabase
			.channel('public:valorant_players')
			.on(
				'postgres_changes',
				{ event: '*', schema: 'public', table: 'valorant_players' },
				(payload) => {
					const getId = (r: any) => r?.id ?? r?.player_id ?? r?.uuid; // try common PKs
					if (payload.eventType === 'INSERT') {
						players = [...players, payload.new as any];
					} else if (payload.eventType === 'UPDATE') {
						const id = getId(payload.new);
						players = players.map((p) => (getId(p) === id ? (payload.new as any) : p));
					} else if (payload.eventType === 'DELETE') {
						const id = getId(payload.old);
						players = players.filter((p) => getId(p) !== id);
					}
				}
			)
			.subscribe();

		return () => {
			supabase.removeChannel(ch);
		};
	});
</script>

<Card class="w-full">
	<CardHeader class="flex flex-row items-center justify-between gap-4">
		<CardTitle class="text-2xl">Valorant Leaderboard</CardTitle>
		{#if scoreKey}
			<Badge variant="secondary" class="text-sm">
				Sorted by {formatHeader(scoreKey)}
			</Badge>
		{/if}
	</CardHeader>
	<CardContent>
		<Table class="w-full">
			<TableCaption>
				{leaderboard.length} players {scoreKey ? `(by ${formatHeader(scoreKey)})` : ''}
			</TableCaption>
			<TableHeader>
				<TableRow>
					<TableHead class="w-12 text-right">#</TableHead>
					{#each cols as c}
						{#if c !== 'created_at'}
							<TableHead class="whitespace-nowrap">{formatHeader(c)}</TableHead>
						{/if}
					{/each}
				</TableRow>
			</TableHeader>
			<TableBody>
				{#each leaderboard as row, i (row.id ?? row.player_id ?? row.uuid ?? i)}
					<TableRow class="hover:bg-muted/50">
						<TableCell class="text-right font-mono">{i + 1}</TableCell>
						{#each cols as c}
							{#if c !== 'created_at'}
								<TableCell class="py-3">
									{#if c === 'rank' || c === 'rating' || c === 'mmr' || c === 'elo' || c === 'rr'}
										<span class="font-semibold">{formatCell(row[c])}</span>
									{:else if c === 'win_rate'}
										<span>{Number(row[c]).toFixed(1)}%</span>
									{:else}
										{formatCell(row[c])}
									{/if}
								</TableCell>
							{/if}
						{/each}
					</TableRow>
				{/each}
			</TableBody>
		</Table>
	</CardContent>
</Card>
