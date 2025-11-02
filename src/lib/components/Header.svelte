<script lang="ts">
	// shadcn-svelte UI components (paths match your project’s prior imports)
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
	import { Home, Trophy, LogIn, Menu } from '@lucide/svelte';
</script>

<header
	class="sticky top-0 z-60 w-full transition-all duration-200 bg-white border-b border-[#E5E7EB] minimal-shadow"
>
	<div class="mx-auto flex max-w-7xl items-center justify-between px-6 py-3">
		<!-- Logo -->
		<a href="/" class="text-xl font-bold tracking-tight transition-colors font-heading text-[#111827] hover:text-[#3B82F6]">
			Valorant Stat Visualizer
		</a>

		<!-- Desktop Nav (shadcn NavigationMenu) -->
		<NavigationMenu class="hidden md:flex">
			<NavigationMenuList class="items-center gap-2">
				<!-- Fill these in with your routes -->
				<NavigationMenuItem>
					<NavigationMenuLink
						href="/"
						class="flex items-center gap-2 rounded-md px-3 py-2 transition-colors hover:bg-[#F8F9FA] hover:text-[#3B82F6] text-[#6B7280]"
					>
						<Home size={18} />
						<span>Home</span>
					</NavigationMenuLink>
				</NavigationMenuItem>
				<NavigationMenuItem>
					<NavigationMenuLink
						href="/leaderboard"
						class="flex items-center gap-2 rounded-md px-3 py-2 transition-colors hover:bg-[#F8F9FA] hover:text-[#3B82F6] text-[#6B7280]"
					>
						<Trophy size={18} />
						<span>Leaderboard</span>
					</NavigationMenuLink>
				</NavigationMenuItem>
				<!-- Example right-aligned action -->
				<NavigationMenuItem class="ml-2">
					<Button variant="secondary" class="flex items-center gap-2 px-3">
						<LogIn size={18} />
						<span>Sign in</span>
					</Button>
				</NavigationMenuItem>
			</NavigationMenuList>
		</NavigationMenu>

		<!-- Mobile: Sheet (hamburger → drawer) -->
		<Sheet>
			<SheetTrigger
				class="inline-flex items-center justify-center rounded-md p-2 transition-colors md:hidden hover:bg-[#F8F9FA] text-[#6B7280]"
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
						<li class="pt-2">
							<Button variant="secondary" class="flex w-full items-center justify-center gap-2">
								<LogIn size={18} />
								<span>Sign in</span>
							</Button>
						</li>
					</ul>
				</nav>
			</SheetContent>
		</Sheet>
	</div>
</header>
