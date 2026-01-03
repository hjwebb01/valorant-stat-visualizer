<script lang="ts">
	import { signInWithGoogle, loading, error, clearError } from '$lib/bracket_store/auth';

	async function handleLogin() {
		const success = await signInWithGoogle();
		if (success) {
			clearError();
		}
	}

	function dismissError() {
		clearError();
	}
</script>

<div class="relative">
	<button on:click={handleLogin} disabled={$loading} class="button login">
		{#if $loading}
			Loading...
		{:else}
			Log In
		{/if}
	</button>

	{#if $error}
		<div
			class="absolute top-full right-0 left-0 mt-2 rounded border border-red-400 bg-red-100 px-3 py-2 text-sm text-red-700"
		>
			<span>{$error}</span>
			<button on:click={dismissError} class="float-right ml-2 text-red-500 hover:text-red-700">
				&times;
			</button>
		</div>
	{/if}
</div>

<style>
	.button {
		padding: 1.1rem 2.8rem;
		font-size: 1.2rem;
		font-weight: 600;
		border-radius: 10px;
		border: none;
		cursor: pointer;
		transition: all 0.3s cubic-bezier(0.25, 0.8, 0.25, 1);
		box-shadow: 0 8px 20px rgba(0, 0, 0, 0.4);
		text-transform: uppercase;
		letter-spacing: 0.08em;
		outline: none;
	}

	.button:focus {
		box-shadow: 0 0 0 4px rgba(99, 179, 237, 0.5);
	}

	.button.login {
		background-color: #63b3ed;
		color: #1a1e27;
	}

	.button.login:hover {
		background-color: #4299e1;
		transform: translateY(-5px) scale(1.03);
		box-shadow: 0 12px 25px rgba(0, 0, 0, 0.5);
	}
</style>
