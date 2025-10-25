<script lang="ts">
	import type { HTMLAttributes } from "svelte/elements";
	import { cn, type WithElementRef } from "$lib/utils.js";

	let {
		ref = $bindable(null),
		class: className,
		children,
		maxHeight = undefined, // e.g. '70vh' or '24rem'
		...restProps
	}: WithElementRef<HTMLAttributes<HTMLDivElement> & { maxHeight?: string }> = $props();
</script>

<div bind:this={ref} data-slot="card-content" class={cn("px-6", className)} {...restProps}>
	{#if maxHeight}
		<div style={`max-height: ${maxHeight};`} class="overflow-auto">
			{@render children?.()}
		</div>
	{:else}
		{@render children?.()}
	{/if}
</div>
