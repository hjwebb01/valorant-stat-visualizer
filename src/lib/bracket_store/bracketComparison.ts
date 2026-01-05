import type { Match, BracketMatchId } from './bracketTypes';
import { REFERENCE_WINNERS } from './bracketConstants';

// Prediction status for a match
export type PredictionStatus = 'correct' | 'incorrect' | 'pending';

/**
 * Determines the prediction status for a match
 * @param match - The match to evaluate
 * @returns Prediction status
 */
export function getPredictionStatus(match: Match): PredictionStatus {
	const actualWinner = REFERENCE_WINNERS[match.id];

	if (actualWinner === 'tbd') {
		return 'pending';
	}

	if (!match.winner) {
		return 'pending';
	}

	const userPickedTeam1 = match.team1?.name === match.winner.name;
	const userPickedTeam2 = match.team2?.name === match.winner.name;

	const actualIsTeam1 = actualWinner === match.team1?.tag;
	const actualIsTeam2 = actualWinner === match.team2?.tag;

	if ((userPickedTeam1 && actualIsTeam1) || (userPickedTeam2 && actualIsTeam2)) {
		return 'correct';
	}

	return 'incorrect';
}

/**
 * Gets the actual winning team for a match
 * @param match - The match to check
 * @returns The actual winning team, or null if match not played
 */
export function getActualWinner(match: Match): { name: string; tag: string } | null {
	const actualWinner = REFERENCE_WINNERS[match.id];

	if (actualWinner === 'tbd') {
		return null;
	}

	if (actualWinner === match.team1?.tag && match.team1) {
		return { name: match.team1.name, tag: match.team1.tag };
	}

	if (actualWinner === match.team2?.tag && match.team2) {
		return { name: match.team2.name, tag: match.team2.tag };
	}

	return null;
}

/**
 * Checks if a specific team was correctly predicted
 * @param match - The match to check
 * @param team - The team to check
 * @returns true if team was correctly predicted, false otherwise
 */
export function isTeamCorrectlyPredicted(match: Match, team: { name: string }): boolean {
	const status = getPredictionStatus(match);
	if (status !== 'correct') {
		return false;
	}

	return match.winner?.name === team.name;
}

/**
 * Checks if a specific team was incorrectly predicted
 * @param match - The match to check
 * @param team - The team to check
 * @returns true if team was incorrectly predicted, false otherwise
 */
export function isTeamIncorrectlyPredicted(match: Match, team: { name: string }): boolean {
	const status = getPredictionStatus(match);
	if (status !== 'incorrect') {
		return false;
	}

	return match.winner?.name === team.name;
}

/**
 * Calculates the user's bracket score
 * @param matches - All matches in the bracket
 * @returns Object with correct, incorrect, and pending counts
 */
export function calculateBracketScore(matches: Record<BracketMatchId, Match>): {
	correct: number;
	incorrect: number;
	pending: number;
	total: number;
	accuracy: number;
} {
	let correct = 0;
	let incorrect = 0;
	let pending = 0;

	for (const matchId in matches) {
		const status = getPredictionStatus(matches[matchId as BracketMatchId]);

		if (status === 'correct') correct++;
		else if (status === 'incorrect') incorrect++;
		else pending++;
	}

	const total = correct + incorrect;
	const accuracy = total > 0 ? (correct / total) * 100 : 0;

	return { correct, incorrect, pending, total, accuracy };
}
