<script lang="ts">
	import '../app.css';
	import favicon from '$lib/assets/favicon.svg';

	let { children } = $props();
</script>

<svelte:head>
	<link rel="icon" href={favicon} />
</svelte:head>

<header class="bg-gray-100 px-6 py-4">
	<h1 class="text-xl font-semibold">Valorant Stat Visualizer</h1>
</header>

{@render children?.()}
