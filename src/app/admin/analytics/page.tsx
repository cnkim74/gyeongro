// 방문 통계 (구글 애널리틱스 GA4) — 관리자
import Link from "next/link";
import { requireAdmin } from "@/lib/admin";
import { gaDashboard, gaReady, type GaSummary } from "@/lib/ga";
import { BarChart3, CheckCircle2, Circle, ExternalLink, Radio } from "lucide-react";

export const dynamic = "force-dynamic";
export const metadata = { title: "방문 통계 - Pothos 관리자" };

const PERIODS = [
  { v: 7, label: "최근 7일" },
  { v: 28, label: "최근 28일" },
  { v: 90, label: "최근 90일" },
];

const CHANNEL_KO: Record<string, string> = {
  "Organic Search": "검색 (네이버·구글 등)",
  Direct: "직접 방문 (주소 입력·북마크·앱)",
  Referral: "다른 사이트 링크",
  "Organic Social": "SNS (스레드·인스타 등)",
  "Paid Search": "검색 광고",
  "Paid Social": "SNS 광고",
  Email: "이메일",
  Unassigned: "분류 안 됨",
  "Organic Video": "동영상 (유튜브 등)",
};
const DEVICE_KO: Record<string, string> = { mobile: "📱 모바일", desktop: "💻 PC", tablet: "📟 태블릿", "smart tv": "📺 TV" };

function fmtDuration(sec: number) {
  const m = Math.floor(sec / 60);
  const s = Math.round(sec % 60);
  return m ? `${m}분 ${s}초` : `${s}초`;
}

function change(cur: number, prev: number) {
  if (!prev) return null;
  return Math.round(((cur - prev) / prev) * 100);
}

function Stat({ label, value, cur, prev, note }: { label: string; value: string; cur: number; prev: number; note?: string }) {
  const c = change(cur, prev);
  return (
    <div className="rounded-2xl border border-gray-200 bg-white p-4 min-w-0">
      <p className="text-xs text-gray-500 truncate">{label}</p>
      <p className="text-2xl font-extrabold text-gray-900 mt-1 tabular-nums truncate">{value}</p>
      <p className="text-[11px] mt-0.5 truncate">
        {c === null ? (
          <span className="text-gray-400">{note ?? "이전 기간 데이터 없음"}</span>
        ) : (
          <span className={c >= 0 ? "text-emerald-600 font-semibold" : "text-rose-500 font-semibold"}>
            {c >= 0 ? "▲" : "▼"} {Math.abs(c)}% <span className="text-gray-400 font-normal">이전 기간 대비</span>
          </span>
        )}
      </p>
    </div>
  );
}

