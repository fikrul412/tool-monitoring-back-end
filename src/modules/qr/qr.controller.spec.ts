import { describe, expect, it, vi } from 'vitest';
import { QrController } from './qr.controller.js';

describe('QrController', () => {
  const qr = {
    verify: vi.fn(),
    issue: vi.fn(),
    refresh: vi.fn(),
    status: vi.fn(),
  };
  const controller = new QrController(qr as never);

  it('passes the scanned token to the single POST verification flow', async () => {
    qr.verify.mockResolvedValue({ authenticated: true });
    await expect(controller.verify({ token: 'raw-qr-token' })).resolves.toEqual({ authenticated: true });
    expect(qr.verify).toHaveBeenCalledWith('raw-qr-token');
  });

  it('issues an action-bound replacement challenge for the signed-in user', async () => {
    qr.refresh.mockResolvedValue({ token: 'replacement' });
    const request = { user: { sub: 'student-1', role: 'STUDENT' } } as never;
    await expect(controller.refresh(request, { jti: 'old-jti' })).resolves.toEqual({ token: 'replacement' });
    expect(qr.refresh).toHaveBeenCalledWith('old-jti', 'student-1', 'STUDENT');
  });
});
