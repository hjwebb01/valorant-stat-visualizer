<script lang="ts">
	import '../app.css';
	import favicon from '$lib/assets/favicon.svg';
	import Header from '$lib/components/Header.svelte';

	let { children } = $props();
</script>

<Header />

<svelte:head>
	<link rel="icon" href={favicon} />
	<script defer data-domain="yourdomain.com" src="https://plausible.io/js/script.js"></script>
</svelte:head>

<div class="min-h-screen bg-background">
	{@render children?.()}
</div>
