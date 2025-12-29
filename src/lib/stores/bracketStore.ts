import { writable, derived } from 'svelte/store';
import { browser } from '$app/environment';

export interface Team {
	name: string;
	tag: string;
	seed: number;
}

export interface Match {
	id: string;
	team1: Team | null;
	team2: Team | null;
	winner: Team | null;
	nextMatchId: string | null;
	nextMatchSlot: 'team1' | 'team2' | null;
	loserNextMatchId: string | null;
	loserNextMatchSlot: 'team1' | 'team2' | null;
}

type MatchState = Record<string, Match>;

const STORAGE_KEY = 'bracket.state.v1';

const teams: Team[] = [
	{ name: 'Pokeball of Wonders', tag: 'POW', seed: 1 },
	{ name: 'Hooters', tag: 'HOR', seed: 2 },
	{ name: 'Terence Terence Rence', tag: 'TTR', seed: 3 },
	{ name: 'The Big Black', tag: 'TBB', seed: 4 },
	{ name: 'JT Rebuild Rebuild', tag: 'JTRR', seed: 5 },
	{ name: 'O. Jenk Simpsons', tag: 'OJS', seed: 6 },
	{ name: 'STranger Danger', tag: 'STD', seed: 7 },
	{ name: 'The Bron Crusaders', tag: 'TBC', seed: 8 }
];

const getTeamBySeed = (seed: number): Team | null => teams.find((t) => t.seed === seed) ?? null;

const createMatch = (
	id: string,
	team1: Team | null,
	team2: Team | null,
	nextMatchId: string | null = null,
	nextMatchSlot: 'team1' | 'team2' | null = null,
	loserNextMatchId: string | null = null,
	loserNextMatchSlot: 'team1' | 'team2' | null = null
): Match => ({
	id,
	team1,
	team2,
	winner: null,
	nextMatchId,
	nextMatchSlot,
	loserNextMatchId,
	loserNextMatchSlot
});

const createInitialMatches = (): MatchState => ({
	U1: createMatch('U1', getTeamBySeed(1), getTeamBySeed(8), 'U5', 'team1', 'L1', 'team1'),
	U2: createMatch('U2', getTeamBySeed(4), getTeamBySeed(5), 'U5', 'team2', 'L1', 'team2'),
	U3: createMatch('U3', getTeamBySeed(2), getTeamBySeed(7), 'U6', 'team1', 'L2', 'team1'),
	U4: createMatch('U4', getTeamBySeed(3), getTeamBySeed(6), 'U6', 'team2', 'L2', 'team2'),
	U5: createMatch('U5', null, null, 'U7', 'team1', 'L4', 'team2'),
	U6: createMatch('U6', null, null, 'U7', 'team2', 'L3', 'team2'),
	U7: createMatch('U7', null, null, 'GF', 'team1', 'L8', 'team1'),
	L1: createMatch('L1', null, null, 'L3', 'team1', null, null),
	L2: createMatch('L2', null, null, 'L4', 'team1', null, null),
	L3: createMatch('L3', null, null, 'L5', 'team1', null, null),
	L4: createMatch('L4', null, null, 'L5', 'team2', null, null),
	L5: createMatch('L5', null, null, 'L8', 'team2', null, null),
	L8: createMatch('L8', null, null, 'GF', 'team2', null, null),
	GF: createMatch('GF', null, null, null, null, null, null)
});

const loadFromStorage = (): MatchState | null => {
	if (!browser) return null;
	try {
		const stored = localStorage.getItem(STORAGE_KEY);
		if (stored) return JSON.parse(stored) as MatchState;
	} catch (error) {
		console.error('Failed to load bracket state from storage:', error);
	}
	return null;
};

const saveToStorage = (state: MatchState) => {
	if (browser) localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
};

const resetWinnerIfNeeded = (
	match: Match,
	newTeam: Team | null,
	currentState: MatchState
): Match => {
	if (!match.winner) return match;

	const winnerIsInMatch =
		(match.team1 && match.team1.name === newTeam?.name) ||
		(match.team2 && match.team2.name === newTeam?.name);

	if (!winnerIsInMatch) {
		const updated = { ...match, winner: null };
		currentState[updated.id] = updated;
	}
	return match;
};

const getWinnerLoser = (match: Match, team: Team) => {
	const isTeam1 = match.team1?.name === team.name;
	return {
		winner: isTeam1 ? match.team1 : match.team2,
		loser: isTeam1 ? match.team2 : match.team1
	};
};

const updateNextMatch = (
	currentState: MatchState,
	match: Match,
	newTeam: Team,
	nextMatchId: string | null,
	nextMatchSlot: 'team1' | 'team2' | null
) => {
	if (!nextMatchId || !nextMatchSlot) return;

	const nextMatch = { ...currentState[nextMatchId] };
	nextMatch[nextMatchSlot] = newTeam;
	currentState[nextMatch.id] = nextMatch;

	resetWinnerIfNeeded(nextMatch, newTeam, currentState);
};

