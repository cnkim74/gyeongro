// IndexNow 키 확인 파일 (/indexnow-key.txt)
// ※ 키 파일은 사이트 맨 위(루트)에 있어야 모든 주소(/blog/...)에 대한 수집 요청이 인정됨
//   (/api/ 아래에 두면 /api/ 주소만 인정 → 422 오류)
import { indexNowKey } from "@/lib/search-index";

export const dynamic = "force-dynamic";

export function GET() {
  return new Response(indexNowKey(), { headers: { "Content-Type": "text/plain; charset=utf-8" } });
}
