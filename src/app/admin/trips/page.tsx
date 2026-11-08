// 회원 여행 일정 — 관심사 분석 + 저장된 일정 목록 (관리자)
import Link from "next/link";
import { requireAdmin, listAdminIds } from "@/lib/admin";
import { getSupabaseServiceClient } from "@/lib/supabase";
import { tripInsights, destinationKey, type Count } from "@/lib/trip-insights";
import { themeLabel, PLANNER_STYLES } from "@/lib/planner-options";
import { MapPin, Calendar, Users, PenSquare } from "lucide-react";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "회원 여행 일정 - Pothos",
};

const PERIODS = [
  { v: 30, label: "최근 30일" },
  { v: 90, label: "최근 90일" },
  { v: 365, label: "최근 1년" },
];

function BarList({ title, items, max = 8, unit = "건", note }: { title: string; items: Count[]; max?: number; unit?: string; note?: string }) {
  const top = items.slice(0, max);
  const peak = Math.max(1, ...top.map((i) => i.count));
  const total = items.reduce((n, i) => n + i.count, 0);
  return (
    <div className="bg-white rounded-2xl border border-gray-100 p-5">
      <p className="font-bold text-gray-900">{title}</p>
      {note && <p className="text-[11px] text-gray-400 mt-0.5">{note}</p>}
      {top.length === 0 ? (
        <p className="mt-3 text-sm text-gray-400">아직 데이터가 없어요.</p>
      ) : (
        <ul className="mt-3 space-y-2">
          {top.map((i) => (
            <li key={i.key} className="text-sm">
              <div className="flex justify-between gap-2">
                <span className="text-gray-700 truncate">{i.label}</span>
                <span className="shrink-0 text-gray-500 tabular-nums">
                  {i.count}
                  {unit} <span className="text-gray-400">· {total ? Math.round((i.count / total) * 100) : 0}%</span>
                </span>
              </div>
              <div className="mt-1 h-1.5 rounded-full bg-gray-100 overflow-hidden">
                <div className="h-full rounded-full bg-blue-500" style={{ width: `${(i.count / peak) * 100}%` }} />
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

export default async function AdminTripsPage({
  searchParams,
}: {
  searchParams: Promise<{ p?: string; d?: string; admins?: string }>;
}) {
  await requireAdmin();
  const sp = await searchParams;
  const period = PERIODS.some((x) => String(x.v) === sp.p) ? Number(sp.p) : 90;
  const includeAdmins = sp.admins === "1";
  const destFilter = sp.d ? destinationKey(sp.d) : "";

  const supabase = getSupabaseServiceClient();
  const [insights, plansRes, admins] = await Promise.all([
    tripInsights(period, !includeAdmins),
    supabase
      .from("travel_plans")
      .select("id, title, destination, days, people, budget, travel_style, themes, created_at, user_id")
      .order("created_at", { ascending: false })
      .limit(500),
    includeAdmins ? Promise.resolve([] as string[]) : listAdminIds(),
  ]);
  const adminSet = new Set(admins);
  const allPlans = (plansRes.data ?? []).filter((t) => !adminSet.has(t.user_id));
  const plans = (destFilter ? allPlans.filter((t) => destinationKey(t.destination) === destFilter) : allPlans).slice(0, 100);

  const userIds = [...new Set(plans.map((t) => t.user_id))];
  const usersMap: Record<string, string> = {};
  if (userIds.length > 0) {
    const { data: users } = await supabase.schema("next_auth").from("users").select("id, nickname, name, email").in("id", userIds);
    for (const u of users ?? []) usersMap[u.id] = u.nickname ?? u.name ?? u.email ?? "익명";
  }

  const q = (o: Record<string, string | number | undefined>) => {
    const s = new URLSearchParams();
    const merged = { p: period, d: sp.d, admins: includeAdmins ? "1" : undefined, ...o };
    for (const [k, v] of Object.entries(merged)) if (v !== undefined && v !== "") s.set(k, String(v));
    return `/admin/trips?${s.toString()}`;
  };

  const t = insights.totals;
  const topDest = insights.destinations.slice(0, 15);
  const peakDest = Math.max(1, ...topDest.map((d) => d.requests + d.saves));
  const ideas = insights.destinations.filter((d) => d.users >= 2 && d.blogPosts === 0).slice(0, 6);
  const weekPeak = Math.max(1, ...insights.weekly.map((w) => w.requests + w.saves));

  return (
    <div className="p-6 lg:p-10 max-w-6xl">
      <h1 className="text-2xl font-bold text-gray-900 mb-1">회원 여행 일정 · 관심사</h1>
      <p className="text-sm text-gray-500">
        회원들이 AI 플래너로 <b>만든 일정(생성 요청)</b>과 <b>저장한 일정</b>을 모아, 어디에 · 어떤 여행에 관심이 많은지 보여줘요.
      </p>

      <div className="mt-5 flex flex-wrap items-center gap-2">
        {PERIODS.map((x) => (
          <Link
            key={x.v}
            href={q({ p: x.v })}
            className={`px-3.5 py-1.5 rounded-full text-sm font-bold ${period === x.v ? "bg-gray-900 text-white" : "bg-gray-100 text-gray-600"}`}
          >
            {x.label}
          </Link>
        ))}
        <Link href={q({ admins: includeAdmins ? undefined : "1" })} className="ml-auto text-xs font-semibold text-gray-500 hover:text-gray-800">
          {includeAdmins ? "☑ 관리자 계정 포함됨 (빼기)" : "☐ 관리자 계정 제외됨 (포함하기)"}
        </Link>
      </div>

      {/* 요약 */}
      <div className="mt-4 grid grid-cols-2 lg:grid-cols-4 gap-3">
        {[
          { label: "일정 생성 요청", value: t.requests.toLocaleString(), note: "AI 플래너 실행 (완성된 것)" },
          { label: "저장한 일정", value: t.saves.toLocaleString(), note: "내 여행에 저장" },
          { label: "참여 회원", value: t.users.toLocaleString(), note: "만들거나 저장한 회원" },
          { label: "저장률", value: `${t.saveRate}%`, note: "저장 ÷ 생성" },
        ].map((s) => (
          <div key={s.label} className="bg-white rounded-2xl border border-gray-100 p-4">
            <p className="text-xs text-gray-500">{s.label}</p>
            <p className="mt-1 text-2xl font-extrabold text-gray-900 tabular-nums">{s.value}</p>
            <p className="text-[11px] text-gray-400">{s.note}</p>
          </div>
        ))}
      </div>

      {/* 인기 목적지 */}
      <section className="mt-6 bg-white rounded-2xl border border-gray-100 p-5">
        <div className="flex flex-wrap items-baseline justify-between gap-2">
          <p className="font-bold text-gray-900">🔥 인기 목적지</p>
          <p className="text-[11px] text-gray-400">관심 회원 수 순 · 막대 = 생성(파랑) + 저장(초록) · 누르면 아래 일정 목록이 그 목적지로 걸러져요</p>
        </div>
        {topDest.length === 0 ? (
          <p className="mt-3 text-sm text-gray-400">이 기간에 만든 일정이 없어요.</p>
        ) : (
          <ul className="mt-3 divide-y divide-gray-50">
            {topDest.map((d, i) => (
              <li key={d.key}>
                <Link href={q({ d: d.label })} className={`flex items-center gap-3 py-2 ${destFilter === d.key ? "bg-blue-50/60 -mx-2 px-2 rounded-lg" : ""}`}>
                  <span className="w-5 text-xs font-bold text-gray-400 tabular-nums">{i + 1}</span>
                  <span className="w-32 sm:w-40 truncate font-semibold text-gray-800">{d.label}</span>
                  <span className="flex-1 h-2.5 rounded-full bg-gray-100 overflow-hidden flex">
                    <span className="h-full bg-blue-500" style={{ width: `${(d.requests / peakDest) * 100}%` }} />
                    <span className="h-full bg-emerald-500" style={{ width: `${(d.saves / peakDest) * 100}%` }} />
                  </span>
                  <span className="shrink-0 w-44 text-right text-xs text-gray-500 tabular-nums">
                    회원 {d.users} · 생성 {d.requests} · 저장 {d.saves}
                  </span>
                  <span
                    className={`hidden sm:inline shrink-0 w-20 text-right text-[11px] font-bold ${d.blogPosts ? "text-gray-400" : "text-orange-600"}`}
                  >
                    {d.blogPosts ? `블로그 ${d.blogPosts}편` : "블로그 없음"}
                  </span>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </section>

      {/* 글감 추천 */}
      {ideas.length > 0 && (
        <section className="mt-4 rounded-2xl border border-orange-100 bg-orange-50/60 p-5">
          <p className="font-bold text-gray-900">✍️ 블로그·스토리 글감 추천</p>
          <p className="text-xs text-gray-500 mt-0.5">회원 2명 이상이 관심을 보였는데 아직 블로그 글이 없는 목적지예요.</p>
          <div className="mt-3 flex flex-wrap gap-2">
            {ideas.map((d) => (
              <Link
                key={d.key}
                href={`/admin/blog?topic=${encodeURIComponent(`${d.label} 여행`)}`}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-white border border-orange-200 text-sm font-semibold text-orange-700 hover:bg-orange-100"
              >
                <PenSquare className="w-3.5 h-3.5" /> {d.label} <span className="text-xs text-orange-400">회원 {d.users}</span>
              </Link>
            ))}
          </div>
        </section>
      )}

      {/* 취향 */}
      <div className="mt-4 grid md:grid-cols-2 lg:grid-cols-3 gap-4">
        <BarList title="🎯 관심 테마" items={insights.themes} max={10} note="한 일정에 여러 개 선택 가능" />
        <BarList title="⏱ 여행 기간" items={insights.lengths} />
        <BarList title="👥 인원" items={insights.party} />
        <BarList title="💰 1인 예산" items={insights.budgets} />
        <BarList title="🚶 여행 스타일" items={insights.styles} />
        <BarList title="🗓 출발 시기" items={insights.travelMonths} note="출발일을 고른 요청만" />
      </div>

      {/* 주별 추이 */}
      <section className="mt-4 bg-white rounded-2xl border border-gray-100 p-5">
        <p className="font-bold text-gray-900">📈 주별 추이 (최근 16주)</p>
        {insights.weekly.length === 0 ? (
          <p className="mt-3 text-sm text-gray-400">아직 데이터가 없어요.</p>
        ) : (
          <div className="mt-4 flex items-end gap-1.5 h-32">
            {insights.weekly.map((w) => (
              <div key={w.week} className="flex-1 flex flex-col items-center gap-1 min-w-0" title={`${w.week} 주 · 생성 ${w.requests} · 저장 ${w.saves}`}>
                <div className="w-full flex flex-col justify-end h-24">
                  <div className="w-full bg-emerald-500 rounded-t-sm" style={{ height: `${(w.saves / weekPeak) * 100}%` }} />
                  <div className="w-full bg-blue-500" style={{ height: `${(w.requests / weekPeak) * 100}%` }} />
                </div>
                <span className="text-[10px] text-gray-400 tabular-nums">{w.week.slice(5).replace("-", "/")}</span>
              </div>
            ))}
          </div>
        )}
        <p className="mt-2 text-[11px] text-gray-400">파랑 = 생성 요청 · 초록 = 저장</p>
      </section>

      {/* 저장된 일정 목록 */}
      <section className="mt-8">
        <div className="flex flex-wrap items-center gap-2 mb-3">
          <h2 className="text-lg font-bold text-gray-900">저장된 일정 {destFilter ? `· ${sp.d}` : ""}</h2>
          <span className="text-sm text-gray-400">{plans.length}개 (최근 100개)</span>
          {destFilter && (
            <Link href={q({ d: undefined })} className="text-xs font-bold text-blue-600">
              전체 보기
            </Link>
          )}
        </div>
        {plans.length === 0 ? (
          <div className="bg-white rounded-3xl border border-gray-100 p-12 text-center">
            <MapPin className="w-12 h-12 text-gray-300 mx-auto mb-3" />
            <p className="text-gray-500">저장된 여행 일정이 없어요.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {plans.map((t) => (
              <Link
                key={t.id}
                href={`/admin/trips/${t.id}`}
                className="block bg-white rounded-2xl border border-gray-100 p-5 hover:shadow-md hover:border-blue-200 transition-all"
              >
                <div className="flex items-start justify-between mb-2">
                  <span className="inline-flex items-center gap-1 text-xs text-blue-500 font-medium bg-blue-50 px-2.5 py-1 rounded-full">
                    <MapPin className="w-3 h-3" />
                    {t.destination}
                  </span>
                  <span className="text-xs text-gray-400">{new Date(t.created_at).toLocaleDateString("ko-KR")}</span>
                </div>
                <h3 className="font-bold text-gray-900 mb-1 line-clamp-2">{t.title}</h3>
                <p className="text-xs text-gray-500 mb-3">by {usersMap[t.user_id] ?? "알 수 없음"}</p>
                <div className="flex flex-wrap items-center gap-3 text-xs text-gray-500">
                  <span className="flex items-center gap-1">
                    <Calendar className="w-3 h-3" />
                    {t.days}박 {t.days + 1}일
                  </span>
                  <span className="flex items-center gap-1">
                    <Users className="w-3 h-3" />
                    {t.people}명
                  </span>
                  <span className="text-emerald-600 font-semibold">{Number(t.budget).toLocaleString()}원</span>
                  {t.travel_style && <span>{PLANNER_STYLES[t.travel_style] ?? t.travel_style}</span>}
                </div>
                {Array.isArray(t.themes) && t.themes.length > 0 && (
                  <div className="mt-2 flex flex-wrap gap-1">
                    {t.themes.slice(0, 5).map((th: string) => (
                      <span key={th} className="px-2 py-0.5 rounded-full bg-gray-100 text-[11px] text-gray-600">
                        {themeLabel(th)}
                      </span>
                    ))}
                  </div>
                )}
              </Link>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
