import { Module } from '@nestjs/common';
import { AuthController } from './auth.controller.js';
import { AuthService } from './auth.service.js';
import { PasswordHashService } from './services/passwordhash.service.js';
import { IdentityRepository } from '../../repositories/identity.repository.js';
import { EmailVerificationService } from './services/emailverification.service.js';
import { EmailService } from './services/email.service.js';
import { AuthRepository } from '../../repositories/auth.repository.js';
import { PassportModule } from '@nestjs/passport';
import { jwtConstants } from './passport/jwt.constants.js';
import { JwtModule } from '@nestjs/jwt';
import { JwtStrategy } from './passport/jwt.strategy.js';
import { GoogleStrategy } from './passport/google.strategy.js';
import { GoogleAuthGuard } from '../../guards/google-auth.guard.js';
import { RefreshTokenService } from './services/refreshtoken.service.js';

@Module({
  imports:[
    PassportModule.register({ defaultStrategy: "jwt" }),
        JwtModule.register({
            secret: jwtConstants.secret,
            signOptions: {
                expiresIn: "12h",
            },
        }),
  ],
  controllers: [AuthController],
  providers: [
    AuthService, 
    PasswordHashService, 
    IdentityRepository, 
    EmailVerificationService,
    EmailService,
    AuthRepository,
    JwtStrategy,
    GoogleStrategy,
    GoogleAuthGuard,
    RefreshTokenService
  ]
})
export class AuthModule {}
