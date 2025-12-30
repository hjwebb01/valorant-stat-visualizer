<script lang="ts">
	import { onMount, onDestroy } from 'svelte';
	import Bracket from '$lib/components/bracket/Bracket.svelte';
	import {
		initializeBracketStore,
		bracketLoading,
		bracketError,
		hasSavedBracket,
		showOverrideConfirm,
		saveBracketToDatabase,
		matches,
		type MatchState
	} from '$lib/stores/bracketStore';
	import { isLoggedIn } from '$lib/stores/auth';

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

			saveTimeout = setTimeout(async () => {
				saveLocalBracket(state);

				if (!$isLoggedIn) return;

				if ($hasSavedBracket) {
					await saveBracketToDatabase(state, false);
				} else {
					const validation = await validateBracket();
					if (validation.valid) {
						await saveBracketToDatabase(state, false);
					}
				}
			}, 1000);
		});
	}

	async function validateBracket(): Promise<boolean> {
		let currentState: MatchState | null = null;
		matches.subscribe((state) => (currentState = state))();

		if (!currentState) return false;

		const hasAllWinners = Object.values(currentState).every((match) => match.winner !== null);

		const grandFinal = currentState['GF'];
		const hasChampion = grandFinal && grandFinal.winner !== null;

		return hasAllWinners && hasChampion;
	}

	async function confirmOverride() {
		showOverrideConfirm.set(false);
		let currentState: MatchState | null = null;
		matches.subscribe((state) => (currentState = state))();
		if (currentState) {
			await saveBracketToDatabase(currentState, true);
		}
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

	{#if $showOverrideConfirm}
		<div class="bg-opacity-50 fixed inset-0 z-50 flex items-center justify-center bg-black">
			<div class="max-w-md rounded-lg bg-white p-6 text-gray-900">
				<h3 class="mb-4 text-lg font-semibold">Override Previous Bracket?</h3>
				<p class="mb-4">
					You already have a saved bracket. Do you want to override it with this new submission?
				</p>
				<div class="flex justify-end gap-4">
					<button
						on:click={() => showOverrideConfirm.set(false)}
						class="rounded border border-gray-300 px-4 py-2 hover:bg-gray-100"
					>
						Cancel
					</button>
					<button
						on:click={confirmOverride}
						class="rounded bg-blue-500 px-4 py-2 text-white hover:bg-blue-600"
					>
						Yes, Override
					</button>
				</div>
			</div>
		</div>
	{/if}
{/if}
