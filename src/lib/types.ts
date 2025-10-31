export type Align = 'left' | 'right';

export type Player = {
  id: number; dataset_id: string; player: string; agents: string;
  games: number; games_won: number; games_lost: number;
  rounds: number; rounds_won: number; rounds_lost: number;
  acs: number; kd: number; kast_pct: number | null; adr: number;
  kills: number; kpg: number; kpr: number;
  deaths: number; dpg: number; dpr: number;
  assists: number; apg: number; apr: number;
  fk: number; fkpg: number; fd: number; fdpg: number;
  hs_pct: number; plants: number; plants_per_game: number;
  defuses: number; defuses_per_game: number; econ_rating: number;
  created_at: string;
};

export type Key =
  | 'id' | 'dataset_id' | 'player' | 'agents'
  | 'games' | 'games_won' | 'games_lost'
  | 'rounds' | 'rounds_won' | 'rounds_lost'
  | 'acs' | 'kd' | 'kast_pct' | 'adr'
  | 'kills' | 'kpg' | 'kpr'
  | 'deaths' | 'dpg' | 'dpr'
  | 'assists' | 'apg' | 'apr'
  | 'fk' | 'fkpg' | 'fd' | 'fdpg'
  | 'hs_pct'
  | 'plants' | 'plants_per_game'
  | 'defuses' | 'defuses_per_game'
  | 'econ_rating'
  | 'created_at';

export type Col = {
  key: Key; label: string; align?: Align; hidden?: boolean; widthClass?: string; digits?: number; percent?: boolean;
};
