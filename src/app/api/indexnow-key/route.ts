// IndexNow 키 확인 파일 — 검색엔진이 우리 사이트 소유인지 확인할 때 읽음
import { indexNowKey } from "@/lib/search-index";

export const dynamic = "force-dynamic";

export function GET() {
  return new Response(indexNowKey(), { headers: { "Content-Type": "text/plain; charset=utf-8" } });
}
