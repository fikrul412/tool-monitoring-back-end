import { Injectable } from "@nestjs/common";
import { randomBytes, scrypt } from "node:crypto";
import { promisify } from "node:util";

const scryptAsync = promisify(scrypt);

@Injectable()
export class PasswordHashService {

    async hash(password: string): Promise<string> {
        const salt = randomBytes(16).toString("hex");
        const key = await scryptAsync(password, salt, 64) as Buffer;
        return `${salt}:${key.toString("hex")}`;
    }

    async verify(password: string, storedHash: string): Promise<boolean> {
        const [salt, key] = storedHash.split(":");
        const derivedKey = await scryptAsync(password, salt, 64) as Buffer;
        return derivedKey.toString("hex") === key;
    }
}
