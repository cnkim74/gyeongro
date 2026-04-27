import Link from "next/link";
import { getSupabaseServiceClient } from "@/lib/supabase";
import {
  HeartPulse,
  Sparkles,
  ShieldCheck,
  Building2,
  Calendar,
  ExternalLink,
  Filter,
} from "lucide-react";
import ReviewActions from "./ReviewActions";
import CurateButton from "./CurateButton";

export const metadata = {
  title: "의료관광 클리닉 관리 - Admin",
};

export const dynamic = "force-dynamic";

const STATUS_TABS = [
  { id: "pending", label: "검수 대기", color: "amber" },
  { id: "published", label: "게시중", color: "emerald" },
  { id: "rejected", label: "거절", color: "rose" },
  { id: "archived", label: "보관", color: "slate" },
] as const;

const COUNTRY_FLAGS: Record<string, string> = {
  KR: "🇰🇷", JP: "🇯🇵", TR: "🇹🇷", TH: "🇹🇭", HU: "🇭🇺", FR: "🇫🇷",
  US: "🇺🇸", GB: "🇬🇧", CN: "🇨🇳", VN: "🇻🇳", CZ: "🇨🇿", MY: "🇲🇾",
};

interface SearchParams {
  status?: string;
}

export default async function AdminClinicsPage({
  searchParams,
}: {
  searchParams: Promise<SearchParams>;
}) {
  const { status } = await searchParams;
  const activeStatus = (status as typeof STATUS_TABS[number]["id"]) ?? "pending";

  const supabase = getSupabaseServiceClient();

  // 카운트 (탭별)
  const counts: Record<string, number> = {};
  await Promise.all(
    STATUS_TABS.map(async (s) => {
      const { count } = await supabase
        .from("medical_clinics")
        .select("id", { count: "exact", head: true })
        .eq("status", s.id);
      counts[s.id] = count ?? 0;
    })
  );

  const { data: clinics } = await supabase
    .from("medical_clinics")
    .select(
      "id, slug, name, name_en, direction, country, city, procedures, description, source, status, created_at, contact_email, contact_phone, website_url, submitted_by"
    )
    .eq("status", activeStatus)
    .order("created_at", { ascending: false });

  // CurateButton에 시술 옵션 전달용
  const { data: procedures } = await supabase
    .from("medical_procedures")
    .select("slug, name_ko, emoji")
    .order("display_order");

  return (
    <div className="p-6 lg:p-8 max-w-7xl">
      <div className="flex items-start justify-between gap-4 flex-wrap mb-6">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <HeartPulse className="w-5 h-5 text-rose-500" />
            <h1 className="text-2xl font-bold text-slate-900">의료관광 클리닉</h1>
          </div>
          <p className="text-sm text-slate-500">
            사용자 등록 신청 검수 + AI 큐레이션 데이터 관리
          </p>
        </div>
        <CurateButton procedures={procedures ?? []} />
      </div>

      {/* Status tabs */}
      <div className="flex gap-2 mb-6 overflow-x-auto">
        {STATUS_TABS.map((tab) => {
          const isActive = activeStatus === tab.id;
          return (
            <Link
              key={tab.id}
              href={`/admin/medical/clinics?status=${tab.id}`}
              className={`shrink-0 px-4 py-2 rounded-full text-sm font-semibold transition-colors inline-flex items-center gap-2 ${
                isActive
                  ? "bg-slate-900 text-white"
                  : "bg-white border border-slate-200 text-slate-600 hover:border-slate-300"
              }`}
            >
              {tab.label}
              <span
                className={`text-xs px-1.5 py-0.5 rounded-full ${
                  isActive ? "bg-white/20" : "bg-slate-100 text-slate-500"
                }`}
              >
                {counts[tab.id] ?? 0}
              </span>
            </Link>
          );
        })}
      </div>

      {!clinics || clinics.length === 0 ? (
        <div className="bg-white rounded-3xl border border-dashed border-slate-200 p-16 text-center">
          <Filter className="w-10 h-10 mx-auto text-slate-300 mb-3" />
          <p className="text-slate-500">
            {activeStatus === "pending"
              ? "검수 대기 중인 신청이 없어요."
              : "결과가 없어요."}
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {clinics.map((c) => (
            <div
              key={c.id}
              className="bg-white rounded-2xl border border-slate-200 p-5"
            >
              <div className="flex items-start justify-between gap-4 flex-wrap">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 text-xs text-slate-500 mb-1.5">
                    <span className="text-base">
                      {COUNTRY_FLAGS[c.country] ?? "🌍"}
                    </span>
                    <span className="font-semibold">
                      {c.country} · {c.city}
                    </span>
                    <span className="text-slate-300">·</span>
                    <span
                      className={`px-1.5 py-0.5 rounded-full text-[10px] font-bold uppercase ${
                        c.direction === "inbound"
                          ? "bg-blue-50 text-blue-700"
                          : "bg-rose-50 text-rose-700"
                      }`}
                    >
                      {c.direction}
                    </span>
                    <span className="text-slate-300">·</span>
                    <span className="inline-flex items-center gap-0.5 text-[10px] font-medium text-slate-500">
                      {c.source === "ai_curated" ? (
                        <>
                          <Sparkles className="w-2.5 h-2.5" />
                          AI 큐레이션
                        </>
                      ) : c.source === "verified_partner" ? (
                        <>
                          <ShieldCheck className="w-2.5 h-2.5" />
                          인증 파트너
                        </>
                      ) : (
                        <>
                          <Building2 className="w-2.5 h-2.5" />
                          사용자 등록
                        </>
                      )}
                    </span>
                  </div>
                  <h3 className="font-bold text-slate-900 tracking-tight mb-1">
                    {c.name}
                  </h3>
                  {c.name_en && (
                    <p className="text-xs text-slate-500 italic mb-2">
                      {c.name_en}
                    </p>
                  )}
                  <p className="text-sm text-slate-600 leading-relaxed line-clamp-2 mb-3">
                    {c.description}
                  </p>
                  <div className="flex items-center gap-3 text-xs text-slate-500 flex-wrap">
                    <span className="inline-flex items-center gap-1">
                      <Calendar className="w-3 h-3" />
                      {new Date(c.created_at).toLocaleDateString("ko-KR")}
                    </span>
                    {c.contact_email && (
                      <span className="text-slate-400">{c.contact_email}</span>
                    )}
                    {c.website_url && (
                      <a
                        href={c.website_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-blue-600 hover:underline inline-flex items-center gap-0.5"
                      >
                        <ExternalLink className="w-3 h-3" />
                        웹사이트
                      </a>
                    )}
                    {c.status === "published" && (
                      <Link
                        href={`/medical/clinic/${c.slug}`}
                        target="_blank"
                        className="text-emerald-600 hover:underline inline-flex items-center gap-0.5"
                      >
                        <ExternalLink className="w-3 h-3" />
                        공개 페이지
                      </Link>
                    )}
                  </div>
                </div>

                <div className="w-full sm:w-48 shrink-0">
                  <ReviewActions clinicId={c.id} currentStatus={c.status} />
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
