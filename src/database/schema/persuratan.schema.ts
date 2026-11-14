import { pgEnum, pgTable, text, timestamp, uuid } from 'drizzle-orm/pg-core';
import { researches } from './research.schema.js';
import { students } from './identity.schema.js';

export const letterTypeEnum = pgEnum('letter_type', ['LAB_ACCESS', 'LAB_CLEARANCE']);
export const letterStatusEnum = pgEnum('letter_status', ['SUBMITTED', 'RECEIVED', 'REJECTED']);

export const letterApplications = pgTable('letter_applications', {
  id: uuid('id').defaultRandom().primaryKey(),
  researchId: uuid('research_id').references(() => researches.id).notNull(),
  studentId: uuid('student_id').references(() => students.id).notNull(),
  type: letterTypeEnum('type').notNull(),
  status: letterStatusEnum('status').default('SUBMITTED').notNull(),
  reviewComments: text('review_comments'),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp('updated_at', { withTimezone: true }),
});

export type LetterApplication = typeof letterApplications.$inferSelect;
