<script lang="ts">
	import * as d3 from 'd3';
	import { onMount } from 'svelte';
	import { goto, invalidateAll } from '$app/navigation';
	import type { Player } from '$lib/types';
	import CombinedPerformanceDelta from '$lib/charts/CombinedPerformanceDelta.svelte';

	export let data: {
		players: Player[];
		period: 'alltime' | 'playoffs';
		performanceDeltas: any[];
	};

	let selectedPeriod: 'alltime' | 'playoffs' = data.period;
	let players: Array<Player & { rank_group: string }> = [];

	$: {
		// Update period from data
		selectedPeriod = data.period;
		// Recalculate players when data changes
		players = (data.players ?? []).map((p) => ({
			...p,
			rank_group: combineRank((p as any).rank_label)
		}));
	}

	const combineRank = (rank: string | null | undefined) => {
		const r = (rank ?? '').toLowerCase();
		if (!r) return 'unranked';
		if (r.startsWith('bronze')) return 'bronze';
		if (r.startsWith('silver')) return 'silver';
		if (r.startsWith('gold')) return 'gold';
		if (r.startsWith('platinum')) return 'platinum';
		if (r.startsWith('diamond')) return 'diamond';
		if (r.startsWith('ascendant')) return 'ascendant';
		if (r.startsWith('immortal')) return 'immortal';
		if (r.startsWith('radiant')) return 'radiant';
		return 'unranked';
	};
	$: if (typeof window !== 'undefined') {
		console.log('Total players:', players.length);
		console.log('Sample player:', players[0]);
		if (players.length > 0) {
			const keys = Object.keys(players[0]);
			console.log('All player keys:', keys);
			console.log('Number of keys:', keys.length);
			// Check for rank-related fields
			const rankKeys = keys.filter((k) => k.toLowerCase().includes('rank'));
			console.log('Rank-related keys:', rankKeys);
			rankKeys.forEach((k) => {
				console.log(`${k}:`, (players[0] as any)[k]);
			});
			const rankGroups = [...new Set(players.map((p) => p.rank_group))];
			console.log('Unique rank groups:', rankGroups);
		}
		console.log('Filtered players:', filtered.length);
	}

	const rankOrder = [
		'radiant',
		'immortal',
		'ascendant',
		'diamond',
		'platinum',
		'gold',
		'silver',
		'bronze'
	];

	const rankColors: Record<string, string> = {
		radiant: '#FCD34D',
		immortal: '#EC4899',
		ascendant: '#34D399',
		diamond: '#60A5FA',
		platinum: '#22D3EE',
		gold: '#FBBF24',
		silver: '#A1A1AA',
		bronze: '#B45309',
		other: '#94A3B8',
		unranked: '#6B7280'
	};

	let selectedRanks = new Set(rankOrder);

	let svgScatter: SVGSVGElement | null = null;
	let showTrendline = false;

	let filtered: Array<Player & { rank_group: string }> = [];
	$: filtered = players.filter((p) => selectedRanks.has(p.rank_group));

	const drawScatter = (svg: SVGSVGElement | null, data: typeof filtered, showTrend: boolean) => {
		if (!svg) return;
		const points = data.filter(
			(d) => Number.isFinite(Number((d as any).acs)) && Number.isFinite(Number((d as any).kast_pct))
		);

		// Get unique ranks that actually exist in the data
		const existingRanks = [...new Set(points.map((d) => d.rank_group))].filter(
			(r) => r !== 'other' && r !== 'unranked'
		);
		const width = 960;
		const height = 500;
		const margin = { top: 30, right: 30, bottom: 100, left: 70 };
		const innerW = width - margin.left - margin.right;
		const innerH = height - margin.top - margin.bottom;

		const root = d3.select(svg);
		root.selectAll('*').remove();

		// Ensure a single tooltip instance
		d3.select('body').selectAll('.scatter-tooltip').remove();
		const tooltip = d3
			.select('body')
			.append('div')
			.attr('class', 'scatter-tooltip')
			.style('position', 'absolute')
			.style('pointer-events', 'none')
			.style('opacity', '0')
			.style('background', 'rgba(15, 23, 42, 0.9)')
			.style('color', '#E5E7EB')
			.style('padding', '8px 10px')
			.style('border-radius', '8px')
			.style('border', '1px solid rgba(255,255,255,0.08)')
			.style('box-shadow', '0 8px 24px rgba(0,0,0,0.18)')
			.style('font-size', '12px')
			.style('line-height', '1.35');
		svg.setAttribute('viewBox', `0 0 ${width} ${height}`);
		svg.setAttribute('preserveAspectRatio', 'xMidYMid meet');

		if (points.length === 0) {
			root
				.append('text')
				.attr('x', width / 2)
				.attr('y', height / 2)
				.attr('text-anchor', 'middle')
				.attr('fill', '#9CA3AF')
				.style('font-size', '14px')
				.text('No data points for selected ranks');
			return;
		}

		const acsVals = points.map((d) => Number((d as any).acs));
		const kastVals = points.map((d) => Number((d as any).kast_pct));
		let xDomain = d3.extent(acsVals) as [number, number];
		let yDomain = d3.extent(kastVals) as [number, number];

		// Add padding when showing a single rank for better spacing
		const showLabels = existingRanks.length === 1;
		if (showLabels) {
			const xRange = xDomain[1] - xDomain[0];
			const yRange = yDomain[1] - yDomain[0];
			xDomain = [xDomain[0] - xRange * 0.15, xDomain[1] + xRange * 0.15];
			// Much more vertical padding to reduce label overlap
			yDomain = [yDomain[0] - yRange * 0.25, yDomain[1] + yRange * 0.25];
		}

		// Always add a bit of headroom so points are not flush with the top
		const yPad = (yDomain[1] - yDomain[0]) * 0.05;
		yDomain = [yDomain[0], yDomain[1] + yPad];

		let x = d3
			.scaleLinear()
			.domain([xDomain[0] ?? 0, xDomain[1] ?? 1])
			.nice()
			.range([0, innerW]);
		let y = d3
			.scaleLinear()
			.domain([Math.min(30, yDomain[0] ?? 0), yDomain[1] ?? 1])
			.nice()
			.range([innerH, 0]);
		const color = (r: string) => rankColors[r] ?? '#999';

		const g = root.append('g').attr('transform', `translate(${margin.left},${margin.top})`);

		// Add clipping region for zooming
		g.append('defs')
			.append('clipPath')
			.attr('id', 'clip')
			.append('rect')
			.attr('width', innerW)
			.attr('height', innerH);

		// Create axis groups and save references
		const leftAxisGroup = g.append('g').attr('class', 'y-axis');
		leftAxisGroup.call(d3.axisLeft(y)).selectAll('text').style('font-size', '10px');

		const bottomAxisGroup = g
			.append('g')
			.attr('class', 'x-axis')
			.attr('transform', `translate(0,${innerH})`);
		bottomAxisGroup.call(d3.axisBottom(x)).selectAll('text').style('font-size', '10px');

		g.append('text')
			.attr('x', innerW / 2)
			.attr('y', innerH + 45)
			.attr('text-anchor', 'middle')
			.attr('fill', '#9CA3AF')
			.style('font-size', '12px')
			.text('ACS');

		g.append('text')
			.attr('transform', 'rotate(-90)')
			.attr('x', -innerH / 2)
			.attr('y', -margin.left + 18)
			.attr('fill', '#9CA3AF')
			.attr('text-anchor', 'middle')
			.style('font-size', '12px')
			.text('KAST %');

		// Transparent overlay for zoom (placed beneath circles)
		const zoomRect = g
			.append('rect')
			.attr('width', innerW)
			.attr('height', innerH)
			.attr('fill', 'transparent')
			.attr('pointer-events', 'all');

		const circleGroup = g.append('g').attr('clip-path', 'url(#clip)');
		circleGroup
			.selectAll('circle')
			.data(points)
			.join('circle')
			.attr('cx', (d) => x(Number((d as any).acs)))
			.attr('cy', (d) => y(Number((d as any).kast_pct)))
			.attr('r', 5)
			.attr('fill', (d) => {
				const rank = d.rank_group;
				return rankColors[rank] ?? '#999';
			})
			.attr('stroke', 'rgba(0,0,0,0.3)')
			.attr('stroke-width', 0.5)
			.attr('opacity', 0.7)
			.style('cursor', 'pointer')
			.style('pointer-events', 'auto')
			.on('mouseenter', function (event, d) {
				const acs = Number((d as any).acs);
				const kast = Number((d as any).kast_pct);
				tooltip
					.style('opacity', '1')
					.html(
						`<div style="font-weight:600; margin-bottom:4px;">${(d as any).player}</div>` +
							`<div>ACS: ${Number.isFinite(acs) ? acs.toFixed(1) : 'N/A'}</div>` +
							`<div>KAST: ${Number.isFinite(kast) ? kast.toFixed(1) : 'N/A'}%</div>`
					);
				d3.select(this)
					.transition()
					.duration(120)
					.attr('r', 7)
					.attr('opacity', 1)
					.attr('stroke-width', 2);
			})
			.on('mousemove', function (event) {
				tooltip.style('left', `${event.pageX + 12}px`).style('top', `${event.pageY - 32}px`);
			})
			.on('mouseleave', function () {
				tooltip.style('opacity', '0');
				d3.select(this)
					.transition()
					.duration(120)
					.attr('r', 5)
					.attr('opacity', 0.7)
					.attr('stroke-width', 0.5);
			});

		let trendLine: d3.Selection<SVGLineElement, unknown, null, undefined> | null = null;
		if (showTrend && points.length >= 2) {
			// Simple least-squares regression y = a*x + b
			const n = points.length;
			const xs = points.map((d) => Number((d as any).acs));
			const ys = points.map((d) => Number((d as any).kast_pct));
			const meanX = d3.mean(xs) ?? 0;
			const meanY = d3.mean(ys) ?? 0;
			const num = d3.sum(xs.map((xv, i) => (xv - meanX) * (ys[i] - meanY))) ?? 0;
			const den = d3.sum(xs.map((xv) => (xv - meanX) ** 2)) ?? 1;
			const slope = den === 0 ? 0 : num / den;
			const intercept = meanY - slope * meanX;

			const xMin = d3.min(xs) ?? 0;
			const xMax = d3.max(xs) ?? 1;
			const yMin = slope * xMin + intercept;
			const yMax = slope * xMax + intercept;

			trendLine = g
				.append('line')
				.attr('clip-path', 'url(#clip)')
				.attr('x1', x(xMin))
				.attr('y1', y(yMin))
				.attr('x2', x(xMax))
				.attr('y2', y(yMax))
				.attr('stroke', '#FFFFFF')
				.attr('stroke-width', 2)
				.attr('stroke-dasharray', '6 4')
				.attr('opacity', 0.9);
		}

		// Add zoom functionality attached to overlay (circles stay interactive on top)
		const zoom = d3
			.zoom<SVGRectElement, unknown>()
			.scaleExtent([1, 8])
			.translateExtent([
				[0, 0],
				[innerW, innerH]
			])
			.extent([
				[0, 0],
				[innerW, innerH]
			])
			.on('zoom', (event) => {
				const newX = event.transform.rescaleX(x);
				const newY = event.transform.rescaleY(y);

				// Update axes using saved group references
				leftAxisGroup.call(d3.axisLeft(newY) as any);
				bottomAxisGroup.call(d3.axisBottom(newX) as any);

				// Update circles
				circleGroup
					.selectAll('circle')
					.attr('cx', (d) => newX(Number((d as any).acs)))
					.attr('cy', (d) => newY(Number((d as any).kast_pct)));

				// Update trend line if present
				if (trendLine) {
					const xs = points.map((d) => Number((d as any).acs));
					const ys = points.map((d) => Number((d as any).kast_pct));
					const meanX = d3.mean(xs) ?? 0;
					const meanY = d3.mean(ys) ?? 0;
					const num = d3.sum(xs.map((xv, i) => (xv - meanX) * (ys[i] - meanY))) ?? 0;
					const den = d3.sum(xs.map((xv) => (xv - meanX) ** 2)) ?? 1;
					const slope = den === 0 ? 0 : num / den;
					const intercept = meanY - slope * meanX;
					const xMin = d3.min(xs) ?? 0;
					const xMax = d3.max(xs) ?? 1;
					const yMin = slope * xMin + intercept;
					const yMax = slope * xMax + intercept;
					trendLine
						.attr('x1', newX(xMin))
						.attr('y1', newY(yMin))
						.attr('x2', newX(xMax))
						.attr('y2', newY(yMax));
				}
			});

		// Enable zoom/pan on the overlay rect
		zoomRect.call(zoom as any);

		// Move legend below the chart to avoid overlap - only show ranks that exist
		const legendData = rankOrder.filter((r) => existingRanks.includes(r));
		// Estimate each legend item width: swatch + gap + text + margin
		const legendWidths = legendData.map((label) => 10 + 4 + label.length * 7.5 + 15);
		const totalLegendWidth = legendWidths.reduce((a, b) => a + b, 0);
		const legendStartX = margin.left + Math.max(0, (innerW - totalLegendWidth) / 2);
		const legend = root
			.append('g')
			.attr('transform', `translate(${legendStartX}, ${height - 20})`)
			.selectAll('g')
			.data(legendData)
			.join('g');

		// Position legend items with dynamic spacing based on precomputed widths
		let xPos = 0;
		legend.attr('transform', function (_, i) {
			const pos = xPos;
			xPos += legendWidths[i];
			return `translate(${pos}, 0)`;
		});

		legend
			.append('rect')
			.attr('width', 10)
			.attr('height', 10)
			.attr('fill', (r) => rankColors[r] ?? '#999')
			.attr('rx', 2);

		legend
			.append('text')
			.attr('x', 14)
			.attr('y', 9)
			.attr('fill', '#9CA3AF')
			.style('font-size', '10px')
			.style('text-transform', 'capitalize')
			.text((r) => r);
	};

	onMount(() => {
		drawScatter(svgScatter, filtered, showTrendline);
	});

	// Redraw when filtered data, svg element, or trendline toggle changes
	$: if (svgScatter) {
		drawScatter(svgScatter, filtered, showTrendline);
	}

	// Update when period changes
	$: if (data.period) {
		selectedPeriod = data.period;
	}

	async function changePeriod(period: 'alltime' | 'playoffs') {
		await goto(`?period=${period}`);
		await invalidateAll();
	}

	function toggleRank(rank: string) {
		const next = new Set(selectedRanks);
		if (next.has(rank)) next.delete(rank);
		else next.add(rank);
		selectedRanks = next;
	}
