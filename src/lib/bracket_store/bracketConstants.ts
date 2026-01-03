import type { BracketMatchId, Team } from './bracketTypes';

// Match order for validation and export operations
export const MATCH_ORDER: readonly BracketMatchId[] = [
	'U1',
	'U2',
	'U3',
	'U4',
	'L1',
	'L2',
	'U5',
	'U6',
	'L3',
	'L4',
	'L5',
	'U7',
	'L8',
	'GF'
] as const;

// Elimination matches - teams are eliminated after these matches
export const ELIMINATION_MATCHES: Set<BracketMatchId> = new Set([
	'L1',
	'L2',
	'L3',
	'L4',
	'L5',
	'L8',
	'GF'
]);

// Initial teams for the tournament
// TODO: Consider moving to a config file or database for easier updates
export const INITIAL_TEAMS: Team[] = [
	{ name: 'Pokeball of Wonders', tag: 'POW', seed: 1 },
	{ name: 'Hooters', tag: 'HOR', seed: 2 },
	{ name: 'Terence Terence Rence', tag: 'TTR', seed: 3 },
	{ name: 'The Big Black', tag: 'TBB', seed: 4 },
	{ name: 'JT Rebuild Rebuild', tag: 'JTRR', seed: 5 },
	{ name: 'O. Jenk Simpsons', tag: 'OJS', seed: 6 },
	{ name: 'STranger Danger', tag: 'STD', seed: 7 },
	{ name: 'The Bron Crusaders', tag: 'TBC', seed: 8 }
];

// Upper bracket match IDs
export const UPPER_BRACKET_MATCHES: readonly BracketMatchId[] = [
	'U1',
	'U2',
	'U3',
	'U4',
	'U5',
	'U6',
	'U7'
] as const;

// Lower bracket match IDs
export const LOWER_BRACKET_MATCHES: readonly BracketMatchId[] = [
	'L1',
	'L2',
	'L3',
	'L4',
	'L5',
	'L8'
] as const;

// Finals match IDs
export const FINALS_MATCHES: readonly BracketMatchId[] = ['GF'] as const;
