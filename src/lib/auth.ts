import NextAuth from "next-auth";
import Google from "next-auth/providers/google";
import Kakao from "next-auth/providers/kakao";
import Credentials from "next-auth/providers/credentials";
import type { OAuthConfig } from "next-auth/providers";
import { SupabaseAdapter } from "@auth/supabase-adapter";
import { createClient } from "@supabase/supabase-js";
import bcrypt from "bcryptjs";
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

const credentialsProvider = Credentials({
  id: "credentials",
  name: "Email",
  credentials: {
    email: { label: "Email", type: "email" },
    password: { label: "Password", type: "password" },
  },
  async authorize(creds) {
    const email = (creds?.email ?? "").toString().trim().toLowerCase();
    const password = (creds?.password ?? "").toString();
    if (!email || !password) return null;
    if (!supabaseUrl || !supabaseServiceKey) return null;

    const sb = createClient(supabaseUrl, supabaseServiceKey, {
      db: { schema: "next_auth" },
      auth: { persistSession: false },
    });

    const { data: user } = await sb
      .from("users")
      .select("id, email, name, image, password_hash, custom_image, nickname, avatar_preset")
      .eq("email", email)
      .maybeSingle();

    if (!user || !user.password_hash) return null;
    const ok = await bcrypt.compare(password, user.password_hash);
    if (!ok) return null;

    return {
      id: user.id,
      email: user.email,
      name: user.nickname ?? user.name ?? null,
      image: user.custom_image ?? user.image ?? null,
    };
  },
});

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
    credentialsProvider,
  ],
  // Credentials provider 호환을 위해 JWT 세션 사용.
  // Supabase Adapter는 OAuth 사용자/계정 저장용으로 유지 (세션만 JWT).
  ...(hasSupabase
    ? {
        adapter: SupabaseAdapter({
          url: supabaseUrl!,
          secret: supabaseServiceKey!,
        }),
        session: { strategy: "jwt" as const },
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

        const userRecord = user as
          | (typeof user & { phone?: string | null; custom_image?: string | null })
          | undefined;
        if (userRecord?.phone !== undefined) {
          (session.user as { phone?: string | null }).phone = userRecord.phone;
        }

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
