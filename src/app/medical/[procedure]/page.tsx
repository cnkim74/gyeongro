import Link from "next/link";
import { notFound } from "next/navigation";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { getSupabaseServiceClient } from "@/lib/supabase";
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
  direction: "inbound" | "outbound";
  country: string;
  city: string;
  highlights: string[] | null;
  price_range_min: number | null;
  price_range_max: number | null;
}

function formatPrice(min: number | null, max: number | null) {
  if (!min && !max) return "문의";
  const fmt = (n: number) => `${(n / 10000).toLocaleString("ko-KR")}만원`;
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

  const supabase = getSupabaseServiceClient();
  const { data: proc } = await supabase
    .from("medical_procedures")
    .select("slug, name_ko, name_en, emoji, description, recovery_days")
    .eq("slug", slug)
    .maybeSingle();

  if (!proc) notFound();

  let query = supabase
    .from("medical_clinics")
    .select(
      "slug, name, direction, country, city, highlights, price_range_min, price_range_max"
    )
    .eq("status", "published")
    .contains("procedures", [slug])
    .order("display_order");

  if (direction) query = query.eq("direction", direction);

  const { data: clinicsRaw } = await query;
  const clinics = (clinicsRaw ?? []) as Clinic[];

  return (
    <div className="flex flex-col min-h-screen bg-white">
      <Header />

      <main className="flex-1 pt-24 pb-16">
        <div className="max-w-5xl mx-auto px-6">
          <Link
            href="/medical"
            className="inline-flex items-center gap-1.5 text-sm text-slate-500 hover:text-slate-800 mb-6"
          >
            <ArrowLeft className="w-4 h-4" /> 의료관광 홈
          </Link>

          <div className="flex items-start gap-5 mb-10">
            <div className="text-6xl">{proc.emoji}</div>
            <div className="flex-1">
              <p className="text-xs font-semibold tracking-[0.2em] text-rose-600 uppercase mb-1">
                {proc.name_en}
              </p>
              <h1 className="text-3xl sm:text-4xl font-bold text-slate-900 mb-3 tracking-tight">
                {proc.name_ko} 의료관광
              </h1>
              <p className="text-slate-600 leading-relaxed">
                {proc.description}
              </p>
              <div className="flex items-center gap-4 mt-4 text-xs text-slate-500">
                <span className="flex items-center gap-1.5">
                  <Stethoscope className="w-3.5 h-3.5" />
                  평균 회복 {proc.recovery_days}일
                </span>
                <span>·</span>
                <span>등록 {clinics.length}곳</span>
              </div>
            </div>
          </div>

          {/* Direction filter */}
          <div className="flex gap-2 mb-8 overflow-x-auto">
            <FilterPill
              href={`/medical/${slug}`}
              active={!direction}
              label="전체"
            />
            <FilterPill
              href={`/medical/${slug}?direction=inbound`}
              active={direction === "inbound"}
              label="🇰🇷 한국으로 (Inbound)"
            />
            <FilterPill
              href={`/medical/${slug}?direction=outbound`}
              active={direction === "outbound"}
              label="✈️ 해외로 (Outbound)"
            />
          </div>

          {clinics.length === 0 ? (
            <div className="bg-slate-50 rounded-3xl border border-dashed border-slate-200 p-14 text-center">
              <p className="text-slate-500 mb-2">
                해당 조건에 맞는 클리닉이 아직 없습니다.
              </p>
              <p className="text-xs text-slate-400">
                관리자가 큐레이션하는 대로 곧 추가됩니다.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {clinics.map((c) => (
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
                        {c.country} · {c.city}
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
                    {c.name}
                  </h3>
                  {c.highlights && c.highlights.length > 0 && (
                    <ul className="space-y-1 mb-4">
                      {c.highlights.slice(0, 3).map((h, i) => (
                        <li key={i} className="text-xs text-slate-600">
                          · {h}
                        </li>
                      ))}
                    </ul>
                  )}
                  <div className="flex items-center justify-between pt-3 border-t border-slate-100">
                    <span className="text-sm font-semibold text-rose-600">
                      {formatPrice(c.price_range_min, c.price_range_max)}
                    </span>
                    <ArrowRight className="w-4 h-4 text-slate-300 group-hover:text-rose-500 group-hover:translate-x-0.5 transition-all" />
                  </div>
                </Link>
              ))}
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
