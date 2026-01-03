<script lang="ts">
	import { user, isLoggedIn, loading } from '$lib/bracket_store/auth';
</script>

{#if $loading}
	<div class="loading-text">Loading profile...</div>
{:else if $isLoggedIn && $user}
	<div class="profile-container">
		{#if $user.user_metadata?.avatar_url}
			<img
				src={$user.user_metadata.avatar_url}
				alt={$user.user_metadata.name || $user.email || 'User'}
				class="profile-picture"
			/>
		{:else}
			<div class="profile-placeholder">
				{($user.user_metadata?.name || $user.email || 'U').charAt(0).toUpperCase()}
			</div>
		{/if}
		<div class="profile-info">
			<div class="profile-name">
				{$user.user_metadata?.name || $user.email || 'Unknown User'}
			</div>
			<div class="profile-email">
				{$user.email || ''}
			</div>
		</div>
	</div>
{/if}

<style>
	.loading-text {
		font-size: 1.8rem;
		font-weight: 500;
		color: #a0aec0;
		animation: pulse 1.5s infinite ease-in-out;
	}

	.profile-container {
		display: flex;
		flex-direction: column;
		align-items: center;
		gap: 1rem;
	}

	.profile-picture {
		width: 110px;
		height: 110px;
		border-radius: 50%;
		object-fit: cover;
		border: 3px solid #63b3ed;
		transition: transform 0.3s ease-in-out;
	}

	.profile-picture:hover {
		transform: scale(1.05);
	}

	.profile-placeholder {
		width: 110px;
		height: 110px;
		border-radius: 50%;
		background-color: #63b3ed;
		display: flex;
		align-items: center;
		justify-content: center;
		font-size: 3rem;
		font-weight: 700;
		color: #1a1e27;
		border: 3px solid #63b3ed;
		transition: transform 0.3s ease-in-out;
	}

	.profile-placeholder:hover {
		transform: scale(1.05);
	}

	.profile-info {
		text-align: center;
	}

	.profile-name {
		font-size: 2rem;
		font-weight: 600;
		color: #f7fafc;
		margin-bottom: 0.5rem;
	}

	.profile-email {
		font-size: 1.15rem;
		color: #a0aec0;
	}

	@keyframes pulse {
		0%,
		100% {
			opacity: 1;
		}
		50% {
			opacity: 0.6;
		}
	}
</style>
