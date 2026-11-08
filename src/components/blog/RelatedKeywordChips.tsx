// 보조 키워드 점검 표시 (관리자 편집·검색 노출 점검 공용)
import { RELATED_MAX, RELATED_MIN, type RelatedCheck } from "@/lib/blog-utils";

export default function RelatedKeywordChips({ checks }: { checks: RelatedCheck[] }) {
  const done = checks.filter((c) => c.status === "full").length;
  const n = checks.length;
  const countOk = n >= RELATED_MIN && n <= RELATED_MAX;
  return (
    <div>
      <p className="text-xs font-bold text-gray-700">
        보조 키워드 {n}개 · 본문 반영 {done}/{n}
        <span className={`ml-2 font-semibold ${countOk ? "text-emerald-600" : "text-amber-600"}`}>
          {n === 0
            ? `— ${RELATED_MIN}~${RELATED_MAX}개를 넣어 주세요`
            : n < RELATED_MIN
              ? `— ${RELATED_MIN}개 이상 권장`
              : n > RELATED_MAX
                ? `— ${RELATED_MAX}개 이하 권장 (많으면 주제가 흐려져요)`
                : "— 개수 적당해요"}
        </span>
      </p>
      {n > 0 && (
        <div className="mt-1.5 flex flex-wrap gap-1.5">
          {checks.map((c) => (
            <span
              key={c.keyword}
              title={
                c.status === "full"
                  ? `본문에 ${c.count}번${c.inHeading ? " · 소제목에도 있어요" : ""}`
                  : c.status === "partial"
                    ? "단어는 있지만 이 문구 그대로는 없어요"
                    : "본문에 없어요"
              }
              className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-semibold ${
                c.status === "full"
                  ? "bg-emerald-50 text-emerald-700"
                  : c.status === "partial"
                    ? "bg-amber-50 text-amber-700"
                    : "bg-rose-50 text-rose-600"
              }`}
            >
              {c.status === "full" ? "✓" : c.status === "partial" ? "△" : "✗"} {c.keyword}
              {c.status === "full" && <span className="opacity-70">{c.count}</span>}
              {c.inHeading && <span className="opacity-70">· 소제목</span>}
            </span>
          ))}
        </div>
      )}
      {n > 0 && (
        <p className="mt-1 text-[11px] text-gray-400">✓ 문구 그대로 있음 · △ 단어만 흩어져 있음 · ✗ 없음 — 각 1~3번, 소제목·표·자주 묻는 질문에 자연스럽게</p>
      )}
    </div>
  );
}
