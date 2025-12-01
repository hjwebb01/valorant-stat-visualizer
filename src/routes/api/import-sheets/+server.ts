import { json } from '@sveltejs/kit';
import { google } from 'googleapis';
import { supabaseAdmin } from '$lib/server/supabaseAdmin';
import { SHEET_ID_TEAMS, SHEET_ID_STATS, GOOGLE_SERVICE_KEY_PATH } from '$env/static/private';

/* ==========================================================
   RANK MAP (color → tier)
   ========================================================== */
const RANK_COLOR_MAP: Record<string, string> = {
	'#f6b26b': 'Bronze 1',
	'#e69138': 'Bronze 2',
	'#b45f06': 'Bronze 3',
	'#d9d9d9': 'Silver 1',
	'#b7b7b7': 'Silver 2',
	'#999999': 'Silver 3',
	'#ffe599': 'Gold 1',
	'#ffd966': 'Gold 2',
	'#f1c232': 'Gold 3',
	'#a2c4c9': 'Platinum 1',
	'#76a5af': 'Platinum 2',
	'#45818e': 'Platinum 3',
	'#ffa2e4': 'Diamond 1',
	'#eaa0ff': 'Diamond 2',
	'#e175ff': 'Diamond 3',
	'#b6d7a8': 'Ascendant 1',
	'#93c47d': 'Ascendant 2',
	'#6aa84f': 'Ascendant 3',
	'#f4cccc': 'Immortal 0RR',
	'#ea9999': 'Immortal 100RR',
	'#e06666': 'Immortal 200RR',
	'#cc0000': 'Immortal 300RR',
	'#434343': 'Radiant 450RR'
};

// sort order
const RANK_ORDER: Record<string, number> = Object.fromEntries(
	Object.values(RANK_COLOR_MAP).map((label, i) => [label, i + 1])
);

/* ==========================================================
   HEADER NORMALIZATION
   ========================================================== */
const STATS_HEADER_MAP: Record<string, string> = {
	player: 'player',
	agent: 'agents',
	agents: 'agents',
	acs: 'acs',
	'k/d': 'kd',
	kd: 'kd',
	'kast%': 'kast_pct',
	kast: 'kast_pct',
	adr: 'adr',
	kills: 'kills',
	deaths: 'deaths',
	assists: 'assists',
	fk: 'fk',
	fd: 'fd',
	'hs%': 'hs_pct',
	'econ rating': 'econ_rating',
	econ_rating: 'econ_rating',
	'# games': 'games',
	games: 'games',
	'games won': 'games_won',
	'games lost': 'games_lost',
	'# rounds': 'rounds',
	rounds: 'rounds',
	'rounds won': 'rounds_won',
	'rounds lost': 'rounds_lost',
	kpg: 'kpg',
	kpr: 'kpr',
	dpg: 'dpg',
	dpr: 'dpr',
	apg: 'apg',
	apr: 'apr',
	fkpg: 'fkpg',
	fdpg: 'fdpg',
	plants: 'plants',
	'plants / game': 'plants_per_game',
	defuses: 'defuses',
	'defuses / game': 'defuses_per_game'
};

/* ==========================================================
   UTILITIES
   ========================================================== */
const toNumber = (v: unknown, fallback = 0): number => {
	const n = typeof v === 'string' ? Number(v.replace(/[%\s,]+/g, '')) : Number(v);
	return Number.isFinite(n) ? n : fallback;
};

/**
 * Robust bg-color extractor:
 * supports effectiveFormat + userEnteredFormat + backgroundColorStyle.rgbColor
 */
function extractBackgroundColor(cell: any) {
	return (
		cell?.effectiveFormat?.backgroundColor ??
		cell?.userEnteredFormat?.backgroundColor ??
		cell?.effectiveFormat?.backgroundColorStyle?.rgbColor ??
		cell?.userEnteredFormat?.backgroundColorStyle?.rgbColor ??
		null
	);
}

function rgbToHex(c?: { red?: number | null; green?: number | null; blue?: number | null }) {
	if (!c) return null;
	const r = Math.round((c.red ?? 1) * 255);
	const g = Math.round((c.green ?? 1) * 255);
	const b = Math.round((c.blue ?? 1) * 255);
	return `#${r.toString(16).padStart(2, '0')}${g
		.toString(16)
		.padStart(2, '0')}${b.toString(16).padStart(2, '0')}`.toLowerCase();
}

function parsePlayerCell(raw: string | undefined) {
	if (!raw) return '';
	return raw.replace(/\(.*?\)/g, '').trim();
}

