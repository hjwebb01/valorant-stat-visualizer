<script lang="ts">
	import { onMount } from 'svelte';
	import Bracket from '$lib/components/bracket/Bracket.svelte';
	import {
		initializeBracketStore,
		bracketLoading,
		bracketError
	} from '$lib/bracket_store/bracketStore';
	onMount(() => {
		// Clean up localStorage bracket data (one-time migration)
		if (typeof window !== 'undefined') {
			const migrated = localStorage.getItem('bracket_migration');
			if (!migrated) {
				localStorage.removeItem('bracket_draft');
				localStorage.setItem('bracket_migration', 'true');
			}
		}
		initializeBracketStore();
	});
	function clearError() {
		bracketError.set(null);
	}
</script>

{#if $bracketLoading}
	<div class="flex min-h-screen items-center justify-center">
		<div class="h-12 w-12 animate-spin rounded-full border-b-2 border-blue-500"></div>
		<span class="ml-4">Loading bracket...</span>
	</div>
{:else}
	{#if $bracketError}
		<div class="relative mb-4 rounded border border-red-400 bg-red-100 px-4 py-3 text-red-700">
			<span class="block sm:inline">{$bracketError}</span>
			<button on:click={clearError} class="absolute top-0 right-0 bottom-0 px-4 py-3">
				<span class="text-red-500 hover:text-red-700">&times;</span>
			</button>
		</div>
	{/if}
	<Bracket />
{/if}
