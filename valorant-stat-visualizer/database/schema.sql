-- Valorant Match Tracker Database Schema
-- Execute this SQL in your Supabase SQL Editor

-- Players table: stores unique player information
CREATE TABLE players (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL UNIQUE,
  tracker_id TEXT UNIQUE,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Teams table: stores team information
CREATE TABLE teams (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL UNIQUE,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Team memberships: many-to-many relationship between teams and players
CREATE TABLE team_members (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  team_id UUID REFERENCES teams(id) ON DELETE CASCADE,
  player_id UUID REFERENCES players(id) ON DELETE CASCADE,
  joined_at TIMESTAMP DEFAULT NOW(),
  UNIQUE(team_id, player_id)
);

-- Matches table: stores match metadata
CREATE TABLE matches (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  tracker_url TEXT NOT NULL UNIQUE,
  match_date TIMESTAMP,
  map TEXT,
  scraped_at TIMESTAMP DEFAULT NOW()
);

-- Match stats: stores individual player performance per match
CREATE TABLE match_stats (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  match_id UUID REFERENCES matches(id) ON DELETE CASCADE,
  player_id UUID REFERENCES players(id) ON DELETE CASCADE,
  team_side TEXT,
  agent TEXT NOT NULL,
  kills INTEGER NOT NULL,
  deaths INTEGER NOT NULL,
  assists INTEGER NOT NULL,
  acs INTEGER,
  headshot_percent DECIMAL,
  first_bloods INTEGER,
  plants INTEGER,
  defuses INTEGER,
  UNIQUE(match_id, player_id)
);

-- Create indexes for better query performance
CREATE INDEX idx_match_stats_player ON match_stats(player_id);
CREATE INDEX idx_match_stats_match ON match_stats(match_id);
CREATE INDEX idx_team_members_player ON team_members(player_id);
CREATE INDEX idx_team_members_team ON team_members(team_id);