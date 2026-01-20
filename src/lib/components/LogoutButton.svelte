<script lang="ts">
	import { logout } from '$lib/bracket_store/auth';
	import { goto } from '$app/navigation';

	async function handleLogout() {
		await logout();
		goto('/', { replaceState: true, invalidateAll: true });
	}
</script>

<button on:click={handleLogout} class="button logout"> Log Out </button>

<style>
	.button {
		padding: 0.6rem 1.6rem;
		font-size: 0.95rem;
		font-weight: 600;
		border-radius: 8px;
		border: none;
		cursor: pointer;
		transition: all 0.3s cubic-bezier(0.25, 0.8, 0.25, 1);
		box-shadow: 0 6px 16px rgba(0, 0, 0, 0.35);
		text-transform: uppercase;
		letter-spacing: 0.06em;
		outline: none;
	}

	.button:focus {
		box-shadow: 0 0 0 4px rgba(252, 129, 129, 0.5);
	}

	.button.logout {
		background-color: #fc8181;
		color: #1a1e27;
	}

	.button.logout:hover {
		background-color: #e53e3e;
		transform: translateY(-5px) scale(1.03);
		box-shadow: 0 12px 25px rgba(0, 0, 0, 0.5);
	}
</style>
