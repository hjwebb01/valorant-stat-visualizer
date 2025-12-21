<script lang="ts">
	import { Card, CardHeader, CardTitle, CardContent } from '$lib/components/ui/card';
	import { Slider } from '$lib/components/ui/slider';
	import { Input } from '$lib/components/ui/input';
	import type { Col, Key } from '$lib/types';
	import { onMount } from 'svelte';

	type Props = {
		cols: Col[];
		visibleSet: Set<Key>;
		maxMaps: number;
		minMaps?: number;
		onToggle?: (key: Key) => void;
		onShowAll?: () => void;
		onHideAll?: () => void;
		onReset?: () => void;
	};

	let {
		cols,
		visibleSet,
		maxMaps,
		minMaps = $bindable(1),
		onToggle,
		onShowAll,
		onHideAll,
		onReset
	}: Props = $props();

	let sliderValue = $state(minMaps);
	let isSliding = $state(false);

	function startSliding() {
		isSliding = true;
	}

	function stopSliding() {
		if (!isSliding) return;
		isSliding = false;
		minMaps = sliderValue;
	}

	$effect(() => {
		if (!isSliding) sliderValue = minMaps; // Sync when user inputs directly
	});
	const STORAGE_KEY = 'leaderboard.visibleCols.v1';

	// String value for the input (HTML number inputs bind to strings)
	// Use sliderValue so the input shows live updates during sliding
	let displayValue = $derived(String(sliderValue));

	// Clamp minMaps between 1 and maxMaps (only when it goes out of bounds)
	$effect(() => {
		if (minMaps < 1) minMaps = 1;
		if (minMaps > maxMaps) minMaps = maxMaps;
	});

	function handleInputChange(e: Event) {
		const target = e.currentTarget as HTMLInputElement;
		const value = parseInt(target.value, 10);
		if (!isNaN(value)) {
			minMaps = Math.max(1, Math.min(maxMaps, value));
		}
	}

	// Persist in parent, but we still read initial in case parent wants a fallback
	onMount(() => {
		try {
			const raw = localStorage.getItem(STORAGE_KEY);
			if (raw) {
				const restored = new Set<Key>(JSON.parse(raw));
				// inform parent we have a persisted state
				onReset?.();
				for (const c of cols) {
					const has = restored.has(c.key);
					if (has !== visibleSet.has(c.key)) onToggle?.(c.key);
				}
			}
		} catch {}
	});
</script>

<svelte:window onpointerup={stopSliding} />
<aside class="h-full min-h-0">
	<Card class="flex h-full min-h-0 flex-col">
		<CardHeader class="shrink-0">
			<CardTitle class="text-base md:text-lg">Filter Stats</CardTitle>
		</CardHeader>

		<CardContent class="flex min-h-0 flex-1 flex-col gap-2 overflow-hidden">
			<div class="flex shrink-0 flex-col gap-3">
				<div class="space-y-2">
					<label for="min-maps-input" class="text-xs font-medium md:text-sm"
						>Minimum Maps Played</label
					>
					<div class="flex items-center gap-3">
						<Slider
							bind:value={sliderValue}
							min={1}
							max={maxMaps}
							step={1}
							class="flex-1"
							onpointerdown={startSliding}
						/>
						<Input
							id="min-maps-input"
							type="number"
							min={1}
							max={maxMaps}
							value={displayValue}
							oninput={handleInputChange}
							class="w-16 text-center"
							aria-label="Minimum maps played"
						/>
					</div>
				</div>
				<div class="flex shrink-0 gap-1.5">
					<button
						class="hover:bg-muted rounded-lg border px-2.5 py-1 text-xs md:text-sm"
						onclick={() => onShowAll?.()}
					>
						Show all
					</button>
					<button
						class="hover:bg-muted rounded-lg border px-2.5 py-1 text-xs md:text-sm"
						onclick={() => onHideAll?.()}
					>
						Hide all
					</button>
					<button
						class="hover:bg-muted rounded-lg border px-2.5 py-1 text-xs md:text-sm"
						onclick={() => onReset?.()}
					>
						Reset
					</button>
				</div>
			</div>

			<div class="min-h-0 flex-1 overflow-y-auto overscroll-contain pr-1.5">
				<div class="grid grid-cols-2 gap-1.5 md:grid-cols-1">
					{#each cols as c}
						<label
							class="hover:bg-muted/60 flex items-center gap-1.5 rounded-md border px-2 py-1.5"
						>
							<input
								type="checkbox"
								class="h-4 w-4"
								checked={visibleSet.has(c.key)}
								onchange={() => onToggle?.(c.key)}
							/>
							<span class="text-[11px] leading-tight md:text-sm">{c.label}</span>
						</label>
					{/each}
				</div>
			</div>
		</CardContent>
	</Card>
</aside>