</script>

<svelte:head>
	<title>Visuals | ACS vs KAST</title>
</svelte:head>

<section class="mx-auto max-w-6xl space-y-6 px-4 py-6">
	<div class="flex flex-wrap items-center justify-between gap-3">
		<div>
			<h1 class="text-foreground text-2xl font-semibold">Visuals</h1>
			<p class="text-muted-foreground text-sm">
				ACS and KAST across all players, filter by rank groups.
			</p>
		</div>
		<div class="flex flex-wrap gap-3">
			<div class="flex items-center gap-2">
				<button
					on:click={() => changePeriod('alltime')}
					class={`rounded-md px-3 py-1 text-sm font-medium transition-colors ${
						selectedPeriod === 'alltime'
							? 'border-primary text-primary bg-card border'
							: 'border-border text-muted-foreground bg-card hover:bg-accent border'
					}`}
				>
					Regular Season
				</button>
				<button
					on:click={() => changePeriod('playoffs')}
					class={`rounded-md px-3 py-1 text-sm font-medium transition-colors ${
						selectedPeriod === 'playoffs'
							? 'border-primary text-primary bg-card border'
							: 'border-border text-muted-foreground bg-card hover:bg-accent border'
					}`}
				>
					Playoffs
				</button>
				<button
					on:click={() => (showTrendline = !showTrendline)}
					class={`rounded-md px-3 py-1 text-sm font-medium transition-colors ${
						showTrendline
							? 'border-primary text-primary bg-card border'
							: 'border-border text-muted-foreground bg-card hover:bg-accent border'
					}`}
				>
					Line of best fit
				</button>
			</div>
			<div class="flex flex-wrap gap-2">
				{#each rankOrder as r}
					<label class="border-border flex items-center gap-2 rounded-md border px-2 py-1 text-sm">
						<input
							type="checkbox"
							checked={selectedRanks.has(r)}
							on:change={() => toggleRank(r)}
							class="accent-primary"
						/>
						<span class="inline-flex items-center gap-1">
							<span class="h-3 w-3 rounded-sm" style={`background:${rankColors[r] ?? '#999'}`}
							></span>
							{r.charAt(0).toUpperCase() + r.slice(1)}
						</span>
					</label>
				{/each}
			</div>
		</div>
	</div>

	<div class="border-border bg-card space-y-4 rounded-lg border p-4 shadow-sm">
		<div class="flex items-center justify-between">
			<h2 class="text-foreground text-lg font-semibold">ACS vs KAST</h2>
			<p class="text-muted-foreground text-sm">Scatter plot colored by rank group.</p>
		</div>
		<svg bind:this={svgScatter} class="w-full"></svg>
	</div>

	{#if data.performanceDeltas && data.performanceDeltas.length > 0}
		<div class="border-border bg-card space-y-4 rounded-lg border p-4 shadow-sm">
			<div class="flex items-center justify-between">
				<div>
					<h2 class="text-foreground text-lg font-semibold">Performance Delta Analysis</h2>
					<p class="text-muted-foreground mt-1 text-sm">
						Combined z-score comparison of playoff vs regular season performance for all players.
					</p>
				</div>
			</div>
			<CombinedPerformanceDelta players={data.performanceDeltas} />
			<div class="text-muted-foreground mt-4 space-y-1 text-xs">
				<p><strong>What the numbers mean:</strong></p>
				<ul class="ml-2 list-inside list-disc space-y-1">
					<li>
						Numbers represent <strong>standard deviations</strong> from league average (σ)
					</li>
					<li>
						<strong>±0.5σ or more</strong> = significant difference in performance
					</li>
					<li>Combines both ACS and KAST stats into one number for easy comparison</li>
				</ul>
			</div>
		</div>
	{/if}
</section>
