<script lang="ts">
	import { Card, CardHeader, CardTitle, CardContent } from '$lib/components/ui/card';
	import type { Col, Key } from '$lib/types';
	import { createEventDispatcher, onMount } from 'svelte';

	export let cols: Col[] = [];
	export let visibleSet: Set<Key>;
	const STORAGE_KEY = 'leaderboard.visibleCols.v1';

	const dispatch = createEventDispatcher<{
		toggle: { key: Key };
		showAll: void;
		hideAll: void;
		reset: void;
	}>();

	// Persist in parent, but we still read initial in case parent wants a fallback
	onMount(() => {
		try {
			const raw = localStorage.getItem(STORAGE_KEY);
			if (raw) {
				const restored = new Set<Key>(JSON.parse(raw));
				// inform parent we have a persisted state
				dispatch('reset');
				for (const c of cols) {
					const has = restored.has(c.key);
					if (has !== visibleSet.has(c.key)) dispatch('toggle', { key: c.key });
				}
			}
		} catch {}
	});
</script>

<aside class="h-full min-h-0">
	<Card class="flex h-full min-h-0 flex-col">
		<CardHeader class="shrink-0">
			<CardTitle class="text-base md:text-lg">Columns</CardTitle>
		</CardHeader>

		<CardContent class="flex min-h-0 flex-1 flex-col gap-2 overflow-hidden">
			<div class="flex shrink-0 gap-1.5">
				<button
					class="hover:bg-muted rounded-lg border px-2.5 py-1 text-xs md:text-sm"
					on:click={() => dispatch('showAll')}>Show all</button
				>
				<button
					class="hover:bg-muted rounded-lg border px-2.5 py-1 text-xs md:text-sm"
					on:click={() => dispatch('hideAll')}>Hide all</button
				>
				<button
					class="hover:bg-muted rounded-lg border px-2.5 py-1 text-xs md:text-sm"
					on:click={() => dispatch('reset')}>Reset</button
				>
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
								on:change={() => dispatch('toggle', { key: c.key })}
							/>
							<span class="text-[11px] leading-tight md:text-sm">{c.label}</span>
						</label>
					{/each}
				</div>
			</div>
		</CardContent>
	</Card>
</aside>
