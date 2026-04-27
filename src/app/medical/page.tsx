import Link from "next/link";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { getSupabaseServiceClient } from "@/lib/supabase";
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
  emoji: string | null;
  description: string | null;
  recovery_days: number | null;
}

interface Clinic {
  slug: string;
  name: string;
  direction: "inbound" | "outbound";
  country: string;
  city: string;
  procedures: string[];
  highlights: string[] | null;
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
  const supabase = getSupabaseServiceClient();

  const { data: procedures } = await supabase
    .from("medical_procedures")
    .select("slug, name_ko, emoji, description, recovery_days")
    .order("display_order");

  const { data: clinicsRaw } = await supabase
    .from("medical_clinics")
    .select(
      "slug, name, direction, country, city, procedures, highlights, price_range_min, price_range_max"
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
            치료와 여행을
            <br />
            한 동선으로
          </h1>

          <p className="text-base sm:text-lg text-slate-600 leading-relaxed max-w-2xl mx-auto">
            성형·건강검진·모발이식. 검증된 클리닉을 큐레이팅하고,
            <br />
            회복 기간에 맞춘 관광 코스까지 함께 제안합니다.
          </p>

          <div className="mt-8 flex flex-wrap justify-center gap-4 text-xs text-slate-500">
            <div className="flex items-center gap-1.5">
              <ShieldCheck className="w-4 h-4 text-emerald-500" />
              관리자 검수 정보
            </div>
            <div className="flex items-center gap-1.5">
              <Globe className="w-4 h-4 text-blue-500" />
              인바운드·아웃바운드
            </div>
            <div className="flex items-center gap-1.5">
              <Stethoscope className="w-4 h-4 text-rose-500" />
              직접 예약 X · 정보 제공
            </div>
          </div>
        </div>
      </section>

      {/* Procedure cards */}
      <section className="py-16 bg-white">
        <div className="max-w-6xl mx-auto px-6">
          <div className="text-center mb-10">
            <p className="text-xs font-semibold tracking-[0.25em] text-rose-600 uppercase mb-2">
              By Procedure
            </p>
            <h2 className="text-3xl font-bold text-slate-900 tracking-tight">
              시술별로 둘러보기
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
            {(procedures ?? []).map((p: Procedure) => (
              <Link
                key={p.slug}
                href={`/medical/${p.slug}`}
                className="group bg-white rounded-3xl border border-slate-200 hover:border-rose-300 hover:shadow-xl hover:-translate-y-1 transition-all p-6"
              >
                <div className="text-4xl mb-3">{p.emoji}</div>
                <h3 className="text-xl font-bold text-slate-900 mb-2 tracking-tight">
                  {p.name_ko}
                </h3>
                <p className="text-sm text-slate-600 leading-relaxed mb-4 line-clamp-3">
                  {p.description}
                </p>
                <div className="flex items-center justify-between text-xs">
                  <span className="text-slate-500">
                    평균 회복 {p.recovery_days}일
                  </span>
                  <span className="font-semibold text-rose-600 group-hover:text-rose-700 inline-flex items-center gap-1">
                    클리닉 보기 <ArrowRight className="w-3.5 h-3.5" />
                  </span>
                </div>
              </Link>
            ))}
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
                  Inbound · 한국으로
                </p>
                <h2 className="text-2xl sm:text-3xl font-bold text-slate-900 tracking-tight">
                  외국 환자가 찾는 한국 클리닉
                </h2>
              </div>
              <Plane className="w-8 h-8 text-blue-300" />
            </div>
            <ClinicGrid clinics={inboundClinics} />
          </div>

          {/* Outbound */}
          <div>
            <div className="flex items-center justify-between mb-6">
              <div>
                <p className="text-xs font-semibold tracking-[0.25em] text-rose-600 uppercase mb-1">
                  Outbound · 해외로
                </p>
                <h2 className="text-2xl sm:text-3xl font-bold text-slate-900 tracking-tight">
                  한국인이 떠나는 해외 의료관광
                </h2>
              </div>
              <Plane className="w-8 h-8 text-rose-300 -scale-x-100" />
            </div>
            <ClinicGrid clinics={outboundClinics} />
          </div>
        </div>
      </section>

      {/* CTA / Disclaimer */}
      <section className="py-16 bg-white">
        <div className="max-w-3xl mx-auto px-6 text-center">
          <h2 className="text-2xl sm:text-3xl font-bold text-slate-900 mb-4 tracking-tight">
            병원/클리닉 등록 신청
          </h2>
          <p className="text-slate-600 leading-relaxed mb-6">
            의료기관을 운영하시는 분이라면 Pothos에 정보를 등록하실 수 있습니다.
            <br />
            관리자 검수 후 게시되며, 검수 기준은 의료법 및 외국인환자 유치업
            관련 법령을 따릅니다.
          </p>
          <Link
            href="/medical/register"
            className="inline-flex items-center gap-2 px-6 py-3 rounded-full bg-slate-900 text-white text-sm font-semibold hover:bg-slate-800 transition-colors"
          >
            등록 안내 보기
            <ArrowRight className="w-4 h-4" />
          </Link>

          <p className="mt-10 pt-8 border-t border-slate-100 text-xs text-slate-400 leading-relaxed">
            ※ Pothos는 의료기관·시술의 정보를 큐레이션해 제공하는 미디어
            서비스로,
            <br />
            의료행위·예약·결제를 직접 대행하지 않습니다. 견적·상담은 본인이
            클리닉에 직접 진행하셔야 합니다.
            <br />
            의료법 제27조(영리 알선·유인 금지)를 준수합니다.
          </p>
        </div>
      </section>

      <Footer />
    </div>
  );
}

function ClinicGrid({ clinics }: { clinics: Clinic[] }) {
  if (clinics.length === 0) {
    return (
      <div className="bg-white rounded-2xl border border-dashed border-slate-200 p-10 text-center text-sm text-slate-400">
        등록된 클리닉이 곧 추가됩니다.
      </div>
    );
  }
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
      {clinics.map((c) => (
        <Link
          key={c.slug}
          href={`/medical/clinic/${c.slug}`}
          className="group bg-white rounded-2xl border border-slate-200 hover:border-rose-300 hover:shadow-lg hover:-translate-y-0.5 transition-all p-5"
        >
          <div className="flex items-center gap-2 mb-3">
            <span className="text-xl">{COUNTRY_FLAGS[c.country] ?? "🌍"}</span>
            <span className="text-xs font-semibold text-slate-500">
              {c.country} · {c.city}
            </span>
          </div>
          <h3 className="font-bold text-slate-900 mb-2 tracking-tight group-hover:text-rose-600 transition-colors">
            {c.name}
          </h3>
          {c.highlights && c.highlights.length > 0 && (
            <ul className="space-y-1 mb-3">
              {c.highlights.slice(0, 2).map((h, i) => (
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
      ))}
    </div>
  );
}
