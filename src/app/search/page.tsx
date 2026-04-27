import Link from "next/link";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import {
  Mountain,
  HeartPulse,
  Sparkles,
  Star,
  Search as SearchIcon,
  ArrowRight,
  Plane,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import { performSearch, type SearchType, type SortKey } from "@/lib/search";
import {
  SPECIALTY_BY_ID,
  LANGUAGE_BY_CODE,
  COUNTRY_FLAGS,
  formatRate,
} from "@/lib/sherpa";
import SearchFilters from "@/components/SearchFilters";
import SearchSort from "@/components/SearchSort";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "검색 - Pothos",
};

interface RawParams {
  q?: string;
  type?: string;
  country?: string;
  city?: string;
  language?: string;
  specialty?: string;
  direction?: string;
  category?: string;
  minPrice?: string;
  maxPrice?: string;
  minRating?: string;
  sort?: string;
  page?: string;
}

const VALID_TYPES = new Set(["all", "sherpa", "clinic", "theme"]);
const VALID_SORTS = new Set([
  "relevance",
  "rating",
  "price_asc",
  "price_desc",
  "newest",
]);

const PAGE_SIZE = 12;

function parseList(raw?: string): string[] {
  if (!raw) return [];
  return raw.split(",").map((s) => s.trim()).filter(Boolean);
}

