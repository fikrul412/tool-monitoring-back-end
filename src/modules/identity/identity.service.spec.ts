import { Test, TestingModule } from '@nestjs/testing';
import { IdentityService } from './identity.service.js';
import { IdentityRepository } from '../../repositories/identity.repository.js';
import { PasswordHashService } from '../auth/services/passwordhash.service.js';

describe('IdentityService', () => {
  let service: IdentityService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [IdentityService, { provide: IdentityRepository, useValue: {} }, { provide: PasswordHashService, useValue: {} }],
    }).compile();

    service = module.get<IdentityService>(IdentityService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
