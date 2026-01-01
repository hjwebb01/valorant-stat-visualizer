import { supabase } from '$lib/supabaseClient';
import { MATCH_ORDER } from './bracketConstants';
import { updateNextMatch, getWinnerLoser } from './bracketHelpers';
import type { MatchState, BracketMatchId } from './bracketTypes';

export async function checkUserHasBracket(
	userId: string,
	emitError: boolean = false
): Promise<boolean> {
	const { data, error } = await supabase
		.from('brackets')
		.select('id')
		.eq('user_id', userId)
		.single();

	if (error && error.code !== 'PGRST116') {
		if (emitError) {
			throw new Error(error.message);
		}
		console.error('Failed to check if user has bracket', error);
		return false;
	}

	return !!data;
}

export async function loadBracketFromDatabase(
	userId: string,
	createInitialMatches: () => MatchState
): Promise<MatchState | null> {
	const { data, error } = await supabase
		.from('brackets')
		.select('picks')
		.eq('user_id', userId)
		.single();

	if (error) {
		if (error.code === 'PGRST116') {
			return null;
		}
		console.error('Failed to load bracket from database', error);
		return null;
	}

	const picks = data.picks as Partial<Record<BracketMatchId, string>>;
	const orderedMatchIds = MATCH_ORDER.filter((matchId) => matchId in picks);
	let matchState = createInitialMatches();

	for (const matchId of orderedMatchIds) {
		const tag = picks[matchId];
		if (!tag) {
			continue;
		}

		const match = matchState[matchId];
		if (!match || !match.team1 || !match.team2) {
			continue;
		}

		const winnerTeam =
			match.team1.tag === tag ? match.team1 : match.team2.tag === tag ? match.team2 : null;
		if (!winnerTeam) {
			continue;
		}

		const { winner, loser } = getWinnerLoser(match, winnerTeam);
		if (!winner || !loser) {
			continue;
		}

		const updatedMatch = { ...match, winner };
		matchState = { ...matchState, [matchId]: updatedMatch };

		matchState = updateNextMatch(
			matchState,
			updatedMatch,
			winner,
			updatedMatch.nextMatchId,
			updatedMatch.nextMatchSlot
		);
		matchState = updateNextMatch(
			matchState,
			updatedMatch,
			loser,
			updatedMatch.loserNextMatchId,
			updatedMatch.loserNextMatchSlot
		);
	}

	return matchState;
}
