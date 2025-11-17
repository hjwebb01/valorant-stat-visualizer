import {
	pgTable,
	uuid,
	serial,
	text,
	timestamp,
	doublePrecision,
	integer,
	date,
	primaryKey
} from 'drizzle-orm/pg-core';

export const players = pgTable('players', {
	id: uuid('id').defaultRandom().primaryKey(),
	name: text('name').notNull().unique(),
	ign: text('ign'),
	region: text('region'),
	country: text('country'),
	createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull()
});

export const teams = pgTable('teams', {
	id: uuid('id').defaultRandom().primaryKey(),
	name: text('name').notNull().unique(),
	tag: text('tag'),
	org: text('org'),
	createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull()
});

export const teamMemberships = pgTable('team_memberships', {
	id: serial('id').primaryKey(),
	playerId: uuid('player_id')
		.notNull()
		.references(() => players.id),
	teamId: uuid('team_id')
		.notNull()
		.references(() => teams.id),
	joinedAt: date('joined_at').defaultNow(),
	leftAt: date('left_at')
});

export const events = pgTable('events', {
	id: uuid('id').defaultRandom().primaryKey(),
	name: text('name').notNull(),
	startDate: date('start_date'),
	endDate: date('end_date'),
	type: text('type').default('other'),
	season: text('season'),
	createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull()
});

export const datasets = pgTable('datasets', {
	id: uuid('id').defaultRandom().primaryKey(),
	eventId: uuid('event_id').references(() => events.id),
	label: text('label').notNull(),
	type: text('type').notNull(),
	periodStart: date('period_start').notNull(),
	periodEnd: date('period_end').notNull(),
	createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull()
});

export const playerStats = pgTable('player_stats', {
	id: serial('id').primaryKey(),
	datasetId: uuid('dataset_id')
		.notNull()
		.references(() => datasets.id),
	playerId: uuid('player_id')
		.notNull()
		.references(() => players.id),
	teamId: uuid('team_id').references(() => teams.id),
	acs: doublePrecision('acs'),
	kd: doublePrecision('kd'),
	adr: doublePrecision('adr'),
	kastPct: doublePrecision('kast_pct'),
	kills: integer('kills'),
	deaths: integer('deaths'),
	assists: integer('assists'),
	fk: integer('fk'),
	fd: integer('fd'),
	hsPct: doublePrecision('hs_pct'),
	econRating: doublePrecision('econ_rating'),
	createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull()
});
