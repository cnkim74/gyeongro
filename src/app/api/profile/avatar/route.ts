import { NextRequest } from "next/server";
import { auth } from "@/lib/auth";
import { getSupabaseServiceClient } from "@/lib/supabase";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const MAX_SIZE = 5 * 1024 * 1024;
const ALLOWED_TYPES = ["image/jpeg", "image/png", "image/webp", "image/gif"];

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
  const ext = file.name.split(".").pop()?.toLowerCase() ?? "jpg";
  const path = `${session.user.id}/avatar-${Date.now()}.${ext}`;

  const arrayBuffer = await file.arrayBuffer();
  const { error: uploadError } = await supabase.storage
    .from("avatars")
    .upload(path, arrayBuffer, {
      contentType: file.type,
      upsert: false,
    });

  if (uploadError) {
    return Response.json({ error: uploadError.message }, { status: 500 });
  }

  const { data: publicUrl } = supabase.storage.from("avatars").getPublicUrl(path);
  const url = publicUrl.publicUrl;

  // 기존 custom_image가 있으면 삭제 (Storage 정리)
  const { data: prev } = await supabase
    .schema("next_auth")
    .from("users")
    .select("custom_image")
    .eq("id", session.user.id)
    .single();

  if (prev?.custom_image) {
    const oldPath = prev.custom_image.split("/storage/v1/object/public/avatars/")[1];
    if (oldPath) {
      await supabase.storage.from("avatars").remove([oldPath]);
    }
  }

  const { error: updateError } = await supabase
    .schema("next_auth")
    .from("users")
    .update({ custom_image: url })
    .eq("id", session.user.id);

  if (updateError) {
    return Response.json({ error: updateError.message }, { status: 500 });
  }

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

  if (prev?.custom_image) {
    const oldPath = prev.custom_image.split("/storage/v1/object/public/avatars/")[1];
    if (oldPath) {
      await supabase.storage.from("avatars").remove([oldPath]);
    }
  }

  const { error } = await supabase
    .schema("next_auth")
    .from("users")
    .update({ custom_image: null })
    .eq("id", session.user.id);

  if (error) return Response.json({ error: error.message }, { status: 500 });
  return Response.json({ ok: true });
}
