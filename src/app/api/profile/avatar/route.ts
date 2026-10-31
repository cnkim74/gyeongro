import { NextRequest } from "next/server";
import { auth } from "@/lib/auth";
import { revalidatePath } from "next/cache";
import { getSupabaseServiceClient } from "@/lib/supabase";
import { r2Put, r2Delete, r2KeyFromUrl } from "@/lib/r2";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const MAX_SIZE = 5 * 1024 * 1024;
const EXT_BY_TYPE: Record<string, string> = {
  "image/jpeg": "jpg",
  "image/png": "png",
  "image/webp": "webp",
  "image/gif": "gif",
};
const ALLOWED_TYPES = Object.keys(EXT_BY_TYPE);
const LEGACY_AVATAR_MARKER = "/storage/v1/object/public/avatars/";

/** 예전 사진 정리 — R2 주소면 R2에서, 예전 Supabase 주소면 Supabase에서 삭제 */
async function removeOldAvatar(url: string) {
  try {
    const r2Key = r2KeyFromUrl(url);
    if (r2Key) {
      if (r2Key.startsWith("avatars/")) await r2Delete(r2Key);
      return;
    }
    const legacyPath = url.split(LEGACY_AVATAR_MARKER)[1];
    if (legacyPath) {
      await getSupabaseServiceClient().storage.from("avatars").remove([legacyPath]);
    }
  } catch (e) {
    console.error("[avatar] 예전 사진 삭제 실패:", e);
  }
}

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) {
    return Response.json({ error: "로그인이 필요해요." }, { status: 401 });
  }

  const formData = await req.formData();
  const file = formData.get("file");

  if (!(file instanceof File)) {
    return Response.json({ error: "파일이 전송되지 않았어요." }, { status: 400 });
  }

  if (file.size > MAX_SIZE) {
    return Response.json({ error: "파일 크기는 5MB 이하여야 해요." }, { status: 400 });
  }

  if (!ALLOWED_TYPES.includes(file.type)) {
    return Response.json({ error: "JPG, PNG, WebP, GIF만 지원해요." }, { status: 400 });
  }

  const supabase = getSupabaseServiceClient();
  const ext = EXT_BY_TYPE[file.type];
  const key = `avatars/${session.user.id}/avatar-${Date.now()}.${ext}`;

  let url: string;
  try {
    url = await r2Put(key, new Uint8Array(await file.arrayBuffer()), file.type);
  } catch (e) {
    console.error("[avatar] R2 업로드 실패:", e);
    return Response.json({ error: "사진을 올리지 못했어요." }, { status: 500 });
  }

  // 기존 custom_image가 있으면 삭제 (저장소 정리)
  const { data: prev } = await supabase
    .schema("next_auth")
    .from("users")
    .select("custom_image")
    .eq("id", session.user.id)
    .single();

  if (prev?.custom_image) await removeOldAvatar(prev.custom_image);

  const { error: updateError } = await supabase
    .schema("next_auth")
    .from("users")
    .update({ custom_image: url })
    .eq("id", session.user.id);

  if (updateError) {
    return Response.json({ error: updateError.message }, { status: 500 });
  }

  revalidatePath("/", "layout");

  return Response.json({ url });
}

export async function DELETE() {
  const session = await auth();
  if (!session?.user?.id) {
    return Response.json({ error: "로그인이 필요해요." }, { status: 401 });
  }

  const supabase = getSupabaseServiceClient();

  const { data: prev } = await supabase
    .schema("next_auth")
    .from("users")
    .select("custom_image")
    .eq("id", session.user.id)
    .single();

  if (prev?.custom_image) await removeOldAvatar(prev.custom_image);

  const { error } = await supabase
    .schema("next_auth")
    .from("users")
    .update({ custom_image: null })
    .eq("id", session.user.id);

  if (error) return Response.json({ error: error.message }, { status: 500 });
  revalidatePath("/", "layout");
  return Response.json({ ok: true });
}
