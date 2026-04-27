import Link from "next/link";
import { notFound } from "next/navigation";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { getSupabaseServiceClient } from "@/lib/supabase";
import { getLocale, createTranslator } from "@/lib/i18n";
import { ArrowLeft, ArrowRight, Plane, Stethoscope } from "lucide-react";

export const dynamic = "force-dynamic";

const COUNTRY_FLAGS: Record<string, string> = {
  KR: "🇰🇷",
  TR: "🇹🇷",
  HU: "🇭🇺",
  TH: "🇹🇭",
  CZ: "🇨🇿",
  MY: "🇲🇾",
};

interface Clinic {
  slug: string;
  name: string;
  name_en: string | null;
  direction: "inbound" | "outbound";
  country: string;
  city: string;
  city_en: string | null;
  highlights: string[] | null;
  highlights_en: string[] | null;
  price_range_min: number | null;
  price_range_max: number | null;
}

function formatPrice(
  min: number | null,
  max: number | null,
  locale: "ko" | "en" | "ja" | "zh"
) {
  if (!min && !max) {
    return locale === "en"
      ? "Inquire"
      : locale === "ja"
      ? "問合せ"
      : locale === "zh"
      ? "咨询"
      : "문의";
  }
  const fmt = (n: number) => {
    if (locale === "en") return `${(n / 1000).toLocaleString("en-US")}K KRW`;
    if (locale === "ja") return `${(n / 10000).toLocaleString("ja-JP")}万ウォン`;
    if (locale === "zh") return `${(n / 10000).toLocaleString("zh-CN")}万韩元`;
    return `${(n / 10000).toLocaleString("ko-KR")}만원`;
  };
  if (min && max && min !== max) return `${fmt(min)} ~ ${fmt(max)}`;
  return fmt(min ?? max ?? 0);
}

interface PageProps {
  params: Promise<{ procedure: string }>;
  searchParams: Promise<{ direction?: "inbound" | "outbound" }>;
}

export async function generateMetadata({ params }: PageProps) {
  const { procedure } = await params;
  const supabase = getSupabaseServiceClient();
  const { data } = await supabase
    .from("medical_procedures")
    .select("name_ko, description")
    .eq("slug", procedure)
    .maybeSingle();
  if (!data) return { title: "의료관광 - Pothos" };
  return {
    title: `${data.name_ko} 의료관광 - Pothos`,
    description: data.description ?? undefined,
  };
}

