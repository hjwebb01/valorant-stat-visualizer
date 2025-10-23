import {
  pgTable,
  serial,
  text,
  integer,
  doublePrecision,
  timestamp,
  uniqueIndex
} from "drizzle-orm/pg-core";

export const valorant_players = pgTable(
  "valorant_players",
  {
    id: serial("id").primaryKey(),

    player: text("player").notNull(),
    agents: text("agents").notNull(),
    games: integer("games").notNull(),
    gamesWon: integer("games_won").notNull(),
    gamesLost: integer("games_lost").notNull(),

    rounds: integer("rounds").notNull(),
    roundsWon: integer("rounds_won").notNull(),
    roundsLost: integer("rounds_lost").notNull(),

    acs: doublePrecision("acs").notNull(),
    kd: doublePrecision("kd").notNull(),

    kastPct: doublePrecision("kast_pct"), // nullable allowed
    adr: doublePrecision("adr").notNull(),

    kills: integer("kills").notNull(),
    kpg: doublePrecision("kpg").notNull(),
    kpr: doublePrecision("kpr").notNull(),

    deaths: integer("deaths").notNull(),
    dpg: doublePrecision("dpg").notNull(),
    dpr: doublePrecision("dpr").notNull(),

    assists: integer("assists").notNull(),
    apg: doublePrecision("apg").notNull(),
    apr: doublePrecision("apr").notNull(),

    fk: integer("fk").notNull(),
    fkpg: doublePrecision("fkpg").notNull(),
    fd: integer("fd").notNull(),
    fdpg: doublePrecision("fdpg").notNull(),

    hsPct: doublePrecision("hs_pct").notNull(),
    plants: integer("plants").notNull(),
    plantsPerGame: doublePrecision("plants_per_game").notNull(),
    defuses: integer("defuses").notNull(),
    defusesPerGame: doublePrecision("defuses_per_game").notNull(),

    econRating: doublePrecision("econ_rating").notNull(),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull()
  },
  (t) => ({
    // define indexes here using the table builder (t)
    playerUnique: uniqueIndex("valorant_players_player_idx").on(t.player)
  })
);
