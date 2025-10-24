<script lang="ts">
	import { onMount } from 'svelte';
	import * as d3 from 'd3';
	export let data: { t: number; y: number }[] = [];
	let container: HTMLDivElement;

	$: draw(); // re-draw on data changes (small datasets)
	function draw() {
		if (!container) return;
		container.innerHTML = '';

		const w = 600,
			h = 280,
			m = { t: 16, r: 24, b: 28, l: 40 };
		const svg = d3.select(container).append('svg').attr('width', w).attr('height', h);
		const x = d3
			.scaleUtc()
			.domain(d3.extent(data, (d) => new Date(d.t)) as [Date, Date])
			.range([m.l, w - m.r]);
		const y = d3
			.scaleLinear()
			.domain(d3.extent(data, (d) => d.y) as [number, number])
			.nice()
			.range([h - m.b, m.t]);

		const g = svg.append('g');
		g.append('g')
			.attr('transform', `translate(0,${h - m.b})`)
			.call(d3.axisBottom(x).ticks(5));
		g.append('g').attr('transform', `translate(${m.l},0)`).call(d3.axisLeft(y).ticks(5));

		const line = d3
			.line<{ t: number; y: number }>()
			.x((d) => x(new Date(d.t)))
			.y((d) => y(d.y));
		g.append('path')
			.datum(data)
			.attr('fill', 'none')
			.attr('stroke', 'currentColor')
			.attr('stroke-width', 2)
			.attr('d', line);
	}

	onMount(draw);
</script>

<div bind:this={container} class="text-foreground" />
