
import {
    pgTable,
    uuid,
    varchar,
    text,
    timestamp,
    uniqueIndex,
    index,
} from "drizzle-orm/pg-core";

import { users } from "./identity.schema.js";
import { authProviderEnum } from "./enums.js";

export const authAccounts = pgTable(
    "auth_accounts",
    {
        id: uuid("id").defaultRandom().primaryKey(),

        userId: uuid("user_id")
            .references(() => users.id)
            .notNull(),

        provider: authProviderEnum("provider").notNull(),

        providerAccountId: varchar("provider_account_id", {
            length: 255,
        }).notNull(),

        createdAt: timestamp("created_at", {
            withTimezone: true,
        }).defaultNow().notNull(),
    },
    (table) => [
        uniqueIndex("auth_provider_account_idx").on(
            table.provider,
            table.providerAccountId,
        ),
    ],
);

export const emailVerificationTokens = pgTable(
    "email_verification_tokens",
    {
        id: uuid("id").defaultRandom().primaryKey(),

        userId: uuid("user_id")
            .references(() => users.id, { onDelete: "cascade" })
            .notNull(),

        tokenHash: text("token_hash").notNull(),

        expiresAt: timestamp("expires_at", {
            withTimezone: true,
        }).notNull(),

        createdAt: timestamp("created_at", {
            withTimezone: true,
        }).defaultNow().notNull(),
    },
    (table) => [
        uniqueIndex("email_verification_token_hash_idx")
            .on(table.tokenHash),

        index("email_verification_user_id_idx")
            .on(table.userId),
    ],
);

export const passwordResetTokens = pgTable('password_reset_tokens', {
    id: uuid('id').defaultRandom().primaryKey(),
    userId: uuid('user_id').references(() => users.id, { onDelete: 'cascade' }).notNull(),
    tokenHash: text('token_hash').notNull().unique(),
    expiresAt: timestamp('expires_at', { withTimezone: true }).notNull(),
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
}, (table) => [index('password_reset_user_id_idx').on(table.userId)]);

export const refreshTokens = pgTable("refresh_tokens", {
    id: uuid("id").defaultRandom().primaryKey(),

    userId: uuid("user_id")
        .references(() => users.id, { onDelete: "cascade" })
        .notNull(),

    tokenHash: text("token_hash").notNull().unique(),

    expiresAt: timestamp("expires_at", {
        withTimezone: true,
    }).notNull(),

    revokedAt: timestamp("revoked_at", {
        withTimezone: true,
    }),

    createdAt: timestamp("created_at", {
        withTimezone: true,
    }).defaultNow().notNull(),
});

export type RefreshToken = typeof refreshTokens.$inferSelect;
export type NewRefreshToken = typeof refreshTokens.$inferInsert;
export type AuthAccount = typeof authAccounts.$inferSelect;
export type NewAuthAccount = typeof authAccounts.$inferInsert;

export type EmailVerificationToken =
    typeof emailVerificationTokens.$inferSelect;

export type NewEmailVerificationToken =
    typeof emailVerificationTokens.$inferInsert;