const clearTeamFromFuture = (
	state: MatchState,
	teamToClear: Team | null,
	startMatchId: string,
	visited: Set<string>
): MatchState => {
	if (!teamToClear || visited.has(startMatchId)) return state;

	const match = state[startMatchId];
	if (!match) return state;

	visited.add(startMatchId);

	const team1InMatch = match.team1?.name === teamToClear.name;
	const team2InMatch = match.team2?.name === teamToClear.name;

	if (!team1InMatch && !team2InMatch) return state;

	const updatedMatch = {
		...match,
		...(team1InMatch && { team1: null }),
		...(team2InMatch && { team2: null }),
		...(match.winner?.name === teamToClear.name && { winner: null })
	};

	if (!updatedMatch.team1 || !updatedMatch.team2) {
		updatedMatch.winner = null;
	}

	let updatedState = { ...state, [startMatchId]: updatedMatch };

	if (match.nextMatchId) {
		updatedState = clearTeamFromFuture(updatedState, teamToClear, match.nextMatchId, visited);
	}
	if (match.loserNextMatchId) {
		updatedState = clearTeamFromFuture(updatedState, teamToClear, match.loserNextMatchId, visited);
	}

	return updatedState;
};

export const matches = writable<MatchState>(loadFromStorage() ?? createInitialMatches());

export function setWinner(matchId: string, team: Team) {
	matches.update((state) => {
		const match = { ...state[matchId] };
		if (!match.team1 || !match.team2) return state;

		const oldWinner = match.winner;
		const oldLoser =
			match.loserNextMatchId && match.loserNextMatchSlot
				? (state[match.loserNextMatchId]?.[match.loserNextMatchSlot] ?? null)
				: null;

		const { winner, loser } = getWinnerLoser(match, team);
		if (!winner || !loser) return state;

		match.winner = winner;
		let newState = { ...state, [matchId]: match };

		if (oldWinner && match.nextMatchId) {
			newState = clearTeamFromFuture(newState, oldWinner, match.nextMatchId, new Set());
		}
		if (oldLoser && oldLoser.name !== loser.name && match.loserNextMatchId) {
			newState = clearTeamFromFuture(newState, oldLoser, match.loserNextMatchId, new Set());
		}

		updateNextMatch(newState, match, winner, match.nextMatchId, match.nextMatchSlot);
		updateNextMatch(newState, match, loser, match.loserNextMatchId, match.loserNextMatchSlot);

		saveToStorage(newState);
		return newState;
	});
}

export function resetBracket() {
	const newMatches = createInitialMatches();
	matches.set(newMatches);
	saveToStorage(newMatches);
}

export const champion = derived(matches, ($matches) => $matches['GF']?.winner ?? null);

// Match order for validation traversal (tournament progression order)
const MATCH_ORDER = [
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
];

// Matches where losing means elimination (lower bracket matches)
const ELIMINATION_MATCHES = new Set(['L1', 'L2', 'L3', 'L4', 'L5', 'L8', 'GF']);

export interface BracketValidationResult {
	valid: boolean;
	errors: string[];
}

export interface BracketPicksExport {
	picks: Record<string, string>;
	champion: string;
	timestamp: string;
}

export function validateBracket(): BracketValidationResult {
	let currentState: MatchState | null = null;
	matches.subscribe((state) => (currentState = state))();

	if (!currentState) {
		return { valid: false, errors: ['Unable to read bracket state'] };
	}

	const state = currentState as MatchState;
	const errors: string[] = [];
	const eliminatedTeams = new Set<string>();

	for (const matchId of MATCH_ORDER) {
		const match = state[matchId];

		// Check if match has both teams
		if (!match.team1 || !match.team2) {
			errors.push(`Match ${matchId}: Missing teams (bracket incomplete)`);
			continue;
		}

		// Check if match has a winner
		if (!match.winner) {
			errors.push(`Match ${matchId}: No winner selected`);
			continue;
		}

		// Check if winner is one of the teams in this match
		const winnerName = match.winner.name;
		if (winnerName !== match.team1.name && winnerName !== match.team2.name) {
			errors.push(`Match ${matchId}: Winner is not a participant in this match`);
			continue;
		}

		// Check if winner was previously eliminated
		if (eliminatedTeams.has(winnerName)) {
			errors.push(`Match ${matchId}: Winner "${match.winner.tag}" was already eliminated`);
		}

		// Determine the loser and track elimination if this is an elimination match
		const loser = match.winner.name === match.team1.name ? match.team2 : match.team1;
		if (ELIMINATION_MATCHES.has(matchId) && loser) {
			eliminatedTeams.add(loser.name);
		}
	}

	return { valid: errors.length === 0, errors };
}

export function exportBracketPicks(): BracketPicksExport | null {
	const validation = validateBracket();

	if (!validation.valid) {
		return null;
	}

	let currentState: MatchState | null = null;
	matches.subscribe((state) => (currentState = state))();

	if (!currentState) {
		return null;
	}

	const state = currentState as MatchState;
	const picks: Record<string, string> = {};

	for (const matchId of MATCH_ORDER) {
		const match = state[matchId];
		if (match.winner) {
			picks[matchId] = match.winner.tag;
		}
	}

	const championTeam = state['GF']?.winner;
	if (!championTeam) {
		return null;
	}

	const exportData: BracketPicksExport = {
		picks,
		champion: championTeam.tag,
		timestamp: new Date().toISOString()
	};

	console.log('Bracket Picks Export:', JSON.stringify(exportData, null, 2));

	return exportData;
}
