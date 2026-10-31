// Supabase Storage → Cloudflare R2 이전 도구 — 서버 전용 (관리자 화면 /admin/storage 에서 사용)
//
// 옮기는 대상 (실제로 쓰이고 있는 파일만)
//   - 프로필 사진: next_auth.users.custom_image 가 Supabase 'avatars' 버킷 주소인 것
//   - 메인 히어로: 설정의 mediaUrl·posterUrl 이 Supabase 'site-media' 버킷 주소인 것 (+ 설정 JSON 자체)
//
// 복사만 한다. Supabase 쪽 원본은 지우지 않음 → 화면에서 확인한 뒤 Supabase 대시보드에서 직접 정리.

import { getSupabaseServiceClient } from "./supabase";
import { r2Put, r2GetText } from "./r2";
import { getHeroConfigFresh, saveHeroConfig } from "./hero-server";

const MARKER = "/storage/v1/object/public/";
const BUCKET_TO_R2_PREFIX: Record<string, string> = {
  avatars: "avatars/", // avatars/<사용자ID>/avatar-... → R2 avatars/<사용자ID>/avatar-...
  "site-media": "", //    site-media/hero/...           → R2 hero/...
};

const MIME_BY_EXT: Record<string, string> = {
  jpg: "image/jpeg",
  jpeg: "image/jpeg",
  png: "image/png",
  webp: "image/webp",
  gif: "image/gif",
  mp4: "video/mp4",
  webm: "video/webm",
};

type LegacyFile = { bucket: string; path: string; r2Key: string };

/** Supabase 공개 주소 → 버킷·경로·R2 키 (해당 없으면 null) */
export function parseLegacyUrl(url: string | null | undefined): LegacyFile | null {
  if (!url) return null;
  const i = url.indexOf(MARKER);
  if (i < 0) return null;
  const rest = url.slice(i + MARKER.length).split("?")[0];
  const slash = rest.indexOf("/");
  if (slash < 0) return null;
  const bucket = rest.slice(0, slash);
  const path = decodeURIComponent(rest.slice(slash + 1));
  const prefix = BUCKET_TO_R2_PREFIX[bucket];
  if (prefix === undefined || !path) return null;
  return { bucket, path, r2Key: `${prefix}${path}` };
}

/** Supabase에서 받아 R2에 같은 이름으로 올리고 새 공개 주소를 돌려준다 */
async function copyToR2(file: LegacyFile): Promise<string> {
  const supabase = getSupabaseServiceClient();
  const { data, error } = await supabase.storage.from(file.bucket).download(file.path);
  if (error || !data) throw new Error(`Supabase에서 받지 못함: ${file.bucket}/${file.path} (${error?.message ?? "없음"})`);
  const ext = file.path.split(".").pop()?.toLowerCase() ?? "";
  const contentType = data.type || MIME_BY_EXT[ext] || "application/octet-stream";
  return r2Put(file.r2Key, new Uint8Array(await data.arrayBuffer()), contentType);
}

type PendingUser = { id: string; name: string | null; url: string };

async function findLegacyAvatars(): Promise<PendingUser[]> {
  const supabase = getSupabaseServiceClient();
  const { data, error } = await supabase
    .schema("next_auth")
    .from("users")
    .select("id, name, custom_image")
    .like("custom_image", `%${MARKER}avatars/%`);
  if (error) throw new Error(`사용자 목록을 읽지 못함: ${error.message}`);
  return (data ?? []).map((u) => ({ id: u.id as string, name: (u.name as string) ?? null, url: u.custom_image as string }));
}

export type MigrationStatus = {
  heroConfigInR2: boolean;
  heroFiles: { field: "mediaUrl" | "posterUrl"; url: string }[];
  avatars: PendingUser[];
};

/** 아직 Supabase에 남아 있는 대상 점검 */
export async function getMigrationStatus(): Promise<MigrationStatus> {
  const [configText, hero, avatars] = await Promise.all([
    r2GetText("config/hero.json").catch(() => null),
    getHeroConfigFresh(),
    findLegacyAvatars(),
  ]);
  const heroFiles: MigrationStatus["heroFiles"] = [];
  if (parseLegacyUrl(hero.mediaUrl)) heroFiles.push({ field: "mediaUrl", url: hero.mediaUrl });
  if (parseLegacyUrl(hero.posterUrl)) heroFiles.push({ field: "posterUrl", url: hero.posterUrl });
  return { heroConfigInR2: !!configText, heroFiles, avatars };
}

export type MigrationStepResult = {
  done: string[];
  failed: string[];
  remaining: number;
};

/** 한 번 호출에 시간 예산(budgetMs) 안에서 최대한 옮긴다. remaining 이 0 이 될 때까지 반복 호출. */
export async function runMigrationStep(budgetMs = 200_000): Promise<MigrationStepResult> {
  const started = Date.now();
  const done: string[] = [];
  const failed: string[] = [];

  // 1) 메인 히어로 — 파일 복사 후 새 주소로 설정 저장 (설정 JSON도 이때 R2에 기록됨)
  const status = await getMigrationStatus();
  if (status.heroFiles.length > 0 || !status.heroConfigInR2) {
    try {
      const hero = await getHeroConfigFresh();
      const next = { ...hero };
      for (const f of status.heroFiles) {
        const legacy = parseLegacyUrl(f.url)!;
        next[f.field] = await copyToR2(legacy);
        done.push(`히어로 ${f.field === "mediaUrl" ? "배경" : "포스터"}: ${legacy.path}`);
      }
      await saveHeroConfig(next);
      done.push("히어로 설정 → R2");
    } catch (e) {
      failed.push(`히어로: ${e instanceof Error ? e.message : String(e)}`);
    }
  }

  // 2) 프로필 사진
  const supabase = getSupabaseServiceClient();
  for (const u of status.avatars) {
    if (Date.now() - started > budgetMs) break;
    const legacy = parseLegacyUrl(u.url);
    if (!legacy) continue;
    try {
      const newUrl = await copyToR2(legacy);
      // 그 사이 사용자가 사진을 바꿨다면 덮어쓰지 않도록 예전 주소일 때만 교체
      const { error } = await supabase
        .schema("next_auth")
        .from("users")
        .update({ custom_image: newUrl })
        .eq("id", u.id)
        .eq("custom_image", u.url);
      if (error) throw new Error(error.message);
      done.push(`프로필 사진: ${u.name ?? u.id}`);
    } catch (e) {
      failed.push(`프로필 사진 ${u.name ?? u.id}: ${e instanceof Error ? e.message : String(e)}`);
    }
  }

  const after = await getMigrationStatus();
  // 실패한 항목은 다시 시도해도 같은 결과일 수 있으니 남은 수에서 빼서 무한 반복을 막는다
  const remaining = Math.max(0, after.heroFiles.length + after.avatars.length - failed.length);
  return { done, failed, remaining };
}

