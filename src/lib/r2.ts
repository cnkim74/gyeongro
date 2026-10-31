// Cloudflare R2 (S3 호환) 저장소 — 서버 전용
//
// 필요한 환경 변수
//   R2_ACCOUNT_ID, R2_ACCESS_KEY_ID, R2_SECRET_ACCESS_KEY, R2_BUCKET_NAME  (서버 전용, 비공개)
//   NEXT_PUBLIC_R2_PUBLIC_URL  (공개 주소, 예: https://pub-xxxx.r2.dev 또는 https://cdn.도메인)

import {
  S3Client,
  PutObjectCommand,
  GetObjectCommand,
  DeleteObjectCommand,
} from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";

function requireEnv(name: string): string {
  const value = process.env[name];
  if (!value) throw new Error(`R2 환경 변수 ${name} 이(가) 설정되지 않았어요.`);
  return value;
}

// 빌드 시점에 환경 변수가 없어도 터지지 않도록 처음 쓸 때 만든다
let client: S3Client | null = null;

function getClient(): S3Client {
  if (client) return client;
  client = new S3Client({
    region: "auto",
    forcePathStyle: true,
    endpoint: `https://${requireEnv("R2_ACCOUNT_ID")}.r2.cloudflarestorage.com`,
    credentials: {
      accessKeyId: requireEnv("R2_ACCESS_KEY_ID"),
      secretAccessKey: requireEnv("R2_SECRET_ACCESS_KEY"),
    },
    // 최신 SDK 기본 체크섬 헤더가 브라우저 직접 업로드(서명 주소)를 깨뜨리지 않게
    requestChecksumCalculation: "WHEN_REQUIRED",
    responseChecksumValidation: "WHEN_REQUIRED",
  });
  return client;
}

function bucket(): string {
  return requireEnv("R2_BUCKET_NAME");
}

function publicBase(): string {
  return requireEnv("NEXT_PUBLIC_R2_PUBLIC_URL").replace(/\/+$/, "");
}

/** 저장 키 → 공개 주소 */
export function r2PublicUrl(key: string): string {
  return `${publicBase()}/${key.replace(/^\/+/, "")}`;
}

/** 이 주소가 R2 공개 주소라면 저장 키를, 아니면 null */
export function r2KeyFromUrl(url: string): string | null {
  const base = process.env.NEXT_PUBLIC_R2_PUBLIC_URL?.replace(/\/+$/, "");
  if (!base || !url.startsWith(`${base}/`)) return null;
  return decodeURIComponent(url.slice(base.length + 1).split("?")[0]);
}

/** 서버에서 바로 올리기 (작은 파일·JSON) */
export async function r2Put(
  key: string,
  body: Uint8Array | string,
  contentType: string,
  cacheControl = "public, max-age=31536000, immutable"
): Promise<string> {
  await getClient().send(
    new PutObjectCommand({
      Bucket: bucket(),
      Key: key,
      Body: body,
      ContentType: contentType,
      CacheControl: cacheControl,
    })
  );
  return r2PublicUrl(key);
}

/** 텍스트로 읽기 — 없으면 null */
export async function r2GetText(key: string): Promise<string | null> {
  try {
    const res = await getClient().send(new GetObjectCommand({ Bucket: bucket(), Key: key }));
    return (await res.Body?.transformToString()) ?? null;
  } catch (e) {
    const name = (e as { name?: string }).name;
    if (name === "NoSuchKey" || name === "NotFound") return null;
    throw e;
  }
}

/** 삭제 (없는 키여도 오류 없음) */
export async function r2Delete(key: string): Promise<void> {
  await getClient().send(new DeleteObjectCommand({ Bucket: bucket(), Key: key }));
}

/** 브라우저가 직접 PUT 할 서명된 업로드 주소 (Vercel 요청 크기 제한 회피)
 *  ※ 브라우저는 PUT 할 때 Content-Type 헤더를 함께 보낼 것 */
export async function r2PresignedPutUrl(
  key: string,
  contentType: string,
  expiresIn = 600
): Promise<string> {
  return getSignedUrl(
    getClient(),
    new PutObjectCommand({
      Bucket: bucket(),
      Key: key,
      ContentType: contentType,
    }),
    { expiresIn }
  );
}
