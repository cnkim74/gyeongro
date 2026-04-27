import Link from "next/link";
import { getSupabaseServiceClient } from "@/lib/supabase";
import {
  MessagesSquare,
  Mail,
  Phone,
  Calendar,
  Wallet,
  ExternalLink,
} from "lucide-react";

export const metadata = {
  title: "의료관광 상담 요청 - Admin",
};

export const dynamic = "force-dynamic";

const STATUS_TABS = [
  { id: "new", label: "신규" },
  { id: "forwarded", label: "전달완료" },
  { id: "responded", label: "응답완료" },
  { id: "closed", label: "종료" },
] as const;

interface SearchParams {
  status?: string;
}

export default async function AdminInquiriesPage({
  searchParams,
}: {
  searchParams: Promise<SearchParams>;
}) {
  const { status } = await searchParams;
  const activeStatus = (status as typeof STATUS_TABS[number]["id"]) ?? "new";

  const supabase = getSupabaseServiceClient();

  const counts: Record<string, number> = {};
  await Promise.all(
    STATUS_TABS.map(async (s) => {
      const { count } = await supabase
        .from("medical_inquiries")
        .select("id", { count: "exact", head: true })
        .eq("status", s.id);
      counts[s.id] = count ?? 0;
    })
  );

  const { data: inquiries } = await supabase
    .from("medical_inquiries")
    .select(
      "id, clinic_id, procedure_slug, contact_name, contact_email, contact_phone, preferred_contact, preferred_date, budget_krw, notes, status, created_at, medical_clinics(name, slug)"
    )
    .eq("status", activeStatus)
    .order("created_at", { ascending: false });

  return (
    <div className="p-6 lg:p-8 max-w-6xl">
      <div className="flex items-center gap-2 mb-1">
        <MessagesSquare className="w-5 h-5 text-blue-500" />
        <h1 className="text-2xl font-bold text-slate-900">상담 요청</h1>
      </div>
      <p className="text-sm text-slate-500 mb-6">
        의료관광 상담 신청 — 운영팀이 클리닉에 전달 후 응답 회신
      </p>

      <div className="flex gap-2 mb-6 overflow-x-auto">
        {STATUS_TABS.map((tab) => {
          const isActive = activeStatus === tab.id;
          return (
            <Link
              key={tab.id}
              href={`/admin/medical/inquiries?status=${tab.id}`}
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

      {!inquiries || inquiries.length === 0 ? (
        <div className="bg-white rounded-3xl border border-dashed border-slate-200 p-16 text-center">
          <p className="text-slate-500">결과가 없어요.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {inquiries.map((q) => {
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            const clinic = (q as any).medical_clinics;
            return (
              <div
                key={q.id}
                className="bg-white rounded-2xl border border-slate-200 p-5"
              >
                <div className="flex items-center justify-between flex-wrap gap-2 mb-2">
                  <div className="flex items-center gap-2 text-xs text-slate-500">
                    <Calendar className="w-3 h-3" />
                    {new Date(q.created_at).toLocaleString("ko-KR")}
                  </div>
                  {clinic && (
                    <Link
                      href={`/medical/clinic/${clinic.slug}`}
                      target="_blank"
                      className="text-xs font-semibold text-rose-600 hover:underline inline-flex items-center gap-0.5"
                    >
                      <ExternalLink className="w-3 h-3" />
                      {clinic.name}
                    </Link>
                  )}
                </div>

                <div className="flex items-center gap-3 mb-3 flex-wrap">
                  <span className="font-bold text-slate-900">{q.contact_name}</span>
                  <span className="inline-flex items-center gap-0.5 text-xs text-slate-500">
                    <Mail className="w-3 h-3" />
                    <a
                      href={`mailto:${q.contact_email}`}
                      className="hover:underline"
                    >
                      {q.contact_email}
                    </a>
                  </span>
                  {q.contact_phone && (
                    <span className="inline-flex items-center gap-0.5 text-xs text-slate-500">
                      <Phone className="w-3 h-3" />
                      <a
                        href={`tel:${q.contact_phone}`}
                        className="hover:underline"
                      >
                        {q.contact_phone}
                      </a>
                    </span>
                  )}
                  <span className="text-xs px-2 py-0.5 rounded-full bg-blue-50 text-blue-700 font-semibold">
                    선호: {q.preferred_contact}
                  </span>
                </div>

                <p className="text-sm text-slate-700 leading-relaxed bg-slate-50 rounded-xl p-3 mb-2 whitespace-pre-line">
                  {q.notes}
                </p>

                <div className="flex items-center gap-3 text-xs text-slate-500 flex-wrap">
                  {q.preferred_date && (
                    <span>희망일: {q.preferred_date}</span>
                  )}
                  {q.budget_krw && (
                    <span className="inline-flex items-center gap-0.5">
                      <Wallet className="w-3 h-3" />
                      예산 {(q.budget_krw / 10000).toLocaleString("ko-KR")}만원
                    </span>
                  )}
                  {q.procedure_slug && (
                    <span className="text-rose-600 font-medium">
                      {q.procedure_slug}
                    </span>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
