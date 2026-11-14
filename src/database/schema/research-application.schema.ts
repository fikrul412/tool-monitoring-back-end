
import {
  pgTable,
  uuid,
  text,
  timestamp,
} from 'drizzle-orm/pg-core';

import { researches } from './research.schema.js';
import { researchStatusEnum } from './enums.js';
export const researchApplicationLogs = pgTable(
  'research_application_logs',
  {
    id: uuid('id').defaultRandom().primaryKey(),

    researchId: uuid('research_id')
      .references(() => researches.id)
      .notNull(),

    status: researchStatusEnum('status').notNull(),

    comments: text('comments'),

    createdAt: timestamp('created_at', {
      withTimezone: true,
    }).defaultNow().notNull(),

  },
);

// Research Application Logs
export type ResearchApplicationLog =
  typeof researchApplicationLogs.$inferSelect;

export type NewResearchApplicationLog =
  typeof researchApplicationLogs.$inferInsert;

export type UpdateResearchApplicationLog = Partial<
  Omit<NewResearchApplicationLog, 'id' | 'createdAt'>
>;
