<script lang="ts">
	import type { HTMLTableAttributes } from 'svelte/elements';
	import { cn, type WithElementRef } from '$lib/utils.js';

	let {
		ref = $bindable(null),
		class: className,
		children,
		...restProps
	}: WithElementRef<HTMLTableAttributes> = $props();
</script>

<div
	data-slot="table-container"
	class="bg-backgroundp-4 relative mx-auto w-full overflow-x-auto rounded-lg border shadow-md sm:w-[95%]"
>
	<table
		bind:this={ref}
		data-slot="table"
		class={cn('w-full caption-bottom text-sm ', className)}
		{...restProps}
	>
		{@render children?.()}
	</table>
</div>
