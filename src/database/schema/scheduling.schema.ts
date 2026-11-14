
import {
  pgTable,
  uuid,
  text,
  timestamp,
  primaryKey,
} from 'drizzle-orm/pg-core';

import { tools } from './equipment.schema.js';
import { students } from './identity.schema.js';
import { researches } from './research.schema.js';
import { scheduleLogTypeEnum, scheduleReviewStatusEnum } from './enums.js';

export const toolSchedules = pgTable(
  'tool_schedules',
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

    startTime: timestamp('start_time', {
      withTimezone: true,
    }).notNull(),

    endTime: timestamp('end_time', {
      withTimezone: true,
    }).notNull(),

    location: text('location'),

    description: text('description'),

    reviewStatus: scheduleReviewStatusEnum('review_status').default('PENDING').notNull(),

    createdAt: timestamp('created_at', {
      withTimezone: true,
    }).defaultNow().notNull(),
  },
);

export const toolScheduleLogs = pgTable(
  'tool_schedule_logs',
  {
    id: uuid('id').defaultRandom().primaryKey(),

    toolId: uuid('tool_id')
      .references(() => tools.id)
      .notNull(),

    studentId: uuid('student_id')
      .references(() => students.id)
      .notNull(),

    scheduleId: uuid('schedule_id')
      .references(() => toolSchedules.id),

    timeStart: timestamp('time_start', {
      withTimezone: true,
    }),

    timeEnd: timestamp('time_end', {
      withTimezone: true,
    }),

    type: scheduleLogTypeEnum('type').notNull(),

    description: text('description'),

    createdAt: timestamp('created_at', {
      withTimezone: true,
    }).defaultNow().notNull(),
  },
);

// Tool Schedules
export type ToolSchedule =
  typeof toolSchedules.$inferSelect;

export type NewToolSchedule =
  typeof toolSchedules.$inferInsert;

export type UpdateToolSchedule = Partial<
  Omit<NewToolSchedule, 'id' | 'createdAt'>
>;

// Tool Schedule Logs
export type ToolScheduleLog =
  typeof toolScheduleLogs.$inferSelect;

export type NewToolScheduleLog =
  typeof toolScheduleLogs.$inferInsert;
