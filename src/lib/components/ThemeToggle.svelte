<script lang="ts">
	import { onMount, onDestroy } from 'svelte';
	import { Sun, Moon } from '@lucide/svelte';

	let isDark = false;

	function applyTheme(dark: boolean) {
		const root = document.documentElement;
		root.classList.toggle('dark', dark);
	}

	onMount(() => {
		let observer: MutationObserver | null = null;
		try {
			const saved = localStorage.getItem('theme');
			if (saved === 'dark') isDark = true;
			else if (saved === 'light') isDark = false;
			else if (window.matchMedia) {
				isDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
			}
		} catch {}
		applyTheme(isDark);

		try {
			observer = new MutationObserver(() => {
				isDark = document.documentElement.classList.contains('dark');
			});
			observer.observe(document.documentElement, { attributes: true, attributeFilter: ['class'] });
		} catch {}

		return () => {
			if (observer) observer.disconnect();
		};
	});

	function toggle() {
		isDark = !isDark;
		applyTheme(isDark);
		try {
			localStorage.setItem('theme', isDark ? 'dark' : 'light');
		} catch {}
	}
</script>

<button
	type="button"
	class="bg-card border-border hover:bg-muted rounded-full border border-solid px-2 py-2 shadow-sm transition-colors"
	aria-label={isDark ? 'Switch to light mode' : 'Switch to dark mode'}
	aria-pressed={isDark}
	on:click={toggle}
>
	{#if isDark}
		<Sun size={16} />
	{:else}
		<Moon size={16} />
	{/if}
</button>
