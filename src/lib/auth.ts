import NextAuth from "next-auth";
import Google from "next-auth/providers/google";
import Kakao from "next-auth/providers/kakao";
import type { OAuthConfig } from "next-auth/providers";
import { SupabaseAdapter } from "@auth/supabase-adapter";
import jwt from "jsonwebtoken";

interface NaverProfile {
  resultcode: string;
  message: string;
  response: {
    id: string;
    nickname?: string;
    name?: string;
    email?: string;
    profile_image?: string;
  };
}

const Naver: OAuthConfig<NaverProfile> = {
  id: "naver",
  name: "Naver",
  type: "oauth",
  authorization: {
    url: "https://nid.naver.com/oauth2.0/authorize",
    params: { response_type: "code" },
  },
  token: "https://nid.naver.com/oauth2.0/token",
  userinfo: "https://openapi.naver.com/v1/nid/me",
  clientId: process.env.NAVER_CLIENT_ID,
  clientSecret: process.env.NAVER_CLIENT_SECRET,
  profile(profile) {
    return {
      id: profile.response.id,
      name: profile.response.nickname ?? profile.response.name ?? null,
      email: profile.response.email ?? null,
      image: profile.response.profile_image ?? null,
    };
  },
};

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const hasSupabase = !!supabaseUrl && !!supabaseServiceKey;

export const { handlers, auth, signIn, signOut } = NextAuth({
  providers: [
    Google({
      clientId: process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET,
    }),
    Naver,
    Kakao({
      clientId: process.env.KAKAO_CLIENT_ID,
      clientSecret: process.env.KAKAO_CLIENT_SECRET,
    }),
  ],
  ...(hasSupabase
    ? {
        adapter: SupabaseAdapter({
          url: supabaseUrl!,
          secret: supabaseServiceKey!,
        }),
        session: { strategy: "database" as const },
      }
    : {
        session: { strategy: "jwt" as const },
      }),
  pages: {
    signIn: "/login",
  },
  callbacks: {
    async session({ session, user, token }) {
      const signingSecret = process.env.SUPABASE_JWT_SECRET;
      const userId = user?.id ?? (token?.sub as string | undefined);
      if (session.user && userId) {
        session.user.id = userId;
        if (signingSecret) {
          const payload = {
            aud: "authenticated",
            exp: Math.floor(new Date(session.expires).getTime() / 1000),
            sub: userId,
            email: session.user.email,
            role: "authenticated",
          };
          session.supabaseAccessToken = jwt.sign(payload, signingSecret);
        }
      }
      return session;
    },
  },
});
