import Link from "next/link";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { CalendarDays, MapPin, PartyPopper, Sparkles, Search } from "lucide-react";
import {
  listFestivals,
  isTourApiEnabled,
  ymd,
  formatYmd,
  regionOf,
  REGIONS,
  type FestivalSummary,
} from "@/lib/tourapi";
import { GLOBAL_FESTIVALS } from "@/lib/global-festivals";

export const metadata = {
  title: "축제·행사 찾기 - Pothos",
  description: "전국 축제·행사와 세계 대표 축제를 찾고, 축제 일정에 맞춘 여행 코스를 AI로 만들어 보세요.",
};

// 공공데이터는 fetch 단위로 캐시(6시간) — 페이지는 요청마다 필터 적용
export const dynamic = "force-dynamic";

type Search = { tab?: string; ym?: string; region?: string; kind?: string };

function monthOptions(): { ym: string; label: string; month: number }[] {
  const now = new Date(Date.now() + 9 * 3600 * 1000);
  const out = [];
  for (let i = 0; i < 12; i++) {
    const d = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth() + i, 1));
    const y = d.getUTCFullYear();
    const m = d.getUTCMonth() + 1;
    out.push({
      ym: `${y}${String(m).padStart(2, "0")}`,
      label: i === 0 ? "이번 달" : y !== now.getUTCFullYear() ? `${y}.${m}월` : `${m}월`,
      month: m,
    });
  }
  return out;
}

function lastDayOf(ym: string): string {
  const y = Number(ym.slice(0, 4));
  const m = Number(ym.slice(4, 6));
  const d = new Date(Date.UTC(y, m, 0)).getUTCDate();
  return `${ym}${String(d).padStart(2, "0")}`;
}

function badge(f: FestivalSummary, today: string): { text: string; cls: string } | null {
  if (!f.startDate) return null;
  if (f.startDate <= today && (!f.endDate || f.endDate >= today)) {
    return { text: "진행 중", cls: "bg-emerald-500" };
  }
  if (f.startDate > today) {
    const toDate = (s: string) => Date.UTC(+s.slice(0, 4), +s.slice(4, 6) - 1, +s.slice(6, 8));
    const days = Math.round((toDate(f.startDate) - toDate(today)) / 86400000);
    return { text: days === 0 ? "오늘 시작" : `D-${days}`, cls: "bg-blue-600" };
  }
  return null;
}

function qs(base: Search, patch: Partial<Search>): string {
  const p = new URLSearchParams();
  const merged = { ...base, ...patch };
  for (const [k, v] of Object.entries(merged)) if (v) p.set(k, v);
  const s = p.toString();
  return s ? `/festivals?${s}` : "/festivals";
}

