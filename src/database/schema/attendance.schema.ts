
import {
  pgTable,
  uuid,
  text,
  timestamp,
} from 'drizzle-orm/pg-core';

import { labs } from './laboratory.schema.js';
import { students, lecturers } from './identity.schema.js';
import { researches } from './research.schema.js';
import { attendanceStatusEnum } from './enums.js';

export const labAttendanceLogs = pgTable(
  'lab_attendance_logs',
  {
    id: uuid('id').defaultRandom().primaryKey(),

    labId: uuid('lab_id')
      .references(() => labs.id)
      .notNull(),

    studentId: uuid('student_id').references(() => students.id),

    lecturerId: uuid('lecturer_id').references(() => lecturers.id),

    researchId: uuid('research_id')
      .references(() => researches.id),

    activity: text('activity'),

    status: attendanceStatusEnum('status').notNull(),

    recordedAt: timestamp('recorded_at', {
      withTimezone: true,
    }).defaultNow().notNull(),

    // References the QR token/challenge.
    // A QR token table can be added later.
    qrTokenId: uuid('qr_token_id'),
  },
);

export type LabAttendanceLog =
  typeof labAttendanceLogs.$inferSelect;

export type NewLabAttendanceLog =
  typeof labAttendanceLogs.$inferInsert;

export type UpdateLabAttendanceLog = Partial<
  Omit<NewLabAttendanceLog, 'id' | 'recordedAt'>
>;
