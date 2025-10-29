<script lang="ts">
  import { onMount } from 'svelte';

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
    NavigationMenuRoot,
    NavigationMenuList,
    NavigationMenuItem,
    NavigationMenuLink
  } from '$lib/components/ui/navigation-menu';
	import NavigationMenu from './ui/navigation-menu/navigation-menu.svelte';

  let scrolled = false;

  onMount(() => {
    const handleScroll = () => (scrolled = window.scrollY > 10);
    window.addEventListener('scroll', handleScroll, { passive: true });
    handleScroll();
    return () => window.removeEventListener('scroll', handleScroll);
  });
</script>

<header
  class="sticky top-0 z-50 w-full bg-background transition-all duration-200"
  class:shadow-md={scrolled}
>
  <div class="mx-auto flex max-w-7xl items-center justify-between px-6 py-3">
    <!-- Logo -->
    <a href="/" class="text-xl font-bold tracking-tight hover:text-primary transition-colors">
      Valorant Stat Visualizer
    </a>

    <!-- Desktop Nav (shadcn NavigationMenu) -->
    <NavigationMenu class="hidden md:flex">
      <NavigationMenuList class="items-center gap-2">
        <!-- Fill these in with your routes -->
        <NavigationMenuItem>
          <NavigationMenuLink href="/" class="px-3 py-2 rounded-md hover:bg-accent hover:text-accent-foreground">
            Home
          </NavigationMenuLink>
        </NavigationMenuItem>
        <NavigationMenuItem>
          <NavigationMenuLink href="/leaderboard" class="px-3 py-2 rounded-md hover:bg-accent hover:text-accent-foreground">
            Leaderboard
          </NavigationMenuLink>
        </NavigationMenuItem>
        <!-- Example right-aligned action -->
        <NavigationMenuItem class="ml-2">
          <Button variant="secondary" class="px-3">Sign in</Button>
        </NavigationMenuItem>
      </NavigationMenuList>
    </NavigationMenu>

    <!-- Mobile: Sheet (hamburger → drawer) -->
    <Sheet>
      <SheetTrigger class="md:hidden inline-flex items-center justify-center rounded-md p-2 hover:bg-accent">
        <!-- Hamburger icon -->
        <svg xmlns="http://www.w3.org/2000/svg" class="h-6 w-6" fill="none"
          viewBox="0 0 24 24" stroke="currentColor" stroke-width="2" aria-hidden="true">
          <path stroke-linecap="round" stroke-linejoin="round" d="M4 6h16M4 12h16M4 18h16" />
        </svg>
        <span class="sr-only">Open menu</span>
      </SheetTrigger>

      <SheetContent side="left" class="w-72 p-0">
        <SheetHeader class="px-6 py-4 border-b">
          <SheetTitle class="text-base">Menu</SheetTitle>
        </SheetHeader>

        <nav class="px-6 py-4">
          <ul class="flex flex-col space-y-2 text-sm font-medium">
            <!-- Same links as desktop -->
            <li>
              <a href="/" class="block rounded-md px-3 py-2 hover:bg-accent hover:text-accent-foreground">
                Home
              </a>
            </li>
            <li>
              <a href="/leaderboard" class="block rounded-md px-3 py-2 hover:bg-accent hover:text-accent-foreground">
                Leaderboard
              </a>
            </li>
            <li class="pt-2">
              <Button variant="secondary" class="w-full justify-center">Sign in</Button>
            </li>
          </ul>
        </nav>
      </SheetContent>
    </Sheet>
  </div>
</header>
