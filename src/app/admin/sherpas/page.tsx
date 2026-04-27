import Link from "next/link";
import { getSupabaseServiceClient } from "@/lib/supabase";
import {
  SPECIALTY_BY_ID,
  LANGUAGE_BY_CODE,
  COUNTRY_FLAGS,
} from "@/lib/sherpa";
import {
  Mountain,
  Calendar,
  Filter,
  ExternalLink,
  Star,
  ShieldCheck,
} from "lucide-react";
import ReviewActions from "./ReviewActions";

export const metadata = {
  title: "셰르파 관리 - Admin",
};

export const dynamic = "force-dynamic";

const STATUS_TABS = [
  { id: "pending", label: "검수 대기" },
  { id: "published", label: "활동중" },
  { id: "rejected", label: "거절" },
  { id: "paused", label: "일시중지" },
] as const;

interface SearchParams {
  status?: string;
}

export default async function AdminSherpasPage({
  searchParams,
}: {
  searchParams: Promise<SearchParams>;
}) {
  const { status } = await searchParams;
  const activeStatus = (status as typeof STATUS_TABS[number]["id"]) ?? "pending";

  const supabase = getSupabaseServiceClient();

  const counts: Record<string, number> = {};
  await Promise.all(
    STATUS_TABS.map(async (s) => {
      const { count } = await supabase
        .from("sherpas")
        .select("id", { count: "exact", head: true })
        .eq("status", s.id);
      counts[s.id] = count ?? 0;
    })
  );

  const { data: sherpas } = await supabase
    .from("sherpas")
    .select(
      "id, slug, display_name, tagline, bio, countries, cities, languages, specialties, hourly_rate_krw, full_day_rate_krw, status, created_at, rating_avg, rating_count, booking_count, verified_id, user_id"
    )
    .eq("status", activeStatus)
    .order("created_at", { ascending: false });

  return (
    <div className="p-6 lg:p-8 max-w-7xl">
      <div className="flex items-center gap-2 mb-1">
        <Mountain className="w-5 h-5 text-emerald-500" />
        <h1 className="text-2xl font-bold text-slate-900">셰르파</h1>
      </div>
      <p className="text-sm text-slate-500 mb-6">
        등록 신청 검수 + 활동중 셰르파 관리
      </p>

      <div className="flex gap-2 mb-6 overflow-x-auto">
        {STATUS_TABS.map((tab) => {
          const isActive = activeStatus === tab.id;
          return (
            <Link
              key={tab.id}
              href={`/admin/sherpas?status=${tab.id}`}
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

      {!sherpas || sherpas.length === 0 ? (
        <div className="bg-white rounded-3xl border border-dashed border-slate-200 p-16 text-center">
          <Filter className="w-10 h-10 mx-auto text-slate-300 mb-3" />
          <p className="text-slate-500">결과가 없어요.</p>
        </div>
      ) : (
        <div className="space-y-4">
          {sherpas.map((s) => (
            <div
              key={s.id}
              className="bg-white rounded-2xl border border-slate-200 p-5"
            >
              <div className="flex items-start justify-between gap-4 flex-wrap">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 text-xs text-slate-500 mb-1.5 flex-wrap">
                    {s.countries.map((c: string, i: number) => (
                      <span key={i}>{COUNTRY_FLAGS[c] ?? "🌍"}</span>
                    ))}
                    <span className="font-semibold">
                      {s.cities.slice(0, 2).join(", ")}
                    </span>
                    <span className="text-slate-300">·</span>
                    <span>
                      {s.languages
                        .map((l: string) => LANGUAGE_BY_CODE[l]?.label ?? l)
                        .join(", ")}
                    </span>
                    {s.verified_id && (
                      <span className="inline-flex items-center gap-0.5 text-emerald-600 text-[10px] font-semibold">
                        <ShieldCheck className="w-2.5 h-2.5" />
                        신원확인
                      </span>
                    )}
                  </div>

                  <h3 className="font-bold text-slate-900 tracking-tight">
                    {s.display_name}
                  </h3>
                  {s.tagline && (
                    <p className="text-xs text-slate-500 mb-2">{s.tagline}</p>
                  )}
                  <p className="text-sm text-slate-600 leading-relaxed line-clamp-2 mb-3">
                    {s.bio}
                  </p>

                  <div className="flex flex-wrap gap-1 mb-3">
                    {s.specialties.map((sp: string) => {
                      const meta = SPECIALTY_BY_ID[sp];
                      return (
                        <span
                          key={sp}
                          className="inline-flex items-center gap-0.5 px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 text-[10px] font-medium"
                        >
                          {meta?.emoji} {meta?.label ?? sp}
                        </span>
                      );
                    })}
                  </div>

                  <div className="flex items-center gap-3 text-xs text-slate-500 flex-wrap">
                    <span className="inline-flex items-center gap-1">
                      <Calendar className="w-3 h-3" />
                      {new Date(s.created_at).toLocaleDateString("ko-KR")}
                    </span>
                    {s.hourly_rate_krw && (
                      <span>시간당 {(s.hourly_rate_krw / 10000).toFixed(0)}만원</span>
                    )}
                    {s.full_day_rate_krw && (
                      <span>종일 {(s.full_day_rate_krw / 10000).toFixed(0)}만원</span>
                    )}
                    {s.rating_count > 0 && (
                      <span className="inline-flex items-center gap-0.5 text-amber-600">
                        <Star className="w-3 h-3 fill-amber-400 text-amber-400" />
                        {Number(s.rating_avg).toFixed(2)} ({s.rating_count})
                      </span>
                    )}
                    {s.booking_count > 0 && (
                      <span>{s.booking_count}건 매칭</span>
                    )}
                    {s.status === "published" && (
                      <Link
                        href={`/sherpa/${s.slug}`}
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
                  <ReviewActions sherpaId={s.id} currentStatus={s.status} />
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
