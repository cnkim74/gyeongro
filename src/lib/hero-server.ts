// 메인 히어로 설정 저장·불러오기 — 서버 전용
//
// Cloudflare R2 버킷(R2_BUCKET_NAME)에 저장
//   - 설정:  config/hero.json
//   - 미디어: hero/<시각>-<무작위>.<확장자>  (관리자 브라우저가 서명된 주소로 직접 업로드)
//
// 예전에는 Supabase Storage 'site-media' 버킷을 썼음.
// R2에 설정이 아직 없으면 예전 Supabase 설정을 읽어 그대로 보여주고,
// 관리자가 한 번 저장하면 그때부터 R2에 기록된다.

import { unstable_cache, revalidateTag } from "next/cache";
import { getSupabaseServiceClient } from "./supabase";
import { DEFAULT_HERO, normalizeHero, type HeroConfig } from "./hero";
import { r2GetText, r2Put, r2PresignedPutUrl, r2PublicUrl } from "./r2";

const CONFIG_KEY = "config/hero.json";
export const HERO_TAG = "hero-config";
const MAX_MEDIA_BYTES = 100 * 1024 * 1024; // R2는 단일 업로드 5GB까지 가능 — 메인 영상 용도로 100MB 제한

const LEGACY_BUCKET = "site-media";
const LEGACY_CONFIG_PATH = "config/hero.json";

async function readLegacyHeroConfig(): Promise<HeroConfig | null> {
  try {
    const supabase = getSupabaseServiceClient();
    const { data, error } = await supabase.storage.from(LEGACY_BUCKET).download(LEGACY_CONFIG_PATH);
    if (error || !data) return null;
    return normalizeHero(JSON.parse(await data.text()));
  } catch {
    return null;
  }
}

async function readHeroConfig(): Promise<HeroConfig> {
  try {
    const text = await r2GetText(CONFIG_KEY);
    if (text) return normalizeHero(JSON.parse(text));
  } catch (e) {
    console.error("[hero] R2 설정 읽기 실패:", e);
  }
  return (await readLegacyHeroConfig()) ?? DEFAULT_HERO;
}

/** 메인 페이지용 — 캐시(1시간), 관리자가 저장하면 즉시 갱신
 *  ※ 이 캐시는 배포가 바뀌어도 유지됨 → 기본값(DEFAULT_HERO)이나 저장 위치를 바꾸면 키 버전도 올릴 것 */
export const getHeroConfig = unstable_cache(readHeroConfig, ["hero-config-v3"], {
  tags: [HERO_TAG],
  revalidate: 3600,
});

/** 관리자 편집 화면용 — 캐시 없이 최신 값 */
export async function getHeroConfigFresh(): Promise<HeroConfig> {
  return readHeroConfig();
}

export async function saveHeroConfig(input: unknown): Promise<HeroConfig> {
  const config = normalizeHero(input);
  await r2Put(CONFIG_KEY, JSON.stringify(config, null, 2), "application/json", "no-store");
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

/** 관리자 브라우저가 R2에 직접 올릴 서명된 업로드 주소 발급 (Vercel 요청 크기 제한 회피) */
export async function createHeroUploadUrl(contentType: string, size: number) {
  const ext = ALLOWED_MEDIA[contentType];
  if (!ext) throw new Error("MP4·WebM 영상 또는 JPG·PNG·WebP 사진만 올릴 수 있어요.");
  if (!(size > 0) || size > MAX_MEDIA_BYTES) throw new Error("파일은 100MB 이하만 올릴 수 있어요.");
  const key = `hero/${Date.now()}-${Math.random().toString(36).slice(2, 8)}.${ext}`;
  const signedUrl = await r2PresignedPutUrl(key, contentType);
  return {
    signedUrl,
    publicUrl: r2PublicUrl(key),
    // 브라우저가 PUT 할 때 이 값을 Content-Type 헤더로 보낸다 (R2에 파일 형식으로 저장됨)
    contentType,
  };
}
