CREATE TABLE "datasets" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"label" text NOT NULL,
	"type" text NOT NULL,
	"period_start" text NOT NULL,
	"period_end" text NOT NULL,
	"season" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "player_stats" (
	"id" serial PRIMARY KEY NOT NULL,
	"dataset_id" uuid NOT NULL,
	"player" text NOT NULL,
	"agents" text NOT NULL,
	"games" integer NOT NULL,
	"games_won" integer NOT NULL,
	"games_lost" integer NOT NULL,
	"rounds" integer NOT NULL,
	"rounds_won" integer NOT NULL,
	"rounds_lost" integer NOT NULL,
	"acs" double precision NOT NULL,
	"kd" double precision NOT NULL,
	"kast_pct" double precision,
	"adr" double precision NOT NULL,
	"kills" integer NOT NULL,
	"kpg" double precision NOT NULL,
	"kpr" double precision NOT NULL,
	"deaths" integer NOT NULL,
	"dpg" double precision NOT NULL,
	"dpr" double precision NOT NULL,
	"assists" integer NOT NULL,
	"apg" double precision NOT NULL,
	"apr" double precision NOT NULL,
	"fk" integer NOT NULL,
	"fkpg" double precision NOT NULL,
	"fd" integer NOT NULL,
	"fdpg" double precision NOT NULL,
	"hs_pct" double precision NOT NULL,
	"plants" integer NOT NULL,
	"plants_per_game" double precision NOT NULL,
	"defuses" integer NOT NULL,
	"defuses_per_game" double precision NOT NULL,
	"econ_rating" double precision NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX "player_stats_dataset_player_uniq" ON "player_stats" USING btree ("dataset_id","player");