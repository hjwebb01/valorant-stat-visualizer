<script lang="ts">
	// shadcn-svelte UI components (paths match your project's prior imports)
	import { Button } from '$lib/components/ui/button';
	import {
		Sheet,
		SheetContent,
		SheetHeader,
		SheetTitle,
		SheetTrigger
	} from '$lib/components/ui/sheet';
	import {
		NavigationMenuList,
		NavigationMenuItem,
		NavigationMenuLink
	} from '$lib/components/ui/navigation-menu';
	import NavigationMenu from './ui/navigation-menu/navigation-menu.svelte';

	// Icons from lucide
	import { Home, Trophy, LogIn, LogOut, Menu } from '@lucide/svelte';
	import { Users } from '@lucide/svelte';
	import ThemeToggle from '$lib/components/ThemeToggle.svelte';
	import { login, logout, isLoggedIn } from '$lib/stores/auth';

	async function handleSignIn(event: MouseEvent) {
		event.preventDefault();
		event.stopPropagation();
		try {
			await login();
		} catch (err) {
			console.error('Sign in error:', err);
		}
	}

	async function handleSignOut(event: MouseEvent) {
		event.preventDefault();
		event.stopPropagation();
		try {
			await logout();
		} catch (err) {
			console.error('Sign out error:', err);
		}
	}
</script>

<header
	class="text-foreground sticky top-0 z-60 w-full transition-all duration-200"
	style="background-color: var(--color-card); box-shadow: 0 2px 8px rgba(0, 0, 0, 0.15);"
>
	<div class="mx-auto flex max-w-7xl items-center justify-between px-6 py-3">
		<!-- Left cluster: logo + desktop theme toggle -->
		<div class="flex items-center gap-2">
			<a href="/" class="text-xl font-bold tracking-tight transition-colors">
				Valorant Stat Visualizer
			</a>
			<div class="hidden items-center md:flex">
				<ThemeToggle />
			</div>
		</div>

		<!-- Right-side controls: desktop nav, mobile toggle, mobile menu -->
		<div class="flex items-center gap-2">
			<!-- Desktop Nav (shadcn NavigationMenu) -->
			<NavigationMenu class="hidden md:flex">
				<NavigationMenuList class="items-center gap-2">
					<!-- Fill these in with your routes -->
					<NavigationMenuItem>
						<NavigationMenuLink
							href="/"
							class="flex items-center gap-2 rounded-md px-3 py-2 transition-colors"
						>
							<Home size={18} />
							<span>Home</span>
						</NavigationMenuLink>
					</NavigationMenuItem>
					<NavigationMenuItem>
						<NavigationMenuLink
							href="/leaderboard"
							class="flex items-center gap-2 rounded-md px-3 py-2 transition-colors"
						>
							<Trophy size={18} />
							<span>Leaderboard</span>
						</NavigationMenuLink>
					</NavigationMenuItem>
					<NavigationMenuItem>
						<NavigationMenuLink
							href="/compare"
							class="flex items-center gap-2 rounded-md px-3 py-2 transition-colors"
						>
							<Users size={18} />
							<span>Compare</span>
						</NavigationMenuLink>
					</NavigationMenuItem>
					<!-- Example right-aligned action -->
					<NavigationMenuItem class="ml-2">
						{#if $isLoggedIn}
							<Button
								variant="secondary"
								class="flex items-center gap-2 px-3"
								onclick={handleSignOut}
							>
								<LogOut size={18} />
								<span>Sign out</span>
							</Button>
						{:else}
							<Button variant="secondary" class="flex items-center gap-2 px-3">
								<LogIn size={18} />
								<span>Sign in</span>
							</Button>
						{/if}
					</NavigationMenuItem>
				</NavigationMenuList>
			</NavigationMenu>

			<!-- Theme toggle on mobile (desktop toggle is near title) -->
			<div class="md:hidden">
				<ThemeToggle />
			</div>

			<!-- Mobile: Sheet (hamburger → drawer) -->
			<Sheet>
				<SheetTrigger
					class="inline-flex items-center justify-center rounded-md p-2 transition-colors md:hidden"
				>
					<Menu size={24} />
					<span class="sr-only">Open menu</span>
				</SheetTrigger>

				<SheetContent side="left" class="w-72 p-0">
					<SheetHeader class="border-b px-6 py-4">
						<SheetTitle class="text-base">Menu</SheetTitle>
					</SheetHeader>

					<nav class="px-6 py-4">
						<ul class="flex flex-col space-y-2 text-sm font-medium">
							<!-- Same links as desktop -->
							<li>
								<a
									href="/"
									class="hover:bg-accent hover:text-accent-foreground flex items-center gap-2 rounded-md px-3 py-2"
								>
									<Home size={18} />
									<span>Home</span>
								</a>
							</li>
							<li>
								<a
									href="/leaderboard"
									class="hover:bg-accent hover:text-accent-foreground flex items-center gap-2 rounded-md px-3 py-2"
								>
									<Trophy size={18} />
									<span>Leaderboard</span>
								</a>
							</li>
							<li>
								<a
									href="/compare"
									class="hover:bg-accent hover:text-accent-foreground flex items-center gap-2 rounded-md px-3 py-2"
								>
									<Users size={18} />
									<span>Compare</span>
								</a>
							</li>
							<li class="pt-2">
								{#if $isLoggedIn}
									<Button
										variant="secondary"
										class="flex w-full items-center justify-center gap-2"
										onclick={handleSignOut}
									>
										<LogOut size={18} />
										<span>Sign out</span>
									</Button>
								{:else}
									<Button variant="secondary" class="flex w-full items-center justify-center gap-2">
										<LogIn size={18} />
										<span>Sign in</span>
									</Button>
								{/if}
							</li>
						</ul>
					</nav>
				</SheetContent>
			</Sheet>
		</div>
	</div>
</header>