function Bars({ title, items, unit }: { title: string; items: { name: string; value: number }[]; unit: string }) {
  const peak = Math.max(1, ...items.map((i) => i.value));
  const total = items.reduce((s, i) => s + i.value, 0);
  return (
    <div className="bg-white rounded-2xl border border-gray-100 p-5">
      <p className="font-bold text-gray-900">{title}</p>
      {items.length === 0 ? (
        <p className="mt-3 text-sm text-gray-400">아직 데이터가 없어요.</p>
      ) : (
        <ul className="mt-3 space-y-2">
          {items.map((i) => (
            <li key={i.name} className="text-sm">
              <div className="flex justify-between gap-2">
                <span className="text-gray-700 truncate">{i.name || "(알 수 없음)"}</span>
                <span className="shrink-0 text-gray-500 tabular-nums">
                  {i.value.toLocaleString()}
                  {unit} <span className="text-gray-400">· {total ? Math.round((i.value / total) * 100) : 0}%</span>
                </span>
              </div>
              <div className="mt-1 h-1.5 rounded-full bg-gray-100 overflow-hidden">
                <div className="h-full rounded-full bg-indigo-500" style={{ width: `${(i.value / peak) * 100}%` }} />
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

function Setup({ ready, gaError }: { ready: ReturnType<typeof gaReady>; gaError: string | null }) {
  const steps = [
    {
      ok: ready.tag,
      title: "1. 사이트에 방문 기록 태그 달기",
      body: (
        <>
          analytics.google.com → 관리 → 속성 만들기(이름: Pothos, 시간대: 대한민국) → 데이터 스트림 → 웹 → <b>pothostravel.com</b> 입력 →
          나오는 <b>측정 ID(G-로 시작)</b>를 Vercel 환경변수 <code className="px-1 bg-gray-100 rounded">NEXT_PUBLIC_GA_ID</code> 에 넣고 Redeploy.
          이 단계만 해도 구글 애널리틱스 사이트에서 방문 기록을 볼 수 있어요.
        </>
      ),
    },
    {
      ok: ready.property,
      title: "2. 속성 ID 알려주기 (이 화면에서 보려면)",
      body: (
        <>
          GA 관리 → 속성 설정(속성 세부정보) 오른쪽 위의 <b>속성 ID(숫자)</b>를 Vercel 환경변수 <code className="px-1 bg-gray-100 rounded">GA4_PROPERTY_ID</code> 에 넣어 주세요.
        </>
      ),
    },
    {
      ok: ready.serviceAccount && ready.property && !gaError,
      title: "3. 서치콘솔용 서비스 계정에 읽기 권한 주기",
      body: (
        <>
          GA 관리 → 속성 액세스 관리 → ＋ → 이메일에{" "}
          <code className="px-1 bg-gray-100 rounded break-all">{ready.serviceAccountEmail ?? "(서치콘솔 서비스 계정 이메일)"}</code> 입력, 역할 <b>뷰어</b> → 추가.
          그리고 구글 클라우드 콘솔에서 같은 프로젝트의 <b>Google Analytics Data API</b>를 &lsquo;사용&rsquo;으로 켜 주세요.
          {gaError && <span className="block mt-1 text-rose-600">지금 오류: {gaError}</span>}
        </>
      ),
    },
  ];
  return (
    <div className="mt-6 rounded-2xl border border-indigo-100 bg-indigo-50/40 p-5">
      <p className="font-bold text-gray-900">연결 순서</p>
      <ul className="mt-3 space-y-3">
        {steps.map((s) => (
          <li key={s.title} className="flex gap-2.5">
            {s.ok ? <CheckCircle2 className="w-5 h-5 shrink-0 text-emerald-500 mt-0.5" /> : <Circle className="w-5 h-5 shrink-0 text-gray-300 mt-0.5" />}
            <div>
              <p className="font-semibold text-gray-900">{s.title}</p>
              <p className="text-sm text-gray-600 leading-relaxed mt-0.5">{s.body}</p>
            </div>
          </li>
        ))}
      </ul>
      <div className="mt-4 flex flex-wrap gap-2">
        <a href="https://analytics.google.com/" target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg bg-white border border-gray-200 text-xs font-bold text-gray-700">
          구글 애널리틱스 <ExternalLink className="w-3 h-3" />
        </a>
        <a
          href="https://console.cloud.google.com/apis/library/analyticsdata.googleapis.com"
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg bg-white border border-gray-200 text-xs font-bold text-gray-700"
        >
          Analytics Data API 켜기 <ExternalLink className="w-3 h-3" />
        </a>
      </div>
    </div>
  );
}

export default async function AnalyticsPage({ searchParams }: { searchParams: Promise<{ p?: string }> }) {
  await requireAdmin();
  const { p } = await searchParams;
  const days = PERIODS.some((x) => String(x.v) === p) ? Number(p) : 28;
  const ready = gaReady();
  const data = ready.property && ready.serviceAccount ? await gaDashboard(days) : null;
  const connected = !!data && !data.error;
  const s: GaSummary | null = data?.summary ?? null;
  const prev = data?.previous;
  const dayPeak = Math.max(1, ...(data?.daily ?? []).map((x) => x.views));

  return (
    <div className="p-6 sm:p-8 max-w-6xl">
      <h1 className="flex items-center gap-2 text-2xl font-bold text-gray-900 mb-1">
        <BarChart3 className="w-6 h-6 text-indigo-600" /> 방문 통계
      </h1>
      <p className="text-sm text-gray-500">구글 애널리틱스(GA4) 기준 방문자·페이지·유입 경로예요. 관리자 화면 방문은 기록하지 않아요.</p>

      {!connected && <Setup ready={ready} gaError={data?.error ?? null} />}

      {connected && s && prev && data && (
        <>
          <div className="mt-5 flex flex-wrap items-center gap-2">
            {PERIODS.map((x) => (
              <Link
                key={x.v}
                href={`/admin/analytics?p=${x.v}`}
                className={`px-3.5 py-1.5 rounded-full text-sm font-bold ${days === x.v ? "bg-gray-900 text-white" : "bg-gray-100 text-gray-600"}`}
              >
                {x.label}
              </Link>
            ))}
            <span className="ml-auto inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-emerald-50 text-emerald-700 text-sm font-bold">
              <Radio className="w-4 h-4" /> 지금 접속 중 {data.realtime.users}명
            </span>
          </div>

          <div className="mt-4 grid grid-cols-2 lg:grid-cols-6 gap-3">
            <Stat label="방문자" value={s.users.toLocaleString()} cur={s.users} prev={prev.users} />
            <Stat label="신규 방문자" value={s.newUsers.toLocaleString()} cur={s.newUsers} prev={prev.newUsers} />
            <Stat label="방문 횟수(세션)" value={s.sessions.toLocaleString()} cur={s.sessions} prev={prev.sessions} />
            <Stat label="페이지 조회" value={s.views.toLocaleString()} cur={s.views} prev={prev.views} />
            <Stat label="평균 머문 시간" value={fmtDuration(s.avgSessionSec)} cur={s.avgSessionSec} prev={prev.avgSessionSec} />
            <Stat label="참여율" value={`${Math.round(s.engagementRate * 100)}%`} cur={s.engagementRate} prev={prev.engagementRate} />
          </div>

          {/* 일별 */}
          <section className="mt-4 bg-white rounded-2xl border border-gray-100 p-5">
            <p className="font-bold text-gray-900">일별 추이</p>
            {data.daily.length === 0 ? (
              <p className="mt-3 text-sm text-gray-400">아직 데이터가 없어요. 태그를 단 뒤 하루쯤 지나면 쌓이기 시작해요.</p>
            ) : (
              <div className="mt-4 flex items-end gap-[2px] h-40">
                {data.daily.map((x) => (
                  <div key={x.date} className="flex-1 flex flex-col items-center min-w-0" title={`${x.date.slice(4, 6)}/${x.date.slice(6)} · 방문자 ${x.users} · 조회 ${x.views}`}>
                    <div className="w-full flex flex-col justify-end h-32 relative">
                      <div className="w-full bg-indigo-200 rounded-t-sm" style={{ height: `${(x.views / dayPeak) * 100}%` }} />
                      <div className="absolute bottom-0 left-0 right-0 bg-indigo-600 rounded-t-sm" style={{ height: `${(x.users / dayPeak) * 100}%` }} />
                    </div>
                    {data.daily.length <= 31 && <span className="mt-1 text-[9px] text-gray-400 tabular-nums">{Number(x.date.slice(6))}</span>}
                  </div>
                ))}
              </div>
            )}
            <p className="mt-2 text-[11px] text-gray-400">진한 색 = 방문자 · 연한 색 = 페이지 조회 (막대에 마우스를 올리면 숫자)</p>
          </section>

          {/* 인기 페이지 */}
          <section className="mt-4 bg-white rounded-2xl border border-gray-100 p-5">
            <p className="font-bold text-gray-900">많이 본 페이지</p>
            <div className="mt-3 overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="text-gray-400 text-xs">
                  <tr>
                    <th className="text-left font-medium py-1.5">페이지</th>
                    <th className="text-right font-medium py-1.5 w-20">조회</th>
                    <th className="text-right font-medium py-1.5 w-20">방문자</th>
                  </tr>
                </thead>
                <tbody>
                  {data.pages.map((pg) => (
                    <tr key={pg.path + pg.title} className="border-t border-gray-50">
                      <td className="py-1.5 pr-3">
                        <a href={pg.path} target="_blank" rel="noopener noreferrer" className="block min-w-0 hover:text-indigo-600">
                          <span className="block truncate max-w-[520px] text-gray-800">{pg.title.replace(/ \| Pothos.*$| - Pothos.*$/, "") || pg.path}</span>
                          <span className="block truncate max-w-[520px] text-[11px] text-gray-400">{decodeURIComponent(pg.path)}</span>
                        </a>
                      </td>
                      <td className="py-1.5 text-right tabular-nums">{pg.views.toLocaleString()}</td>
                      <td className="py-1.5 text-right tabular-nums text-gray-500">{pg.users.toLocaleString()}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>

          <div className="mt-4 grid md:grid-cols-2 lg:grid-cols-3 gap-4">
            <Bars title="어디서 왔나 (유입 경로)" items={data.channels.map((c) => ({ name: CHANNEL_KO[c.name] ?? c.name, value: c.sessions }))} unit="회" />
            <Bars title="유입 사이트 (출처 / 매체)" items={data.sources.map((c) => ({ name: c.name, value: c.sessions }))} unit="회" />
            <Bars title="기기" items={data.devices.map((c) => ({ name: DEVICE_KO[c.name] ?? c.name, value: c.users }))} unit="명" />
            <Bars title="국가" items={data.countries.map((c) => ({ name: c.name, value: c.users }))} unit="명" />
            <Bars title="도시" items={data.cities.map((c) => ({ name: c.name, value: c.users }))} unit="명" />
            <Bars title="지금 보고 있는 화면 (실시간)" items={data.realtime.pages.map((c) => ({ name: c.name, value: c.users }))} unit="명" />
          </div>

          <p className="mt-4 text-[11px] text-gray-400">
            더 자세한 분석은{" "}
            <a href="https://analytics.google.com/" target="_blank" rel="noopener noreferrer" className="underline">
              구글 애널리틱스
            </a>
            에서 볼 수 있어요. 숫자는 몇 시간 늦게 반영될 수 있어요 (실시간 제외).
          </p>
        </>
      )}
    </div>
  );
}
