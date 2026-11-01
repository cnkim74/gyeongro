import { requireAdmin } from "@/lib/admin";
import { getSupabaseServiceClient } from "@/lib/supabase";
import { FIRST_POST_EVENT } from "@/lib/events";
import { KRW_PER_USD, PLANNER_EST_USD } from "@/lib/ai-runs";
import { Bot, Coins, Gift, AlertCircle } from "lucide-react";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "AI 사용량·비용 - Pothos 관리자",
};

const ACTION_LABEL: Record<string, string> = {
  planner: "AI 여행 플래너",
  optimizer: "동선 최적화",
  translation: "번역",
  blog: "블로그 AI 작성",
};

function won(usd: number) {
  return `₩${Math.round(usd * KRW_PER_USD).toLocaleString("ko-KR")}`;
}

function kstDate(d: Date) {
  return d.toLocaleDateString("sv-SE", { timeZone: "Asia/Seoul" });
}

export default async function AiUsagePage() {
  await requireAdmin();
  const supabase = getSupabaseServiceClient();

  const [usageRes, runsRes, eventRes] = await Promise.all([
    supabase.from("ai_usage").select("user_id, action, used_on, count").order("used_on", { ascending: false }).limit(10000),
    supabase
      .from("ai_runs")
      .select("action, cost_usd, ok, calls, input_tokens, output_tokens, meta, created_at")
      .order("created_at", { ascending: false })
      .limit(10000),
    supabase.from("ai_credits").select("user_id, granted, remaining, expires_at").eq("source", FIRST_POST_EVENT.source),
  ]);

  // ── 1) 실행 횟수 (ai_usage: 처음부터 기록됨) ──
  const usage = usageRes.data ?? [];
  const now = new Date();
  const today = kstDate(now);
  const month = today.slice(0, 7);
  const byAction = new Map<string, { total: number; today: number; month: number; users: Set<string> }>();
  const byDay = new Map<string, number>();
  for (const u of usage) {
    const a = byAction.get(u.action) ?? { total: 0, today: 0, month: 0, users: new Set<string>() };
    a.total += u.count;
    if (u.used_on === today) a.today += u.count;
    if (String(u.used_on).startsWith(month)) a.month += u.count;
    a.users.add(u.user_id);
    byAction.set(u.action, a);
    if (u.action === "planner") byDay.set(u.used_on, (byDay.get(u.used_on) ?? 0) + u.count);
  }
  const planner = byAction.get("planner") ?? { total: 0, today: 0, month: 0, users: new Set<string>() };

  // ── 2) 실제 비용 (ai_runs: 이번 업데이트 이후부터 기록) ──
  const runsMissing = !!runsRes.error;
  const runs = (runsRes.data ?? []).filter((r) => r.action === "planner");
  const runsCost = runs.reduce((s, r) => s + Number(r.cost_usd), 0);
  const avgUsd = runs.length > 0 ? runsCost / runs.length : PLANNER_EST_USD;
  const avgIsMeasured = runs.length > 0;
  const failed = runs.filter((r) => !r.ok).length;
  const costByDay = new Map<string, { n: number; usd: number }>();
  for (const r of runs) {
    const d = kstDate(new Date(r.created_at));
    const c = costByDay.get(d) ?? { n: 0, usd: 0 };
    c.n++;
    c.usd += Number(r.cost_usd);
    costByDay.set(d, c);
  }
  // 일수별 평균 비용
  const byDays = new Map<number, { n: number; usd: number }>();
  for (const r of runs) {
    const days = Number((r.meta as { days?: number } | null)?.days) || 0;
    if (!days) continue;
    const c = byDays.get(days) ?? { n: 0, usd: 0 };
    c.n++;
    c.usd += Number(r.cost_usd);
    byDays.set(days, c);
  }

  // ── 3) 첫 글 이벤트 ──
  const ev = eventRes.data ?? [];
  const evPeople = ev.length;
  const evGranted = ev.reduce((s, c) => s + c.granted, 0);
  const evRemaining = ev.reduce((s, c) => s + c.remaining, 0);
  const evActiveRemaining = ev
    .filter((c) => !c.expires_at || new Date(c.expires_at) > now)
    .reduce((s, c) => s + c.remaining, 0);
  const evUsed = evGranted - evRemaining;

  const days14 = Array.from({ length: 14 }, (_, i) => kstDate(new Date(now.getTime() - i * 86400000)));

  return (
    <div className="p-6 sm:p-8 max-w-5xl">
      <h1 className="text-2xl font-bold text-gray-900 mb-1">AI 사용량·비용</h1>
      <p className="text-sm text-gray-500 mb-8">
        AI 플래너를 실제로 몇 번 돌렸는지, 비용이 얼마나 들었는지 확인해요. (환율 1달러 ≈ ₩{KRW_PER_USD.toLocaleString()} 기준)
      </p>

      {(usageRes.error || runsMissing) && (
        <div className="mb-6 rounded-2xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900 flex gap-3">
          <AlertCircle className="w-5 h-5 shrink-0 mt-0.5" />
          <div>
            {usageRes.error && <p>사용량 표(ai_usage)를 읽지 못했어요: {usageRes.error.message}</p>}
            {runsMissing && (
              <p>
                <b>실제 비용 기록 표가 아직 없어요.</b> Supabase SQL Editor에서{" "}
                <code className="px-1 bg-white rounded">supabase/migration_ai_runs.sql</code> 을 한 번 실행하면, 그 뒤로 AI를 돌릴
                때마다 실제 비용이 쌓여요. 그 전까지는 1회 약 {won(PLANNER_EST_USD)}(4일 일정 기준 추정)으로 계산해요.
              </p>
            )}
          </div>
        </div>
      )}

      {/* 실행 횟수 */}
      <section className="mb-8">
        <h2 className="flex items-center gap-2 font-bold text-gray-900 mb-3">
          <Bot className="w-5 h-5 text-indigo-600" /> 실제 실행 횟수
        </h2>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <Stat label="AI 플래너 누적" value={`${planner.total.toLocaleString()}회`} />
          <Stat label="이번 달" value={`${planner.month.toLocaleString()}회`} />
          <Stat label="오늘" value={`${planner.today.toLocaleString()}회`} />
          <Stat label="사용한 사람" value={`${planner.users.size.toLocaleString()}명`} />
        </div>
        {[...byAction.entries()].filter(([k]) => k !== "planner").length > 0 && (
          <p className="text-xs text-gray-500 mt-2">
            그 외:{" "}
            {[...byAction.entries()]
              .filter(([k]) => k !== "planner")
              .map(([k, v]) => `${ACTION_LABEL[k] ?? k} ${v.total}회`)
              .join(" · ")}
          </p>
        )}
        <p className="text-xs text-gray-400 mt-1">관리자 테스트 실행도 포함돼요. 이용권으로 돌린 횟수도 포함돼요.</p>
      </section>

      {/* 비용 */}
      <section className="mb-8">
        <h2 className="flex items-center gap-2 font-bold text-gray-900 mb-3">
          <Coins className="w-5 h-5 text-amber-500" /> 비용
        </h2>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <Stat
            label={avgIsMeasured ? "1회 평균 (실측)" : "1회 평균 (추정)"}
            value={won(avgUsd)}
            sub={`$${avgUsd.toFixed(3)}`}
          />
          <Stat label="누적 추정 비용" value={won(planner.total * avgUsd)} sub={`${planner.total}회 × 평균`} />
          <Stat label="이번 달 추정" value={won(planner.month * avgUsd)} />
          <Stat
            label="실측 합계"
            value={runsMissing ? "—" : won(runsCost)}
            sub={runsMissing ? "기록 표 필요" : `기록 ${runs.length}회${failed ? ` · 실패 ${failed}` : ""}`}
          />
        </div>
        {byDays.size > 0 && (
          <div className="mt-3 rounded-2xl border border-gray-200 bg-white p-4">
            <p className="text-sm font-semibold text-gray-800 mb-2">여행 일수별 1회 평균 비용 (실측)</p>
            <div className="flex flex-wrap gap-2">
              {[...byDays.entries()]
                .sort((a, b) => a[0] - b[0])
                .map(([d, c]) => (
                  <span key={d} className="text-xs rounded-full bg-gray-100 px-3 py-1 text-gray-700">
                    {d}일 · {won(c.usd / c.n)} ({c.n}회)
                  </span>
                ))}
            </div>
          </div>
        )}
      </section>

      {/* 첫 글 이벤트 */}
      <section className="mb-8">
        <h2 className="flex items-center gap-2 font-bold text-gray-900 mb-3">
          <Gift className="w-5 h-5 text-rose-500" /> 첫 글 이벤트 (AI 플래너 {FIRST_POST_EVENT.reward}회 이용권)
        </h2>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <Stat label="받은 사람" value={`${evPeople}명`} sub={`지급 ${evGranted}회분`} />
          <Stat label="사용한 이용권" value={`${evUsed}회`} sub={`비용 약 ${won(evUsed * avgUsd)}`} />
          <Stat label="남은 이용권 (유효)" value={`${evActiveRemaining}회`} sub={`최대 추가 ${won(evActiveRemaining * avgUsd)}`} />
          <Stat
            label="1명당 최대 비용"
            value={won(FIRST_POST_EVENT.reward * avgUsd)}
            sub={`${FIRST_POST_EVENT.reward}회 × 평균`}
          />
        </div>
        <p className="text-xs text-gray-500 mt-2">
          참고: 100명 참여 시 최대 약 {won(100 * FIRST_POST_EVENT.reward * avgUsd)}, 1,000명이면 약{" "}
          {won(1000 * FIRST_POST_EVENT.reward * avgUsd)} (모두 3회를 다 쓴다고 가정한 최댓값 — 실제로는 더 적어요)
        </p>
      </section>

      {/* 최근 14일 */}
      <section>
        <h2 className="font-bold text-gray-900 mb-3">최근 14일</h2>
        <div className="overflow-x-auto rounded-2xl border border-gray-200 bg-white">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 text-gray-500">
              <tr>
                <th className="text-left px-4 py-2 font-medium">날짜</th>
                <th className="text-right px-4 py-2 font-medium">플래너 실행</th>
                <th className="text-right px-4 py-2 font-medium">실측 비용</th>
              </tr>
            </thead>
            <tbody>
              {days14.map((d) => {
                const n = byDay.get(d) ?? 0;
                const c = costByDay.get(d);
                return (
                  <tr key={d} className="border-t border-gray-100">
                    <td className="px-4 py-2 text-gray-700">{d}</td>
                    <td className="px-4 py-2 text-right tabular-nums">{n ? `${n}회` : "-"}</td>
                    <td className="px-4 py-2 text-right tabular-nums">{c ? `${won(c.usd)} (${c.n}회)` : "-"}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}

function Stat({ label, value, sub }: { label: string; value: string; sub?: string }) {
  return (
    <div className="rounded-2xl border border-gray-200 bg-white p-4 min-w-0">
      <p className="text-xs text-gray-500 truncate">{label}</p>
      <p className="text-xl font-bold text-gray-900 mt-1 truncate tabular-nums">{value}</p>
      {sub && <p className="text-[11px] text-gray-400 mt-0.5 truncate">{sub}</p>}
    </div>
  );
}
