<script lang="ts">
	import type { HTMLTableAttributes } from "svelte/elements";
	import { cn, type WithElementRef } from "$lib/utils.js";

	let {
		ref = $bindable(null),
		class: className,
		children,
		...restProps
	}: WithElementRef<HTMLTableAttributes> = $props();
</script>

<div
	data-slot="table-container"
	class="relative w-full sm:w-[95%] mx-auto overflow-x-auto rounded-lg border bg-backgroundp-4 shadow-md"
>
	<table
		bind:this={ref}
		data-slot="table"
		class={cn("w-full caption-bottom text-sm ", className)}
		{...restProps}
	>
		{@render children?.()}
	</table>
</div>
