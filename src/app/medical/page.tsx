import Link from "next/link";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { getSupabaseServiceClient } from "@/lib/supabase";
import { getLocale, createTranslator } from "@/lib/i18n";
import {
  Plane,
  Stethoscope,
  ArrowRight,
  ShieldCheck,
  Globe,
  HeartPulse,
} from "lucide-react";

export const metadata = {
  title: "의료관광 - Pothos",
  description:
    "성형·건강검진·모발이식. 한국 인바운드와 해외 아웃바운드를 한 곳에서. AI 큐레이션 + 검증된 클리닉 정보.",
};

export const dynamic = "force-dynamic";

interface Procedure {
  slug: string;
  name_ko: string;
  name_en: string | null;
  emoji: string | null;
  description: string | null;
  description_en: string | null;
  recovery_days: number | null;
}

interface Clinic {
  slug: string;
  name: string;
  name_en: string | null;
  direction: "inbound" | "outbound";
  country: string;
  city: string;
  city_en: string | null;
  procedures: string[];
  highlights: string[] | null;
  highlights_en: string[] | null;
  price_range_min: number | null;
  price_range_max: number | null;
}

const COUNTRY_FLAGS: Record<string, string> = {
  KR: "🇰🇷",
  TR: "🇹🇷",
  HU: "🇭🇺",
  TH: "🇹🇭",
  CZ: "🇨🇿",
  MY: "🇲🇾",
};

function formatPrice(min: number | null, max: number | null) {
  if (!min && !max) return "문의";
  const fmt = (n: number) => `${(n / 10000).toLocaleString("ko-KR")}만원`;
  if (min && max && min !== max) return `${fmt(min)} ~ ${fmt(max)}`;
  return fmt(min ?? max ?? 0);
}

export default async function MedicalHubPage() {
  const locale = await getLocale();
  const t = createTranslator(locale);
  const supabase = getSupabaseServiceClient();

  const { data: procedures } = await supabase
    .from("medical_procedures")
    .select("slug, name_ko, name_en, emoji, description, description_en, recovery_days")
    .order("display_order");

  const { data: clinicsRaw } = await supabase
    .from("medical_clinics")
    .select(
      "slug, name, name_en, direction, country, city, city_en, procedures, highlights, highlights_en, price_range_min, price_range_max"
    )
    .eq("status", "published")
    .order("display_order")
    .limit(12);

  const clinics = (clinicsRaw ?? []) as Clinic[];
  const inboundClinics = clinics.filter((c) => c.direction === "inbound");
  const outboundClinics = clinics.filter((c) => c.direction === "outbound");

  return (
    <div className="flex flex-col min-h-screen bg-white">
      <Header />

      {/* Hero */}
      <section className="relative pt-28 pb-16 bg-gradient-to-br from-rose-50 via-white to-blue-50 overflow-hidden">
        <div className="absolute inset-0 opacity-40">
          <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-rose-200/30 rounded-full blur-3xl" />
          <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-blue-200/30 rounded-full blur-3xl" />
        </div>

        <div className="relative max-w-5xl mx-auto px-6 text-center">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-rose-100 text-rose-700 text-xs font-semibold mb-5">
            <HeartPulse className="w-3.5 h-3.5" />
            Medical Tourism · Pothos
          </div>

          <h1 className="text-4xl sm:text-5xl font-bold text-slate-900 mb-5 leading-tight tracking-tight">
            {t("medical.title")}
            <br />
            {t("medical.title_2")}
          </h1>

          <p className="text-base sm:text-lg text-slate-600 leading-relaxed max-w-2xl mx-auto whitespace-pre-line">
            {t("medical.subtitle")}
          </p>

          <div className="mt-8 flex flex-wrap justify-center gap-4 text-xs text-slate-500">
            <div className="flex items-center gap-1.5">
              <ShieldCheck className="w-4 h-4 text-emerald-500" />
              {t("medical.badge.curated")}
            </div>
            <div className="flex items-center gap-1.5">
              <Globe className="w-4 h-4 text-blue-500" />
              {t("medical.badge.bidirectional")}
            </div>
            <div className="flex items-center gap-1.5">
              <Stethoscope className="w-4 h-4 text-rose-500" />
              {t("medical.badge.no_booking")}
            </div>
          </div>
        </div>
      </section>

      {/* Procedure cards */}
      <section className="py-16 bg-white">
        <div className="max-w-6xl mx-auto px-6">
          <div className="text-center mb-10">
            <p className="text-xs font-semibold tracking-[0.25em] text-rose-600 uppercase mb-2">
              {t("medical.procedures.eyebrow")}
            </p>
            <h2 className="text-3xl font-bold text-slate-900 tracking-tight">
              {t("medical.procedures.title")}
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
            {(procedures ?? []).map((p: Procedure) => {
              const procName =
                locale === "en" && p.name_en ? p.name_en : p.name_ko;
              const procDesc =
                locale === "en" && p.description_en ? p.description_en : p.description;
              return (
                <Link
                  key={p.slug}
                  href={`/medical/${p.slug}`}
                  className="group bg-white rounded-3xl border border-slate-200 hover:border-rose-300 hover:shadow-xl hover:-translate-y-1 transition-all p-6"
                >
                  <div className="text-4xl mb-3">{p.emoji}</div>
                  <h3 className="text-xl font-bold text-slate-900 mb-2 tracking-tight">
                    {procName}
                  </h3>
                  <p className="text-sm text-slate-600 leading-relaxed mb-4 line-clamp-3">
                    {procDesc}
                  </p>
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-slate-500">
                      {t("medical.procedures.recovery_days").replace(
                        "{days}",
                        String(p.recovery_days ?? "")
                      )}
                    </span>
                    <span className="font-semibold text-rose-600 group-hover:text-rose-700 inline-flex items-center gap-1">
                      {t("medical.procedures.see_clinics")}{" "}
                      <ArrowRight className="w-3.5 h-3.5" />
                    </span>
                  </div>
                </Link>
              );
            })}
          </div>
        </div>
      </section>

      {/* Direction sections */}
      <section className="py-16 bg-slate-50">
        <div className="max-w-6xl mx-auto px-6 space-y-14">
          {/* Inbound */}
          <div>
            <div className="flex items-center justify-between mb-6">
              <div>
                <p className="text-xs font-semibold tracking-[0.25em] text-blue-600 uppercase mb-1">
                  {t("medical.inbound.eyebrow")}
                </p>
                <h2 className="text-2xl sm:text-3xl font-bold text-slate-900 tracking-tight">
                  {t("medical.inbound.title")}
                </h2>
              </div>
              <Plane className="w-8 h-8 text-blue-300" />
            </div>
            <ClinicGrid clinics={inboundClinics} locale={locale} emptyText={t("medical.empty")} />
          </div>

          {/* Outbound */}
          <div>
            <div className="flex items-center justify-between mb-6">
              <div>
                <p className="text-xs font-semibold tracking-[0.25em] text-rose-600 uppercase mb-1">
                  {t("medical.outbound.eyebrow")}
                </p>
                <h2 className="text-2xl sm:text-3xl font-bold text-slate-900 tracking-tight">
                  {t("medical.outbound.title")}
                </h2>
              </div>
              <Plane className="w-8 h-8 text-rose-300 -scale-x-100" />
            </div>
            <ClinicGrid clinics={outboundClinics} locale={locale} emptyText={t("medical.empty")} />
          </div>
        </div>
      </section>

      {/* CTA / Disclaimer */}
      <section className="py-16 bg-white">
        <div className="max-w-3xl mx-auto px-6 text-center">
          <h2 className="text-2xl sm:text-3xl font-bold text-slate-900 mb-4 tracking-tight">
            {t("medical.register.title")}
          </h2>
          <p className="text-slate-600 leading-relaxed mb-6 whitespace-pre-line">
            {t("medical.register.desc")}
          </p>
          <Link
            href="/medical/register"
            className="inline-flex items-center gap-2 px-6 py-3 rounded-full bg-slate-900 text-white text-sm font-semibold hover:bg-slate-800 transition-colors"
          >
            {t("medical.register.cta")}
            <ArrowRight className="w-4 h-4" />
          </Link>

          <p className="mt-10 pt-8 border-t border-slate-100 text-xs text-slate-400 leading-relaxed whitespace-pre-line">
            {t("medical.disclaimer")}
          </p>
        </div>
      </section>

      <Footer />
    </div>
  );
}

