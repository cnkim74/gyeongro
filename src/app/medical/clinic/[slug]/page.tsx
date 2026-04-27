import Link from "next/link";
import { notFound } from "next/navigation";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { getSupabaseServiceClient } from "@/lib/supabase";
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

function formatPrice(min: number | null, max: number | null) {
  if (!min && !max) return "문의";
  const fmt = (n: number) => `${(n / 10000).toLocaleString("ko-KR")}만원`;
  if (min && max && min !== max) return `${fmt(min)} ~ ${fmt(max)}`;
  return fmt(min ?? max ?? 0);
}

export default async function ClinicDetailPage({ params }: PageProps) {
  const { slug } = await params;
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
    .select("slug, name_ko, emoji")
    .in("slug", procedureSlugs.length > 0 ? procedureSlugs : [""]);

  const sourceLabel: Record<string, string> = {
    ai_curated: "AI 큐레이션",
    user_submitted: "사용자 등록",
    verified_partner: "인증 파트너",
  };

  return (
    <div className="flex flex-col min-h-screen bg-white">
      <Header />

      <main className="flex-1 pt-24 pb-20">
        <div className="max-w-5xl mx-auto px-6">
          <Link
            href="/medical"
            className="inline-flex items-center gap-1.5 text-sm text-slate-500 hover:text-slate-800 mb-6"
          >
            <ArrowLeft className="w-4 h-4" /> 의료관광 홈
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
                    {clinic.country} · {clinic.city}
                  </p>
                  <h1 className="text-3xl sm:text-4xl font-bold text-slate-900 tracking-tight">
                    {clinic.name}
                  </h1>
                  {clinic.name_en && (
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
                  {sourceLabel[clinic.source] ?? clinic.source}
                </span>
              </div>
            </div>

            {clinic.description && (
              <p className="text-slate-700 leading-relaxed mt-4">
                {clinic.description}
              </p>
            )}

            {/* Procedure tags */}
            {procedures && procedures.length > 0 && (
              <div className="flex flex-wrap gap-2 mt-5">
                {procedures.map((p) => (
                  <Link
                    key={p.slug}
                    href={`/medical/${p.slug}`}
                    className="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-white border border-slate-200 text-xs font-medium text-slate-700 hover:border-rose-300 transition-colors"
                  >
                    <span>{p.emoji}</span>
                    {p.name_ko}
                  </Link>
                ))}
              </div>
            )}
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Left: details */}
            <div className="lg:col-span-2 space-y-8">
              {/* Highlights */}
              {clinic.highlights && clinic.highlights.length > 0 && (
                <section>
                  <h2 className="text-lg font-bold text-slate-900 mb-4 tracking-tight">
                    주요 특징
                  </h2>
                  <ul className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    {clinic.highlights.map((h: string, i: number) => (
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
              {clinic.specialties && clinic.specialties.length > 0 && (
                <section>
                  <h2 className="text-lg font-bold text-slate-900 mb-4 tracking-tight">
                    세부 시술
                  </h2>
                  <div className="flex flex-wrap gap-2">
                    {clinic.specialties.map((s: string, i: number) => (
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
                  가격대
                </h2>
                <div className="bg-rose-50 rounded-2xl p-5">
                  <p className="text-2xl font-bold text-rose-700">
                    {formatPrice(clinic.price_range_min, clinic.price_range_max)}
                  </p>
                  <p className="text-xs text-slate-500 mt-1">
                    시술 종류·옵션·환율에 따라 달라질 수 있습니다. 정확한
                    견적은 클리닉 상담을 통해 확인하세요.
                  </p>
                </div>
              </section>

              {/* Disclaimer */}
              <section className="text-xs text-slate-400 leading-relaxed bg-slate-50 rounded-2xl p-4 border border-slate-100">
                <ShieldCheck className="w-4 h-4 inline mr-1 text-slate-500" />
                Pothos는 정보 제공 목적의 큐레이션 미디어입니다. 의료행위·예약·결제를
                직접 대행하지 않으며, 의료행위에 대한 책임은 해당 클리닉에 있습니다.
                의료법 제27조(영리 알선·유인 금지)를 준수합니다.
              </section>
            </div>

            {/* Right: contact + inquiry */}
            <aside className="space-y-5">
              {(clinic.contact_phone ||
                clinic.contact_email ||
                clinic.website_url) && (
                <div className="bg-white rounded-2xl border border-slate-200 p-5">
                  <h3 className="text-sm font-bold text-slate-900 mb-3">
                    클리닉 직접 연락처
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
                          공식 웹사이트
                        </a>
                      </li>
                    )}
                  </ul>
                </div>
              )}

              <div className="bg-white rounded-2xl border border-slate-200 p-5">
                <h3 className="text-sm font-bold text-slate-900 mb-3">
                  Pothos를 통해 상담 요청
                </h3>
                <InquiryForm
                  clinicId={clinic.id}
                  clinicName={clinic.name}
                  procedureSlug={procedureSlugs[0] ?? ""}
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
