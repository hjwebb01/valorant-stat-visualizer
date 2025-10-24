<script lang="ts">
	import { onMount } from 'svelte';
	import { supabase } from '../lib/supabaseClient';
	export let data: { metrics?: any[] } = {};
	let metrics = data.metrics ?? [];

	onMount(() => {
		const ch = supabase
			.channel('public:metrics')
			.on('postgres_changes', { event: '*', schema: 'public', table: 'metrics' }, (payload) => {
				if (payload.eventType === 'INSERT') metrics = [...metrics, payload.new as any];
			})
			.subscribe();
		return () => {
			supabase.removeChannel(ch);
		};
	});
</script>

<h1 class="mb-4 text-2xl font-bold">Metrics</h1>
<ul class="space-y-2">
	{#each metrics as m (m.id)}
		<li class="rounded border p-3">
			<div class="font-semibold">{m.series}</div>
			<div class="text-sm opacity-80">{m.metric_date} — {m.value}</div>
		</li>
	{/each}
</ul>
