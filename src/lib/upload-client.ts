// 브라우저에서 사진 올리기 — 큰 휴대폰 사진은 가로 2000px JPEG로 줄인 뒤 서명된 주소로 직접 업로드
// endpoint: "/api/upload-url" (로그인 사용자) 또는 "/api/admin/hero/upload-url" (관리자)

async function shrink(file: File): Promise<Blob> {
  if (!/^image\/(jpeg|png|webp)$/.test(file.type)) return file;
  try {
    const bmp = await createImageBitmap(file);
    const max = 2000;
    const scale = Math.min(1, max / Math.max(bmp.width, bmp.height));
    if (scale === 1 && file.size < 2.5 * 1024 * 1024) {
      bmp.close();
      return file;
    }
    const canvas = document.createElement("canvas");
    canvas.width = Math.round(bmp.width * scale);
    canvas.height = Math.round(bmp.height * scale);
    canvas.getContext("2d")!.drawImage(bmp, 0, 0, canvas.width, canvas.height);
    bmp.close();
    const blob = await new Promise<Blob | null>((res) => canvas.toBlob(res, "image/jpeg", 0.85));
    return blob ?? file;
  } catch {
    return file; // 줄이기 실패하면 원본 그대로
  }
}

export async function uploadImage(file: File, endpoint = "/api/upload-url"): Promise<string> {
  const blob = await shrink(file);
  const type = blob.type || file.type;
  const r = await fetch(endpoint, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ contentType: type, size: blob.size }),
  });
  const j = await r.json();
  if (!r.ok) throw new Error(j.error ?? "업로드를 준비하지 못했어요.");
  const fd = new FormData();
  fd.append("cacheControl", "31536000");
  fd.append("", blob, file.name.replace(/\.[^.]+$/, "") + (type === "image/jpeg" ? ".jpg" : ""));
  const up = await fetch(j.signedUrl, {
    method: "PUT",
    headers: j.apikey ? { apikey: j.apikey, "x-upsert": "false" } : { "x-upsert": "false" },
    body: fd,
  });
  if (!up.ok) throw new Error(`업로드 실패 (${up.status})`);
  return j.publicUrl as string;
}
