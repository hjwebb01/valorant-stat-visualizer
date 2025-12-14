<script lang="ts">
	import { Slider as SliderPrimitive } from 'bits-ui';
	import { cn } from '$lib/utils.js';
	import type { SliderThumbProps } from 'bits-ui';

	let {
		class: className,
		...restProps
	}: SliderThumbProps = $props();
</script>

<SliderPrimitive.Thumb
	class={cn(
		'block h-5 w-5 rounded-full border-2 border-primary bg-background ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50',
		className
	)}
	{...restProps}
>
	{@render restProps.children?.()}
</SliderPrimitive.Thumb>

