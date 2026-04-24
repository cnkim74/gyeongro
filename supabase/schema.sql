-- ============================================================
-- 경로(Gyeongro) 여행 플랫폼 Supabase 스키마
-- ============================================================
-- 사용법: Supabase 대시보드 → SQL Editor → 아래 전체 복사/붙여넣기 → Run
-- ============================================================

-- Auth.js 테이블 (NextAuth Supabase Adapter 요구사항)
-- 참고: https://authjs.dev/getting-started/adapters/supabase
CREATE SCHEMA IF NOT EXISTS next_auth;
GRANT USAGE ON SCHEMA next_auth TO service_role;
GRANT ALL ON SCHEMA next_auth TO postgres;

-- users
CREATE TABLE IF NOT EXISTS next_auth.users (
  id uuid NOT NULL DEFAULT uuid_generate_v4(),
  name text,
  email text,
  "emailVerified" timestamp with time zone,
  image text,
  CONSTRAINT users_pkey PRIMARY KEY (id),
  CONSTRAINT email_unique UNIQUE (email)
);
GRANT ALL ON TABLE next_auth.users TO service_role;

-- sessions
CREATE TABLE IF NOT EXISTS next_auth.sessions (
  id uuid NOT NULL DEFAULT uuid_generate_v4(),
  expires timestamp with time zone NOT NULL,
  "sessionToken" text NOT NULL,
  "userId" uuid,
  CONSTRAINT sessions_pkey PRIMARY KEY (id),
  CONSTRAINT sessionToken_unique UNIQUE ("sessionToken"),
  CONSTRAINT sessions_userId_fkey FOREIGN KEY ("userId") REFERENCES next_auth.users(id) ON DELETE CASCADE
);
GRANT ALL ON TABLE next_auth.sessions TO service_role;

-- accounts
CREATE TABLE IF NOT EXISTS next_auth.accounts (
  id uuid NOT NULL DEFAULT uuid_generate_v4(),
  type text NOT NULL,
  provider text NOT NULL,
  "providerAccountId" text NOT NULL,
  refresh_token text,
  access_token text,
  expires_at bigint,
  token_type text,
  scope text,
  id_token text,
  session_state text,
  oauth_token_secret text,
  oauth_token text,
  "userId" uuid,
  CONSTRAINT accounts_pkey PRIMARY KEY (id),
  CONSTRAINT provider_unique UNIQUE (provider, "providerAccountId"),
  CONSTRAINT accounts_userId_fkey FOREIGN KEY ("userId") REFERENCES next_auth.users(id) ON DELETE CASCADE
);
GRANT ALL ON TABLE next_auth.accounts TO service_role;

-- verification_tokens
CREATE TABLE IF NOT EXISTS next_auth.verification_tokens (
  identifier text,
  token text NOT NULL,
  expires timestamp with time zone NOT NULL,
  CONSTRAINT verification_tokens_pkey PRIMARY KEY (token),
  CONSTRAINT token_identifier_unique UNIQUE (token, identifier)
);
GRANT ALL ON TABLE next_auth.verification_tokens TO service_role;

-- ============================================================
-- 앱 테이블
-- ============================================================

-- 여행 계획 저장
CREATE TABLE IF NOT EXISTS public.travel_plans (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  title text NOT NULL,
  destination text NOT NULL,
  days integer NOT NULL,
  people integer NOT NULL,
  budget bigint NOT NULL,
  travel_style text,
  themes text[],
  itinerary jsonb NOT NULL,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now(),
  CONSTRAINT travel_plans_pkey PRIMARY KEY (id),
  CONSTRAINT travel_plans_user_fkey FOREIGN KEY (user_id) REFERENCES next_auth.users(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_travel_plans_user_id ON public.travel_plans(user_id);
CREATE INDEX IF NOT EXISTS idx_travel_plans_created_at ON public.travel_plans(created_at DESC);

-- 관리자 테이블
CREATE TABLE IF NOT EXISTS public.admins (
  user_id uuid NOT NULL,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  CONSTRAINT admins_pkey PRIMARY KEY (user_id),
  CONSTRAINT admins_user_fkey FOREIGN KEY (user_id) REFERENCES next_auth.users(id) ON DELETE CASCADE
);

-- ============================================================
-- Row Level Security (RLS)
-- ============================================================

ALTER TABLE public.travel_plans ENABLE ROW LEVEL SECURITY;

-- 본인 여행 계획만 조회/수정/삭제 가능
CREATE POLICY "Users can view own travel plans"
  ON public.travel_plans FOR SELECT
  USING (user_id::text = auth.jwt() ->> 'sub');

CREATE POLICY "Users can insert own travel plans"
  ON public.travel_plans FOR INSERT
  WITH CHECK (user_id::text = auth.jwt() ->> 'sub');

CREATE POLICY "Users can update own travel plans"
  ON public.travel_plans FOR UPDATE
  USING (user_id::text = auth.jwt() ->> 'sub');

CREATE POLICY "Users can delete own travel plans"
  ON public.travel_plans FOR DELETE
  USING (user_id::text = auth.jwt() ->> 'sub');

-- Service role bypass
GRANT ALL ON public.travel_plans TO service_role;
GRANT ALL ON public.admins TO service_role;
