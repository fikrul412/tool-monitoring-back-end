export interface AuthenticatedUser {
  sub: string;
  email: string;
  role: "STUDENT" | "LECTURER" | "ADMIN";
}