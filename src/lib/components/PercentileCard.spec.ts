import { describe, it, expect } from 'vitest';
import { render } from 'vitest-browser-svelte';
import PercentileCard from './PercentileCard.svelte';

describe('PercentileCard', () => {
	it('should render empty state when no player is selected', () => {
		const { container } = render(PercentileCard, {
			props: {
				percentiles: {},
				player: null
			}
		});
		expect(container.textContent).toContain('Select a player');
	});

	it('should render percentile rankings when player is selected', () => {
		const mockPlayer = {
			player: 'TestPlayer',
			acs: 285.5,
			kd: 1.35,
			adr: 165.2,
			kast_pct: 72.5,
			hs_pct: 28.3
		};

		const mockPercentiles = {
			acs: 92,
			kd: 78,
			adr: 65,
			kast_pct: 80,
			hs_pct: 55
		};

		const { container } = render(PercentileCard, {
			props: {
				percentiles: mockPercentiles,
				player: mockPlayer
			}
		});

		expect(container.textContent).toContain('TestPlayer');
		expect(container.textContent).toContain('Top 92%');
		expect(container.textContent).toContain('ACS');
	});
});