function ClinicGrid({
  clinics,
  locale,
  emptyText,
}: {
  clinics: Clinic[];
  locale: "ko" | "en" | "ja" | "zh";
  emptyText: string;
}) {
  if (clinics.length === 0) {
    return (
      <div className="bg-white rounded-2xl border border-dashed border-slate-200 p-10 text-center text-sm text-slate-400">
        {emptyText}
      </div>
    );
  }
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
      {clinics.map((c) => {
        const cityLabel = locale !== "ko" && c.city_en ? c.city_en : c.city;
        const nameLabel = locale !== "ko" && c.name_en ? c.name_en : c.name;
        const highlights =
          locale !== "ko" && c.highlights_en && c.highlights_en.length > 0
            ? c.highlights_en
            : c.highlights;
        return (
          <Link
            key={c.slug}
            href={`/medical/clinic/${c.slug}`}
            className="group bg-white rounded-2xl border border-slate-200 hover:border-rose-300 hover:shadow-lg hover:-translate-y-0.5 transition-all p-5"
          >
            <div className="flex items-center gap-2 mb-3">
              <span className="text-xl">{COUNTRY_FLAGS[c.country] ?? "🌍"}</span>
              <span className="text-xs font-semibold text-slate-500">
                {c.country} · {cityLabel}
              </span>
            </div>
            <h3 className="font-bold text-slate-900 mb-2 tracking-tight group-hover:text-rose-600 transition-colors">
              {nameLabel}
            </h3>
            {highlights && highlights.length > 0 && (
              <ul className="space-y-1 mb-3">
                {highlights.slice(0, 2).map((h, i) => (
                  <li key={i} className="text-xs text-slate-600 line-clamp-1">
                    · {h}
                  </li>
                ))}
              </ul>
            )}
            <div className="flex items-center justify-between pt-3 border-t border-slate-100">
              <span className="text-xs text-slate-500">
                {formatPrice(c.price_range_min, c.price_range_max)}
              </span>
              <ArrowRight className="w-4 h-4 text-slate-300 group-hover:text-rose-500 group-hover:translate-x-0.5 transition-all" />
            </div>
          </Link>
        );
      })}
    </div>
  );
}
