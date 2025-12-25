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
	{ name: 'LCQ Winners', tag: 'LCQW', seed: 8 }
];

function getTeamBySeed(seed: number): Team | null {
	return teams.find((t) => t.seed === seed) ?? null;
}

const createInitialMatches = (): MatchState => {
	const matchState: MatchState = {};

	matchState['U1'] = {
		id: 'U1',
		team1: getTeamBySeed(1),
		team2: getTeamBySeed(8),
		winner: null,
		nextMatchId: 'U5',
		nextMatchSlot: 'team1',
		loserNextMatchId: 'L1',
		loserNextMatchSlot: 'team1'
	};

	matchState['U2'] = {
		id: 'U2',
		team1: getTeamBySeed(4),
		team2: getTeamBySeed(5),
		winner: null,
		nextMatchId: 'U5',
		nextMatchSlot: 'team2',
		loserNextMatchId: 'L1',
		loserNextMatchSlot: 'team2'
	};

	matchState['U3'] = {
		id: 'U3',
		team1: getTeamBySeed(2),
		team2: getTeamBySeed(7),
		winner: null,
		nextMatchId: 'U6',
		nextMatchSlot: 'team1',
		loserNextMatchId: 'L2',
		loserNextMatchSlot: 'team1'
	};

	matchState['U4'] = {
		id: 'U4',
		team1: getTeamBySeed(3),
		team2: getTeamBySeed(6),
		winner: null,
		nextMatchId: 'U6',
		nextMatchSlot: 'team2',
		loserNextMatchId: 'L2',
		loserNextMatchSlot: 'team2'
	};

	matchState['U5'] = {
		id: 'U5',
		team1: null,
		team2: null,
		winner: null,
		nextMatchId: 'U7',
		nextMatchSlot: 'team1',
		loserNextMatchId: 'L5',
		loserNextMatchSlot: 'team2'
	};

	matchState['U6'] = {
		id: 'U6',
		team1: null,
		team2: null,
		winner: null,
		nextMatchId: 'U7',
		nextMatchSlot: 'team2',
		loserNextMatchId: 'L5',
		loserNextMatchSlot: 'team1'
	};

	matchState['U7'] = {
		id: 'U7',
		team1: null,
		team2: null,
		winner: null,
		nextMatchId: 'GF',
		nextMatchSlot: 'team1',
		loserNextMatchId: 'L8',
		loserNextMatchSlot: 'team1'
	};

	matchState['L1'] = {
		id: 'L1',
		team1: null,
		team2: null,
		winner: null,
		nextMatchId: 'L5',
		nextMatchSlot: 'team1',
		loserNextMatchId: null,
		loserNextMatchSlot: null
	};

	matchState['L2'] = {
		id: 'L2',
		team1: null,
		team2: null,
		winner: null,
		nextMatchId: 'L6',
		nextMatchSlot: 'team1',
		loserNextMatchId: null,
		loserNextMatchSlot: null
	};

	matchState['L5'] = {
		id: 'L5',
		team1: null,
		team2: null,
		winner: null,
		nextMatchId: 'L7',
		nextMatchSlot: 'team2',
		loserNextMatchId: null,
		loserNextMatchSlot: null
	};

	matchState['L6'] = {
		id: 'L6',
		team1: null,
		team2: null,
		winner: null,
		nextMatchId: 'L7',
		nextMatchSlot: 'team1',
		loserNextMatchId: null,
		loserNextMatchSlot: null
	};

	matchState['L7'] = {
		id: 'L7',
		team1: null,
		team2: null,
		winner: null,
		nextMatchId: 'L8',
		nextMatchSlot: 'team2',
		loserNextMatchId: null,
		loserNextMatchSlot: null
	};

	matchState['L8'] = {
		id: 'L8',
		team1: null,
		team2: null,
		winner: null,
		nextMatchId: 'GF',
		nextMatchSlot: 'team2',
		loserNextMatchId: null,
		loserNextMatchSlot: null
	};

	matchState['GF'] = {
		id: 'GF',
		team1: null,
		team2: null,
		winner: null,
		nextMatchId: null,
		nextMatchSlot: null,
		loserNextMatchId: null,
		loserNextMatchSlot: null
	};

	return matchState;
};

function loadFromStorage(): MatchState | null {
	if (!browser) return null;
	try {
		const stored = localStorage.getItem(STORAGE_KEY);
		if (stored) {
			const parsed = JSON.parse(stored) as MatchState;
			if (parsed && typeof parsed === 'object') {
				return parsed;
			}
		}
	} catch {}
	return null;
}

function saveToStorage(state: MatchState) {
	if (!browser) return;
	try {
		localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
	} catch {}
}

const initialMatches = createInitialMatches();
const storedMatches = loadFromStorage();

export const matches = writable<MatchState>(storedMatches ?? initialMatches);

export function setWinner(matchId: string, team: Team) {
	matches.update((state) => {
		const match = { ...state[matchId] };

		if (!match.team1 || !match.team2) return state;

		const winningTeam = match.team1.name === team.name ? match.team1 : match.team2;
		const losingTeam = match.team1.name === team.name ? match.team2 : match.team1;

		match.winner = winningTeam;

		const newState = { ...state, [matchId]: match };

		if (match.nextMatchId && match.nextMatchSlot) {
			const nextMatch = { ...newState[match.nextMatchId] };
			const slot = match.nextMatchSlot;
			if (nextMatch[slot] !== winningTeam) {
				nextMatch[slot] = winningTeam;
				newState[nextMatch.id] = nextMatch;

				if (
					nextMatch.winner &&
					(nextMatch.winner === nextMatch.team1 || nextMatch.winner === nextMatch.team2)
				) {
					if (nextMatch.team1 && nextMatch.team2) {
						const currentWinner =
							nextMatch.team1.name === nextMatch.winner.name ? nextMatch.team1 : nextMatch.team2;
						if (winningTeam.name !== currentWinner.name) {
							nextMatch.winner = null;
							newState[nextMatch.id] = nextMatch;
						}
					} else {
						nextMatch.winner = null;
						newState[nextMatch.id] = nextMatch;
					}
				}
			}
		}

		if (match.loserNextMatchId && match.loserNextMatchSlot) {
			const loserMatch = { ...newState[match.loserNextMatchId] };
			const slot = match.loserNextMatchSlot;
			if (loserMatch[slot] !== losingTeam) {
				loserMatch[slot] = losingTeam;
				newState[loserMatch.id] = loserMatch;

				if (
					loserMatch.winner &&
					(loserMatch.winner === loserMatch.team1 || loserMatch.winner === loserMatch.team2)
				) {
					if (loserMatch.team1 && loserMatch.team2) {
						const currentWinner =
							loserMatch.team1.name === loserMatch.winner.name
								? loserMatch.team1
								: loserMatch.team2;
						if (losingTeam.name !== currentWinner.name) {
							loserMatch.winner = null;
							newState[loserMatch.id] = loserMatch;
						}
					} else {
						loserMatch.winner = null;
						newState[loserMatch.id] = loserMatch;
					}
				}
			}
		}

		saveToStorage(newState);
		return newState;
	});
}

export function resetBracket() {
	const newMatches = createInitialMatches();
	matches.set(newMatches);
	saveToStorage(newMatches);
}

export const champion = derived(matches, ($matches) => {
	const grandFinal = $matches['GF'];
	return grandFinal?.winner ?? null;
});
