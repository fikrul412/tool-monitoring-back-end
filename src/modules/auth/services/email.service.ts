import { Injectable } from "@nestjs/common";
import nodemailer from "nodemailer";

@Injectable()
export class EmailService {
    private transporter = nodemailer.createTransport({
        host: process.env.SMTP_HOST,
        port: Number(process.env.SMTP_PORT),
        secure: false,
        auth: {
            user: process.env.SMTP_USER,
            pass: process.env.SMTP_PASS,
        },
    });

    async testConnection() {
        return this.transporter.verify();
    }

    async sendVerificationEmail(email: string, token: string) {
        const verificationUrl =
            `${process.env.MAIN_ENDPOINT}/auth/verify-email?token=${encodeURIComponent(token)}`;

        return this.transporter.sendMail({
            from: process.env.MAIL_FROM,
            to: email,
            subject: "Verify Your Tool Monitor Account",
            html: `
            <h2>Email Verification</h2>
            <p>Thank you for registering with Tool Monitor.</p>
            <p>Click the link below to verify your email:</p>
            <p>
                <a href="${verificationUrl}">
                    Verify Email
                </a>
            </p>
            <p>This link expires in 30 minutes.</p>
        `,
        });
    }
}