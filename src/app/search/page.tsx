import Link from "next/link";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { getSupabaseServiceClient } from "@/lib/supabase";
import {
  Mountain,
  HeartPulse,
  Sparkles,
  Star,
  Search as SearchIcon,
  ArrowRight,
  Plane,
} from "lucide-react";
import {
  SPECIALTY_BY_ID,
  LANGUAGE_BY_CODE,
  COUNTRY_FLAGS,
} from "@/lib/sherpa";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "검색 - Pothos",
};

interface SearchParams {
  q?: string;
  type?: "all" | "sherpa" | "clinic" | "theme";
}

export default async function SearchPage({
  searchParams,
}: {
  searchParams: Promise<SearchParams>;
}) {
  const params = await searchParams;
  const q = (params.q ?? "").trim();
  const type = params.type ?? "all";

  const results = q ? await runSearch(q) : null;

  const total = results
    ? results.sherpas.length + results.clinics.length + results.themes.length
    : 0;

  return (
    <div className="flex flex-col min-h-screen bg-white">
      <Header />

      <main className="flex-1 pt-24 pb-16">
        <div className="max-w-5xl mx-auto px-6">
          {/* Search box (echo) */}
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
          ) : total === 0 ? (
            <NoResults q={q} />
          ) : (
            <>
              {/* Type tabs */}
              <div className="flex gap-2 mb-6 overflow-x-auto">
                <Tab
                  active={type === "all"}
                  href={`/search?q=${encodeURIComponent(q)}`}
                  label="전체"
                  count={total}
                />
                <Tab
                  active={type === "sherpa"}
                  href={`/search?q=${encodeURIComponent(q)}&type=sherpa`}
                  label="셰르파"
                  count={results.sherpas.length}
                  icon={<Mountain className="w-3.5 h-3.5" />}
                />
                <Tab
                  active={type === "clinic"}
                  href={`/search?q=${encodeURIComponent(q)}&type=clinic`}
                  label="의료관광"
                  count={results.clinics.length}
                  icon={<HeartPulse className="w-3.5 h-3.5" />}
                />
                <Tab
                  active={type === "theme"}
                  href={`/search?q=${encodeURIComponent(q)}&type=theme`}
                  label="테마"
                  count={results.themes.length}
                  icon={<Sparkles className="w-3.5 h-3.5" />}
                />
              </div>

              <div className="space-y-10">
                {(type === "all" || type === "sherpa") &&
                  results.sherpas.length > 0 && (
                    <Section
                      title="셰르파"
                      icon={<Mountain className="w-5 h-5 text-emerald-500" />}
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
                      icon={<HeartPulse className="w-5 h-5 text-rose-500" />}
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
                      icon={<Sparkles className="w-5 h-5 text-blue-500" />}
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
            </>
          )}
        </div>
      </main>

      <Footer />
    </div>
  );
}

interface SearchResults {
  sherpas: Array<{
    slug: string;
    display_name: string;
    tagline: string | null;
    countries: string[];
    cities: string[];
    languages: string[];
    specialties: string[];
    rating_avg: number | null;
    rating_count: number;
    avatar_url: string | null;
  }>;
  clinics: Array<{
    slug: string;
    name: string;
    name_en: string | null;
    city: string;
    country: string;
    direction: "inbound" | "outbound";
    description: string | null;
    specialties: string[] | null;
  }>;
  themes: Array<{
    slug: string;
    title: string;
    subtitle: string | null;
    destination: string | null;
    category: string;
    cover_image_url: string | null;
  }>;
}

