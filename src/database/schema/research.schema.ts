
import {
  pgTable,
  uuid,
  varchar,
  timestamp,
  date,
  primaryKey,
} from 'drizzle-orm/pg-core';

import { students, lecturers } from './identity.schema.js';
import { labs } from './laboratory.schema.js';
import { tools } from './equipment.schema.js';
import { researchStatusEnum } from './enums.js';

export const researches = pgTable('researches', {
  id: uuid('id').defaultRandom().primaryKey(),

  studentId: uuid('student_id')
    .references(() => students.id)
    .notNull(),

  title: varchar('title', { length: 255 }).notNull(),

  startDate: date('start_date'),

  endDate: date('end_date'),

  status: researchStatusEnum('status')
    .default('PENDING')
    .notNull(),

  createdAt: timestamp('created_at', {
    withTimezone: true,
  }).defaultNow().notNull(),

  updatedAt: timestamp('updated_at', {
    withTimezone: true,
  }),
});

export const researchSupervisors = pgTable(
  'research_supervisors',
  {
    researchId: uuid('research_id')
      .references(() => researches.id)
      .notNull(),

    lecturerId: uuid('lecturer_id')
      .references(() => lecturers.id)
      .notNull(),
  },
  (table) => [
    primaryKey({
      columns: [table.researchId, table.lecturerId],
    }),
  ],
);

export const researchLabs = pgTable(
  'research_labs',
  {
    researchId: uuid('research_id')
      .references(() => researches.id)
      .notNull(),

    labId: uuid('lab_id')
      .references(() => labs.id)
      .notNull(),
  },
  (table) => [
    primaryKey({
      columns: [table.researchId, table.labId],
    }),
  ],
);

export const researchTools = pgTable(
  'research_tools',
  {
    researchId: uuid('research_id')
      .references(() => researches.id)
      .notNull(),

    toolId: uuid('tool_id')
      .references(() => tools.id)
      .notNull(),
  },
  (table) => [
    primaryKey({
      columns: [table.researchId, table.toolId],
    }),
  ],
);

// Researches
export type Research =
  typeof researches.$inferSelect;

export type NewResearch =
  typeof researches.$inferInsert;

export type UpdateResearch = Partial<
  Omit<NewResearch, 'id' | 'createdAt'>
>;

// Research Supervisors
export type ResearchSupervisor =
  typeof researchSupervisors.$inferSelect;

export type NewResearchSupervisor =
  typeof researchSupervisors.$inferInsert;

// Research Labs
export type ResearchLab =
  typeof researchLabs.$inferSelect;

export type NewResearchLab =
  typeof researchLabs.$inferInsert;

// Research Tools
export type ResearchTool =
  typeof researchTools.$inferSelect;

export type NewResearchTool =
  typeof researchTools.$inferInsert;