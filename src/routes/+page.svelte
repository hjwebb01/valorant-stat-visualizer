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
	let players: Array<Record<string, any>> = data.players ?? [];
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
	$: selectedPercentiles = selected ? computeSelectedPercentiles(selected, players) : {};

	function formatHeader(k: string): string {
		return k.replace(/_/g, ' ').replace(/\b\w/g, (m) => m.toUpperCase());
	}

	function formatValue(v: any): string {
		if (v == null) return '';
		if (typeof v === 'number') return fmtNum(v);
		if (typeof v === 'boolean') return v ? 'true' : 'false';
		// simple ISO date-ish
		if (typeof v === 'string' && /\d{4}-\d{2}-\d{2}T/.test(v)) {
			const d = new Date(v);
			if (!Number.isNaN(d.valueOf())) return d.toLocaleString();
		}
		return String(v);
	}

	function sortedEntries(obj: Record<string, any>): Array<[string, any]> {
		const entries = Object.entries(obj);
		// prioritize some keys
		const priority = new Map(
			['player', 'id', 'acs', 'kd', 'adr'].map((k, i) => [k, i])
		);
		return entries.sort(([a], [b]) => (priority.get(a) ?? 999) - (priority.get(b) ?? 999) || a.localeCompare(b));
	}
	// Layout components
	import DashboardCenter from '$lib/components/layout/DashboardCenter.svelte';
	import DashboardGrid from '$lib/components/layout/DashboardGrid.svelte';
</script>

<DashboardCenter max="max-w-4xl" vertical="center">
	<DashboardGrid cols="md:grid-cols-2" gap="gap-6">
		<Card class="w-full">
			<CardHeader>
				<CardTitle class="text-center text-2xl">Top 20 Players</CardTitle>
			</CardHeader>
			<CardContent>
				<Table class="w-full">
					<TableCaption>{players.length} players (ordered by ACS)</TableCaption>
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
						{#each players as p, i (p.id ?? i)}
							<TableRow
								class={`hover:bg-muted/50 cursor-pointer focus:outline-none focus:ring-2 focus:ring-ring ${selected?.id === p.id ? 'bg-accent/20' : ''}`}
								tabindex={0}
								aria-selected={selected?.id === p.id}
								onclick={() => (selected = p)}
							>
								<TableCell class="text-right font-mono">{i + 1}</TableCell>
								{#each cols as c}
									<TableCell class={c.align === 'right' ? 'text-right' : 'text-left'}>
										{#if c.key === 'player'}
											{p.player}
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
		<Card class="w-full">
			<CardHeader>
				<CardTitle class="text-center text-2xl">Selected Player</CardTitle>
			</CardHeader>
			<CardContent maxHeight="80vh">
				{#if selected}
					<div class="space-y-3">
						<div class="text-lg font-semibold">{selected.player ?? '(Unknown Player)'}</div>
						<div class="grid grid-cols-2 gap-x-4 gap-y-2">
							{#each sortedEntries(selected) as [k, v]}
								<div class="text-sm text-muted-foreground">{formatHeader(k)}</div>
								<div class="text-right font-mono">
									{formatValue(v)}
									{#if selectedPercentiles && selectedPercentiles[k] > 50}
										<span class="ml-2 text-xs text-muted-foreground">(Top {selectedPercentiles[k]}%)</span>
									{/if}
								</div>
							{/each}
						</div>
					</div>
				{:else}
					<div class="text-center text-sm text-muted-foreground">Click a row to preview player details here.</div>
				{/if}
			</CardContent>
		</Card>
	</DashboardGrid>
</DashboardCenter>
