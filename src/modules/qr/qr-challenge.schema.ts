import { index, jsonb, pgTable, text, timestamp, uuid } from 'drizzle-orm/pg-core';
import { users } from '../../database/schema/identity.schema.js';

export type QrPurpose = 'ATTENDANCE' | 'TOOL_BORROW' | 'TOOL_RETURN';
export type QrContext = Record<string, string | number | null>;

export const qrChallenges = pgTable('qr_challenges', {
  jti: uuid('jti').primaryKey(),
  userId: uuid('user_id').references(() => users.id, { onDelete: 'cascade' }).notNull(),
  role: text('role').notNull(),
  purpose: text('purpose').$type<QrPurpose>().notNull(),
  context: jsonb('context').$type<QrContext>().notNull(),
  expiresAt: timestamp('expires_at', { withTimezone: true }).notNull(),
  verifiedAt: timestamp('verified_at', { withTimezone: true }),
  consumedAt: timestamp('consumed_at', { withTimezone: true }),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
}, table => [index('qr_challenges_user_expiry_idx').on(table.userId, table.expiresAt)]);

export type QrChallenge = typeof qrChallenges.$inferSelect;
