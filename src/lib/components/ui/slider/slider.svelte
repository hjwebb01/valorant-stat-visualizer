<script lang="ts">
	import { Slider as SliderPrimitive } from 'bits-ui';
	import { cn } from '$lib/utils.js';
	import SliderThumb from './slider-thumb.svelte';

	type Props = {
		class?: string;
		value?: number;
		min?: number;
		max?: number;
		step?: number;
		disabled?: boolean;
		orientation?: 'horizontal' | 'vertical';
		onValueChange?: (value: number) => void;
	} & Record<string, any>;

	let { class: className, value = $bindable(0), ...restProps }: Props = $props();
</script>

<SliderPrimitive.Root
	type="single"
	bind:value
	class={cn('relative flex w-full touch-none items-center select-none', className)}
	{...restProps as any}
>
	{#snippet children({ thumbs }: { thumbs: number[] })}
		<span class="bg-secondary relative h-2 w-full grow overflow-hidden rounded-full">
			<SliderPrimitive.Range class="bg-primary absolute h-full" />
		</span>
		{#each thumbs as index}
			<SliderThumb {index} />
		{/each}
	{/snippet}
</SliderPrimitive.Root>
