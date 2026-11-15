import { beforeEach, describe, expect, it, vi } from 'vitest';
import { QrService } from './qr.service.js';

describe('QrService', () => {
  const repository = {
    deleteExpired: vi.fn(),
    create: vi.fn(),
    find: vi.fn(),
    markVerified: vi.fn(),
    retireForRefresh: vi.fn(),
    consume: vi.fn(),
  };
  const jwt = {
    signAsync: vi.fn(),
    verifyAsync: vi.fn(),
  };
  const service = new QrService(jwt as never, repository as never);

  beforeEach(() => {
    vi.clearAllMocks();
    jwt.signAsync.mockResolvedValue('signed-qr-token');
  });

  it('issues a persisted QR challenge with a five-minute token', async () => {
    const issued = await service.issue('student-1', 'STUDENT', 'TOOL_BORROW', { toolId: 'tool-1', durationMinutes: 30 });
    expect(issued.token).toBe('signed-qr-token');
    expect(issued.jti).toMatch(/^[0-9a-f-]{36}$/i);
    expect(Date.parse(issued.expiresAt)).toBeGreaterThan(Date.now());
    expect(repository.create).toHaveBeenCalledWith(expect.objectContaining({
      jti: issued.jti,
      userId: 'student-1',
      purpose: 'TOOL_BORROW',
      context: { toolId: 'tool-1', durationMinutes: 30 },
    }));
  });

  it('accepts a valid token once and rejects replay', async () => {
    jwt.verifyAsync.mockResolvedValue({ sub: 'student-1', role: 'STUDENT', jti: 'challenge-1', exp: Math.floor(Date.now() / 1000) + 300 });
    repository.markVerified.mockResolvedValueOnce({ jti: 'challenge-1' }).mockResolvedValueOnce(undefined);

    await expect(service.verify('signed-token')).resolves.toMatchObject({ authenticated: true, jti: 'challenge-1' });
    await expect(service.verify('signed-token')).resolves.toMatchObject({ authenticated: false, jti: 'challenge-1' });
    expect(repository.markVerified).toHaveBeenCalledTimes(2);
  });

  it('returns a failed result for invalid tokens', async () => {
    jwt.verifyAsync.mockRejectedValue(new Error('invalid signature'));
    await expect(service.verify('bad-token')).resolves.toMatchObject({ authenticated: false });
    expect(repository.markVerified).not.toHaveBeenCalled();
  });

  it('reuses the saved purpose and context only when refreshing an unverified challenge', async () => {
    repository.find.mockResolvedValue({ role: 'STUDENT', purpose: 'TOOL_RETURN', context: { toolId: 'tool-1' }, verifiedAt: null, consumedAt: null });
    repository.retireForRefresh.mockResolvedValue({ jti: 'old-jti' });
    const refreshed = await service.refresh('old-jti', 'student-1', 'STUDENT');
    expect(repository.create).toHaveBeenCalledWith(expect.objectContaining({ purpose: 'TOOL_RETURN', context: { toolId: 'tool-1' } }));
    expect(refreshed.jti).not.toBe('old-jti');
  });
});
