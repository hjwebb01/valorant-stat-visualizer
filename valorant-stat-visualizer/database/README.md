# Database Setup

This folder contains the database schema for the Valorant Match Tracker.

## Setup Instructions

1. **Create Supabase Project:**
   - Go to https://supabase.com and sign up/log in
   - Click "New Project"
   - Project name: `valorant-tracker`
   - Set a strong database password (save in password manager)
   - Wait for project initialization (~2 minutes)

2. **Execute Database Schema:**
   - Navigate to SQL Editor in Supabase dashboard
   - Create a new query
   - Copy and paste the contents of `schema.sql`
   - Click "Run" to execute

3. **Verify Tables:**
   - Navigate to Table Editor in Supabase dashboard
   - Confirm all 5 tables exist:
     - `players`
     - `teams`
     - `team_members`
     - `matches`
     - `match_stats`

4. **Save Credentials:**
   - Go to Project Settings → API
   - Copy the following values:
     - Project URL
     - `anon` public key
   - These will be needed for the Next.js environment variables

## Tables Overview

- **players**: Stores unique player information
- **teams**: Stores team information
- **team_members**: Many-to-many relationship between teams and players
- **matches**: Stores match metadata (URL, date, map)
- **match_stats**: Stores individual player performance per match

## Indexes

Performance indexes are created on:
- `match_stats.player_id`
- `match_stats.match_id`
- `team_members.player_id`
- `team_members.team_id`

## Constraints

- `UNIQUE` constraints prevent duplicate data
- `ON DELETE CASCADE` ensures related data is cleaned up
- Foreign key relationships maintain data integrity