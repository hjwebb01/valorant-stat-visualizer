// Bracket-related types for the tournament bracket system

// Match ID type - replaces all magic strings throughout the codebase
export type BracketMatchId =
	| 'U1'
	| 'U2'
	| 'U3'
	| 'U4'
	| 'U5'
	| 'U6'
	| 'U7'
	| 'L1'
	| 'L2'
	| 'L3'
	| 'L4'
	| 'L5'
	| 'L8'
	| 'GF';

// Team slot in next match
export type MatchSlot = 'team1' | 'team2';

// Team interface representing a tournament team
export interface Team {
	name: string;
	tag: string;
	seed: number;
}

// Match interface representing a single match in the bracket
export interface Match {
	id: BracketMatchId;
	team1: Team | null;
	team2: Team | null;
	winner: Team | null;
	nextMatchId: BracketMatchId | null;
	nextMatchSlot: MatchSlot | null;
	loserNextMatchId: BracketMatchId | null;
	loserNextMatchSlot: MatchSlot | null;
}

// Bracket state as a record mapping match IDs to Match objects
export type MatchState = Record<BracketMatchId, Match>;

// Export data structure for saving/loading brackets
export interface BracketPicksExport {
	picks: Record<BracketMatchId, string>;
	champion: string;
	timestamp: string;
}

// Validation result returned by validateBracket()
export interface BracketValidation {
	valid: boolean;
	errors: string[];
}
