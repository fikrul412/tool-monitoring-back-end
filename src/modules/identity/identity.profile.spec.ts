import { beforeEach, describe, expect, it, vi } from 'vitest';
import { IdentityService } from './identity.service.js';

describe('IdentityService own profile', () => {
  const repository = {
    updateOwnProfile: vi.fn(),
    findUserWithProfileById: vi.fn(),
  };
  const service = new IdentityService(repository as never, {} as never);

  beforeEach(() => vi.clearAllMocks());

  it.each(['STUDENT', 'LECTURER'])('updates only name and WhatsApp for %s', async role => {
    repository.updateOwnProfile.mockResolvedValue({ id: 'user-1' });
    repository.findUserWithProfileById.mockResolvedValue({ id: 'user-1', role, profile: { name: 'New Name', whatsapp: '0812' } });

    await expect(service.updateMyProfile('user-1', role, { name: '  New Name ', whatsapp: ' 0812 ' }))
      .resolves.toMatchObject({ profile: { name: 'New Name', whatsapp: '0812' } });
    expect(repository.updateOwnProfile).toHaveBeenCalledWith('user-1', role, { name: 'New Name', whatsapp: '0812' });
  });

  it('normalizes omitted WhatsApp to null', async () => {
    repository.updateOwnProfile.mockResolvedValue({ id: 'user-1' });
    repository.findUserWithProfileById.mockResolvedValue({ id: 'user-1', role: 'STUDENT' });
    await service.updateMyProfile('user-1', 'STUDENT', { name: 'A Name' });
    expect(repository.updateOwnProfile).toHaveBeenCalledWith('user-1', 'STUDENT', { name: 'A Name', whatsapp: null });
  });

  it('rejects admin profile edits', async () => {
    await expect(service.updateMyProfile('admin-1', 'ADMIN', { name: 'Admin' })).rejects.toThrow();
    expect(repository.updateOwnProfile).not.toHaveBeenCalled();
  });
});
