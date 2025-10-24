<script lang="ts">
	import '../app.css';
	import favicon from '$lib/assets/favicon.svg';
	import '@skeletonlabs/skeleton/styles/all.css';

	let { children } = $props();
</script>

<svelte:head>
	<link rel="icon" href={favicon} />
	<script defer data-domain="yourdomain.com" src="https://plausible.io/js/script.js"></script>
</svelte:head>

{@render children?.()}
