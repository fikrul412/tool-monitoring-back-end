export interface GoogleOAuthUser {
  provider: "GOOGLE";
  providerAccountId: string;
  email: string | undefined;
  emailVerified: boolean;
  name: string;
  picture?: string;
}