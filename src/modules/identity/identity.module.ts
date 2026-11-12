import { Module } from '@nestjs/common';
import { IdentityController } from './identity.controller.js';
import { IdentityService } from './identity.service.js';
import { IdentityRepository } from '../../repositories/identity.repository.js';
import { PasswordHashService } from '../auth/services/passwordhash.service.js';

@Module({
  controllers: [IdentityController],
  providers: [IdentityService, IdentityRepository, PasswordHashService]
})
export class IdentityModule {}
