import Link from "next/link";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { getSupabaseServiceClient } from "@/lib/supabase";
import { getLocale, createTranslator } from "@/lib/i18n";
import type { MessageKey } from "@/messages";
import {
  SHERPA_SPECIALTIES,
  SPECIALTY_BY_ID,
  LANGUAGE_BY_CODE,
  COUNTRY_FLAGS,
  formatRate,
  type SherpaListItem,
} from "@/lib/sherpa";
import { Mountain, Star, MessageCircle, ArrowRight, Sparkles } from "lucide-react";

export const metadata = {
  title: "셰르파 — 로컬 가이드 매칭 · Pothos",
  description:
    "현지를 잘 아는 셰르파가 당신의 여정을 함께합니다. 통역·푸드투어·사진·의료동행까지.",
};

export const dynamic = "force-dynamic";

interface SearchParams {
  city?: string;
  specialty?: string;
  language?: string;
  country?: string;
}

export default async function SherpaHubPage({
  searchParams,
}: {
  searchParams: Promise<SearchParams>;
}) {
  const params = await searchParams;
  const locale = await getLocale();
  const t = createTranslator(locale);
  const supabase = getSupabaseServiceClient();

  let query = supabase
    .from("sherpas")
    .select(
      "slug, display_name, tagline, tagline_en, countries, cities, cities_en, languages, specialties, hourly_rate_krw, half_day_rate_krw, full_day_rate_krw, rating_avg, rating_count, booking_count, avatar_url, cover_image_url"
    )
    .eq("status", "published")
    .order("rating_avg", { ascending: false, nullsFirst: false })
    .order("display_order");

  if (params.country) query = query.contains("countries", [params.country]);
  if (params.specialty) query = query.contains("specialties", [params.specialty]);
  if (params.language) query = query.contains("languages", [params.language]);

  const { data } = await query.limit(60);
  let sherpas = (data ?? []) as SherpaListItem[];

  if (params.city) {
    const c = params.city.toLowerCase();
    sherpas = sherpas.filter((s) => s.cities.some((x) => x.toLowerCase().includes(c)));
  }

  return (
    <div className="flex flex-col min-h-screen bg-white">
      <Header />

      {/* Hero */}
      <section className="relative pt-28 pb-16 bg-gradient-to-br from-emerald-50 via-white to-teal-50 overflow-hidden">
        <div className="absolute inset-0 opacity-40">
          <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-emerald-200/30 rounded-full blur-3xl" />
          <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-teal-200/30 rounded-full blur-3xl" />
        </div>

        <div className="relative max-w-5xl mx-auto px-6 text-center">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-emerald-100 text-emerald-700 text-xs font-semibold mb-5">
            <Mountain className="w-3.5 h-3.5" />
            {t("sherpa.eyebrow")}
          </div>

          <h1 className="text-4xl sm:text-5xl font-bold text-slate-900 mb-5 leading-tight tracking-tight">
            {t("sherpa.title")}
            <br />
            {t("sherpa.title_2")}
          </h1>

          <p className="text-base sm:text-lg text-slate-600 leading-relaxed max-w-2xl mx-auto mb-8 whitespace-pre-line">
            {t("sherpa.subtitle")}
          </p>

          <div className="flex flex-wrap justify-center gap-2 mb-2">
            {SHERPA_SPECIALTIES.map((s) => (
              <Link
                key={s.id}
                href={`/sherpa?specialty=${s.id}`}
                className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium transition-colors ${
                  params.specialty === s.id
                    ? "bg-emerald-500 text-white"
                    : "bg-white border border-slate-200 text-slate-700 hover:border-emerald-300"
                }`}
              >
                <span>{s.emoji}</span>
                {t(`sherpa.specialty.${s.id}` as MessageKey)}
              </Link>
            ))}
            {(params.specialty || params.country || params.language || params.city) && (
              <Link
                href="/sherpa"
                className="inline-flex items-center gap-1 px-3 py-1.5 rounded-full text-xs font-medium bg-slate-100 text-slate-600 hover:bg-slate-200"
              >
                {t("sherpa.filter.reset")}
              </Link>
            )}
          </div>
        </div>
      </section>

      {/* List */}
      <section className="py-14 bg-white">
        <div className="max-w-6xl mx-auto px-6">
          <div className="flex items-center justify-between mb-6 gap-3 flex-wrap">
            <p className="text-sm text-slate-500">
              {t("sherpa.count").replace("{count}", String(sherpas.length))}
              {params.specialty &&
                ` · ${
                  t(`sherpa.specialty.${params.specialty}` as MessageKey) ||
                  SPECIALTY_BY_ID[params.specialty]?.label ||
                  params.specialty
                }`}
              {params.language &&
                ` · ${LANGUAGE_BY_CODE[params.language]?.label ?? params.language}`}
            </p>
            <div className="flex items-center gap-3">
              <Link
                href="/sherpa/open-trips"
                className="text-sm font-semibold text-slate-600 hover:text-emerald-600 inline-flex items-center gap-1"
              >
                <Mountain className="w-3.5 h-3.5" />
                {t("sherpa.see_open_trips")}
              </Link>
              <Link
                href="/sherpa/become"
                className="text-sm font-semibold text-emerald-600 hover:text-emerald-700 inline-flex items-center gap-1"
              >
                <Sparkles className="w-3.5 h-3.5" />
                {t("sherpa.register_cta")}
              </Link>
            </div>
          </div>

          {sherpas.length === 0 ? (
            <div className="bg-slate-50 rounded-3xl border border-dashed border-slate-200 p-16 text-center">
              <p className="text-slate-500 mb-2">{t("sherpa.empty")}</p>
              <Link
                href="/sherpa"
                className="text-sm font-semibold text-emerald-600 hover:text-emerald-700"
              >
                {t("sherpa.empty.see_all")} →
              </Link>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
              {sherpas.map((s) => (
                <SherpaCard key={s.slug} sherpa={s} locale={locale} />
              ))}
            </div>
          )}
        </div>
      </section>

      {/* Become a sherpa */}
      <section className="py-16 bg-gradient-to-br from-emerald-500 to-teal-600 text-white">
        <div className="max-w-3xl mx-auto px-6 text-center">
          <Mountain className="w-12 h-12 mx-auto mb-4 opacity-80" />
          <h2 className="text-3xl sm:text-4xl font-bold mb-4 tracking-tight whitespace-pre-line">
            {t("sherpa.become.title")}
          </h2>
          <p className="text-white/85 leading-relaxed mb-8 max-w-xl mx-auto whitespace-pre-line">
            {t("sherpa.become.desc")}
          </p>
          <Link
            href="/sherpa/become"
            className="inline-flex items-center gap-2 px-7 py-3.5 rounded-full bg-white text-emerald-700 font-bold hover:bg-emerald-50 transition-colors"
          >
            {t("sherpa.become.cta")}
            <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      </section>

      <Footer />
    </div>
  );
}

function SherpaCard({
  sherpa,
  locale,
}: {
  sherpa: SherpaListItem & { tagline_en?: string | null; cities_en?: string[] | null };
  locale: "ko" | "en";
}) {
  const tagline =
    locale === "en" && sherpa.tagline_en ? sherpa.tagline_en : sherpa.tagline;
  const cities =
    locale === "en" && sherpa.cities_en && sherpa.cities_en.length > 0
      ? sherpa.cities_en
      : sherpa.cities;
  return (
    <Link
      href={`/sherpa/${sherpa.slug}`}
      className="group bg-white rounded-3xl border border-slate-200 hover:border-emerald-300 hover:shadow-xl hover:-translate-y-0.5 transition-all p-5 flex flex-col"
    >
      <div className="flex items-start gap-3 mb-3">
        {sherpa.avatar_url ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={sherpa.avatar_url}
            alt={sherpa.display_name}
            className="w-14 h-14 rounded-2xl object-cover bg-slate-100"
          />
        ) : (
          <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center text-white text-xl font-bold">
            {sherpa.display_name.charAt(0)}
          </div>
        )}
        <div className="flex-1 min-w-0">
          <h3 className="font-bold text-slate-900 group-hover:text-emerald-600 truncate">
            {sherpa.display_name}
          </h3>
          {tagline && (
            <p className="text-xs text-slate-500 line-clamp-2 leading-tight mt-0.5">
              {tagline}
            </p>
          )}
        </div>
      </div>

      <div className="flex items-center gap-2 text-xs text-slate-500 mb-3 flex-wrap">
        {cities.slice(0, 2).map((city, i) => (
          <span key={i} className="inline-flex items-center gap-0.5">
            <span>{COUNTRY_FLAGS[sherpa.countries[0]] ?? "🌍"}</span>
            {city}
          </span>
        ))}
        {sherpa.languages.length > 0 && (
          <span className="text-slate-400">
            · {sherpa.languages.map((l) => LANGUAGE_BY_CODE[l]?.label ?? l).join(", ")}
          </span>
        )}
      </div>

      <div className="flex flex-wrap gap-1 mb-3">
        {sherpa.specialties.slice(0, 3).map((s) => {
          const meta = SPECIALTY_BY_ID[s];
          return (
            <span
              key={s}
              className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 text-[10px] font-medium"
            >
              <span>{meta?.emoji}</span>
              {meta?.label ?? s}
            </span>
          );
        })}
      </div>

      <div className="mt-auto pt-3 border-t border-slate-100 flex items-center justify-between">
        <div className="flex items-center gap-2 text-xs">
          {sherpa.rating_count > 0 ? (
            <span className="inline-flex items-center gap-0.5 font-semibold text-amber-600">
              <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
              {Number(sherpa.rating_avg ?? 0).toFixed(2)}
              <span className="text-slate-400 font-normal">
                ({sherpa.rating_count})
              </span>
            </span>
          ) : (
            <span className="text-slate-400">{locale === "en" ? "New" : "신규"}</span>
          )}
          {sherpa.booking_count > 0 && (
            <span className="text-slate-400 inline-flex items-center gap-0.5">
              <MessageCircle className="w-3 h-3" />
              {sherpa.booking_count}{locale === "en" ? " trips" : "건"}
            </span>
          )}
        </div>
        <span className="text-sm font-bold text-emerald-600">
          {sherpa.hourly_rate_krw
            ? `${formatRate(sherpa.hourly_rate_krw)}${locale === "en" ? "/h" : "/h"}`
            : sherpa.full_day_rate_krw
            ? `${formatRate(sherpa.full_day_rate_krw)}${locale === "en" ? "/day" : "/일"}`
            : (locale === "en" ? "Inquire" : "문의")}
        </span>
      </div>
    </Link>
  );
}
