import { Module } from '@nestjs/common';
import { QrService } from './qr.service.js';
import { QrController } from './qr.controller.js';
import { JwtModule } from '@nestjs/jwt';
import { jwtConstants } from '../auth/passport/jwt.constants.js';
import { QrRepository } from './qr.repository.js';

@Module({
  imports: [JwtModule.register({ secret: jwtConstants.secret })],
  providers: [QrService, QrRepository],
  controllers: [QrController],
  exports: [QrService],
})
export class QrModule {}