export default async function SearchPage({
  searchParams,
}: {
  searchParams: Promise<RawParams>;
}) {
  const params = await searchParams;
  const q = (params.q ?? "").trim();
  const type: SearchType = VALID_TYPES.has(params.type ?? "")
    ? (params.type as SearchType)
    : "all";
  const sort: SortKey = VALID_SORTS.has(params.sort ?? "")
    ? (params.sort as SortKey)
    : "relevance";
  const page = Math.max(1, Number(params.page) || 1);

  const direction: "inbound" | "outbound" | null =
    params.direction === "inbound" || params.direction === "outbound"
      ? params.direction
      : null;

  const filters = {
    countries: parseList(params.country),
    city: (params.city ?? "").trim(),
    languages: parseList(params.language),
    specialties: parseList(params.specialty),
    direction,
    category: (params.category ?? "").trim(),
    minPrice: Number(params.minPrice) || 0,
    maxPrice: Number(params.maxPrice) || 0,
    minRating: Number(params.minRating) || 0,
  };

  const results = q
    ? await performSearch({
        q,
        type,
        sort,
        page,
        pageSize: PAGE_SIZE,
        ...filters,
      })
    : null;

  const total = results
    ? results.totals.sherpa + results.totals.clinic + results.totals.theme
    : 0;

  // 액티브 타입의 totals만 페이지네이션에 사용 (전체 탭은 합계)
  const activeTotal =
    type === "all"
      ? total
      : type === "sherpa"
      ? results?.totals.sherpa ?? 0
      : type === "clinic"
      ? results?.totals.clinic ?? 0
      : results?.totals.theme ?? 0;
  const totalPages = Math.max(1, Math.ceil(activeTotal / PAGE_SIZE));

  return (
    <div className="flex flex-col min-h-screen bg-white">
      <Header />

      <main className="flex-1 pt-24 pb-16">
        <div className="max-w-6xl mx-auto px-6">
          {/* 검색 박스 (echo) */}
          <form
            action="/search"
            method="get"
            className="mb-6 flex items-center gap-2 bg-white border border-slate-200 rounded-2xl p-2 focus-within:border-blue-400"
          >
            <SearchIcon className="w-4 h-4 text-slate-400 ml-2" />
            <input
              type="text"
              name="q"
              defaultValue={q}
              placeholder="셰르파·클리닉·테마 검색..."
              className="flex-1 px-2 py-2 outline-none text-slate-900"
            />
            <button
              type="submit"
              className="px-4 py-2 rounded-xl bg-slate-900 text-white text-sm font-semibold hover:bg-slate-800"
            >
              검색
            </button>
          </form>

          {!q ? (
            <EmptyState />
          ) : !results ? (
            <p className="text-slate-500">검색 중...</p>
          ) : (
            <>
              {/* 타입 탭 */}
              <div className="flex gap-2 mb-6 overflow-x-auto">
                <Tab
                  active={type === "all"}
                  href={buildHref(params, { type: "all", page: "1" })}
                  label="전체"
                  count={total}
                />
                <Tab
                  active={type === "sherpa"}
                  href={buildHref(params, { type: "sherpa", page: "1" })}
                  label="셰르파"
                  count={results.totals.sherpa}
                  icon={<Mountain className="w-3.5 h-3.5" />}
                />
                <Tab
                  active={type === "clinic"}
                  href={buildHref(params, { type: "clinic", page: "1" })}
                  label="의료관광"
                  count={results.totals.clinic}
                  icon={<HeartPulse className="w-3.5 h-3.5" />}
                />
                <Tab
                  active={type === "theme"}
                  href={buildHref(params, { type: "theme", page: "1" })}
                  label="테마"
                  count={results.totals.theme}
                  icon={<Sparkles className="w-3.5 h-3.5" />}
                />
              </div>

              {total === 0 ? (
                <NoResults q={q} />
              ) : (
                <div className="grid grid-cols-1 lg:grid-cols-[260px_1fr] gap-6">
                  {/* 필터 사이드바 */}
                  <aside>
                    <SearchFilters type={type} />
                  </aside>

                  <div>
                    {/* 정렬 + 결과 수 */}
                    <div className="flex items-center justify-between mb-4">
                      <p className="text-xs text-slate-500">
                        {q && (
                          <>
                            <span className="font-semibold text-slate-700">
                              &lsquo;{q}&rsquo;
                            </span>{" "}
                            검색결과 <strong>{activeTotal}</strong>개
                          </>
                        )}
                      </p>
                      <SearchSort
                        type={type}
                        showPriceSort={
                          type === "sherpa" || type === "all"
                        }
                      />
                    </div>

                    <div className="space-y-10">
                      {(type === "all" || type === "sherpa") &&
                        results.sherpas.length > 0 && (
                          <Section
                            title="셰르파"
                            icon={
                              <Mountain className="w-5 h-5 text-emerald-500" />
                            }
                            seeAllHref={`/sherpa`}
                          >
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                              {results.sherpas.map((s) => (
                                <SherpaCard key={s.slug} sherpa={s} />
                              ))}
                            </div>
                          </Section>
                        )}

                      {(type === "all" || type === "clinic") &&
                        results.clinics.length > 0 && (
                          <Section
                            title="의료관광 클리닉"
                            icon={
                              <HeartPulse className="w-5 h-5 text-rose-500" />
                            }
                            seeAllHref={`/medical`}
                          >
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                              {results.clinics.map((c) => (
                                <ClinicCard key={c.slug} clinic={c} />
                              ))}
                            </div>
                          </Section>
                        )}

                      {(type === "all" || type === "theme") &&
                        results.themes.length > 0 && (
                          <Section
                            title="큐레이티드 테마"
                            icon={
                              <Sparkles className="w-5 h-5 text-blue-500" />
                            }
                            seeAllHref={`/themes`}
                          >
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                              {results.themes.map((t) => (
                                <ThemeCard key={t.slug} theme={t} />
                              ))}
                            </div>
                          </Section>
                        )}
                    </div>

                    {/* 페이지네이션 (전체 탭에서는 안 보여줌 — 각 섹션의 더 보기로 대체) */}
                    {type !== "all" && totalPages > 1 && (
                      <Pagination
                        page={page}
                        totalPages={totalPages}
                        baseParams={params}
                      />
                    )}
                  </div>
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

// ─────────────────────── helpers / sub-components ───────────────────────

function buildHref(
  current: RawParams,
  overrides: Partial<Record<keyof RawParams, string>>
): string {
  const merged: Record<string, string> = {};
  for (const [k, v] of Object.entries(current)) {
    if (typeof v === "string" && v.length > 0) merged[k] = v;
  }
  for (const [k, v] of Object.entries(overrides)) {
    if (v && v.length > 0) merged[k] = v;
    else delete merged[k];
  }
  const qs = new URLSearchParams(merged).toString();
  return qs ? `/search?${qs}` : "/search";
}

function Pagination({
  page,
  totalPages,
  baseParams,
}: {
  page: number;
  totalPages: number;
  baseParams: RawParams;
}) {
  const prev = Math.max(1, page - 1);
  const next = Math.min(totalPages, page + 1);
  return (
    <nav className="mt-10 flex items-center justify-center gap-1">
      <Link
        href={buildHref(baseParams, { page: String(prev) })}
        aria-disabled={page === 1}
        className={`inline-flex items-center gap-1 px-3 py-2 rounded-lg border text-sm ${
          page === 1
            ? "border-slate-100 text-slate-300 pointer-events-none"
            : "border-slate-200 text-slate-700 hover:border-slate-300"
        }`}
      >
        <ChevronLeft className="w-4 h-4" />
        이전
      </Link>
      <span className="px-4 py-2 text-sm text-slate-600">
        {page} / {totalPages}
      </span>
      <Link
        href={buildHref(baseParams, { page: String(next) })}
        aria-disabled={page === totalPages}
        className={`inline-flex items-center gap-1 px-3 py-2 rounded-lg border text-sm ${
          page === totalPages
            ? "border-slate-100 text-slate-300 pointer-events-none"
            : "border-slate-200 text-slate-700 hover:border-slate-300"
        }`}
      >
        다음
        <ChevronRight className="w-4 h-4" />
      </Link>
    </nav>
  );
}

function Tab({
  active,
  href,
  label,
  count,
  icon,
}: {
  active: boolean;
  href: string;
  label: string;
  count: number;
  icon?: React.ReactNode;
}) {
  return (
    <Link
      href={href}
      className={`shrink-0 px-4 py-2 rounded-full text-sm font-semibold transition-colors inline-flex items-center gap-1.5 ${
        active
          ? "bg-slate-900 text-white"
          : "bg-white border border-slate-200 text-slate-600 hover:border-slate-300"
      }`}
    >
      {icon}
      {label}
      <span
        className={`text-xs px-1.5 py-0.5 rounded-full ${
          active ? "bg-white/20" : "bg-slate-100 text-slate-500"
        }`}
      >
        {count}
      </span>
    </Link>
  );
}

function Section({
  title,
  icon,
  seeAllHref,
  children,
}: {
  title: string;
  icon: React.ReactNode;
  seeAllHref: string;
  children: React.ReactNode;
}) {
  return (
    <section>
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          {icon}
          <h2 className="text-lg font-bold text-slate-900 tracking-tight">
            {title}
          </h2>
        </div>
        <Link
          href={seeAllHref}
          className="text-xs text-slate-500 hover:text-slate-800 inline-flex items-center gap-1"
        >
          전체 보기 <ArrowRight className="w-3 h-3" />
        </Link>
      </div>
      {children}
    </section>
  );
}

function SherpaCard({
  sherpa,
}: {
  sherpa: {
    slug: string;
    display_name: string;
    tagline: string | null;
    countries: string[];
    cities: string[];
    languages: string[];
    specialties: string[];
    hourly_rate_krw: number | null;
    rating_avg: number | null;
    rating_count: number;
    avatar_url: string | null;
  };
}) {
  return (
    <Link
      href={`/sherpa/${sherpa.slug}`}
      className="group bg-white rounded-2xl border border-slate-200 hover:border-emerald-300 hover:shadow-md p-4 transition-all flex items-start gap-3"
    >
      {sherpa.avatar_url ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={sherpa.avatar_url}
          alt={sherpa.display_name}
          className="w-12 h-12 rounded-xl object-cover bg-slate-100 shrink-0"
        />
      ) : (
        <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center text-white text-base font-bold shrink-0">
          {sherpa.display_name.charAt(0)}
        </div>
      )}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-1 text-xs text-slate-500 mb-0.5">
          <span>{COUNTRY_FLAGS[sherpa.countries[0]] ?? "🌍"}</span>
          {sherpa.cities.slice(0, 2).join(", ")}
          {sherpa.languages.length > 0 && (
            <span className="text-slate-400">
              {" "}
              · {sherpa.languages.map((l) => LANGUAGE_BY_CODE[l]?.label ?? l).join("/")}
            </span>
          )}
        </div>
        <h3 className="font-bold text-slate-900 truncate group-hover:text-emerald-600">
          {sherpa.display_name}
        </h3>
        {sherpa.tagline && (
          <p className="text-xs text-slate-500 line-clamp-1 mt-0.5">
            {sherpa.tagline}
          </p>
        )}
        <div className="flex items-center gap-2 mt-2 flex-wrap">
          {sherpa.rating_count > 0 && (
            <span className="inline-flex items-center gap-0.5 text-xs font-semibold text-amber-600">
              <Star className="w-3 h-3 fill-amber-400 text-amber-400" />
              {Number(sherpa.rating_avg ?? 0).toFixed(2)}
            </span>
          )}
          {sherpa.hourly_rate_krw && (
            <span className="text-xs font-semibold text-slate-700">
              {formatRate(sherpa.hourly_rate_krw)}
              <span className="text-slate-400">/h</span>
            </span>
          )}
          {sherpa.specialties.slice(0, 2).map((sp) => {
            const m = SPECIALTY_BY_ID[sp];
            return (
              <span
                key={sp}
                className="inline-flex items-center gap-0.5 text-[10px] text-slate-500"
              >
                {m?.emoji} {m?.label ?? sp}
              </span>
            );
          })}
        </div>
      </div>
    </Link>
  );
}

function ClinicCard({
  clinic,
}: {
  clinic: {
    slug: string;
    name: string;
    name_en: string | null;
    city: string;
    country: string;
    direction: "inbound" | "outbound";
    description: string | null;
    specialties: string[] | null;
  };
}) {
  return (
    <Link
      href={`/medical/clinic/${clinic.slug}`}
      className="group bg-white rounded-2xl border border-slate-200 hover:border-rose-300 hover:shadow-md p-4 transition-all"
    >
      <div className="flex items-center gap-2 text-xs text-slate-500 mb-1">
        <span className="text-base">{COUNTRY_FLAGS[clinic.country] ?? "🌍"}</span>
        <span className="font-semibold">
          {clinic.country} · {clinic.city}
        </span>
        <span
          className={`ml-auto text-[10px] font-bold uppercase px-1.5 py-0.5 rounded-full ${
            clinic.direction === "inbound"
              ? "bg-blue-50 text-blue-700"
              : "bg-rose-50 text-rose-700"
          }`}
        >
          <Plane className="w-2.5 h-2.5 inline mr-0.5" />
          {clinic.direction}
        </span>
      </div>
      <h3 className="font-bold text-slate-900 group-hover:text-rose-600 line-clamp-1 mt-1">
        {clinic.name}
      </h3>
      {clinic.description && (
        <p className="text-xs text-slate-500 line-clamp-2 mt-1">
          {clinic.description}
        </p>
      )}
    </Link>
  );
}

function ThemeCard({
  theme,
}: {
  theme: {
    slug: string;
    title: string;
    subtitle: string | null;
    destination: string | null;
    category: string;
    cover_image_url: string | null;
  };
}) {
  return (
    <Link
      href={`/themes/${theme.slug}`}
      className="group bg-white rounded-2xl border border-slate-200 hover:border-blue-300 hover:shadow-md overflow-hidden transition-all"
    >
      {theme.cover_image_url && (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={theme.cover_image_url}
          alt={theme.title}
          className="w-full h-32 object-cover bg-slate-100"
        />
      )}
      <div className="p-4">
        {theme.destination && (
          <p className="text-xs text-slate-500 mb-1">📍 {theme.destination}</p>
        )}
        <h3 className="font-bold text-slate-900 group-hover:text-blue-600 line-clamp-1">
          {theme.title}
        </h3>
        {theme.subtitle && (
          <p className="text-xs text-slate-500 line-clamp-2 mt-1">
            {theme.subtitle}
          </p>
        )}
      </div>
    </Link>
  );
}

function EmptyState() {
  return (
    <div className="bg-slate-50 rounded-3xl border border-dashed border-slate-200 p-16 text-center">
      <SearchIcon className="w-10 h-10 mx-auto text-slate-300 mb-3" />
      <p className="text-slate-500 mb-1">검색어를 입력해주세요.</p>
      <p className="text-xs text-slate-400">
        예: &lsquo;도쿄&rsquo;, &lsquo;푸드 투어&rsquo;, &lsquo;모발이식&rsquo;, &lsquo;검진&rsquo;
      </p>
    </div>
  );
}

function NoResults({ q }: { q: string }) {
  return (
    <div className="bg-slate-50 rounded-3xl border border-dashed border-slate-200 p-14 text-center">
      <p className="text-slate-700 font-semibold mb-1">
        &lsquo;{q}&rsquo; 결과가 없어요
      </p>
      <p className="text-sm text-slate-500">
        필터를 조정하거나 다른 검색어를 시도해보세요.
      </p>
      <div className="flex flex-wrap justify-center gap-2 mt-5">
        <Link
          href="/sherpa"
          className="px-4 py-2 rounded-full bg-white border border-slate-200 text-sm font-medium text-slate-700 hover:border-emerald-300"
        >
          🏔️ 셰르파 둘러보기
        </Link>
        <Link
          href="/medical"
          className="px-4 py-2 rounded-full bg-white border border-slate-200 text-sm font-medium text-slate-700 hover:border-rose-300"
        >
          🫀 의료관광
        </Link>
        <Link
          href="/themes"
          className="px-4 py-2 rounded-full bg-white border border-slate-200 text-sm font-medium text-slate-700 hover:border-blue-300"
        >
          ✨ 테마 여행
        </Link>
      </div>
    </div>
  );
}
