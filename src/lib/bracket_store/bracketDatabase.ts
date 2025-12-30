import { get } from 'svelte/store';
import { user } from './auth';
import { supabase } from '$lib/supabaseClient';
import type { Team, Match, MatchState, BracketPicksExport, BracketMatchId } from './bracketTypes';

// Re-export types for backward compatibility
export type { Team, Match, MatchState, BracketPicksExport, BracketMatchId };

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

	const picks = data.picks as Record<string, string>;
	const matchState = createInitialMatches();

	for (const [matchId, tag] of Object.entries(picks)) {
		const match = matchState[matchId as BracketMatchId];
		if (match) {
			const winnerTeam =
				match.team1?.tag === tag ? match.team1 : match.team2?.tag === tag ? match.team2 : null;
			if (winnerTeam) {
				const updatedMatch = { ...match, winner: winnerTeam };
				matchState[matchId as BracketMatchId] = updatedMatch;
			}
		}
	}

	return matchState;
}

export async function saveBracketToDatabase(
	exportData: BracketPicksExport,
	requireConfirmation: boolean = false
): Promise<{ success: boolean; hasExistingBracket: boolean }> {
	const currentUser = get(user);
	if (!currentUser) {
		throw new Error('You must be logged in to save your bracket.');
	}

	const hasBracket = await checkUserHasBracket(currentUser.id, true);

	if (hasBracket && !requireConfirmation) {
		return { success: false, hasExistingBracket: true };
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

	if (saveError) {
		throw new Error(saveError.message);
	}

	return { success: true, hasExistingBracket: false };
}

export async function deleteBracketFromDatabase(): Promise<boolean> {
	const currentUser = get(user);
	if (!currentUser) {
		throw new Error('You must be logged in to delete your bracket.');
	}

	const { error: deleteError } = await supabase
		.from('brackets')
		.delete()
		.eq('user_id', currentUser.id);

	if (deleteError) {
		throw new Error(deleteError.message);
	}

	return true;
}
