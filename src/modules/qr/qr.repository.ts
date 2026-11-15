import { Injectable, UnauthorizedException } from '@nestjs/common';
import { InjectDrizzle } from '@nestjs/drizzle';
import { and, eq, gt, isNull, lt } from 'drizzle-orm';
import type { NodePgDatabase } from 'drizzle-orm/node-postgres';
import { qrChallenges, type QrContext, type QrPurpose } from './qr-challenge.schema.js';

function sameContext(left: QrContext, right: QrContext) {
  const leftKeys = Object.keys(left).sort();
  const rightKeys = Object.keys(right).sort();
  return leftKeys.length === rightKeys.length && leftKeys.every((key, index) => key === rightKeys[index] && left[key] === right[key]);
}

@Injectable()
export class QrRepository {
  constructor(@InjectDrizzle() private readonly db: NodePgDatabase) {}

  async create(data: { jti: string; userId: string; role: string; purpose: QrPurpose; context: QrContext; expiresAt: Date }) {
    await this.db.insert(qrChallenges).values(data);
  }

  async find(jti: string, userId: string) {
    const [challenge] = await this.db.select().from(qrChallenges)
      .where(and(eq(qrChallenges.jti, jti), eq(qrChallenges.userId, userId))).limit(1);
    return challenge;
  }

  async markVerified(jti: string, userId: string, now: Date) {
    const [challenge] = await this.db.update(qrChallenges).set({ verifiedAt: now })
      .where(and(
        eq(qrChallenges.jti, jti),
        eq(qrChallenges.userId, userId),
        gt(qrChallenges.expiresAt, now),
        isNull(qrChallenges.verifiedAt),
        isNull(qrChallenges.consumedAt),
      )).returning({ jti: qrChallenges.jti });
    return challenge;
  }

  async retireForRefresh(jti: string, userId: string, now: Date) {
    const [retired] = await this.db.update(qrChallenges).set({ consumedAt: now })
      .where(and(
        eq(qrChallenges.jti, jti),
        eq(qrChallenges.userId, userId),
        isNull(qrChallenges.verifiedAt),
        isNull(qrChallenges.consumedAt),
      )).returning({ jti: qrChallenges.jti });
    return retired;
  }

  async consume(jti: string, userId: string, purpose: QrPurpose, context: QrContext, now: Date) {
    const challenge = await this.find(jti, userId);
    if (!challenge || challenge.purpose !== purpose || !sameContext(challenge.context, context) || !challenge.verifiedAt || challenge.consumedAt) {
      throw new UnauthorizedException('A valid QR verification for this action is required.');
    }

    const [consumed] = await this.db.update(qrChallenges).set({ consumedAt: now })
      .where(and(
        eq(qrChallenges.jti, jti),
        eq(qrChallenges.userId, userId),
        eq(qrChallenges.purpose, purpose),
        eq(qrChallenges.verifiedAt, challenge.verifiedAt),
        isNull(qrChallenges.consumedAt),
      )).returning({ jti: qrChallenges.jti });
    if (!consumed) throw new UnauthorizedException('This QR verification has already been used.');
  }

  async deleteExpired(before: Date) {
    await this.db.delete(qrChallenges).where(lt(qrChallenges.expiresAt, before));
  }
}
