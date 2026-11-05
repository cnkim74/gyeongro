// 로그인한 사용자의 사진 업로드 — 서버 전용
// Supabase Storage 공개 버킷 'site-media' 의 stories/<사용자 id>/ 아래에, 브라우저가 서명된 주소로 직접 올림
// (Vercel 요청 크기 제한 회피). 사진만, 10MB 이하.

import { getSupabaseServiceClient } from "./supabase";

const BUCKET = "site-media";
const MAX_BYTES = 10 * 1024 * 1024;
const IMAGE_TYPES: Record<string, string> = {
  "image/jpeg": "jpg",
  "image/png": "png",
  "image/webp": "webp",
};

export async function createUserImageUploadUrl(userId: string, contentType: string, size: number) {
  const ext = IMAGE_TYPES[contentType];
  if (!ext) throw new Error("JPG·PNG·WebP 사진만 올릴 수 있어요.");
  if (!(size > 0) || size > MAX_BYTES) throw new Error("사진은 10MB 이하만 올릴 수 있어요.");
  const supabase = getSupabaseServiceClient();
  const { data: bucket } = await supabase.storage.getBucket(BUCKET);
  if (!bucket) await supabase.storage.createBucket(BUCKET, { public: true });
  const safeUser = userId.replace(/[^a-zA-Z0-9-]/g, "").slice(0, 40) || "user";
  const path = `stories/${safeUser}/${Date.now()}-${Math.random().toString(36).slice(2, 8)}.${ext}`;
  const { data, error } = await supabase.storage.from(BUCKET).createSignedUploadUrl(path);
  if (error || !data) throw new Error(error?.message ?? "업로드 주소를 만들지 못했어요.");
  const { data: pub } = supabase.storage.from(BUCKET).getPublicUrl(path);
  return { signedUrl: data.signedUrl, publicUrl: pub.publicUrl, apikey: process.env.SUPABASE_ANON_KEY ?? "" };
}
