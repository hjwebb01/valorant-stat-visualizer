// src/lib/server/db/schema.ts
import {
  pgTable, serial, text, integer, doublePrecision, timestamp, uuid, uniqueIndex
} from "drizzle-orm/pg-core";

// Each import (week/season/manual) is a dataset
export const datasets = pgTable(
  "datasets",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    label: text("label").notNull(),              // e.g., "2025-W42", "S10"
    type: text("type").notNull(),                // 'week' | 'season' | 'manual' (enforced in SQL)
    periodStart: text("period_start").notNull(), // store as DATE in SQL; typed as string in TS
    periodEnd: text("period_end").notNull(),     // exclusive
    season: text("season"),                      // nullable, only for type='season'
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  }
);

// One row per player per dataset
export const player_stats = pgTable(
  "player_stats",
  {
    id: serial("id").primaryKey(),
    datasetId: uuid("dataset_id").notNull(), // FK in SQL migration
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
    kastPct: doublePrecision("kast_pct"),
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
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (t) => ({
    uniqPerDataset: uniqueIndex("player_stats_dataset_player_uniq").on(t.datasetId, t.player),
  })
);

// Views are created via SQL migrations; we do not define them here.
