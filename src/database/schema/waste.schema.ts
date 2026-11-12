
import {
  pgTable,
  uuid,
  varchar,
  text,
  timestamp,
  numeric,
  primaryKey,
} from 'drizzle-orm/pg-core';

import { researches } from './research.schema.js';
import {
  wastePhaseEnum,
  wasteHandlingEnum,
} from './enums.js';

export const wastes = pgTable('wastes', {
  id: uuid('id').defaultRandom().primaryKey(),

  name: varchar('name', { length: 255 }).notNull(),

  phase: wastePhaseEnum('phase').notNull(),

  quantity: numeric('quantity', {
    precision: 15,
    scale: 4,
  }).default('0').notNull(),

  unit: varchar('unit', { length: 50 }).notNull(),

  handling: wasteHandlingEnum('handling').notNull(),

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