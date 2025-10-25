import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
	return twMerge(clsx(inputs));
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export type WithoutChild<T> = T extends { child?: any } ? Omit<T, 'child'> : T;
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export type WithoutChildren<T> = T extends { children?: any } ? Omit<T, 'children'> : T;
export type WithoutChildrenOrChild<T> = WithoutChildren<WithoutChild<T>>;
export type WithElementRef<T, U extends HTMLElement = HTMLElement> = T & { ref?: U | null };

/**
 * Compute the q-quantile (e.g., q=0.5 median, q=0.9 p90) using linear interpolation.
 * Returns NaN if the array is empty or contains no finite numbers.
 */
export function quantile(values: Array<number | null | undefined>, q: number): number {
	const arr = values
		.map((v) => (typeof v === 'number' ? v : Number(v)))
		.filter((v) => Number.isFinite(v)) as number[];
	if (arr.length === 0) return NaN;
	if (q <= 0) return Math.min(...arr);
	if (q >= 1) return Math.max(...arr);
	arr.sort((a, b) => a - b);
	const pos = (arr.length - 1) * q;
	const lower = Math.floor(pos);
	const upper = Math.ceil(pos);
	if (lower === upper) return arr[lower];
	const weight = pos - lower;
	return arr[lower] * (1 - weight) + arr[upper] * weight;
}

/**
 * Percentile rank of a value within a distribution.
 * Returns a number in [0,1]. By default uses inclusive definition: count(v <= x)/n.
 */
export function percentileRank(
	values: Array<number | null | undefined>,
	x: number | null | undefined,
	opts: { inclusive?: boolean } = {}
): number {
	const { inclusive = true } = opts;
	const arr = values
		.map((v) => (typeof v === 'number' ? v : Number(v)))
		.filter((v) => Number.isFinite(v)) as number[];
	const vx = typeof x === 'number' ? x : Number(x);
	if (!Number.isFinite(vx) || arr.length === 0) return NaN;
	const n = arr.length;
	let count = 0;
	for (const v of arr) {
		if (inclusive ? v <= vx : v < vx) count++;
	}
	return count / n;
}

/**
 * Convenience to express a [0,1] percentile as an integer 0..100.
 */
export function toPercent(p: number): number {
	return Number.isFinite(p) ? Math.round(p * 100) : NaN;
}

/**
 * Compute multiple quantiles in one pass. q values outside [0,1] are clamped.
 */
export function quantiles(values: Array<number | null | undefined>, qs: number[]): number[] {
	return qs.map((q) => quantile(values, Math.min(1, Math.max(0, q))));
}
