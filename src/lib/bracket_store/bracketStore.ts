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

// Re-export database functions for backward compatibility
export {
	checkUserHasBracket,
	loadBracketFromDatabase,
	saveBracketToDatabase,
	deleteBracketFromDatabase
} from './bracketDatabase';

// UI State stores
export const bracketLoading = writable<boolean>(false);
export const bracketError = writable<string | null>(null);
export const hasSavedBracket = writable<boolean>(false);
export const showOverrideConfirm = writable<boolean>(false);

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

					hasSavedBracket.set(hasBracket);

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
				hasSavedBracket.set(false);
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

/**
 * Resets bracket to initial state with default teams.
 */
export function resetBracket() {
	matches.set(createInitialMatches());
	bracketError.set(null);
}

/**
 * Validates the bracket for completeness and consistency.
 * @returns Validation result with errors if any
 */
export function validateBracket(): { valid: boolean; errors: string[] } {
	const state = get(matches);
	const errors: string[] = [];
	const eliminatedTeams = new Set<string>();
	const teamPositions = new Map<string, Set<string>>(); // team name -> set of match IDs

	for (const matchId of MATCH_ORDER) {
		const match = state[matchId];

		// Check teams exist
		if (!match.team1 || !match.team2) {
			errors.push(`Match ${matchId} is missing one or both teams.`);
			continue;
		}

		// Track team positions
		if (match.team1) {
			if (!teamPositions.has(match.team1.name)) {
				teamPositions.set(match.team1.name, new Set());
			}
			teamPositions.get(match.team1.name)!.add(matchId);
		}
		if (match.team2) {
			if (!teamPositions.has(match.team2.name)) {
				teamPositions.set(match.team2.name, new Set());
			}
			teamPositions.get(match.team2.name)!.add(matchId);
		}

		// Check winner exists
		if (!match.winner) {
			errors.push(`Match ${matchId} does not have a winner selected.`);
			continue;
		}

		// Check winner is valid
		const winnerName = match.winner.name;
		if (winnerName !== match.team1.name && winnerName !== match.team2.name) {
			errors.push(`Match ${matchId} has an invalid winner.`);
			continue;
		}

		// Check winner not already eliminated
		if (eliminatedTeams.has(winnerName)) {
			errors.push(`Match ${matchId} winner (${winnerName}) was already eliminated.`);
			continue;
		}

		// Track eliminated teams
		const loser = match.winner.name === match.team1.name ? match.team2 : match.team1;
		if (ELIMINATION_MATCHES.has(matchId) && loser) {
			eliminatedTeams.add(loser.name);
		}

		// Check winner advances to next match
		if (match.nextMatchId && match.nextMatchSlot) {
			const nextMatch = state[match.nextMatchId];
			if (nextMatch) {
				const slotTeam = nextMatch[match.nextMatchSlot];
				if (!slotTeam || slotTeam.name !== winnerName) {
					errors.push(
						`Match ${matchId} winner (${winnerName}) does not advance to match ${match.nextMatchId}.`
					);
				}
			}
		}
	}

	// Check for teams appearing in multiple matches simultaneously
	for (const [teamName, matchIds] of teamPositions.entries()) {
		if (matchIds.size > 1) {
			errors.push(
				`Team ${teamName} appears in multiple matches: ${Array.from(matchIds).join(', ')}`
			);
		}
	}

	// Check champion consistency
	const champion = state['GF']?.winner;
	if (champion) {
		const championInFinal = teamPositions.get(champion.name);
		if (!championInFinal || !championInFinal.has('GF')) {
			errors.push(`Champion ${champion.name} is not in the Grand Final.`);
		}
	}

	return { valid: errors.length === 0, errors };
}

/**
 * Exports current bracket picks for storage.
 * @returns Export data or null if no champion selected
 */
export function exportBracketPicks(): BracketPicksExport | null {
	const state = get(matches);
	const picks: Record<BracketMatchId, string> = {} as Record<BracketMatchId, string>;

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

	return {
		picks,
		champion: championTeam.tag,
		timestamp: new Date().toISOString()
	};
}

/**
 * Saves current bracket to database.
 * @param requireConfirmation - Prompt before overwriting existing bracket
 * @returns true if saved successfully
 */
export async function saveBracket(requireConfirmation: boolean = false): Promise<boolean> {
	bracketLoading.set(true);
	bracketError.set(null);

	try {
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

		const result = await bracketDb.saveBracketToDatabase(exportData, requireConfirmation);

		if (result.hasExistingBracket) {
			showOverrideConfirm.set(true);
			bracketLoading.set(false);
			return false;
		}

		hasSavedBracket.set(true);
		bracketError.set(null);
		bracketLoading.set(false);
		return true;
	} catch (error) {
		bracketError.set(
			error instanceof Error
				? error.message
				: 'An unexpected error occurred while saving the bracket.'
		);
		bracketLoading.set(false);
		return false;
	}
}

/**
 * Deletes user's bracket from database.
 * @returns true if deleted successfully
 */
export async function deleteBracket(): Promise<boolean> {
	bracketLoading.set(true);
	bracketError.set(null);

	try {
		await bracketDb.deleteBracketFromDatabase();
		hasSavedBracket.set(false);
		bracketError.set(null);
		bracketLoading.set(false);
		return true;
	} catch (error) {
		bracketError.set(
			error instanceof Error
				? error.message
				: 'An unexpected error occurred while deleting the bracket.'
		);
		bracketLoading.set(false);
		return false;
	}
}
