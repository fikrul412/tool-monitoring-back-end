
import { Injectable } from "@nestjs/common";
import { InjectDrizzle } from "@nestjs/drizzle";
import { eq, and } from "drizzle-orm";
import type { NodePgDatabase } from "drizzle-orm/node-postgres";
import { AuthProvider } from "../database/schema/enums.js";
import { authAccounts } from "../database/schema/auth.schema.js";
import type { User } from "../database/schema/identity.schema.js";
import { users } from "../database/schema/identity.schema.js";

import {
    emailVerificationTokens,
    passwordResetTokens,
    type NewEmailVerificationToken,
} from "../database/schema/auth.schema.js";

@Injectable()
export class AuthRepository {
    constructor(
        @InjectDrizzle()
        private readonly db: NodePgDatabase
    ) { }

    async createVerificationToken(data: NewEmailVerificationToken) {
        const [token] = await this.db
            .insert(emailVerificationTokens)
            .values(data)
            .returning();

        return token;
    }

    async findVerificationToken(tokenHash: string) {
        const [token] = await this.db
            .select()
            .from(emailVerificationTokens)
            .where(eq(emailVerificationTokens.tokenHash, tokenHash))
            .limit(1);

        return token ?? null;
    }

    async deleteVerificationToken(tokenHash: string) {
        const [token] = await this.db
            .delete(emailVerificationTokens)
            .where(eq(emailVerificationTokens.tokenHash, tokenHash))
            .returning();

        return token ?? null;
    }

    async consumeVerificationToken(tokenHash: string) {
        const [token] = await this.db
            .delete(emailVerificationTokens)
            .where(eq(emailVerificationTokens.tokenHash, tokenHash))
            .returning();

        return token ?? null;
    }

    async deleteUserVerificationTokens(userId: string) {
        return this.db
            .delete(emailVerificationTokens)
            .where(eq(emailVerificationTokens.userId, userId));
    }

    async findAuthAccount(provider: AuthProvider, providerAccountId: string) {
        const [account] = await this.db
            .select()
            .from(authAccounts)
            .where(
                and(
                    eq(authAccounts.provider, provider),
                    eq(authAccounts.providerAccountId, providerAccountId),
                ),
            )
            .limit(1);

        return account ?? null;
    }

    async deleteVerificationTokensByUserId(userId: string) {
        await this.db
            .delete(emailVerificationTokens)
            .where(eq(emailVerificationTokens.userId, userId));
    }

    async createPasswordResetToken(userId: string, tokenHash: string, expiresAt: Date) {
        await this.db.delete(passwordResetTokens).where(eq(passwordResetTokens.userId, userId));
        const [token] = await this.db.insert(passwordResetTokens).values({ userId, tokenHash, expiresAt }).returning();
        return token;
    }

    async findPasswordResetToken(tokenHash: string) {
        const [token] = await this.db.select().from(passwordResetTokens).where(eq(passwordResetTokens.tokenHash, tokenHash)).limit(1);
        return token ?? null;
    }

    async updatePasswordWithResetToken(tokenHash: string, passwordHash: string) {
        return this.db.transaction(async tx => {
            const [token] = await tx.delete(passwordResetTokens).where(eq(passwordResetTokens.tokenHash, tokenHash)).returning();
            if (!token || token.expiresAt < new Date()) return false;
            await tx.update(users).set({ passwordHash, updatedAt: new Date() }).where(eq(users.id, token.userId));
            return true;
        });
    }
}
