import type { BracketMatchId, MatchSlot, Team, Match, MatchState } from './bracketTypes';
import { INITIAL_TEAMS } from './bracketConstants';

/**
 * Finds a team by seed number.
 * @param seed - The seed number to search for
 * @returns The team with matching seed, or null if not found
 */
export const getTeamBySeed = (seed: number): Team | null =>
	INITIAL_TEAMS.find((t) => t.seed === seed) ?? null;

/**
 * Creates a new match object with specified teams and progression.
 * @param id - Unique match identifier
 * @param team1 - First team in the match
 * @param team2 - Second team in the match
 * @param nextMatchId - Match the winner advances to
 * @param nextMatchSlot - Slot in next match for winner
 * @param loserNextMatchId - Match the loser falls to
 * @param loserNextMatchSlot - Slot in loser match for loser
 * @returns New Match object
 */
export const createMatch = (
	id: BracketMatchId,
	team1: Team | null,
	team2: Team | null,
	nextMatchId: BracketMatchId | null = null,
	nextMatchSlot: MatchSlot | null = null,
	loserNextMatchId: BracketMatchId | null = null,
	loserNextMatchSlot: MatchSlot | null = null
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

/**
 * Clears winner if the winning team is no longer in the match.
 * @param match - Current match state
 * @param newTeam - Team being added to the match
 * @returns Updated match with winner cleared if needed
 */
export const resetWinnerIfNeeded = (match: Match, newTeam: Team | null): Match => {
	if (!match.winner) return match;

	const winnerIsInMatch =
		(match.team1 && match.team1.name === newTeam?.name) ||
		(match.team2 && match.team2.name === newTeam?.name);

	if (!winnerIsInMatch) {
		return { ...match, winner: null };
	}

	return match;
};

/**
 * Determines winner and loser from a match for a given team.
 * @param match - The match to evaluate
 * @param team - The team to check
 * @returns Object with winner and loser teams, or nulls if team not in match
 */
export const getWinnerLoser = (
	match: Match,
	team: Team
): { winner: Team | null; loser: Team | null } => {
	const team1IsMatchTeam = match.team1?.name === team.name;
	const team2IsMatchTeam = match.team2?.name === team.name;

	if (!team1IsMatchTeam && !team2IsMatchTeam) {
		return { winner: null, loser: null };
	}

	const winner = team1IsMatchTeam ? match.team1 : match.team2;
	const loser = team1IsMatchTeam ? match.team2 : match.team1;

	return { winner, loser };
};

/**
 * Updates the next match with a team advancing from current match.
 * Returns new state to maintain immutability (fixes mutation bug).
 * @param currentState - Current bracket state
 * @param match - Match causing the update
 * @param newTeam - Team advancing to next match
 * @param nextMatchId - ID of next match
 * @param nextMatchSlot - Slot in next match for team
 * @returns New MatchState object
 */
export const updateNextMatch = (
	currentState: MatchState,
	_match: Match,
	newTeam: Team,
	nextMatchId: BracketMatchId | null,
	nextMatchSlot: MatchSlot | null
): MatchState => {
	if (!nextMatchId || !nextMatchSlot) return currentState;

	const nextMatch = { ...currentState[nextMatchId] };
	nextMatch[nextMatchSlot] = newTeam;

	const updatedNextMatch = resetWinnerIfNeeded(nextMatch, newTeam);

	// FIX: Return new state object instead of mutating
	return { ...currentState, [nextMatchId]: updatedNextMatch };
};

/**
 * Removes a team from all future matches starting from a match ID.
 * Used when a winner is changed and old winner must be cleared.
 * @param state - Current bracket state
 * @param teamToClear - Team to remove from future matches
 * @param startMatchId - Match ID to start clearing from
 * @returns New MatchState with team removed from future matches
 */
export const clearTeamFromFuture = (
	state: MatchState,
	teamToClear: Team | null,
	startMatchId: BracketMatchId
): MatchState => {
	if (!teamToClear) return state;

	const updatedState = { ...state };
	const queue: BracketMatchId[] = [startMatchId];
	const visited = new Set<BracketMatchId>();

	while (queue.length > 0) {
		const matchId = queue.shift()!;

		// FIX: Validate match exists instead of silently skipping
		if (!updatedState[matchId]) {
			console.warn(`clearTeamFromFuture: Match ${matchId} not found`);
			continue;
		}

		if (visited.has(matchId)) continue;

		const match = updatedState[matchId];
		visited.add(matchId);

		const team1InMatch = match.team1?.name === teamToClear.name;
		const team2InMatch = match.team2?.name === teamToClear.name;

		if (!team1InMatch && !team2InMatch) continue;

		const updatedMatch = {
			...match,
			...(team1InMatch && { team1: null }),
			...(team2InMatch && { team2: null }),
			...(match.winner?.name === teamToClear.name && { winner: null })
		};

		if (!updatedMatch.team1 || !updatedMatch.team2) {
			updatedMatch.winner = null;
		}

		updatedState[matchId] = updatedMatch;

		// Add next matches to queue
		if (match.nextMatchId) queue.push(match.nextMatchId);
		if (match.loserNextMatchId) queue.push(match.loserNextMatchId);
	}

	return updatedState;
};

/**
 * Creates initial match state for a new bracket.
 * Note: This stays here as it uses getTeamBySeed internally.
 * @returns MatchState with all matches initialized
 */
export const createInitialMatches = (): MatchState => ({
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
