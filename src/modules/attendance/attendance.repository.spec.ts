import { describe, expect, it, vi } from 'vitest';
import { AttendanceRepository } from './attendance.repository.js';

describe('AttendanceRepository authentication behavior', () => {
  it('does not touch the database when QR authentication fails', async () => {
    const db = { select: vi.fn(), insert: vi.fn() };
    const repository = new AttendanceRepository(db as never);

    await expect(repository.confirm('student-1', 'STUDENT', {
      labId: 'lab-1',
      type: 'ENTRY',
      result: 'FAILED',
    })).resolves.toEqual({ authenticated: false, changed: false });

    expect(db.select).not.toHaveBeenCalled();
    expect(db.insert).not.toHaveBeenCalled();
  });

  it('writes exactly one entry log when authentication succeeds', async () => {
    const selectResults: unknown[][] = [[], [{ id: 'lab-1' }]];
    let selectIndex = 0;
    const insertedLog = { id: 'log-1', labId: 'lab-1', studentId: 'student-1', lecturerId: null, status: 'ENTRY' };
    const db = {
      select: vi.fn(() => ({
        from: () => ({
          where: () => ({
            orderBy: () => ({ limit: async () => selectResults[selectIndex++] }),
            limit: async () => selectResults[selectIndex++],
          }),
        }),
      })),
      insert: vi.fn(() => ({ values: () => ({ returning: async () => [insertedLog] }) })),
    };
    const repository = new AttendanceRepository(db as never);

    await expect(repository.confirm('student-1', 'STUDENT', {
      labId: 'lab-1',
      type: 'ENTRY',
      result: 'OK',
    })).resolves.toMatchObject({ authenticated: true, changed: true, log: insertedLog });

    expect(db.insert).toHaveBeenCalledTimes(1);
  });
});
