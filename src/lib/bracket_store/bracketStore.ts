import { writable, derived, get } from 'svelte/store';
import { user, isLoggedIn } from './auth';
import * as bracketDb from './bracketDatabase';
import type { Team, Match, MatchState, BracketPicksExport, BracketMatchId } from './bracketTypes';
import { MATCH_ORDER, ELIMINATION_MATCHES } from './bracketConstants';
import {
	createInitialMatches,
	updateNextMatch,
	clearTeamFromFuture,
	getWinnerLoser
} from './bracketHelpers';

// Re-export types for external consumers
export type { Team, Match, MatchState, BracketPicksExport, BracketMatchId };

export {
	checkUserHasBracket,
	loadBracketFromDatabase
} from './bracketDatabase';

// UI State stores
export const bracketLoading = writable<boolean>(false);
export const bracketError = writable<string | null>(null);


// Main store
export const matches = writable<MatchState>(createInitialMatches());
export const champion = derived(matches, ($matches) => $matches['GF']?.winner ?? null);

// Store initialization
let currentOperationId = 0;
let isLoggedInUnsubscribe: (() => void) | null = null;

/**
 * Initializes the bracket store with database sync.
 * Should be called once on app startup.
 */
export function initializeBracketStore() {
	if (isLoggedInUnsubscribe) {
		isLoggedInUnsubscribe();
	}

	isLoggedInUnsubscribe = isLoggedIn.subscribe(async (loggedIn) => {
		// Generate unique operation ID for this login cycle
		const operationId = ++currentOperationId;

		if (loggedIn) {
			const currentUser = get(user);
			if (currentUser) {
				try {
					const hasBracket = await bracketDb.checkUserHasBracket(currentUser.id);

					// Check if this operation is still current
					if (operationId !== currentOperationId) {
						return; // Abandon this operation, a newer one started
					}

					

					if (hasBracket) {
						const savedBracket = await bracketDb.loadBracketFromDatabase(
							currentUser.id,
							createInitialMatches
						);

						// Check again before updating state
						if (operationId !== currentOperationId) {
							return;
						}

						if (savedBracket) {
							matches.set(savedBracket);
						}
					} else {
						if (operationId === currentOperationId) {
							matches.set(createInitialMatches());
						}
					}
				} catch (error) {
					if (operationId === currentOperationId) {
						bracketError.set(error instanceof Error ? error.message : 'Failed to load bracket');
					}
				}
			}
		} else {
			if (operationId === currentOperationId) {
				matches.set(createInitialMatches());
			}
		}
	});
}

/**
 * Sets the winner of a match and updates progression.
 * @param matchId - ID of the match to update
 * @param team - Team to set as winner
 * @returns true if successful, false on validation error
 */
export function setWinner(matchId: BracketMatchId, team: Team): boolean {
	let success = false;

	matches.update((state) => {
		const match = { ...state[matchId] };

		// Validate match has both teams
		if (!match.team1 || !match.team2) {
			bracketError.set(`Match ${matchId} is missing teams.`);
			return state;
		}

		// Validate the team is actually in this match
		const teamInMatch = match.team1.name === team.name || match.team2.name === team.name;

		if (!teamInMatch) {
			bracketError.set(`Team ${team.name} is not in match ${matchId}.`);
			return state;
		}

		const { winner, loser } = getWinnerLoser(match, team);
		if (!winner || !loser) {
			bracketError.set(`Failed to determine winner/loser for match ${matchId}.`);
			return state;
		}

		const oldWinner = match.winner;
		const oldLoser =
			match.loserNextMatchId && match.loserNextMatchSlot
				? (state[match.loserNextMatchId]?.[match.loserNextMatchSlot] ?? null)
				: null;

		match.winner = winner;
		let newState = { ...state, [matchId]: match };

		if (oldWinner && match.nextMatchId) {
			newState = clearTeamFromFuture(newState, oldWinner, match.nextMatchId);
		}
		if (oldLoser && oldLoser.name !== loser.name && match.loserNextMatchId) {
			newState = clearTeamFromFuture(newState, oldLoser, match.loserNextMatchId);
		}

		newState = updateNextMatch(newState, match, winner, match.nextMatchId, match.nextMatchSlot);
		newState = updateNextMatch(
			newState,
			match,
			loser,
			match.loserNextMatchId,
			match.loserNextMatchSlot
		);

		success = true;
		bracketError.set(null);
		return newState;
	});

	return success;
}

