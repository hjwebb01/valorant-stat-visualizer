import { writable, derived, get } from 'svelte/store';
import { user, isLoggedIn } from './auth';
import { supabase } from '$lib/supabaseClient';

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

export type MatchState = Record<string, Match>;

export const bracketLoading = writable<boolean>(false);
export const bracketError = writable<string | null>(null);
export const hasSavedBracket = writable<boolean>(false);
export const showOverrideConfirm = writable<boolean>(false);

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

async function checkUserHasBracket(userId: string, emitError: boolean = false): Promise<boolean> {
	const { data, error } = await supabase
		.from('brackets')
		.select('id')
		.eq('user_id', userId)
		.single();

	if (error && error.code !== 'PGRST116') {
		if (emitError) {
			bracketError.set(error.message);
		} else {
			console.error('Failed to check if user has bracket', error);
		}
		return false;
	}

	return !!data;
}

async function loadBracketFromDatabase(userId: string): Promise<MatchState | null> {
	bracketLoading.set(true);

	const { data, error } = await supabase
		.from('brackets')
		.select('picks')
		.eq('user_id', userId)
		.single();

	bracketLoading.set(false);

	if (error) {
		if (error.code === 'PGRST116') {
			return null;
		}
		console.error('Failed to load bracket from database', error);
		return null;
	}

	const picks = data.picks as Record<string, string>;
	const matchState = createInitialMatches();

	for (const [matchId, tag] of Object.entries(picks)) {
		const match = matchState[matchId];
		if (match) {
			const winnerTeam =
				match.team1?.tag === tag ? match.team1 : match.team2?.tag === tag ? match.team2 : null;
			if (winnerTeam) {
				match.winner = winnerTeam;
				matchState[matchId] = match;
			}
		}
	}

	return matchState;
}

export async function saveBracketToDatabase(
	matchState: MatchState,
	requireConfirmation: boolean = false
): Promise<boolean> {
	bracketLoading.set(true);
	bracketError.set(null);

	const validation = validateBracket();
	if (!validation.valid) {
		bracketError.set(validation.errors.join(' '));
		bracketLoading.set(false);
		return false;
	}

	const exportData = exportBracketPicks();
	if (!exportData) {
		bracketError.set('Failed to export bracket data.');
		bracketLoading.set(false);
		return false;
	}

	const currentUser = get(user);
	if (!currentUser) {
		bracketError.set('You must be logged in to save your bracket.');
		bracketLoading.set(false);
		return false;
	}

	const hasBracket = await checkUserHasBracket(currentUser.id, true);

	if (hasBracket && !requireConfirmation) {
		showOverrideConfirm.set(true);
		bracketLoading.set(false);
		return false;
	}

	const { error: saveError } = await supabase.from('brackets').upsert(
		{
			user_id: currentUser.id,
			picks: exportData.picks,
			champion: exportData.champion
		},
		{
			onConflict: 'user_id'
		}
	);

	bracketLoading.set(false);

	if (saveError) {
		bracketError.set(saveError.message);
		return false;
	}

	hasSavedBracket.set(true);
	bracketError.set(null);
	return true;
}

export async function deleteBracketFromDatabase(): Promise<boolean> {
	bracketLoading.set(true);
	bracketError.set(null);

	const currentUser = get(user);
	if (!currentUser) {
		bracketError.set('You must be logged in to delete your bracket.');
		bracketLoading.set(false);
		return false;
	}

	const { error: deleteError } = await supabase
		.from('brackets')
		.delete()
		.eq('user_id', currentUser.id);

	bracketLoading.set(false);

	if (deleteError) {
		bracketError.set(deleteError.message);
		return false;
	}

	hasSavedBracket.set(false);
	bracketError.set(null);
	return true;
}

export const matches = writable<MatchState>(createInitialMatches());

let isLoggedInUnsubscribe: (() => void) | null = null;

export function initializeBracketStore() {
	if (isLoggedInUnsubscribe) {
		isLoggedInUnsubscribe();
	}

	isLoggedInUnsubscribe = isLoggedIn.subscribe(async (loggedIn) => {
		if (loggedIn) {
			const currentUser = get(user);
			if (currentUser) {
				const hasBracket = await checkUserHasBracket(currentUser.id);
				hasSavedBracket.set(hasBracket);

				if (hasBracket) {
					const savedBracket = await loadBracketFromDatabase(currentUser.id);
					if (savedBracket) {
						matches.set(savedBracket);
					}
				} else {
					matches.set(createInitialMatches());
				}
			}
		} else {
			hasSavedBracket.set(false);
			matches.set(createInitialMatches());
		}
	});
}

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

		return newState;
	});
}

export function resetBracket() {
	const newMatches = createInitialMatches();
	matches.set(newMatches);
	bracketError.set(null);
}

export const champion = derived(matches, ($matches) => $matches['GF']?.winner ?? null);

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

const ELIMINATION_MATCHES = new Set(['L1', 'L2', 'L3', 'L4', 'L5', 'L8', 'GF']);

export interface BracketPicksExport {
	picks: Record<string, string>;
	champion: string;
	timestamp: string;
}

export function validateBracket(): { valid: boolean; errors: string[] } {
	let currentState: MatchState | null = null;
	matches.subscribe((state) => (currentState = state))();

	const errors: string[] = [];

	if (!currentState) {
		errors.push('Bracket state is not available.');
		return { valid: false, errors };
	}

	const state = currentState as MatchState;
	const eliminatedTeams = new Set<string>();

	for (const matchId of MATCH_ORDER) {
		const match = state[matchId];

		if (!match.team1 || !match.team2) {
			errors.push(`Match ${matchId} is missing one or both teams.`);
			continue;
		}

		if (!match.winner) {
			errors.push(`Match ${matchId} does not have a winner selected.`);
			continue;
		}

		const winnerName = match.winner.name;
		if (winnerName !== match.team1.name && winnerName !== match.team2.name) {
			errors.push(`Match ${matchId} has an invalid winner.`);
			continue;
		}

		if (eliminatedTeams.has(winnerName)) {
			errors.push(`Match ${matchId} winner (${winnerName}) was already eliminated.`);
			continue;
		}

		const loser = match.winner.name === match.team1.name ? match.team2 : match.team1;
		if (ELIMINATION_MATCHES.has(matchId) && loser) {
			eliminatedTeams.add(loser.name);
		}
	}

	return { valid: errors.length === 0, errors };
}

export function exportBracketPicks(): BracketPicksExport | null {
	
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

	bracketError.set(null);

	return exportData;
}
