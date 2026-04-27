import Link from "next/link";
import { notFound } from "next/navigation";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { getSupabaseServiceClient } from "@/lib/supabase";
import { getLocale, createTranslator } from "@/lib/i18n";
import {
  ArrowLeft,
  MapPin,
  Phone,
  Mail,
  Globe,
  ShieldCheck,
  Sparkles,
  Plane,
  CheckCircle2,
} from "lucide-react";
import InquiryForm from "./InquiryForm";

export const dynamic = "force-dynamic";

const COUNTRY_FLAGS: Record<string, string> = {
  KR: "🇰🇷",
  TR: "🇹🇷",
  HU: "🇭🇺",
  TH: "🇹🇭",
  CZ: "🇨🇿",
  MY: "🇲🇾",
};

interface PageProps {
  params: Promise<{ slug: string }>;
}

export async function generateMetadata({ params }: PageProps) {
  const { slug } = await params;
  const supabase = getSupabaseServiceClient();
  const { data } = await supabase
    .from("medical_clinics")
    .select("name, description")
    .eq("slug", slug)
    .eq("status", "published")
    .maybeSingle();
  if (!data) return { title: "클리닉 - Pothos" };
  return {
    title: `${data.name} - Pothos 의료관광`,
    description: data.description ?? undefined,
  };
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

export default async function ClinicDetailPage({ params }: PageProps) {
  const { slug } = await params;
  const locale = await getLocale();
  const t = createTranslator(locale);
  const supabase = getSupabaseServiceClient();

  const { data: clinic } = await supabase
    .from("medical_clinics")
    .select("*")
    .eq("slug", slug)
    .eq("status", "published")
    .maybeSingle();

  if (!clinic) notFound();

  // 조회수 증가 (best-effort)
  await supabase
    .from("medical_clinics")
    .update({ view_count: (clinic.view_count ?? 0) + 1 })
    .eq("id", clinic.id);

  // 시술 정보
  const procedureSlugs: string[] = Array.isArray(clinic.procedures)
    ? clinic.procedures
    : [];
  const { data: procedures } = await supabase
    .from("medical_procedures")
    .select("slug, name_ko, name_en, emoji")
    .in("slug", procedureSlugs.length > 0 ? procedureSlugs : [""]);

  const sourceLabel: Record<string, Record<string, string>> = {
    ko: { ai_curated: "AI 큐레이션", user_submitted: "사용자 등록", verified_partner: "인증 파트너" },
    en: { ai_curated: "AI curated", user_submitted: "User submitted", verified_partner: "Verified partner" },
    ja: { ai_curated: "AIキュレーション", user_submitted: "ユーザー登録", verified_partner: "認証パートナー" },
    zh: { ai_curated: "AI精选", user_submitted: "用户提交", verified_partner: "认证合作伙伴" },
  };

  const clinicName =
    locale === "en" && clinic.name_en
      ? clinic.name_en
      : locale !== "ko" && clinic.name_en
      ? clinic.name_en
      : clinic.name;
  const clinicCity =
    locale !== "ko" && clinic.city_en ? clinic.city_en : clinic.city;
  const clinicDescription =
    locale !== "ko" && clinic.description_en
      ? clinic.description_en
      : clinic.description;
  const clinicHighlights =
    locale !== "ko" && clinic.highlights_en && clinic.highlights_en.length > 0
      ? clinic.highlights_en
      : clinic.highlights;
  const clinicSpecialties =
    locale !== "ko" && clinic.specialties_en && clinic.specialties_en.length > 0
      ? clinic.specialties_en
      : clinic.specialties;

  return (
    <div className="flex flex-col min-h-screen bg-white">
      <Header />

      <main className="flex-1 pt-24 pb-20">
        <div className="max-w-5xl mx-auto px-6">
          <Link
            href="/medical"
            className="inline-flex items-center gap-1.5 text-sm text-slate-500 hover:text-slate-800 mb-6"
          >
            <ArrowLeft className="w-4 h-4" /> {t("clinic.detail.back")}
          </Link>

          {/* Hero */}
          <div className="bg-gradient-to-br from-rose-50 via-white to-blue-50 rounded-3xl p-8 mb-8 border border-rose-100">
            <div className="flex flex-wrap items-start justify-between gap-4 mb-4">
              <div className="flex items-center gap-3 flex-wrap">
                <span className="text-3xl">
                  {COUNTRY_FLAGS[clinic.country] ?? "🌍"}
                </span>
                <div>
                  <p className="text-xs font-semibold tracking-wider text-slate-500 mb-0.5">
                    <MapPin className="w-3 h-3 inline mr-0.5" />
                    {clinic.country} · {clinicCity}
                  </p>
                  <h1 className="text-3xl sm:text-4xl font-bold text-slate-900 tracking-tight">
                    {clinicName}
                  </h1>
                  {locale === "ko" && clinic.name_en && (
                    <p className="text-sm text-slate-500 mt-1 italic">
                      {clinic.name_en}
                    </p>
                  )}
                </div>
              </div>
              <div className="flex flex-col items-end gap-2">
                <span
                  className={`inline-flex items-center gap-1 text-[11px] font-bold tracking-wider uppercase px-2.5 py-1 rounded-full ${
                    clinic.direction === "inbound"
                      ? "bg-blue-100 text-blue-700"
                      : "bg-rose-100 text-rose-700"
                  }`}
                >
                  <Plane className="w-3 h-3" />
                  {clinic.direction === "inbound" ? "Inbound" : "Outbound"}
                </span>
                <span className="inline-flex items-center gap-1 text-[10px] font-medium text-slate-500 bg-white px-2 py-0.5 rounded-full border border-slate-200">
                  <Sparkles className="w-3 h-3" />
                  {sourceLabel[locale]?.[clinic.source] ?? clinic.source}
                </span>
              </div>
            </div>

            {clinicDescription && (
              <p className="text-slate-700 leading-relaxed mt-4">
                {clinicDescription}
              </p>
            )}

            {/* Procedure tags */}
            {procedures && procedures.length > 0 && (
              <div className="flex flex-wrap gap-2 mt-5">
                {procedures.map((p) => {
                  const procName =
                    locale !== "ko" && p.name_en ? p.name_en : p.name_ko;
                  return (
                    <Link
                      key={p.slug}
                      href={`/medical/${p.slug}`}
                      className="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-white border border-slate-200 text-xs font-medium text-slate-700 hover:border-rose-300 transition-colors"
                    >
                      <span>{p.emoji}</span>
                      {procName}
                    </Link>
                  );
                })}
              </div>
            )}
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Left: details */}
            <div className="lg:col-span-2 space-y-8">
              {/* Highlights */}
              {clinicHighlights && clinicHighlights.length > 0 && (
                <section>
                  <h2 className="text-lg font-bold text-slate-900 mb-4 tracking-tight">
                    {t("clinic.detail.highlights")}
                  </h2>
                  <ul className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    {clinicHighlights.map((h: string, i: number) => (
                      <li
                        key={i}
                        className="flex items-start gap-2 text-sm text-slate-700 bg-slate-50 rounded-xl p-3"
                      >
                        <CheckCircle2 className="w-4 h-4 shrink-0 mt-0.5 text-emerald-500" />
                        {h}
                      </li>
                    ))}
                  </ul>
                </section>
              )}

              {/* Specialties */}
              {clinicSpecialties && clinicSpecialties.length > 0 && (
                <section>
                  <h2 className="text-lg font-bold text-slate-900 mb-4 tracking-tight">
                    {t("clinic.detail.specialties")}
                  </h2>
                  <div className="flex flex-wrap gap-2">
                    {clinicSpecialties.map((s: string, i: number) => (
                      <span
                        key={i}
                        className="px-3 py-1.5 rounded-full bg-rose-50 text-rose-700 text-xs font-medium"
                      >
                        {s}
                      </span>
                    ))}
                  </div>
                </section>
              )}

              {/* Price */}
              <section>
                <h2 className="text-lg font-bold text-slate-900 mb-4 tracking-tight">
                  {t("clinic.detail.price")}
                </h2>
                <div className="bg-rose-50 rounded-2xl p-5">
                  <p className="text-2xl font-bold text-rose-700">
                    {formatPrice(clinic.price_range_min, clinic.price_range_max, locale)}
                  </p>
                  <p className="text-xs text-slate-500 mt-1">
                    {t("clinic.detail.price_note")}
                  </p>
                </div>
              </section>

              {/* Disclaimer */}
              <section className="text-xs text-slate-400 leading-relaxed bg-slate-50 rounded-2xl p-4 border border-slate-100">
                <ShieldCheck className="w-4 h-4 inline mr-1 text-slate-500" />
                {t("clinic.detail.disclaimer")}
              </section>
            </div>

            {/* Right: contact + inquiry */}
            <aside className="space-y-5">
              {(clinic.contact_phone ||
                clinic.contact_email ||
                clinic.website_url) && (
                <div className="bg-white rounded-2xl border border-slate-200 p-5">
                  <h3 className="text-sm font-bold text-slate-900 mb-3">
                    {t("clinic.detail.contact")}
                  </h3>
                  <ul className="space-y-2 text-sm">
                    {clinic.contact_phone && (
                      <li>
                        <a
                          href={`tel:${clinic.contact_phone}`}
                          className="flex items-center gap-2 text-slate-700 hover:text-rose-600"
                        >
                          <Phone className="w-4 h-4 text-slate-400" />
                          {clinic.contact_phone}
                        </a>
                      </li>
                    )}
                    {clinic.contact_email && (
                      <li>
                        <a
                          href={`mailto:${clinic.contact_email}`}
                          className="flex items-center gap-2 text-slate-700 hover:text-rose-600"
                        >
                          <Mail className="w-4 h-4 text-slate-400" />
                          {clinic.contact_email}
                        </a>
                      </li>
                    )}
                    {clinic.website_url && (
                      <li>
                        <a
                          href={clinic.website_url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex items-center gap-2 text-slate-700 hover:text-rose-600"
                        >
                          <Globe className="w-4 h-4 text-slate-400" />
                          {t("clinic.detail.website")}
                        </a>
                      </li>
                    )}
                  </ul>
                </div>
              )}

              <div className="bg-white rounded-2xl border border-slate-200 p-5">
                <h3 className="text-sm font-bold text-slate-900 mb-3">
                  {t("clinic.detail.inquire.title")}
                </h3>
                <InquiryForm
                  clinicId={clinic.id}
                  clinicName={clinicName}
                  procedureSlug={procedureSlugs[0] ?? ""}
                  locale={locale}
                  labels={{
                    intro: t("inquiry.intro"),
                    name: t("inquiry.field.name"),
                    email: t("inquiry.field.email"),
                    phone: t("inquiry.field.phone"),
                    contactMethod: t("inquiry.field.contact_method"),
                    contactEmail: t("inquiry.field.contact.email"),
                    contactPhone: t("inquiry.field.contact.phone"),
                    contactKakao: t("inquiry.field.contact.kakao"),
                    contactWhatsapp: t("inquiry.field.contact.whatsapp"),
                    preferredDate: t("inquiry.field.preferred_date"),
                    budget: t("inquiry.field.budget"),
                    notes: t("inquiry.field.notes"),
                    notesPlaceholder: t("inquiry.field.notes_placeholder"),
                    submit: t("inquiry.submit"),
                    successTitle: t("inquiry.success.title"),
                    successBody: t("inquiry.success.body"),
                    disclaimer: t("inquiry.disclaimer"),
                  }}
                />
              </div>
            </aside>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}
