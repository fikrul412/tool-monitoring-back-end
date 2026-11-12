
import {
  pgTable,
  uuid,
  varchar,
  text,
  timestamp,
  uniqueIndex,
} from 'drizzle-orm/pg-core';

import { users } from './identity.schema.js';

export const labs = pgTable('labs', {
  id: uuid('id').defaultRandom().primaryKey(),

  name: varchar('name', { length: 255 }).notNull(),

  description: text('description'),

  location: text('location'),

  createdAt: timestamp('created_at', {
    withTimezone: true,
  }).defaultNow().notNull(),
});

export const labManagers = pgTable(
  'lab_managers',
  {
    id: uuid('id').defaultRandom().primaryKey(),

    labId: uuid('lab_id')
      .references(() => labs.id)
      .notNull(),

    userId: uuid('user_id')
      .references(() => users.id)
      .notNull(),
  },
  (table) => [
    uniqueIndex('lab_manager_unique_idx').on(
      table.labId,
      table.userId,
    ),
  ],
);

// Labs
export type Lab =
  typeof labs.$inferSelect;

export type NewLab =
  typeof labs.$inferInsert;

export type UpdateLab = Partial<
  Omit<NewLab, 'id' | 'createdAt'>
>;

// Lab Managers
export type LabManager =
  typeof labManagers.$inferSelect;

export type NewLabManager =
  typeof labManagers.$inferInsert;

export type UpdateLabManager = Partial<
  Omit<NewLabManager, 'id'>
>;