<script lang="ts">
	import { Slider as SliderPrimitive } from 'bits-ui';
	import { cn } from '$lib/utils.js';
	import type { SliderThumbProps } from 'bits-ui';

	let { class: className, ...restProps }: SliderThumbProps = $props();
</script>

<SliderPrimitive.Thumb
	class={cn(
		'border-primary bg-background ring-offset-background focus-visible:ring-ring block h-5 w-5 rounded-full border-2 transition-colors focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:outline-none disabled:pointer-events-none disabled:opacity-50',
		className
	)}
	{...restProps}
/>