/* ==========================================================
   DATABASE HELPERS
   ========================================================== */
async function getOrCreatePlayer(name: string) {
	const clean = parsePlayerCell(name);
	const { data, error } = await supabaseAdmin
		.from('players')
		.upsert({ name: clean }, { onConflict: 'name' })
		.select('id')
		.single();
	if (error) throw { context: 'players', details: error };
	return data!;
}

async function getOrCreateTeam(opts: { name: string; status?: string }) {
	const payload: Record<string, unknown> = { name: opts.name };
	if (opts.status) payload.status = opts.status;

	const { data, error } = await supabaseAdmin
		.from('teams')
		.upsert(payload, { onConflict: 'name' })
		.select('id')
		.single();
	if (error) throw { context: 'teams', details: error };
	return data!;
}

async function upsertMembership(player_id: string, team_id: string) {
	const { error } = await supabaseAdmin
		.from('team_memberships')
		.upsert({ player_id, team_id }, { onConflict: 'player_id,team_id' });
	if (error) throw { context: 'team_memberships', details: error };
}

async function resolvePlayerTeamId(player_id: string): Promise<string | null> {
	const { data, error } = await supabaseAdmin
		.from('team_memberships')
		.select('team_id')
		.eq('player_id', player_id)
		.limit(1);
	if (error) throw { context: 'resolvePlayerTeamId', details: error };
	return data?.[0]?.team_id ?? null;
}

/* ==========================================================
   NORMALIZERS
   ========================================================== */
function normalizeStatsRecord(raw: Record<string, any>) {
	return {
		player: String(raw.player ?? '').trim(),
		player_color: raw.player_color ?? null,
		agents: String(raw.agents ?? '').trim(),
		acs: toNumber(raw.acs),
		kd: toNumber(raw.kd),
		adr: toNumber(raw.adr),
		kast_pct: toNumber(raw.kast_pct),
		kills: toNumber(raw.kills),
		deaths: toNumber(raw.deaths),
		assists: toNumber(raw.assists),
		fk: toNumber(raw.fk),
		fd: toNumber(raw.fd),
		hs_pct: toNumber(raw.hs_pct),
		econ_rating: toNumber(raw.econ_rating),
		games: toNumber(raw.games),
		games_won: toNumber(raw.games_won),
		games_lost: toNumber(raw.games_lost),
		rounds: toNumber(raw.rounds),
		rounds_won: toNumber(raw.rounds_won),
		rounds_lost: toNumber(raw.rounds_lost),
		kpg: toNumber(raw.kpg),
		kpr: toNumber(raw.kpr),
		dpg: toNumber(raw.dpg),
		dpr: toNumber(raw.dpr),
		apg: toNumber(raw.apg),
		apr: toNumber(raw.apr),
		fkpg: toNumber(raw.fkpg),
		fdpg: toNumber(raw.fdpg),
		plants: toNumber(raw.plants),
		plants_per_game: toNumber(raw.plants_per_game),
		defuses: toNumber(raw.defuses),
		defuses_per_game: toNumber(raw.defuses_per_game)
	};
}

/* ==========================================================
   WEEK LABEL → DATES
   ========================================================== */
function inferPeriodFromLabel(label: string) {
	const m = label.match(/w(\d+)/i);
	if (!m) {
		const now = new Date();
		return { start: now, end: now };
	}
	const week = Number(m[1]);
	const base = new Date(new Date().getFullYear(), 0, 1);
	const start = new Date(base.getTime() + (week - 1) * 7 * 24 * 3600 * 1000);
	const end = new Date(base.getTime() + week * 7 * 24 * 3600 * 1000);
	return { start, end };
}

/* ==========================================================
   MAIN ROUTE
   ========================================================== */
