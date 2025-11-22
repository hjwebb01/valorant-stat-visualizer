<script lang="ts" module>
	// Allow listening to DOM events (e.g., `on:click`) on the TableRow component
	export interface TableRowEvents {
		click: MouseEvent;
	}

	export interface TableRowSlots {
		default: {};
	}

	// Generic name some tools expect
	export interface Events {
		click: MouseEvent;
	}
</script>

<script lang="ts">
	import { cn, type WithElementRef } from '$lib/utils.js';
	import type { HTMLAttributes } from 'svelte/elements';

	let {
		ref = $bindable(null),
		class: className,
		children,
		...restProps
	}: WithElementRef<HTMLAttributes<HTMLTableRowElement>> = $props();
</script>

<tr
	bind:this={ref}
	data-slot="table-row"
	class={cn(
		'hover:[&,&>svelte-css-wrapper]:[&>th,td]:bg-muted/50 data-[state=selected]:bg-muted border-b transition-colors',
		className
	)}
	{...restProps}
>
	{@render children?.()}
</tr>