async function runSearch(q: string): Promise<SearchResults> {
  const supabase = getSupabaseServiceClient();
  const pattern = `%${q.replace(/[%_]/g, "")}%`;
  const lowerQ = q.toLowerCase();
  const limit = 12;

  const [sherpasRes, clinicsRes, themesRes, allSherpas] = await Promise.all([
    supabase
      .from("sherpas")
      .select(
        "slug, display_name, tagline, countries, cities, languages, specialties, rating_avg, rating_count, avatar_url"
      )
      .eq("status", "published")
      .or(
        [
          `display_name.ilike.${pattern}`,
          `tagline.ilike.${pattern}`,
          `tagline_en.ilike.${pattern}`,
          `bio.ilike.${pattern}`,
          `bio_en.ilike.${pattern}`,
        ].join(",")
      )
      .order("rating_avg", { ascending: false, nullsFirst: false })
      .limit(limit),

    supabase
      .from("medical_clinics")
      .select(
        "slug, name, name_en, city, city_en, country, direction, description, specialties"
      )
      .eq("status", "published")
      .or(
        [
          `name.ilike.${pattern}`,
          `name_en.ilike.${pattern}`,
          `description.ilike.${pattern}`,
          `description_en.ilike.${pattern}`,
          `city.ilike.${pattern}`,
          `city_en.ilike.${pattern}`,
        ].join(",")
      )
      .order("display_order")
      .limit(limit),

    supabase
      .from("curated_themes")
      .select("slug, title, subtitle, description, destination, category, cover_image_url")
      .or(
        [
          `title.ilike.${pattern}`,
          `subtitle.ilike.${pattern}`,
          `description.ilike.${pattern}`,
          `destination.ilike.${pattern}`,
        ].join(",")
      )
      .limit(limit),

    // 배열 컬럼 매칭용
    supabase
      .from("sherpas")
      .select(
        "slug, display_name, tagline, countries, cities, languages, specialties, rating_avg, rating_count, avatar_url"
      )
      .eq("status", "published")
      .order("rating_avg", { ascending: false, nullsFirst: false })
      .limit(80),
  ]);

  const sherpaMap = new Map<string, SearchResults["sherpas"][number]>();
  for (const s of sherpasRes.data ?? []) sherpaMap.set(s.slug, s);
  for (const s of allSherpas.data ?? []) {
    if (sherpaMap.has(s.slug)) continue;
    const hay = [...(s.cities ?? []), ...(s.specialties ?? [])]
      .join(" ")
      .toLowerCase();
    if (hay.includes(lowerQ)) sherpaMap.set(s.slug, s);
  }

  return {
    sherpas: Array.from(sherpaMap.values()).slice(0, limit),
    clinics: (clinicsRes.data ?? []).map((c) => ({
      slug: c.slug,
      name: c.name,
      name_en: c.name_en,
      city: c.city,
      country: c.country,
      direction: c.direction as "inbound" | "outbound",
      description: c.description,
      specialties: c.specialties,
    })),
    themes: (themesRes.data ?? []).map((t) => ({
      slug: t.slug,
      title: t.title,
      subtitle: t.subtitle,
      destination: t.destination,
      category: t.category,
      cover_image_url: t.cover_image_url,
    })),
  };
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
  sherpa: SearchResults["sherpas"][number];
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
        <div className="flex items-center gap-2 mt-2">
          {sherpa.rating_count > 0 && (
            <span className="inline-flex items-center gap-0.5 text-xs font-semibold text-amber-600">
              <Star className="w-3 h-3 fill-amber-400 text-amber-400" />
              {Number(sherpa.rating_avg ?? 0).toFixed(2)}
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
  clinic: SearchResults["clinics"][number];
}) {
  return (
    <Link
      href={`/medical/clinic/${clinic.slug}`}
      className="group bg-white rounded-2xl border border-slate-200 hover:border-rose-300 hover:shadow-md p-4 transition-all"
    >
      <div className="flex items-center gap-2 text-xs text-slate-500 mb-1">
        <span className="text-base">
          {COUNTRY_FLAGS[clinic.country] ?? "🌍"}
        </span>
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
  theme: SearchResults["themes"][number];
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
        다른 검색어를 시도하거나, 카테고리에서 둘러보세요.
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
