import { Body, Controller, Post, Get, Query, Res, Req, UseGuards, HttpCode, HttpStatus, HttpException } from '@nestjs/common';
import { LoginUserLocalDto, RegisterUserLocalDto, ResendVerificationDto } from './dto/auth.dto.js';
import { AuthService } from './auth.service.js';
import { GoogleOAuthUser } from './interfaces/google-oauth-user.interface.js';
import { GoogleAuthGuard } from '../../guards/google-auth.guard.js';
import { JwtAuthGuard } from '../../guards/jwt-auth.guard.js';
import type { Response } from "express";
import { readFile } from "node:fs/promises";
import { join } from "node:path";

@Controller('auth')
export class AuthController {
    constructor(private readonly authService: AuthService) { }

    @Post('register/student')
    async registerUserLocalStudent(@Body() dto: RegisterUserLocalDto) {
        return this.authService.registerLocalStudent(dto)
    }

    @Post('login')
    async loginLocal(
        @Body() dto: LoginUserLocalDto,
        @Res({ passthrough: true }) res: Response,) {
        const result = await this.authService.loginLocalUser(dto);

        res.cookie("access_token", result.accessToken, {
            httpOnly: true,
            secure: process.env.NODE_ENV === "production",
            // The frontend and API are on different sites in production, so
            // browsers require SameSite=None for credentialed XHR requests.
            sameSite: process.env.NODE_ENV === "production" ? "none" : "lax",
            maxAge: 15 * 60 * 1000,
            path: "/",
        });

        return {
            user: result.user,
            accessToken: result.accessToken,
        };
    }

    @Get("verify-email")
    async verifyStudentEmail(
        @Query("token") token: string | undefined,
        @Res() res: Response,
    ) {
        const templatesPath = join(
            process.cwd(),
            "src",
            "modules",
            "auth",
            "templates",
        );

        const successHtml = await readFile(
            join(templatesPath, "verification-success.html"),
            "utf-8",
        );

        const failedHtml = await readFile(
            join(templatesPath, "verification-failed.html"),
            "utf-8",
        );

        if (!token) {
            return res
                .status(HttpStatus.BAD_REQUEST)
                .type("html")
                .send(failedHtml);
        }

        try {
            await this.authService.verifyStudentEmail(token);

            return res
                .status(HttpStatus.OK)
                .type("html")
                .send(successHtml);

        } catch (error) {
            if (error instanceof HttpException) {
                return res
                    .status(HttpStatus.BAD_REQUEST)
                    .type("html")
                    .send(failedHtml);
            }

            throw error;
        }
    }

    @Get('google')
    @UseGuards(GoogleAuthGuard)
    loginGoogle() { }

    @Get("google/callback")
    @UseGuards(GoogleAuthGuard)
    async oauthCallback(
        @Req() req: Request & { user: GoogleOAuthUser },
        @Res() res: Response,
    ) {
        const result = await this.authService.loginGoogleUser(req.user);

        res.cookie("access_token", result.accessToken, {
            httpOnly: true,
            secure: process.env.NODE_ENV === "production",
            sameSite: process.env.NODE_ENV === "production" ? "none" : "lax",
            maxAge: 15 * 60 * 1000,
            path: "/",
        });

        return res.redirect(`${process.env.FRONTEND_URL}/dashboard#access_token=${encodeURIComponent(result.accessToken)}`);
    }

    @Post("logout")
    @HttpCode(HttpStatus.OK)
    logout(@Res({ passthrough: true }) res: Response) {
        res.clearCookie("access_token", {
            httpOnly: true,
            secure: process.env.NODE_ENV === "production",
            sameSite: process.env.NODE_ENV === "production" ? "none" : "lax",
            path: "/",
        });

        return {
            message: "Successfully logged out.",
        };
    }
    @Post("resend-verification")
    @HttpCode(HttpStatus.OK)
    async resendVerification(
        @Body() dto: ResendVerificationDto,
    ) {
        return this.authService.resendStudentVerification(dto);
    }
}
