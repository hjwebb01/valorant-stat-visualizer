/**
 * Calculate mean and standard deviation for a set of values
 */
export function calculateStats(values: number[]): { mean: number; stdDev: number } {
	if (values.length === 0) {
		return { mean: 0, stdDev: 1 };
	}

	const mean = values.reduce((sum, val) => sum + val, 0) / values.length;

	const variance = values.reduce((sum, val) => sum + Math.pow(val - mean, 2), 0) / values.length;

	const stdDev = Math.sqrt(variance);

	return {
		mean,
		stdDev: stdDev || 1 // Avoid division by zero
	};
}

/**
 * Calculate Z-score for a value given mean and standard deviation
 */
export function calculateZScore(value: number, mean: number, stdDev: number): number {
	if (stdDev === 0) return 0;
	return (value - mean) / stdDev;
}

/**
 * Calculate league-wide statistics from player stats
 */
export function calculateLeagueStats(stats: Array<{ acs: number; kastPct: number }>): {
	acs: { mean: number; stdDev: number };
	kast: { mean: number; stdDev: number };
} {
	const acsValues = stats.map((s) => s.acs).filter((v) => v !== null && !isNaN(v));
	const kastValues = stats.map((s) => s.kastPct).filter((v) => v !== null && !isNaN(v));

	return {
		acs: calculateStats(acsValues),
		kast: calculateStats(kastValues)
	};
}