export async function POST() {
	console.log('🟢 Import route triggered');

	try {
		const auth = new google.auth.GoogleAuth({
			keyFile: GOOGLE_SERVICE_KEY_PATH,
			scopes: ['https://www.googleapis.com/auth/spreadsheets.readonly']
		});
		const sheets = google.sheets({ version: 'v4', auth });

		/* ==========================================================
		   1️⃣ TEAM IMPORT
		   ========================================================== */
		const TEAMS_SHEET_ID = SHEET_ID_TEAMS;

		let teamStatusMap = new Map<string, string>();
		try {
			const legendRes = await sheets.spreadsheets.values.get({
				spreadsheetId: TEAMS_SHEET_ID,
				range: `'Legend'!A1:C`
			});
			const legendRows = legendRes.data.values ?? [];
			legendRows.shift();
			teamStatusMap = new Map(
				legendRows
					.filter((r) => r?.[0] && r?.[1])
					.map(([tag, status]) => [
						String(tag).trim().toUpperCase(),
						String(status).trim().toLowerCase()
					])
			);
			console.log('📘 Loaded team legend entries:', teamStatusMap.size);
		} catch {
			console.log('ℹ️ Legend tab not found—defaulting teams to active.');
		}

		const teamsRes = await sheets.spreadsheets.values.get({
			spreadsheetId: TEAMS_SHEET_ID,
			range: `A1:Z`
		});

		const teamRows = (teamsRes.data.values ?? []).filter((r) => r?.[0] && r?.[1]);

		for (const row of teamRows) {
			const [abbrRaw, fullNameRaw, ...memberCells] = row;
			const tag = String(abbrRaw).trim().toUpperCase();
			const fullName = String(fullNameRaw).trim();
			if (!tag || !fullName) continue;

			const status = teamStatusMap.get(tag) ?? 'active';
			if (status === 'disbanded') continue;

			const team = await getOrCreateTeam({ name: fullName, status });

			for (const cell of memberCells) {
				if (!cell) continue;

				const playerName = parsePlayerCell(String(cell));
				if (!playerName) continue;

				const player = await getOrCreatePlayer(playerName);
				await upsertMembership(player.id, team.id);
			}
		}

		/* ==========================================================
		   2️⃣ WEEKLY STATS IMPORT (NO RANKS HERE)
		   ========================================================== */
		const STATS_SHEET_ID = SHEET_ID_STATS;
		const meta = await sheets.spreadsheets.get({ spreadsheetId: STATS_SHEET_ID });

		const sheetTabs =
			meta.data.sheets
				?.map((s) => s.properties?.title)
				.filter((t): t is string => !!t && /^w\d+\s*stats$/i.test(t.trim()))
			?? [];

		for (const tab of sheetTabs) {
			const res = await sheets.spreadsheets.values.get({
				spreadsheetId: STATS_SHEET_ID,
				range: `'${tab}'!A1:ZZ`
			});

			const rows = res.data.values ?? [];
			const headers = rows.shift();
			if (!headers) continue;

			const normalizedRecords = rows.map((r) => {
				const obj: Record<string, any> = {};
				headers.forEach((h, i) => {
					const key = STATS_HEADER_MAP[String(h).trim().toLowerCase()] ?? h;
					// IMPORTANT: normalize player names here too
					if (key === 'player') obj[key] = parsePlayerCell(r[i] ? String(r[i]) : '');
					else obj[key] = r[i];
				});
				return normalizeStatsRecord(obj);
			});

			const { start, end } = inferPeriodFromLabel(tab);

			const { data: dataset } = await supabaseAdmin
				.from('datasets')
				.upsert(
					{ label: tab, type: 'week', period_start: start, period_end: end },
					{ onConflict: 'label' }
				)
				.select('id')
				.single();

			const datasetId = dataset?.id;
			if (!datasetId) throw new Error(`Failed to upsert dataset for tab: ${tab}`);

			console.log(`📚 Processing weekly tab: ${tab} — datasetId=${datasetId} rows=${normalizedRecords.length}`);

			// Quick diagnostics: how many records have no player after normalization?
			const totalRows = normalizedRecords.length;
			const missingPlayers = normalizedRecords.filter((r) => !r.player).length;
			const samplePlayers = normalizedRecords.slice(0, 10).map((r) => r.player || '(empty)');
			console.log(
				`🔎 Weekly tab diagnostics for ${tab}: total=${totalRows} missing_players=${missingPlayers} sample_first_10=${JSON.stringify(samplePlayers)}`
			);

			let upsertedCount = 0;

			for (const rec of normalizedRecords) {
				const playerName = rec.player;
				if (!playerName) continue;

				const player = await getOrCreatePlayer(playerName);

				const team_id = await resolvePlayerTeamId(player.id);
				const { player: _ignore, ...statFields } = rec;

				const { error: psError } = await supabaseAdmin
					.from('player_stats')
					.upsert(
						{
							dataset_id: datasetId,
							player_id: player.id,
							team_id,
							...statFields
						},
						{ onConflict: 'dataset_id,player_id' }
					);

				if (psError) {
					console.error(`⚠️ Weekly upsert error for ${playerName} in ${tab}:`, psError);
				} else {
					upsertedCount++;
				}
			}

			console.log(`✅ Weekly tab ${tab} upsert complete — upserted ${upsertedCount}/${normalizedRecords.length} rows`);
		}

		/* ==========================================================
		   3️⃣ ALL-TIME IMPORT (✓ RANKS HERE)
		   ========================================================== */
		console.log('📚 Processing all-time stats (rank source of truth)');

		const ALL_TAB = 'all-weeks';

		// Fetch formatting + values
		const allRes = await sheets.spreadsheets.get({
			spreadsheetId: STATS_SHEET_ID,
			ranges: [`'${ALL_TAB}'!A1:ZZ`],
			includeGridData: true
		});

		const grid = allRes.data.sheets?.[0]?.data?.[0]?.rowData ?? [];
		if (grid.length === 0) throw new Error('all-weeks sheet empty');

		const headerRow = grid[0]?.values ?? [];
		const headers = headerRow.map((c) => (c.effectiveValue?.stringValue ?? c.formattedValue ?? '').trim());

		// Find the real column index that maps to "player"
		let playerColIdx = headers.findIndex((h) => {
			const keyRaw = h.toLowerCase();
			return (STATS_HEADER_MAP[keyRaw] ?? keyRaw) === 'player';
		});
		if (playerColIdx < 0) playerColIdx = 0; // fallback to col A

		console.log('🧭 all-weeks playerColIdx =', playerColIdx, 'header =', headers[playerColIdx]);

		const normalizedRecords = grid.slice(1).map((row, rowIdx) => {
			const cells = row.values ?? [];
			const obj: Record<string, any> = {};

			headers.forEach((h, i) => {
				const keyRaw = h.toLowerCase();
				const key = STATS_HEADER_MAP[keyRaw] ?? keyRaw;

				const cell = cells[i];
				const value = cell?.effectiveValue?.stringValue ?? cell?.formattedValue ?? '';

				obj[key] = value;
			});

			// Extract rank color ONLY from the true "player" column
			const playerCell = cells[playerColIdx];
			const bg = extractBackgroundColor(playerCell);
			obj.player_color = rgbToHex(bg ?? undefined);

			// Normalize player name
			obj.player = parsePlayerCell(String(obj.player ?? ''));

			// Debug missing colors
			if (!obj.player_color) {
				const name = obj.player;
				console.log(`⚠️ Missing color for all-weeks row ${rowIdx + 2}: ${name}`);
			}

			return normalizeStatsRecord(obj);
		});

		// Create all-time dataset entry
		const { data: allTimeDataset } = await supabaseAdmin
			.from('datasets')
			.upsert(
				{
					label: 'all-time',
					type: 'alltime',
					period_start: new Date('2025-10-25T00:00:00Z'),
					period_end: new Date('2025-12-21T23:59:59Z')
				},
				{ onConflict: 'label' }
			)
			.select('id')
			.single();

		if (!allTimeDataset || !allTimeDataset.id) {
			throw new Error('Failed to upsert dataset for all-time');
		}
		const allTimeDatasetId = allTimeDataset.id;

		for (const rec of normalizedRecords) {
			const playerName = rec.player;
			if (!playerName) continue;

			const player = await getOrCreatePlayer(playerName);
			const team_id = await resolvePlayerTeamId(player.id);

			/* ==========================================================
			   🔥 GLOBAL RANK UPDATE — FROM ALL-TIME ONLY
			   ========================================================== */
			if (rec.player_color) {
				const rankLabel = RANK_COLOR_MAP[rec.player_color] ?? null;
				const rankValue = rankLabel ? RANK_ORDER[rankLabel] : null;

				if (!rankLabel) {
					console.log(`⚠️ Unmapped rank color ${rec.player_color} for ${playerName}`);
				}

				if (rankLabel) {
					await supabaseAdmin
						.from('players')
						.update({
							rank_label: rankLabel,
							rank_color: rec.player_color,
							rank_value: rankValue
						})
						.eq('id', player.id);
				}
			}

			const { player: _ignore, player_color: _ignore2, ...statFields } = rec;

			await supabaseAdmin
				.from('player_stats')
				.upsert(
					{
						dataset_id: allTimeDatasetId,
						player_id: player.id,
						team_id,
						...statFields
					},
					{ onConflict: 'dataset_id,player_id' }
				);
		}

		console.log('✅ Import (with ranks) completed successfully');
		return json({ ok: true });

	} catch (e: any) {
		console.error('🔥 Fatal Import Failure:', e);
		return json({ ok: false, error: e.message || e }, { status: 500 });
	}
}
