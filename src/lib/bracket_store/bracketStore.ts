import { writable, derived, get } from 'svelte/store';
import { user, isLoggedIn } from './auth';
import * as bracketDb from './bracketDatabase';
import type { Team, Match, MatchState, BracketPicksExport, BracketMatchId } from './bracketTypes';
import { MATCH_ORDER, ELIMINATION_MATCHES } from './bracketConstants';
import {
	createInitialMatches,
	updateNextMatch,
	clearTeamFromFuture,
	getWinnerLoser,
	applyWinnerToState
} from './bracketHelpers';

// Re-export types for external consumers
export type { Team, Match, MatchState, BracketPicksExport, BracketMatchId };

export { checkUserHasBracket, loadBracketFromDatabase } from './bracketDatabase';

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
		const operationId = ++currentOperationId;

		if (loggedIn) {
			const currentUser = get(user);
			if (currentUser) {
				try {
					const hasBracket = await bracketDb.checkUserHasBracket(currentUser.id);

					if (operationId !== currentOperationId) {
						return;
					}

					if (hasBracket) {
						const savedBracket = await bracketDb.loadBracketFromDatabase(
							currentUser.id,
							createInitialMatches
						);

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
		const newState = applyWinnerToState(state, matchId, team);

		if (newState === null) {
			bracketError.set(`Failed to set winner for match ${matchId}.`);
			return state;
		}

		success = true;
		bracketError.set(null);
		return newState;
	});

	return success;
}
