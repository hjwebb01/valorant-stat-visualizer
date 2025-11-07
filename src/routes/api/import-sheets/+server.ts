import { json } from '@sveltejs/kit';
import { google } from 'googleapis';
import { supabaseAdmin } from '$lib/server/supabaseAdmin';
import {
  SHEET_ID_TEAMS,
  SHEET_ID_STATS,
  GOOGLE_SERVICE_KEY_PATH
} from '$env/static/private';


export async function POST() {
  console.log('🟢 Import route triggered');

  try {
    // 🔑 Auth
    const auth = new google.auth.GoogleAuth({
      keyFile: GOOGLE_SERVICE_KEY_PATH,
      scopes: ['https://www.googleapis.com/auth/spreadsheets.readonly']
    });
    const sheets = google.sheets({ version: 'v4', auth });

    //
    // 1️⃣ Import Teams Spreadsheet
    //
    const TEAMS_SHEET_ID = SHEET_ID_TEAMS;
    const teamsRes = await sheets.spreadsheets.values.get({
      spreadsheetId: TEAMS_SHEET_ID,
      range: `'teams'!A1:Z`
    });

    const teamRows = teamsRes.data.values ?? [];
    const teamHeaders = teamRows.shift();
    if (!teamHeaders) throw new Error('Teams sheet missing headers');

    const teamRecords = teamRows.map((r) =>
      Object.fromEntries(teamHeaders.map((h, i) => [h.trim().toLowerCase(), r[i]]))
    );

    console.log(`✅ Imported ${teamRecords.length} team members`);

    // Example: upsert into players and teams
    for (const row of teamRecords) {
      const playerName = row.player?.trim();
      const teamName = row.team?.trim();
      if (!playerName || !teamName) continue;

      // Upsert team
      const { data: teamData, error: teamErr } = await supabaseAdmin
        .from('teams')
        .upsert({ name: teamName })
        .select('id')
        .single();
      if (teamErr) throw teamErr;

      // Upsert player
      const { data: playerData, error: playerErr } = await supabaseAdmin
        .from('players')
        .upsert({ name: playerName })
        .select('id')
        .single();
      if (playerErr) throw playerErr;

      // Upsert team_membership
      await supabaseAdmin
        .from('team_members')
        .upsert({
          player_id: playerData.id,
          team_id: teamData.id
        });
    }

    //
    // 2️⃣ Import Player Stats Spreadsheet (multiple tabs)
    //
    const STATS_SHEET_ID = SHEET_ID_STATS;
    const meta = await sheets.spreadsheets.get({ spreadsheetId: STATS_SHEET_ID });
    const sheetTabs =
      meta.data.sheets?.map((s) => s.properties?.title).filter((t) => t && t.includes('Stats')) ?? [];

    console.log('📊 Found stat tabs:', sheetTabs);

    for (const tab of sheetTabs) {
      const res = await sheets.spreadsheets.values.get({
        spreadsheetId: STATS_SHEET_ID,
        range: `'${tab}'!A1:Z`
      });

      const rows = res.data.values ?? [];
      const headers = rows.shift();
      if (!headers) continue;

      const records = rows.map((r) =>
        Object.fromEntries(headers.map((h, i) => [h.trim().toLowerCase(), r[i]]))
      );

      console.log(`📈 ${tab}: ${records.length} rows`);

      // Upsert dataset entry
      const { data: dataset, error: datasetErr } = await supabaseAdmin
        .from('datasets')
        .upsert({
          label: tab,
          type: 'week',
          period_start: new Date(), // Replace with actual week start if present in sheet
          period_end: new Date(),
        })
        .select('id')
        .single();

      if (datasetErr) throw datasetErr;
      if (!dataset) {
        console.warn(`No dataset returned for tab ${tab}, skipping`);
        continue;
      }

      // Upsert each player’s stats
      for (const rec of records) {
        const playerName = rec.player?.trim();
        if (!playerName) continue;

        const { data: player } = await supabaseAdmin
          .from('players')
          .select('id')
          .eq('name', playerName)
          .maybeSingle();

        if (!player) continue; // skip unknown player

        await supabaseAdmin.from('player_stats').upsert({
          dataset_id: dataset.id,
          player_id: player.id,
          acs: Number(rec.acs ?? 0),
          kd: Number(rec.kd ?? 0),
          adr: Number(rec.adr ?? 0),
          games: Number(rec.games ?? 0),
          kills: Number(rec.kills ?? 0),
          deaths: Number(rec.deaths ?? 0),
          assists: Number(rec.assists ?? 0)
        });
      }
    }

    return json({ ok: true, message: 'All data imported successfully' });
  } catch (e: any) {
    console.error('❌ Import failed:', e);
    return json({ ok: false, error: e.message }, { status: 500 });
  }
}
