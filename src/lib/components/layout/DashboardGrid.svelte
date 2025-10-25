<script lang="ts">
	export let cols: string = 'md:grid-cols-2';
	export let gap: string = 'gap-6';
</script>

<div class={`grid grid-cols-1 ${cols} ${gap}`}>
	<slot />
</div>
