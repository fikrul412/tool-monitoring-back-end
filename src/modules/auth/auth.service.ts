import {
    Injectable,
    ConflictException,
    BadRequestException,
    UnauthorizedException
} from '@nestjs/common';
import { LoginUserLocalDto, RegisterUserLocalDto, ResendVerificationDto } from './dto/auth.dto.js';
import { IdentityRepository } from '../../repositories/identity.repository.js';
import { PasswordHashService } from './services/passwordhash.service.js';
import { EmailVerificationService } from './services/emailverification.service.js';
import { EmailService } from './services/email.service.js';
import { AuthRepository } from '../../repositories/auth.repository.js';
import { JwtService } from '@nestjs/jwt'; import "@nestjs/jwt"
import { GoogleOAuthUser } from './interfaces/google-oauth-user.interface.js';
import type { User } from '../../database/schema/identity.schema.js';

@Injectable()
export class AuthService {
    constructor(
        private readonly identityRepo: IdentityRepository,
        private readonly authRepo: AuthRepository,
        private readonly passwordHash: PasswordHashService,
        private readonly emailVerification: EmailVerificationService,
        private readonly emailService: EmailService,
        private readonly jwtService: JwtService
    ) { }

    async registerLocalStudent(dto: RegisterUserLocalDto) {
        const existingUser =
            await this.identityRepo.findUserByEmail(dto.email);

        if (existingUser) {
            throw new ConflictException("Email already exists");
        }

        const existingStudent =
            await this.identityRepo.findStudentByNim(dto.nim);

        if (existingStudent) {
            throw new ConflictException("NIM already exists");
        }

        const passwordHash =
            await this.passwordHash.hash(dto.password);

        const user = await this.identityRepo.createStudentAccount({
            email: dto.email,
            passwordHash,
            name: dto.name,
            nim: dto.nim,
            studyProgram: dto.studyProgram,
            whatsapp: dto.whatsapp,
            address: dto.address,
            status: "PENDING_VERIFICATION",
        });

        const token = this.emailVerification.generateToken();
        const tokenHash = this.emailVerification.hashToken(token);

        await this.authRepo.createVerificationToken({
            userId: user.id,
            tokenHash,
            expiresAt: new Date(Date.now() + 30 * 60 * 1000),
        });

        await this.emailService.sendVerificationEmail(
            dto.email,
            token,
        );

        return {
            message: "Registration successful. Please verify your email.",
        };
    }

    async verifyStudentEmail(token: string) {
        const tokenHash = this.emailVerification.hashToken(token);

        const verification =
            await this.authRepo.findVerificationToken(tokenHash);

        if (!verification) {
            throw new BadRequestException(
                "Invalid verification token",
            );
        }

        if (verification.expiresAt < new Date()) {
            await this.authRepo.deleteVerificationToken(tokenHash);

            throw new BadRequestException(
                "Verification token has expired",
            );
        }

        await this.identityRepo.activateStudentAccount(
            verification.userId,
            tokenHash,
        );

        return {
            message: "Email successfully verified",
        };
    }

    async loginLocalUser(dto: LoginUserLocalDto) {
        const user = await this.identityRepo.findUserByEmail(dto.email);

        if (!user || !user.passwordHash) {
            throw new UnauthorizedException("Invalid email or password");
        }

        if (user.status !== "ACTIVE") {
            throw new UnauthorizedException("Account is not active");
        }

        const isValid = await this.passwordHash.verify(
            dto.password,
            user.passwordHash,
        );

        if (!isValid) {
            throw new UnauthorizedException("Invalid email or password");
        }

        const accessToken = await this.jwtService.signAsync({
            sub: user.id,
            email: user.email,
            role: user.role,
        });

        const { passwordHash: _, ...safeUser } = user;

        return {
            accessToken,
            user: safeUser,
        };
    }

    async loginGoogleUser(googleUser: GoogleOAuthUser) {
        if (!googleUser.email || !googleUser.emailVerified) {
            throw new UnauthorizedException(
                "Google email is not verified.",
            );
        }

        const authAccount = await this.identityRepo.findGoogleAccount(
            googleUser.providerAccountId,
        );

        let user: User | null;

        if (authAccount) {
            user = await this.identityRepo.findUserById(
                authAccount.userId,
            );
        } else {
            user = await this.identityRepo.findUserByEmail(
                googleUser.email,
            );

            if (user) {
                await this.identityRepo.createGoogleAccountLink(
                    user.id,
                    googleUser.providerAccountId,
                );
            } else {
                user = await this.identityRepo.createGoogleUser({
                    email: googleUser.email,
                    role: "STUDENT",
                    status: "ACTIVE",
                    providerAccountId: googleUser.providerAccountId,
                    name: googleUser.name,
                });
            }
        }

        if (!user || user.status !== "ACTIVE") {
            throw new UnauthorizedException(
                "Account is not active.",
            );
        }

        const accessToken = await this.jwtService.signAsync({
            sub: user.id,
            email: user.email,
            role: user.role,
        });

        const { passwordHash: _, ...safeUser } = user;

        return {
            accessToken,
            user: safeUser,
        };
    }

    async resendStudentVerification(dto: ResendVerificationDto) {
        const response = {
            message: "If your account requires verification, a new verification email has been sent.",
        };

        const user = await this.identityRepo.findUserByEmail(dto.email);

        if (!user || user.status !== "PENDING_VERIFICATION") {
            return response;
        }

        await this.authRepo.deleteVerificationTokensByUserId(user.id);

        const token = this.emailVerification.generateToken();
        const tokenHash = this.emailVerification.hashToken(token);

        await this.authRepo.createVerificationToken({
            userId: user.id,
            tokenHash,
            expiresAt: new Date(Date.now() + 30 * 60 * 1000),
        });

        await this.emailService.sendVerificationEmail(
            dto.email,
            token,
        );

        return response;
    }

    async requestPasswordReset(email: string) {
        const response = { message: 'If an account exists for that email, a password reset link has been sent.' };
        const user = await this.identityRepo.findUserByEmail(email);
        if (!user || !user.passwordHash || user.status !== 'ACTIVE') return response;
        const token = this.emailVerification.generateToken();
        await this.authRepo.createPasswordResetToken(user.id, this.emailVerification.hashToken(token), new Date(Date.now() + 30 * 60 * 1000));
        await this.emailService.sendPasswordResetEmail(email, token);
        return response;
    }

    async resetPassword(token: string, password: string) {
        const tokenHash = this.emailVerification.hashToken(token);
        const existing = await this.authRepo.findPasswordResetToken(tokenHash);
        if (!existing || existing.expiresAt < new Date()) throw new BadRequestException('Password reset link is invalid or expired.');
        const passwordHash = await this.passwordHash.hash(password);
        const updated = await this.authRepo.updatePasswordWithResetToken(tokenHash, passwordHash);
        if (!updated) throw new BadRequestException('Password reset link is invalid or expired.');
        return { message: 'Password has been reset. You can now sign in.' };
    }
}