export default async function FestivalsPage({ searchParams }: { searchParams: Promise<Search> }) {
  const sp = await searchParams;
  const tab = sp.tab === "global" ? "global" : "kr";
  const months = monthOptions();
  const ym = months.some((m) => m.ym === sp.ym) ? sp.ym! : months[0].ym;
  const month = Number(ym.slice(4, 6));
  const region = REGIONS.includes(sp.region as (typeof REGIONS)[number]) ? sp.region! : "";
  const kind = sp.kind === "festival" || sp.kind === "event" ? sp.kind : "";
  const base: Search = { tab: tab === "global" ? "global" : undefined, ym: sp.ym, region: region || undefined, kind: kind || undefined };
  const today = ymd(new Date());

  let festivals: FestivalSummary[] = [];
  let hasCat = false;
  if (tab === "kr" && isTourApiEnabled()) {
    const from = ym === months[0].ym ? today : `${ym}01`;
    const all = await listFestivals(from, lastDayOf(ym));
    hasCat = all.some((f) => f.cat2);
    festivals = all
      .filter((f) => !f.endDate || f.endDate >= today)
      .filter((f) => !region || regionOf(f.addr) === region)
      .filter((f) => !kind || (kind === "festival" ? f.cat2 === "A0207" : f.cat2 !== "A0207"));
  }
  const globals = GLOBAL_FESTIVALS.filter((f) => f.months.includes(month));

  const chip = (active: boolean) =>
    `shrink-0 px-4 py-2 rounded-full text-[15px] font-semibold transition-colors ${
      active ? "bg-slate-900 text-white" : "bg-white text-slate-700 border border-slate-200 hover:bg-slate-50"
    }`;

  return (
    <div className="flex flex-col min-h-screen bg-gray-50">
      <Header />
      <main className="flex-1 pt-24 pb-16">
        <div className="max-w-6xl mx-auto px-4">
          <div className="text-center mb-8">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-rose-50 text-rose-600 text-sm font-semibold mb-4">
              <PartyPopper className="w-4 h-4" /> 축제·행사 찾기
            </div>
            <h1 className="text-[28px] sm:text-4xl font-extrabold text-gray-900 mb-3">
              축제에 맞춰 떠나는 여행
            </h1>
            <p className="text-base sm:text-lg text-gray-600">
              가고 싶은 축제를 고르면 AI가 축제 날짜에 맞춘 여행 일정을 만들어 드려요
            </p>
          </div>

          {/* 국내 / 해외 */}
          <div className="flex justify-center gap-2 mb-5">
            <Link href={qs(base, { tab: undefined, region: undefined, kind: undefined })} className={chip(tab === "kr")}>
              🇰🇷 국내 축제·행사
            </Link>
            <Link href={qs(base, { tab: "global", region: undefined, kind: undefined })} className={chip(tab === "global")}>
              🌍 세계 대표 축제
            </Link>
          </div>

          {/* 월 선택 */}
          <div className="flex gap-2 overflow-x-auto pb-3 mb-2 -mx-4 px-4">
            {months.map((m) => (
              <Link key={m.ym} href={qs(base, { ym: m.ym === months[0].ym ? undefined : m.ym })} className={chip(m.ym === ym)}>
                {m.label}
              </Link>
            ))}
          </div>

          {tab === "kr" && (
            <>
              {/* 지역 */}
              <div className="flex gap-2 overflow-x-auto pb-3 mb-2 -mx-4 px-4">
                <Link href={qs(base, { region: undefined })} className={chip(!region)}>
                  전국
                </Link>
                {REGIONS.map((r) => (
                  <Link key={r} href={qs(base, { region: r })} className={chip(region === r)}>
                    {r}
                  </Link>
                ))}
              </div>
              {hasCat && (
                <div className="flex gap-2 mb-6">
                  <Link href={qs(base, { kind: undefined })} className={chip(!kind)}>전체</Link>
                  <Link href={qs(base, { kind: "festival" })} className={chip(kind === "festival")}>🎉 축제</Link>
                  <Link href={qs(base, { kind: "event" })} className={chip(kind === "event")}>🎪 공연·행사·박람회</Link>
                </div>
              )}

              {!isTourApiEnabled() ? (
                <div className="bg-white rounded-3xl p-10 text-center text-gray-600 text-base">
                  국내 축제 정보를 준비 중이에요. 잠시 후 다시 확인해 주세요.
                </div>
              ) : festivals.length === 0 ? (
                <div className="bg-white rounded-3xl p-10 text-center text-gray-600 text-base">
                  조건에 맞는 축제·행사가 없어요. 다른 달이나 지역을 선택해 보세요.
                </div>
              ) : (
                <>
                  <p className="text-[15px] text-gray-500 mb-4">
                    {festivals.length}개의 축제·행사 · 출처: 한국관광공사
                  </p>
                  <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
                    {festivals.map((f) => {
                      const b = badge(f, today);
                      return (
                        <Link
                          key={f.contentId}
                          href={`/festivals/${f.contentId}`}
                          className="group bg-white rounded-3xl overflow-hidden border border-gray-100 shadow-sm hover:shadow-lg transition-all"
                        >
                          <div className="relative aspect-[16/10] bg-gradient-to-br from-rose-100 to-orange-100">
                            {f.thumb ? (
                              // eslint-disable-next-line @next/next/no-img-element
                              <img src={f.image ?? f.thumb} alt={f.title} className="w-full h-full object-cover" loading="lazy" />
                            ) : (
                              <div className="w-full h-full flex items-center justify-center text-5xl">🎉</div>
                            )}
                            {b && (
                              <span className={`absolute top-3 left-3 px-3 py-1 rounded-full text-white text-sm font-bold ${b.cls}`}>
                                {b.text}
                              </span>
                            )}
                          </div>
                          <div className="p-5">
                            <h2 className="text-lg font-bold text-gray-900 leading-snug mb-2 group-hover:text-rose-600">
                              {f.title}
                            </h2>
                            <p className="flex items-center gap-1.5 text-[15px] text-gray-600">
                              <CalendarDays className="w-4 h-4 shrink-0" />
                              {formatYmd(f.startDate)} ~ {formatYmd(f.endDate)}
                            </p>
                            {f.addr && (
                              <p className="flex items-center gap-1.5 text-[15px] text-gray-500 mt-1">
                                <MapPin className="w-4 h-4 shrink-0" />
                                <span className="truncate">{f.addr}</span>
                              </p>
                            )}
                          </div>
                        </Link>
                      );
                    })}
                  </div>
                </>
              )}
            </>
          )}

          {tab === "global" && (
            <>
              <p className="text-[15px] text-gray-500 mb-4 mt-2">
                {month}월에 열리는 세계 대표 축제 · 개최일은 해마다 달라지니 출발 전 공식 정보를 꼭 확인하세요
              </p>
              {globals.length === 0 ? (
                <div className="bg-white rounded-3xl p-10 text-center text-gray-600 text-base">
                  이 달에 등록된 세계 대표 축제가 없어요. 다른 달을 선택해 보세요.
                </div>
              ) : (
                <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
                  {globals.map((f) => (
                    <div key={f.id} className="bg-white rounded-3xl border border-gray-100 shadow-sm p-6 flex flex-col">
                      <div className="text-5xl mb-3">{f.emoji}</div>
                      <p className="text-sm font-semibold text-gray-500 mb-1">
                        {f.flag} {f.country} · {f.city}
                      </p>
                      <h2 className="text-lg font-bold text-gray-900 leading-snug">{f.name}</h2>
                      <p className="text-sm text-gray-400 mb-2">{f.nameEn}</p>
                      <p className="flex items-center gap-1.5 text-[15px] text-rose-600 font-semibold mb-2">
                        <CalendarDays className="w-4 h-4" /> {f.period}
                      </p>
                      <p className="text-[15px] text-gray-700 leading-relaxed flex-1">{f.summary}</p>
                      <div className="flex gap-2 mt-4">
                        <Link
                          href={`/planner?gfest=${f.id}`}
                          className="flex-1 inline-flex items-center justify-center gap-1.5 py-3 rounded-2xl bg-gradient-to-r from-rose-500 to-orange-500 text-white text-[15px] font-bold"
                        >
                          <Sparkles className="w-4 h-4" /> 이 축제로 일정 만들기
                        </Link>
                        <a
                          href={`https://www.google.com/search?q=${encodeURIComponent(`${f.nameEn} ${new Date().getFullYear()} dates`)}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center justify-center px-4 rounded-2xl border border-gray-200 text-gray-700"
                          title="올해 개최일 검색"
                        >
                          <Search className="w-5 h-5" />
                        </a>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </>
          )}
        </div>
      </main>
      <Footer />
    </div>
  );
}
