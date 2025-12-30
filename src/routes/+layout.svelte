<script lang="ts">
	import '../app.css';
	import favicon from '$lib/assets/rivals_logo.png';
	import Header from '$lib/components/Header.svelte';
	import { initializeAuth, signInWithGoogle } from '$lib/stores/auth';
	import { onMount, onDestroy } from 'svelte';
	import { page } from '$app/stores';
	import { goto } from '$app/navigation';
	import {
		Dialog,
		DialogContent,
		DialogHeader,
		DialogTitle,
		DialogDescription,
		DialogFooter
	} from '$lib/components/ui/dialog';
	import { Button } from '$lib/components/ui/button';

	let unsubscribe: (() => void) | undefined;
	let showAuthDialog = $state(false);

	onMount(() => {
		unsubscribe = initializeAuth();
	});

	onDestroy(() => {
		unsubscribe?.();
	});

	// Watch for auth_required query param
	$effect(() => {
		if ($page.url.searchParams.get('auth_required') === 'true') {
			showAuthDialog = true;
			// Clean up the URL without triggering navigation
			const url = new URL($page.url);
			url.searchParams.delete('auth_required');
			goto(url.pathname + url.search, { replaceState: true, noScroll: true });
		}
	});

	async function handleSignIn() {
		showAuthDialog = false;
		await signInWithGoogle();
	}

	function handleDialogClose() {
		showAuthDialog = false;
	}

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

<Dialog bind:open={showAuthDialog} onOpenChange={(open) => (showAuthDialog = open)}>
	<DialogContent class="sm:max-w-md">
		<DialogHeader>
			<DialogTitle>Sign in required</DialogTitle>
			<DialogDescription>
				You need to sign in to access the Bracket page. Please sign in with your Google account to
				continue.
			</DialogDescription>
		</DialogHeader>
		<DialogFooter class="flex-col gap-2 sm:flex-row">
			<Button variant="outline" onclick={handleDialogClose}>Cancel</Button>
			<Button onclick={handleSignIn}>Sign in with Google</Button>
		</DialogFooter>
	</DialogContent>
</Dialog>
