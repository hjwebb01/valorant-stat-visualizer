ALTER TABLE "valorant_players" ALTER COLUMN "acs" SET DATA TYPE double precision;--> statement-breakpoint
ALTER TABLE "valorant_players" ALTER COLUMN "kd" SET DATA TYPE double precision;--> statement-breakpoint
ALTER TABLE "valorant_players" ALTER COLUMN "kast_pct" SET DATA TYPE double precision;--> statement-breakpoint
ALTER TABLE "valorant_players" ALTER COLUMN "adr" SET DATA TYPE double precision;--> statement-breakpoint
ALTER TABLE "valorant_players" ALTER COLUMN "kpg" SET DATA TYPE double precision;--> statement-breakpoint
ALTER TABLE "valorant_players" ALTER COLUMN "kpr" SET DATA TYPE double precision;--> statement-breakpoint
ALTER TABLE "valorant_players" ALTER COLUMN "dpg" SET DATA TYPE double precision;--> statement-breakpoint
ALTER TABLE "valorant_players" ALTER COLUMN "dpr" SET DATA TYPE double precision;--> statement-breakpoint
ALTER TABLE "valorant_players" ALTER COLUMN "apg" SET DATA TYPE double precision;--> statement-breakpoint
ALTER TABLE "valorant_players" ALTER COLUMN "apr" SET DATA TYPE double precision;--> statement-breakpoint
ALTER TABLE "valorant_players" ALTER COLUMN "fkpg" SET DATA TYPE double precision;--> statement-breakpoint
ALTER TABLE "valorant_players" ALTER COLUMN "fdpg" SET DATA TYPE double precision;--> statement-breakpoint
ALTER TABLE "valorant_players" ALTER COLUMN "hs_pct" SET DATA TYPE double precision;--> statement-breakpoint
ALTER TABLE "valorant_players" ALTER COLUMN "plants_per_game" SET DATA TYPE double precision;--> statement-breakpoint
ALTER TABLE "valorant_players" ALTER COLUMN "defuses_per_game" SET DATA TYPE double precision;--> statement-breakpoint
ALTER TABLE "valorant_players" ALTER COLUMN "econ_rating" SET DATA TYPE double precision;--> statement-breakpoint
CREATE UNIQUE INDEX "valorant_players_player_idx" ON "valorant_players" USING btree ("player");