import { ValidationPipe } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import type { INestApplication } from '@nestjs/common';
import { afterAll, beforeAll, describe, expect, it, vi } from 'vitest';
import request from 'supertest';
import { JwtAuthGuard } from '../../guards/jwt-auth.guard.js';
import { AttendanceController } from './attendance.controller.js';
import { AttendanceRepository } from './attendance.repository.js';
import { IdentityController } from '../identity/identity.controller.js';
import { IdentityService } from '../identity/identity.service.js';

describe('Attendance and self-profile HTTP API', () => {
  let app: INestApplication;
  let role: 'STUDENT' | 'LECTURER' | 'ADMIN' = 'STUDENT';
  const attendance = {
    options: vi.fn().mockResolvedValue({ labs: [], researches: [], current: null }),
    request: vi.fn().mockResolvedValue({ result: 'QR_REQUIRED', type: 'ENTRY', qrPayload: 'challenge' }),
    confirm: vi.fn().mockImplementation((_userId, _role, dto) => Promise.resolve(dto.result === 'FAILED' ? { authenticated: false, changed: false } : { authenticated: true, changed: true })),
    recent: vi.fn().mockResolvedValue([]),
    logs: vi.fn().mockResolvedValue([]),
    summary: vi.fn().mockResolvedValue({ totalLogs: 0, entriesToday: 0, exitsToday: 0, currentlyInLabs: 0, recentLogs: [] }),
  };
  const identity = { updateMyProfile: vi.fn().mockResolvedValue({ id: 'user-1' }) };

  beforeAll(async () => {
    const module = await Test.createTestingModule({
      controllers: [AttendanceController, IdentityController],
      providers: [
        { provide: AttendanceRepository, useValue: attendance },
        { provide: IdentityService, useValue: identity },
      ],
    }).overrideGuard(JwtAuthGuard).useValue({
      canActivate(context) {
        context.switchToHttp().getRequest().user = { sub: 'user-1', email: 'user@example.test', role };
        return true;
      },
    }).compile();
    app = module.createNestApplication();
    app.useGlobalPipes(new ValidationPipe({ whitelist: true, forbidNonWhitelisted: true, transform: true }));
    await app.init();
  });

  afterAll(async () => app.close());

  it('serves attendance options and history', async () => {
    await request(app.getHttpServer()).get('/attendance/options').expect(200).expect({ labs: [], researches: [], current: null });
    await request(app.getHttpServer()).get('/attendance/history').expect(200).expect([]);
    expect(attendance.options).toHaveBeenCalledWith('user-1', 'STUDENT');
    expect(attendance.recent).toHaveBeenCalledWith('user-1', 'STUDENT');
  });

  it('creates a read-only QR challenge and confirms okay or failed scans', async () => {
    await request(app.getHttpServer()).post('/attendance/request').send({ labId: '11111111-1111-4111-8111-111111111111' }).expect(201);
    await request(app.getHttpServer()).post('/attendance/confirm').send({ labId: '11111111-1111-4111-8111-111111111111', type: 'ENTRY', result: 'FAILED' }).expect(201).expect({ authenticated: false, changed: false });
    await request(app.getHttpServer()).post('/attendance/confirm').send({ labId: '11111111-1111-4111-8111-111111111111', type: 'ENTRY', result: 'OK' }).expect(201).expect({ authenticated: true, changed: true });
    expect(attendance.request).toHaveBeenCalledWith('user-1', 'STUDENT', '11111111-1111-4111-8111-111111111111', undefined);
    expect(attendance.confirm).toHaveBeenCalledTimes(2);
  });

  it('protects admin attendance logs and summary by role', async () => {
    await request(app.getHttpServer()).get('/attendance/admin/logs').expect(403);
    role = 'ADMIN';
    await request(app.getHttpServer()).get('/attendance/admin/logs').expect(200).expect([]);
    await request(app.getHttpServer()).get('/attendance/admin/summary').expect(200).expect({ totalLogs: 0, entriesToday: 0, exitsToday: 0, currentlyInLabs: 0, recentLogs: [] });
  });

  it('accepts a self-profile update through the protected identity endpoint', async () => {
    role = 'LECTURER';
    await request(app.getHttpServer()).patch('/identity/me/profile').send({ name: 'Dr. Example', whatsapp: '08123456789' }).expect(200).expect({ id: 'user-1' });
    expect(identity.updateMyProfile).toHaveBeenCalledWith('user-1', 'LECTURER', { name: 'Dr. Example', whatsapp: '08123456789' });
  });
});