export default async function ProcedurePage({ params, searchParams }: PageProps) {
  const { procedure: slug } = await params;
  const { direction } = await searchParams;
  const locale = await getLocale();
  const t = createTranslator(locale);

  const supabase = getSupabaseServiceClient();
  const { data: proc } = await supabase
    .from("medical_procedures")
    .select("slug, name_ko, name_en, emoji, description, description_en, recovery_days")
    .eq("slug", slug)
    .maybeSingle();

  if (!proc) notFound();

  let query = supabase
    .from("medical_clinics")
    .select(
      "slug, name, name_en, direction, country, city, city_en, highlights, highlights_en, price_range_min, price_range_max"
    )
    .eq("status", "published")
    .contains("procedures", [slug])
    .order("display_order");

  if (direction) query = query.eq("direction", direction);

  const { data: clinicsRaw } = await query;
  const clinics = (clinicsRaw ?? []) as Clinic[];

  const procName = locale !== "ko" && proc.name_en ? proc.name_en : proc.name_ko;
  const procDesc =
    locale !== "ko" && proc.description_en ? proc.description_en : proc.description;

  return (
    <div className="flex flex-col min-h-screen bg-white">
      <Header />

      <main className="flex-1 pt-24 pb-16">
        <div className="max-w-5xl mx-auto px-6">
          <Link
            href="/medical"
            className="inline-flex items-center gap-1.5 text-sm text-slate-500 hover:text-slate-800 mb-6"
          >
            <ArrowLeft className="w-4 h-4" /> {t("procedure.back")}
          </Link>

          <div className="flex items-start gap-5 mb-10">
            <div className="text-6xl">{proc.emoji}</div>
            <div className="flex-1">
              <p className="text-xs font-semibold tracking-[0.2em] text-rose-600 uppercase mb-1">
                {proc.name_en}
              </p>
              <h1 className="text-3xl sm:text-4xl font-bold text-slate-900 mb-3 tracking-tight">
                {procName}
              </h1>
              <p className="text-slate-600 leading-relaxed">{procDesc}</p>
              <div className="flex items-center gap-4 mt-4 text-xs text-slate-500">
                <span className="flex items-center gap-1.5">
                  <Stethoscope className="w-3.5 h-3.5" />
                  {t("procedure.recovery").replace(
                    "{days}",
                    String(proc.recovery_days ?? "")
                  )}
                </span>
                <span>·</span>
                <span>
                  {t("procedure.count").replace("{count}", String(clinics.length))}
                </span>
              </div>
            </div>
          </div>

          {/* Direction filter */}
          <div className="flex gap-2 mb-8 overflow-x-auto">
            <FilterPill
              href={`/medical/${slug}`}
              active={!direction}
              label={t("procedure.filter.all")}
            />
            <FilterPill
              href={`/medical/${slug}?direction=inbound`}
              active={direction === "inbound"}
              label={t("procedure.filter.inbound")}
            />
            <FilterPill
              href={`/medical/${slug}?direction=outbound`}
              active={direction === "outbound"}
              label={t("procedure.filter.outbound")}
            />
          </div>

          {clinics.length === 0 ? (
            <div className="bg-slate-50 rounded-3xl border border-dashed border-slate-200 p-14 text-center">
              <p className="text-slate-500 mb-2">{t("procedure.empty.title")}</p>
              <p className="text-xs text-slate-400">{t("procedure.empty.sub")}</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {clinics.map((c) => {
                const cName = locale !== "ko" && c.name_en ? c.name_en : c.name;
                const cCity = locale !== "ko" && c.city_en ? c.city_en : c.city;
                const cHighlights =
                  locale !== "ko" &&
                  c.highlights_en &&
                  c.highlights_en.length > 0
                    ? c.highlights_en
                    : c.highlights;
                return (
                  <Link
                    key={c.slug}
                    href={`/medical/clinic/${c.slug}`}
                    className="group bg-white rounded-2xl border border-slate-200 hover:border-rose-300 hover:shadow-lg hover:-translate-y-0.5 transition-all p-5"
                  >
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center gap-2">
                        <span className="text-xl">
                          {COUNTRY_FLAGS[c.country] ?? "🌍"}
                        </span>
                        <span className="text-xs font-semibold text-slate-500">
                          {c.country} · {cCity}
                        </span>
                      </div>
                      <span
                        className={`text-[10px] font-bold tracking-wider uppercase px-2 py-0.5 rounded-full ${
                          c.direction === "inbound"
                            ? "bg-blue-50 text-blue-700"
                            : "bg-rose-50 text-rose-700"
                        }`}
                      >
                        <Plane className="w-2.5 h-2.5 inline mr-0.5" />
                        {c.direction === "inbound" ? "Inbound" : "Outbound"}
                      </span>
                    </div>
                    <h3 className="font-bold text-slate-900 mb-2 tracking-tight group-hover:text-rose-600 transition-colors">
                      {cName}
                    </h3>
                    {cHighlights && cHighlights.length > 0 && (
                      <ul className="space-y-1 mb-4">
                        {cHighlights.slice(0, 3).map((h, i) => (
                          <li key={i} className="text-xs text-slate-600">
                            · {h}
                          </li>
                        ))}
                      </ul>
                    )}
                    <div className="flex items-center justify-between pt-3 border-t border-slate-100">
                      <span className="text-sm font-semibold text-rose-600">
                        {formatPrice(c.price_range_min, c.price_range_max, locale)}
                      </span>
                      <ArrowRight className="w-4 h-4 text-slate-300 group-hover:text-rose-500 group-hover:translate-x-0.5 transition-all" />
                    </div>
                  </Link>
                );
              })}
            </div>
          )}
        </div>
      </main>

      <Footer />
    </div>
  );
}

function FilterPill({
  href,
  active,
  label,
}: {
  href: string;
  active: boolean;
  label: string;
}) {
  return (
    <Link
      href={href}
      className={`shrink-0 px-4 py-2 rounded-full text-sm font-medium transition-colors ${
        active
          ? "bg-rose-500 text-white"
          : "bg-slate-100 text-slate-600 hover:bg-slate-200"
      }`}
    >
      {label}
    </Link>
  );
}
