import type { DefaultSession } from "next-auth";

declare module "next-auth" {
  interface Session {
    user: {
      id: string;
    } & DefaultSession["user"];
  }
}

// Token'et baerer kun bruger-id (uid). Den aktive butik ligger i en cookie og
// verificeres mod Membership (se lib/session), saa den ligger bevidst IKKE her.
declare module "next-auth/jwt" {
  interface JWT {
    uid?: string;
  }
}
