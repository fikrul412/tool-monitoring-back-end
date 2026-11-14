
import {
  pgTable,
  uuid,
  text,
  timestamp,
  numeric,
} from 'drizzle-orm/pg-core';

import { tools } from './equipment.schema.js';
import { materials } from './materials.schema.js';
import { students } from './identity.schema.js';
import { researches } from './research.schema.js';

import {
  borrowingTypeEnum,
  borrowingStatusEnum,
  materialRequestStatusEnum,
} from './enums.js';

export const toolBorrowingLogs = pgTable(
  'tool_borrowing_logs',
  {
    id: uuid('id').defaultRandom().primaryKey(),

    toolId: uuid('tool_id')
      .references(() => tools.id)
      .notNull(),

    studentId: uuid('student_id')
      .references(() => students.id)
      .notNull(),

    researchId: uuid('research_id')
      .references(() => researches.id),

    time: timestamp('time', {
      withTimezone: true,
    }).defaultNow().notNull(),

    status: borrowingStatusEnum('status').notNull(),

    type: borrowingTypeEnum('type').notNull(),

    description: text('description'),
  },
);

export const materialBorrowingLogs = pgTable(
  'material_borrowing_logs',
  {
    id: uuid('id').defaultRandom().primaryKey(),

    materialId: uuid('material_id')
      .references(() => materials.id)
      .notNull(),

    studentId: uuid('student_id')
      .references(() => students.id)
      .notNull(),

    researchId: uuid('research_id')
      .references(() => researches.id),

    time: timestamp('time', {
      withTimezone: true,
    }).defaultNow().notNull(),

    quantity: numeric('quantity', {
      precision: 15,
      scale: 4,
    }).notNull(),

    approvalStatus: materialRequestStatusEnum('approval_status').default('PENDING').notNull(),

    reviewComments: text('review_comments'),

    type: borrowingTypeEnum('type').notNull(),

    description: text('description'),
  },
);

// Tool Borrowing Logs
export type ToolBorrowingLog =
  typeof toolBorrowingLogs.$inferSelect;

export type NewToolBorrowingLog =
  typeof toolBorrowingLogs.$inferInsert;

export type UpdateToolBorrowingLog = Partial<
  Omit<NewToolBorrowingLog, 'id' | 'time'>
>;


// Material Borrowing Logs
export type MaterialBorrowingLog =
  typeof materialBorrowingLogs.$inferSelect;

export type NewMaterialBorrowingLog =
  typeof materialBorrowingLogs.$inferInsert;

export type UpdateMaterialBorrowingLog = Partial<
  Omit<NewMaterialBorrowingLog, 'id' | 'time'>
>;
