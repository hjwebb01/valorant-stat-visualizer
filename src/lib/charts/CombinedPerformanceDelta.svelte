<script lang="ts">
	import { onMount } from 'svelte';
	import * as d3 from 'd3';

	export let players: Array<{
		playerName: string;
		combinedZDelta: number;
		acsZDelta: number;
		kastZDelta: number;
		regularSeasonStats: { acs: number; kastPct: number };
		playoffStats: { acs: number; kastPct: number };
	}> = [];

	export let maxPlayers: number = 30;

	let container: HTMLDivElement;

	function draw() {
		if (!container || players.length === 0) return;
		container.innerHTML = '';

		// Display all players, sorted by combined Z-score delta
		const displayPlayers = [...players].sort((a, b) => b.combinedZDelta - a.combinedZDelta);

		const w = 800;
		const h = Math.max(400, displayPlayers.length * 20 + 100);
		const m = { t: 60, r: 120, b: 40, l: 150 };

		const svg = d3.select(container).append('svg').attr('width', w).attr('height', h);

		// X scale for combined Z-score delta (centered at 0)
		const maxAbsZ = d3.max(displayPlayers, (d) => Math.abs(d.combinedZDelta)) || 1;
		const x = d3
			.scaleLinear()
			.domain([-maxAbsZ - 0.3, maxAbsZ + 0.3])
			.range([m.l, w - m.r]);

		// Y scale for players
		const y = d3
			.scaleBand()
			.domain(displayPlayers.map((d) => d.playerName))
			.range([m.t, h - m.b])
			.padding(0.15);

		const g = svg.append('g');

		// Draw center line at 0
		g.append('line')
			.attr('x1', x(0))
			.attr('x2', x(0))
			.attr('y1', m.t)
			.attr('y2', h - m.b)
			.attr('stroke', 'currentColor')
			.attr('stroke-width', 2)
			.attr('opacity', 0.3);

		// Create tooltip
		const tooltip = d3
			.select('body')
			.append('div')
			.style('position', 'absolute')
			.style('background', 'rgba(0, 0, 0, 0.9)')
			.style('color', 'white')
			.style('padding', '8px 12px')
			.style('border-radius', '6px')
			.style('font-size', '12px')
			.style('pointer-events', 'none')
			.style('opacity', '0')
			.style('z-index', '1000')
			.style('transition', 'opacity 0.2s');

		// Draw bars
		g.selectAll('.bar')
			.data(displayPlayers)
			.join('rect')
			.attr('class', 'bar')
			.attr('x', (d) => (d.combinedZDelta < 0 ? x(d.combinedZDelta) : x(0)))
			.attr('y', (d) => y(d.playerName) || 0)
			.attr('width', (d) => Math.abs(x(d.combinedZDelta) - x(0)))
			.attr('height', y.bandwidth())
			.attr('fill', (d) => {
				const val = d.combinedZDelta;
				if (val >= 0.5) return '#22c55e';
				if (val >= 0) return '#86efac';
				if (val >= -0.5) return '#fca5a5';
				return '#ef4444';
			})
			.attr('opacity', 0.85)
			.style('cursor', 'pointer')
			.on('mouseenter', function (event, d) {
				d3.select(this).attr('opacity', 1);
				tooltip
					.style('opacity', '1')
					.html(
						`<div style="font-weight:600; margin-bottom:6px;">${d.playerName}</div>` +
							`<div style="margin-bottom:4px;"><strong>Combined Δ:</strong> ${d.combinedZDelta >= 0 ? '+' : ''}${d.combinedZDelta.toFixed(2)}σ</div>` +
							`<div style="margin-bottom:2px;">ACS Δ: ${d.acsZDelta >= 0 ? '+' : ''}${d.acsZDelta.toFixed(2)}σ</div>` +
							`<div style="margin-bottom:6px;">KAST Δ: ${d.kastZDelta >= 0 ? '+' : ''}${d.kastZDelta.toFixed(2)}σ</div>` +
							`<div style="font-size:10px; opacity:0.8;">` +
							`Regular: ${d.regularSeasonStats.acs.toFixed(0)} ACS, ${d.regularSeasonStats.kastPct.toFixed(1)}% KAST<br/>` +
							`Playoffs: ${d.playoffStats.acs.toFixed(0)} ACS, ${d.playoffStats.kastPct.toFixed(1)}% KAST` +
							`</div>`
					);
			})
			.on('mousemove', function (event) {
				tooltip.style('left', `${event.pageX + 12}px`).style('top', `${event.pageY - 60}px`);
			})
			.on('mouseleave', function () {
				d3.select(this).attr('opacity', 0.85);
				tooltip.style('opacity', '0');
			});

		// Add player name labels (left side)
		g.selectAll('.label')
			.data(displayPlayers)
			.join('text')
			.attr('class', 'label')
			.attr('x', m.l - 10)
			.attr('y', (d) => (y(d.playerName) || 0) + y.bandwidth() / 2)
			.attr('text-anchor', 'end')
			.attr('dominant-baseline', 'middle')
			.attr('fill', 'currentColor')
			.attr('font-size', '11px')
			.text((d) => {
				const maxLen = 18;
				return d.playerName.length > maxLen
					? d.playerName.substring(0, maxLen - 1) + '…'
					: d.playerName;
			});

		// Add combined Z-score delta values on bars
		g.selectAll('.value')
			.data(displayPlayers)
			.join('text')
			.attr('class', 'value')
			.attr('x', (d) => x(d.combinedZDelta) + (d.combinedZDelta >= 0 ? 5 : -5))
			.attr('y', (d) => (y(d.playerName) || 0) + y.bandwidth() / 2)
			.attr('text-anchor', (d) => (d.combinedZDelta >= 0 ? 'start' : 'end'))
			.attr('dominant-baseline', 'middle')
			.attr('fill', 'currentColor')
			.attr('font-size', '10px')
			.attr('font-weight', '600')
			.text((d) => `${d.combinedZDelta >= 0 ? '+' : ''}${d.combinedZDelta.toFixed(2)}σ`);

		// Add X axis
		g.append('g')
			.attr('transform', `translate(0,${h - m.b})`)
			.call(
				d3
					.axisBottom(x)
					.ticks(8)
					.tickFormat((d) => `${d}σ`)
			)
			.selectAll('text')
			.attr('fill', 'currentColor');

		g.selectAll('.domain, .tick line').attr('stroke', 'currentColor').attr('opacity', 0.3);

		// Add title
		svg
			.append('text')
			.attr('x', w / 2)
			.attr('y', 25)
			.attr('text-anchor', 'middle')
			.attr('fill', 'currentColor')
			.attr('font-size', '16px')
			.attr('font-weight', 'bold')
			.text('How Players Performed in Playoffs vs Regular Season');

		svg
			.append('text')
			.attr('x', w / 2)
			.attr('y', 45)
			.attr('text-anchor', 'middle')
			.attr('fill', 'currentColor')
			.attr('font-size', '12px')
			.attr('opacity', 0.7)
			.text(
				'Green = better in playoffs | Red = worse in playoffs | Bars show overall performance change'
			);

		// Cleanup on destroy
		return () => {
			tooltip.remove();
		};
	}

	onMount(() => {
		const cleanup = draw();
		return cleanup;
	});
	$: (players, maxPlayers, draw());
</script>

<div bind:this={container} class="text-foreground flex justify-center"></div>

<style>
	div {
		min-height: 400px;
	}
</style>
