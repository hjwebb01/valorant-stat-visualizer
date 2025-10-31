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

<aside class="min-h-0 h-full">
  <Card class="flex h-full min-h-0 flex-col">
    <CardHeader class="shrink-0">
      <CardTitle class="text-base md:text-lg">Columns</CardTitle>
    </CardHeader>

    <CardContent class="min-h-0 flex-1 overflow-hidden flex flex-col gap-2">
      <div class="shrink-0 flex gap-1.5">
        <button class="rounded-lg border px-2.5 py-1 text-xs md:text-sm hover:bg-muted" on:click={() => dispatch('showAll')}>Show all</button>
        <button class="rounded-lg border px-2.5 py-1 text-xs md:text-sm hover:bg-muted" on:click={() => dispatch('hideAll')}>Hide all</button>
        <button class="rounded-lg border px-2.5 py-1 text-xs md:text-sm hover:bg-muted" on:click={() => dispatch('reset')}>Reset</button>
      </div>

      <div class="flex-1 min-h-0 overflow-y-auto overscroll-contain pr-1.5">
        <div class="grid grid-cols-2 md:grid-cols-1 gap-1.5">
          {#each cols as c}
            <label class="flex items-center gap-1.5 rounded-md border px-2 py-1.5 hover:bg-muted/60">
              <input
                type="checkbox"
                class="h-4 w-4"
                checked={visibleSet.has(c.key)}
                on:change={() => dispatch('toggle', { key: c.key })}
              />
              <span class="text-[11px] md:text-sm leading-tight">{c.label}</span>
            </label>
          {/each}
        </div>
      </div>
    </CardContent>
  </Card>
</aside>
