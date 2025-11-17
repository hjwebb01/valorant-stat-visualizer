import { json } from '@sveltejs/kit';
import { google } from 'googleapis';
import { supabaseAdmin } from '$lib/server/supabaseAdmin';
import { SHEET_ID_TEAMS, SHEET_ID_STATS, GOOGLE_SERVICE_KEY_PATH } from '$env/static/private';

// ==========================================================
// Header normalization map
// ==========================================================
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

// ==========================================================
// Utility functions
// ==========================================================
const toNumber = (v: unknown, fallback = 0): number => {
	const n = typeof v === 'string' ? Number(v.replace(/[%\s,]+/g, '')) : Number(v);
	return Number.isFinite(n) ? n : fallback;
};

function parsePlayerCell(raw: string | undefined) {
	if (!raw) return '';
	return raw.replace(/\(.*?\)/g, '').trim();
}

// ==========================================================
// Database helpers
// ==========================================================
async function getOrCreatePlayer(name: string) {
	console.log(`🟩 [players] Upserting player: "${name}"`);
	const { data, error } = await supabaseAdmin
		.from('players')
		.upsert({ name }, { onConflict: 'name' })
		.select('id')
		.single();
	if (error) throw { context: 'players', details: error };
	return data!;
}

async function getOrCreateTeam(opts: { name: string; status?: string }) {
	console.log(`🟦 [teams] Upserting team: "${opts.name}" (${opts.status ?? 'active'})`);
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
	console.log(`🟨 [team_memberships] Linking player_id=${player_id} → team_id=${team_id}`);
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

// ==========================================================
// Record normalization
// ==========================================================
function normalizeStatsRecord(raw: Record<string, any>) {
	return {
		player: String(raw.player ?? '').trim(),
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

// ==========================================================
// Main Route
// ==========================================================
export async function POST() {
	console.log('🟢 Import route triggered');

	try {
		const auth = new google.auth.GoogleAuth({
			keyFile: GOOGLE_SERVICE_KEY_PATH,
			scopes: ['https://www.googleapis.com/auth/spreadsheets.readonly']
		});
		const sheets = google.sheets({ version: 'v4', auth });

		// ==========================================================
		// 1️⃣ TEAM IMPORT
		// ==========================================================
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
			console.log('ℹ️ Legend tab not found, defaulting all teams to "active".');
		}

		const teamsRes = await sheets.spreadsheets.values.get({
			spreadsheetId: TEAMS_SHEET_ID,
			range: `A1:Z`
		});
		const teamRows = (teamsRes.data.values ?? []).filter((r) => r?.[0] && r?.[1]);
		console.log(`✅ Parsed ${teamRows.length} team rows`);

		for (const row of teamRows) {
			const [abbrRaw, fullNameRaw, ...memberCells] = row;
			const tag = String(abbrRaw).trim().toUpperCase();
			const fullName = String(fullNameRaw).trim();
			if (!tag || !fullName) continue;

			const status = teamStatusMap.get(tag) ?? 'active';
			if (status === 'disbanded') {
				console.log(`⚪ Skipping disbanded team: ${fullName} (${tag})`);
				continue;
			}

			const team = await getOrCreateTeam({ name: fullName, status });
			for (const cell of memberCells) {
				if (!cell) continue;
				const name = parsePlayerCell(String(cell));
				if (!name) continue;
				const player = await getOrCreatePlayer(name);
				await upsertMembership(player.id, team.id);
			}
		}

		// ==========================================================
		// 2️⃣ PLAYER STATS IMPORT
		// ==========================================================
		const STATS_SHEET_ID = SHEET_ID_STATS;
		const meta = await sheets.spreadsheets.get({ spreadsheetId: STATS_SHEET_ID });
		const sheetTabs =
			meta.data.sheets
				?.filter((s) => !s.properties?.hidden)
				.map((s) => s.properties?.title)
				.filter((t): t is string => !!t && /^w\d+\s*stats$/i.test(t.trim())) ?? [];

		console.log('📊 Found stat tabs:', sheetTabs);

		for (const tab of sheetTabs) {
			console.log(`📘 Processing stats tab: "${tab}"`);
			const res = await sheets.spreadsheets.values.get({
				spreadsheetId: STATS_SHEET_ID,
				range: `'${tab}'!A1:ZZ`
			});

			const rawRows = res.data.values ?? [];
			const headers = rawRows.shift();
			if (!headers || headers.length === 0) {
				console.warn(`⚠️ No headers in tab "${tab}", skipping`);
				continue;
			}

			const normalizedRecords = rawRows.map((r) => {
				const obj: Record<string, any> = {};
				headers.forEach((h, i) => {
					const keyRaw = String(h ?? '')
						.trim()
						.toLowerCase();
					const key = STATS_HEADER_MAP[keyRaw] ?? keyRaw;
					obj[key] = r[i];
				});
				return normalizeStatsRecord(obj);
			});

			console.log(`📈 ${tab}: ${normalizedRecords.length} parsed rows`);
			const { start, end } = inferPeriodFromLabel(tab);

			const { data: dataset, error: datasetErr } = await supabaseAdmin
				.from('datasets')
				.upsert(
					{ label: tab, type: 'week', period_start: start, period_end: end },
					{ onConflict: 'label' }
				)
				.select('id')
				.single();
			if (datasetErr) throw { context: 'datasets', details: datasetErr };
			if (!dataset) {
				console.warn(`⚠️ No dataset returned for tab "${tab}", skipping`);
				continue;
			}

			for (const rec of normalizedRecords) {
				const playerName = rec.player;
				if (!playerName) continue;

				const player = await getOrCreatePlayer(playerName);
				const team_id = await resolvePlayerTeamId(player.id);

				// 🧹 remove non-schema fields before upsert
				const { player: _ignore, ...statFields } = rec;

				const payload = {
					dataset_id: dataset.id,
					player_id: player.id,
					team_id,
					...statFields
				};

				console.log(`🟢 [player_stats] Upserting stats for "${playerName}"`);
				const { error: psErr } = await supabaseAdmin
					.from('player_stats')
					.upsert(payload, { onConflict: 'dataset_id,player_id' });
				if (psErr) throw { context: 'player_stats', details: psErr };
			}
		}

		console.log('✅ Import complete!');
		return json({ ok: true, message: 'All data imported successfully' });
	} catch (e: any) {
		console.error('🔥 Fatal Import Failure:', JSON.stringify(e, null, 2));
		return json({ ok: false, error: e.message || e }, { status: 500 });
	}
}
