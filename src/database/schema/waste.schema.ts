
import {
  pgTable,
  uuid,
  varchar,
  text,
  timestamp,
  numeric,
  primaryKey,
  pgEnum,
  boolean,
  uniqueIndex,
} from 'drizzle-orm/pg-core';

import { researches } from './research.schema.js';
import { users } from './identity.schema.js';
import { researchClearanceReports } from './persuratan.schema.js';

export const wasteOptionTypeEnum = pgEnum('waste_option_type', ['CATEGORY', 'UNIT', 'PHASE', 'HANDLING']);

export const wasteOptions = pgTable('waste_options', {
  id: uuid('id').defaultRandom().primaryKey(),
  type: wasteOptionTypeEnum('type').notNull(),
  value: varchar('value', { length: 150 }).notNull(),
  active: boolean('active').default(true).notNull(),
  createdBy: uuid('created_by').references(() => users.id, { onDelete: 'set null' }),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
}, (table) => [uniqueIndex('waste_option_type_value_idx').on(table.type, table.value)]);

export const wastes = pgTable('wastes', {
  id: uuid('id').defaultRandom().primaryKey(),

  clearanceReportId: uuid('clearance_report_id').references(() => researchClearanceReports.id, { onDelete: 'cascade' }),

  name: varchar('name', { length: 255 }).notNull(),

  phase: varchar('phase', { length: 100 }).notNull(),

  quantity: numeric('quantity', {
    precision: 15,
    scale: 4,
  }).default('0').notNull(),

  unit: varchar('unit', { length: 50 }).notNull(),

  handling: varchar('handling', { length: 150 }).notNull(),

  description: text('description'),

  createdAt: timestamp('created_at', {
    withTimezone: true,
  }).defaultNow().notNull(),
});

export const researchWastes = pgTable(
  'research_wastes',
  {
    researchId: uuid('research_id')
      .references(() => researches.id)
      .notNull(),

    wasteId: uuid('waste_id')
      .references(() => wastes.id)
      .notNull(),
  },
  (table) => [
    primaryKey({
      columns: [table.researchId, table.wasteId],
    }),
  ],
);

// Wastes
export type Waste =
  typeof wastes.$inferSelect;

export type NewWaste =
  typeof wastes.$inferInsert;

export type UpdateWaste = Partial<
  Omit<NewWaste, 'id' | 'createdAt'>
>;

// Research Wastes
export type ResearchWaste =
  typeof researchWastes.$inferSelect;

export type NewResearchWaste =
  typeof researchWastes.$inferInsert;
