<script lang="ts">
  export let max: string = 'max-w-3xl'; // Tailwind max-width class
  export let vertical: 'center' | 'top' = 'center';
  export let padding: string = 'p-6';
</script>

<div class={`min-h-screen flex ${vertical === 'center' ? 'items-center' : 'items-start'} justify-center ${padding}`}>
  <div class={`w-full ${max}`}>
    <slot />
  </div>
</div>
