
import { Injectable } from "@nestjs/common";
import { PassportStrategy } from "@nestjs/passport";
import { Strategy, Profile } from "passport-google-oauth20";

@Injectable()
export class GoogleStrategy extends PassportStrategy(
  Strategy,
  "google",
) {
  constructor() {
    super({
      clientID: process.env.GOOGLE_OAUTH2_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_OAUTH2_CLIENT_SECRET!,
      callbackURL: process.env.GOOGLE_OAUTH2_REDIRECT_URL!,
      scope: ["email", "profile"],
    });
  }

  async validate(
    accessToken: string,
    refreshToken: string,
    profile: Profile,
  ) {
    const email = profile.emails?.[0]?.value;

    return {
      provider: "GOOGLE" as const,
      providerAccountId: profile.id,
      email,
      emailVerified: profile._json.email_verified === true,
      name: profile.displayName,
      picture: profile.photos?.[0]?.value,
    };
  }
}
