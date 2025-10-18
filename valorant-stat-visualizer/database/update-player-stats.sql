-- Update script to add individual player stats and rank columns
-- Run this in Supabase SQL Editor AFTER creating the initial schema

-- Add individual player statistics columns
ALTER TABLE players ADD COLUMN IF NOT EXISTS total_matches INTEGER DEFAULT 0;
ALTER TABLE players ADD COLUMN IF NOT EXISTS total_kills INTEGER DEFAULT 0;
ALTER TABLE players ADD COLUMN IF NOT EXISTS total_deaths INTEGER DEFAULT 0;
ALTER TABLE players ADD COLUMN IF NOT EXISTS total_assists INTEGER DEFAULT 0;
ALTER TABLE players ADD COLUMN IF NOT EXISTS total_acs INTEGER DEFAULT 0;
ALTER TABLE players ADD COLUMN IF NOT EXISTS total_headshot_percent DECIMAL DEFAULT 0;
ALTER TABLE players ADD COLUMN IF NOT EXISTS total_first_bloods INTEGER DEFAULT 0;
ALTER TABLE players ADD COLUMN IF NOT EXISTS total_plants INTEGER DEFAULT 0;
ALTER TABLE players ADD COLUMN IF NOT EXISTS total_defuses INTEGER DEFAULT 0;

-- Add calculated averages
ALTER TABLE players ADD COLUMN IF NOT EXISTS avg_kd_ratio DECIMAL DEFAULT 0;
ALTER TABLE players ADD COLUMN IF NOT EXISTS avg_acs DECIMAL DEFAULT 0;
ALTER TABLE players ADD COLUMN IF NOT EXISTS avg_headshot_percent DECIMAL DEFAULT 0;

-- Add rank information
ALTER TABLE players ADD COLUMN IF NOT EXISTS current_rank TEXT;
ALTER TABLE players ADD COLUMN IF NOT EXISTS rank_rating INTEGER;
ALTER TABLE players ADD COLUMN IF NOT EXISTS peak_rank TEXT;
ALTER TABLE players ADD COLUMN IF NOT EXISTS peak_rank_rating INTEGER;

-- Add most played agent
ALTER TABLE players ADD COLUMN IF NOT EXISTS favorite_agent TEXT;

-- Add win/loss tracking
ALTER TABLE players ADD COLUMN IF NOT EXISTS wins INTEGER DEFAULT 0;
ALTER TABLE players ADD COLUMN IF NOT EXISTS losses INTEGER DEFAULT 0;
ALTER TABLE players ADD COLUMN IF NOT EXISTS win_rate DECIMAL DEFAULT 0;