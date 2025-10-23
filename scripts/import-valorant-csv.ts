import { createReadStream } from "fs";
import { parse } from "csv-parse";
import { Pool } from "pg";
import { z } from "zod";
import "dotenv/config";

const CSV_PATH = process.argv[2];
if (!CSV_PATH) {
  console.error("Usage: npm run import ./data/valorant.csv");
  process.exit(1);
}

// Header map: CSV -> DB column (snake_case)
const headerMap: Record<string, string> = {
  "PLAYER": "player",
  "AGENTS": "agents",
  "# GAMES": "games",
  "GAMES WON": "games_won",
  "GAMES LOST": "games_lost",
  "# ROUNDS": "rounds",
  "ROUNDS WON": "rounds_won",
  "ROUNDS LOST": "rounds_lost",
  "ACS": "acs",
  "K/D": "kd",
  "KAST": "kast_pct",
  "ADR": "adr",
  "KILLS": "kills",
  "KPG": "kpg",
  "KPR": "kpr",
  "DEATHS": "deaths",
  "DPG": "dpg",
  "DPR": "dpr",
  "ASSISTS": "assists",
  "APG": "apg",
  "APR": "apr",
  "FK": "fk",
  "FKPG": "fkpg",
  "FD": "fd",
  "FDPG": "fdpg",
  "HS%": "hs_pct",
  "PLANTS": "plants",
  "PLANTS / GAME": "plants_per_game",
  "DEFUSES": "defuses",
  "DEFUSES / GAME": "defuses_per_game",
  "ECON RATING": "econ_rating"
};

// Coercion helpers
const toNumber = (v: unknown) => {
  if (v === null || v === undefined) return null;
  let s = String(v).trim();
  if (!s) return null;
  if (s === "N/A") return null;
  // strip thousands commas if any
  s = s.replace(/,/g, "");
  const n = Number(s);
  return Number.isFinite(n) ? n : null;
};

const toPercentNumber = (v: unknown) => {
  if (v === null || v === undefined) return null;
  const s = String(v).trim();
  if (!s || s === "N/A") return null;
  const stripped = s.replace(/%/g, "").replace(/,/g, "");
  const n = Number(stripped);
  return Number.isFinite(n) ? n : null; // keep as 0..100
};

// Zod schema (nullable where N/A appears)
const Row = z.object({
  player: z.string(),
  agents: z.string(),
  games: z.coerce.number(),
  games_won: z.coerce.number(),
  games_lost: z.coerce.number(),
  rounds: z.coerce.number(),
  rounds_won: z.coerce.number(),
  rounds_lost: z.coerce.number(),
  acs: z.coerce.number(),
  kd: z.coerce.number(),
  kast_pct: z.number().nullable(),
  adr: z.coerce.number(),
  kills: z.coerce.number(),
  kpg: z.coerce.number(),
  kpr: z.coerce.number(),
  deaths: z.coerce.number(),
  dpg: z.coerce.number(),
  dpr: z.coerce.number(),
  assists: z.coerce.number(),
  apg: z.coerce.number(),
  apr: z.coerce.number(),
  fk: z.coerce.number(),
  fkpg: z.coerce.number(),
  fd: z.coerce.number(),
  fdpg: z.coerce.number(),
  hs_pct: z.coerce.number(),
  plants: z.coerce.number(),
  plants_per_game: z.coerce.number(),
  defuses: z.coerce.number(),
  defuses_per_game: z.coerce.number(),
  econ_rating: z.coerce.number()
});

type RowT = z.infer<typeof Row>;

function normalize(rec: Record<string,string>): RowT {
  const out: any = {};
  for (const [csvKey, value] of Object.entries(rec)) {
    const dbKey = headerMap[csvKey.trim()];
    if (!dbKey) continue;

    if (dbKey === "kast_pct" || dbKey === "hs_pct") {
      out[dbKey] = toPercentNumber(value);
    } else {
      const n = toNumber(value);
      // string fields:
      if (["player", "agents"].includes(dbKey)) {
        out[dbKey] = String(value ?? "").trim();
      } else {
        out[dbKey] = n;
      }
    }
  }
  // Zod coercion/validation will catch missing fields
  return Row.parse(out);
}

async function main() {
  const pool = new Pool({ connectionString: process.env.DATABASE_URL });
  const client = await pool.connect();
  try {
    await client.query("begin");

    const parser = createReadStream(CSV_PATH).pipe(
      parse({ columns: true, bom: true, trim: true })
    );

    const batch: RowT[] = [];
    const BATCH_SIZE = 1000;

    const flush = async () => {
      if (!batch.length) return;
      const cols = [
        "player","agents","games","games_won","games_lost",
        "rounds","rounds_won","rounds_lost",
        "acs","kd","kast_pct","adr",
        "kills","kpg","kpr",
        "deaths","dpg","dpr",
        "assists","apg","apr",
        "fk","fkpg","fd","fdpg",
        "hs_pct","plants","plants_per_game",
        "defuses","defuses_per_game","econ_rating"
      ];
      const placeholders: string[] = [];
      const values: any[] = [];
      batch.forEach((r, i) => {
        const base = i * cols.length;
        placeholders.push(
          `(${cols.map((_, j) => `$${base + j + 1}`).join(",")})`
        );
        values.push(
          r.player, r.agents, r.games, r.games_won, r.games_lost,
          r.rounds, r.rounds_won, r.rounds_lost,
          r.acs, r.kd, r.kast_pct, r.adr,
          r.kills, r.kpg, r.kpr,
          r.deaths, r.dpg, r.dpr,
          r.assists, r.apg, r.apr,
          r.fk, r.fkpg, r.fd, r.fdpg,
          r.hs_pct, r.plants, r.plants_per_game,
          r.defuses, r.defuses_per_game, r.econ_rating
        );
      });

      // If you created a UNIQUE index on (player), this upserts; otherwise it just inserts.
      const sql = `
        insert into public.valorant_players
        (${cols.join(",")})
        values ${placeholders.join(",")}
        on conflict (player) do update set
          agents = excluded.agents,
          games = excluded.games,
          games_won = excluded.games_won,
          games_lost = excluded.games_lost,
          rounds = excluded.rounds,
          rounds_won = excluded.rounds_won,
          rounds_lost = excluded.rounds_lost,
          acs = excluded.acs,
          kd = excluded.kd,
          kast_pct = excluded.kast_pct,
          adr = excluded.adr,
          kills = excluded.kills,
          kpg = excluded.kpg,
          kpr = excluded.kpr,
          deaths = excluded.deaths,
          dpg = excluded.dpg,
          dpr = excluded.dpr,
          assists = excluded.assists,
          apg = excluded.apg,
          apr = excluded.apr,
          fk = excluded.fk,
          fkpg = excluded.fkpg,
          fd = excluded.fd,
          fdpg = excluded.fdpg,
          hs_pct = excluded.hs_pct,
          plants = excluded.plants,
          plants_per_game = excluded.plants_per_game,
          defuses = excluded.defuses,
          defuses_per_game = excluded.defuses_per_game,
          econ_rating = excluded.econ_rating;
      `;
      await client.query(sql, values);
      batch.length = 0;
    };

    for await (const raw of parser) {
      const row = normalize(raw);
      batch.push(row);
      if (batch.length >= BATCH_SIZE) await flush();
    }
    await flush();

    await client.query("commit");
    console.log("CSV import complete ✅");
  } catch (e) {
    await client.query("rollback");
    console.error(e);
    process.exit(1);
  } finally {
    client.release();
    await pool.end();
  }
}

main();
