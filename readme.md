# valorant-stat-visualizer — Preview

Visualize Valorant match data quickly. Import a tracker.gg match, save player stats to Supabase, and explore charts to find trends.

What it does
- Scrapes tracker.gg match pages (server-side) and extracts players, agents, and match metadata
- Stores normalized data in a Supabase Postgres schema
- Provides import UI and starter dashboards using Recharts

Tech stack
- Next.js 14+ (App Router) · TypeScript · Tailwind CSS
- Supabase (Postgres) · Cheerio · Recharts

Getting started (short)
- Copy environment variables into `.env.local`
- npm install && npm run dev
- Use the Import Match form to paste a tracker.gg match URL