<script lang="ts">
	import { onMount, onDestroy } from 'svelte';
	import Bracket from '$lib/components/bracket/Bracket.svelte';
	import {
		initializeBracketStore,
		bracketLoading,
		bracketError,
		matches,
		type MatchState
	} from '$lib/stores/bracketStore';

	let saveTimeout: ReturnType<typeof setTimeout> | null = null;

	onMount(() => {
		initializeBracketStore();
		loadLocalBracket();
		subscribeToChanges();
	});

	onDestroy(() => {
		if (saveTimeout) clearTimeout(saveTimeout);
	});

	function loadLocalBracket() {
		const localData = localStorage.getItem('bracket_draft');
		if (localData) {
			try {
				const parsed = JSON.parse(localData);
				matches.set(parsed);
			} catch (e) {
				console.error('Failed to load local bracket:', e);
			}
		}
	}

	function saveLocalBracket(state: MatchState) {
		localStorage.setItem('bracket_draft', JSON.stringify(state));
	}

	function subscribeToChanges() {
		matches.subscribe((state) => {
			if (saveTimeout) clearTimeout(saveTimeout);

			saveTimeout = setTimeout(() => {
				saveLocalBracket(state);
			}, 1000);
		});
	}

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
