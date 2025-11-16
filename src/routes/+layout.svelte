<script lang="ts">
	import '../app.css';
	import favicon from '$lib/assets/rivals_logo.png';
	import Header from '$lib/components/Header.svelte';
	import { initializeAuth } from '$lib/stores/auth';
	import { onMount } from 'svelte';
	onMount(() => {
		initializeAuth();
	});

	let { children } = $props();
</script>

<Header />

<svelte:head>
	<link rel="icon" href={favicon} />
	<script defer data-domain="yourdomain.com" src="https://plausible.io/js/script.js"></script>
</svelte:head>

<div class="bg-background min-h-screen">
	{@render children?.()}
</div>
