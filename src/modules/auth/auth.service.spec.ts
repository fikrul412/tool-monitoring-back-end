import { Test, TestingModule } from '@nestjs/testing';
import { AuthService } from './auth.service.js';
import { IdentityRepository } from '../../repositories/identity.repository.js';
import { AuthRepository } from '../../repositories/auth.repository.js';
import { PasswordHashService } from './services/passwordhash.service.js';
import { EmailVerificationService } from './services/emailverification.service.js';
import { EmailService } from './services/email.service.js';
import { JwtService } from '@nestjs/jwt';

describe('AuthService', () => {
  let service: AuthService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [AuthService, { provide: IdentityRepository, useValue: {} }, { provide: AuthRepository, useValue: {} }, { provide: PasswordHashService, useValue: {} }, { provide: EmailVerificationService, useValue: {} }, { provide: EmailService, useValue: {} }, { provide: JwtService, useValue: {} }],
    }).compile();

    service = module.get<AuthService>(AuthService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
