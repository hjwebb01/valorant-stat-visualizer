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

- **players**: Stores unique player information with aggregated statistics and rank data
- **teams**: Stores team information
- **team_members**: Many-to-many relationship between teams and players
- **matches**: Stores match metadata (URL, date, map)
- **match_stats**: Stores individual player performance per match

## Player Statistics & Rank Fields

The `players` table now includes comprehensive statistics and ranking information:

### Aggregated Statistics
- `total_matches`: Total number of matches played
- `total_kills`, `total_deaths`, `total_assists`: Career totals
- `total_acs`: Total ACS (Average Combat Score)
- `total_headshot_percent`: Total headshot percentage
- `total_first_bloods`, `total_plants`, `total_defuses`: Special action totals

### Calculated Averages
- `avg_kd_ratio`: Average K/D ratio across all matches
- `avg_acs`: Average ACS across all matches
- `avg_headshot_percent`: Average headshot percentage

### Rank Information
- `current_rank`: Current Valorant rank (e.g., "Radiant", "Immortal 3")
- `rank_rating`: Current RR (Rank Rating) points
- `peak_rank`: Highest rank achieved
- `peak_rank_rating`: RR at peak rank

### Additional Data
- `favorite_agent`: Most played agent
- `wins`, `losses`: Win/loss record
- `win_rate`: Win percentage (calculated)

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