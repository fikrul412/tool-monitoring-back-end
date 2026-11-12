
import { Injectable } from "@nestjs/common";
import { randomBytes, createHash } from "node:crypto";

@Injectable()
export class EmailVerificationService {

    generateToken(): string {
        return randomBytes(32).toString("hex");
    }

    hashToken(token: string): string {
        return createHash("sha256")
            .update(token)
            .digest("hex");
    }

}
