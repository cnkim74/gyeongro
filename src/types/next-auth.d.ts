import type { DefaultSession } from "next-auth";

declare module "next-auth" {
  interface Session {
    supabaseAccessToken?: string;
    user: {
      id: string;
      phone?: string | null;
    } & DefaultSession["user"];
  }
}
