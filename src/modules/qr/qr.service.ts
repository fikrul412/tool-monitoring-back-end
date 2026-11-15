import { Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { randomUUID } from 'node:crypto';
import { QrRepository } from './qr.repository.js';
import type { QrContext, QrPurpose } from './qr-challenge.schema.js';

type QrIdentity = { sub: string; role: string; jti: string; exp: number };
export type QrResult = { authenticated: boolean; pending?: boolean; userId?: string; role?: string; jti?: string; message?: string };

@Injectable()
export class QrService {
  constructor(private readonly jwt: JwtService, private readonly repository: QrRepository) {}

  async issue(userId: string, role: string, purpose: QrPurpose, context: QrContext) {
    const jti = randomUUID();
    const expiresAt = new Date(Date.now() + 5 * 60_000);
    await this.repository.deleteExpired(new Date(Date.now() - 24 * 60 * 60_000));
    const token = await this.jwt.signAsync({ sub: userId, role, jti }, { expiresIn: '5m' });
    await this.repository.create({ jti, userId, role, purpose, context, expiresAt });
    return { token, jti, expiresAt: expiresAt.toISOString() };
  }

  async refresh(jti: string, userId: string, role: string) {
    const challenge = await this.repository.find(jti, userId);
    if (!challenge || challenge.role !== role || challenge.verifiedAt || challenge.consumedAt) {
      throw new UnauthorizedException('QR session cannot be refreshed. Start a new request.');
    }
    const retired = await this.repository.retireForRefresh(jti, userId, new Date());
    if (!retired) throw new UnauthorizedException('QR session cannot be refreshed. Start a new request.');
    return this.issue(userId, role, challenge.purpose, challenge.context);
  }

  async verify(token: string): Promise<QrResult> {
    let payload: QrIdentity;
    try {
      payload = await this.jwt.verifyAsync<QrIdentity>(token);
    } catch {
      return { authenticated: false, message: 'QR token is invalid or expired.' };
    }

    if (!payload.sub || !payload.jti || !payload.role || !payload.exp) {
      return { authenticated: false, message: 'QR token is invalid or expired.' };
    }

    const marked = await this.repository.markVerified(payload.jti, payload.sub, new Date());
    if (!marked) return { authenticated: false, jti: payload.jti, message: 'QR token is invalid, expired, or already used.' };
    return { authenticated: true, userId: payload.sub, role: payload.role, jti: payload.jti };
  }

  async status(jti: string, userId: string): Promise<QrResult> {
    const challenge = await this.repository.find(jti, userId);
    if (!challenge) throw new UnauthorizedException('QR session is missing or belongs to another user.');
    if (challenge.consumedAt) return { authenticated: false, jti, message: 'QR session has already been used or refreshed.' };
    if (challenge.verifiedAt) return { authenticated: true, userId, role: challenge.role, jti };
    if (challenge.expiresAt <= new Date()) return { authenticated: false, jti, message: 'QR token expired.' };
    return { authenticated: false, pending: true, jti };
  }

  consumeVerification(jti: string, userId: string, purpose: QrPurpose, context: QrContext) {
    return this.repository.consume(jti, userId, purpose, context, new Date());
  }
}
