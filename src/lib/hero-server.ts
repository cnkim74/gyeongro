// 메인 히어로 설정 저장·불러오기 — 서버 전용
//
// DB 테이블 없이 Supabase Storage 의 공개 버킷 'site-media' 에 저장
//   - 설정:  site-media/config/hero.json
//   - 미디어: site-media/hero/<시각>-<이름>  (관리자 브라우저가 서명된 주소로 직접 업로드)
// 버킷이 없으면 처음 업로드·저장할 때 자동 생성.

import { unstable_cache, revalidateTag } from "next/cache";
import { getSupabaseServiceClient } from "./supabase";
import { DEFAULT_HERO, normalizeHero, type HeroConfig } from "./hero";

const BUCKET = "site-media";
const CONFIG_PATH = "config/hero.json";
export const HERO_TAG = "hero-config";
const MAX_MEDIA_BYTES = 50 * 1024 * 1024; // Supabase 무료 플랜 파일 한도

async function ensureBucket() {
  const supabase = getSupabaseServiceClient();
  const { data } = await supabase.storage.getBucket(BUCKET);
  if (data) return;
  await supabase.storage.createBucket(BUCKET, {
    public: true,
    fileSizeLimit: MAX_MEDIA_BYTES,
    allowedMimeTypes: ["video/mp4", "video/webm", "image/jpeg", "image/png", "image/webp", "application/json"],
  });
}

async function readHeroConfig(): Promise<HeroConfig> {
  try {
    const supabase = getSupabaseServiceClient();
    const { data, error } = await supabase.storage.from(BUCKET).download(CONFIG_PATH);
    if (error || !data) return DEFAULT_HERO;
    return normalizeHero(JSON.parse(await data.text()));
  } catch {
    return DEFAULT_HERO;
  }
}

/** 메인 페이지용 — 캐시(1시간), 관리자가 저장하면 즉시 갱신
 *  ※ 이 캐시는 배포가 바뀌어도 유지됨 → 기본값(DEFAULT_HERO)을 바꾸면 키 버전도 올릴 것 */
export const getHeroConfig = unstable_cache(readHeroConfig, ["hero-config-v2"], {
  tags: [HERO_TAG],
  revalidate: 3600,
});

/** 관리자 편집 화면용 — 캐시 없이 최신 값 */
export async function getHeroConfigFresh(): Promise<HeroConfig> {
  return readHeroConfig();
}

export async function saveHeroConfig(input: unknown): Promise<HeroConfig> {
  const config = normalizeHero(input);
  await ensureBucket();
  const supabase = getSupabaseServiceClient();
  const { error } = await supabase.storage
    .from(BUCKET)
    .upload(CONFIG_PATH, new Blob([JSON.stringify(config, null, 2)], { type: "application/json" }), {
      upsert: true,
      contentType: "application/json",
      cacheControl: "0",
    });
  if (error) throw new Error(error.message);
  revalidateTag(HERO_TAG, { expire: 0 });
  return config;
}

const ALLOWED_MEDIA: Record<string, string> = {
  "video/mp4": "mp4",
  "video/webm": "webm",
  "image/jpeg": "jpg",
  "image/png": "png",
  "image/webp": "webp",
};

/** 관리자 브라우저가 직접 올릴 서명된 업로드 주소 발급 (Vercel 요청 크기 제한 회피) */
export async function createHeroUploadUrl(contentType: string, size: number) {
  const ext = ALLOWED_MEDIA[contentType];
  if (!ext) throw new Error("MP4·WebM 영상 또는 JPG·PNG·WebP 사진만 올릴 수 있어요.");
  if (!(size > 0) || size > MAX_MEDIA_BYTES) throw new Error("파일은 50MB 이하만 올릴 수 있어요.");
  await ensureBucket();
  const supabase = getSupabaseServiceClient();
  const path = `hero/${Date.now()}-${Math.random().toString(36).slice(2, 8)}.${ext}`;
  const { data, error } = await supabase.storage.from(BUCKET).createSignedUploadUrl(path);
  if (error || !data) throw new Error(error?.message ?? "업로드 주소를 만들지 못했어요.");
  const { data: pub } = supabase.storage.from(BUCKET).getPublicUrl(path);
  return {
    signedUrl: data.signedUrl,
    publicUrl: pub.publicUrl,
    // 브라우저용 공개 키 (Supabase 설계상 공개해도 되는 anon 키) — 게이트웨이 통과용
    apikey: process.env.SUPABASE_ANON_KEY ?? "",
  };
}
