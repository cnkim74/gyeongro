import Link from "next/link";
import { redirect } from "next/navigation";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { auth } from "@/lib/auth";
import { getSupabaseServiceClient } from "@/lib/supabase";
import {
  Mountain,
  ArrowLeft,
  Star,
  CheckCircle2,
  Inbox,
  Send,
  Wallet,
  Calendar,
  ExternalLink,
  Users,
  AlertCircle,
} from "lucide-react";
import DashboardTabs from "./DashboardTabs";
import BookingActions from "./BookingActions";
import ProfileEditor from "./ProfileEditor";
import ReplyForm from "./ReplyForm";
import MessageThread from "@/components/MessageThread";
import { formatRate } from "@/lib/sherpa";

export const metadata = {
  title: "셰르파 대시보드 - Pothos",
};

export const dynamic = "force-dynamic";

const STATUS_LABEL: Record<string, string> = {
  pending: "대기 중",
  accepted: "수락됨",
  declined: "거절",
  cancelled: "취소",
  completed: "완료",
  expired: "만료",
  withdrawn: "철회",
};

const STATUS_COLOR: Record<string, string> = {
  pending: "bg-amber-50 text-amber-700",
  accepted: "bg-emerald-50 text-emerald-700",
  declined: "bg-slate-100 text-slate-500",
  cancelled: "bg-slate-100 text-slate-500",
  completed: "bg-blue-50 text-blue-700",
  expired: "bg-slate-100 text-slate-500",
  withdrawn: "bg-slate-100 text-slate-500",
};

export default async function SherpaDashboardPage() {
  const session = await auth();
  if (!session?.user?.id) redirect("/login?callbackUrl=/sherpa/dashboard");

  const supabase = getSupabaseServiceClient();

  const { data: sherpa } = await supabase
    .from("sherpas")
    .select("*")
    .eq("user_id", session.user.id)
    .maybeSingle();

  if (!sherpa) {
    return (
      <NotASherpa />
    );
  }

  if (sherpa.status === "pending") {
    return <Pending />;
  }
  if (sherpa.status === "rejected") {
    return <Rejected reason={sherpa.rejection_reason} />;
  }

  // 받은 예약 (Path A)
  const { data: bookings } = await supabase
    .from("sherpa_bookings")
    .select("*")
    .eq("sherpa_id", sherpa.id)
    .order("created_at", { ascending: false })
    .limit(50);

  // 내 제안 (Path B)
  const { data: proposalsRaw } = await supabase
    .from("sherpa_proposals")
    .select(
      "id, proposed_price_krw, proposed_scope, message, status, created_at, travel_plans(id, title, destination, days)"
    )
    .eq("sherpa_id", sherpa.id)
    .order("created_at", { ascending: false })
    .limit(50);

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const proposals = (proposalsRaw ?? []) as any[];
  const allBookings = bookings ?? [];

  // 받은 후기
  const { data: reviewsRaw } = await supabase
    .from("sherpa_reviews")
    .select("id, rating, comment, sherpa_reply, sherpa_replied_at, created_at, client_id, status")
    .eq("sherpa_id", sherpa.id)
    .order("created_at", { ascending: false })
    .limit(50);

  const reviewClientIds = (reviewsRaw ?? [])
    .map((r) => r.client_id)
    .filter((v): v is string => !!v);
  let reviewClientMap: Record<string, string> = {};
  if (reviewClientIds.length > 0) {
    const { data: users } = await supabase
      .schema("next_auth")
      .from("users")
      .select("id, nickname, name")
      .in("id", reviewClientIds);
    reviewClientMap = Object.fromEntries(
      (users ?? []).map((u) => [u.id, u.nickname ?? u.name ?? "익명 여행자"])
    );
  }
  const reviews = (reviewsRaw ?? []).map((r) => ({
    ...r,
    client_name: r.client_id ? reviewClientMap[r.client_id] ?? null : null,
  }));
  const pendingReplies = reviews.filter(
    (r) => !r.sherpa_reply && r.status === "visible"
  ).length;

  const pendingBookings = allBookings.filter((b) => b.status === "pending").length;
  const pendingProposals = proposals.filter((p) => p.status === "pending").length;

  // 통계
  const acceptedBookings = allBookings.filter((b) => b.status === "accepted").length;
  const completedBookings = allBookings.filter((b) => b.status === "completed").length;

  const earnedKrw = allBookings
    .filter((b) => b.status === "completed")
    .reduce((s, b) => s + (b.estimated_price_krw ?? 0), 0);

  return (
    <div className="flex flex-col min-h-screen bg-slate-50">
      <Header />

      <main className="flex-1 pt-24 pb-16">
        <div className="max-w-5xl mx-auto px-4">
          <Link
            href="/sherpa"
            className="inline-flex items-center gap-1.5 text-sm text-slate-500 hover:text-slate-800 mb-6"
          >
            <ArrowLeft className="w-4 h-4" /> 셰르파 홈
          </Link>

          {/* Hero */}
          <div className="bg-gradient-to-br from-emerald-500 to-teal-600 rounded-3xl p-7 text-white mb-6 flex items-center gap-5 flex-wrap">
            {sherpa.avatar_url ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={sherpa.avatar_url}
                alt={sherpa.display_name}
                className="w-16 h-16 rounded-2xl object-cover bg-white/20"
              />
            ) : (
              <div className="w-16 h-16 rounded-2xl bg-white/20 flex items-center justify-center text-2xl font-bold">
                {sherpa.display_name.charAt(0)}
              </div>
            )}
            <div className="flex-1 min-w-0">
              <p className="text-xs text-white/70 mb-0.5">
                <Mountain className="w-3 h-3 inline mr-1" />
                Sherpa Dashboard
              </p>
              <h1 className="text-2xl font-bold tracking-tight">
                안녕하세요, {sherpa.display_name} 셰르파!
              </h1>
              {sherpa.tagline && (
                <p className="text-sm text-white/80 mt-1">{sherpa.tagline}</p>
              )}
            </div>
            <Link
              href={`/sherpa/${sherpa.slug}`}
              target="_blank"
              className="inline-flex items-center gap-1 px-4 py-2 rounded-full bg-white/20 hover:bg-white/30 text-white text-sm font-semibold transition-colors"
            >
              <ExternalLink className="w-3.5 h-3.5" />
              공개 프로필
            </Link>
          </div>

          <DashboardTabs
            bookingCount={pendingBookings}
            proposalCount={pendingProposals}
            reviewCount={pendingReplies}
            stats={
              <StatsView
                rating={Number(sherpa.rating_avg ?? 0)}
                ratingCount={sherpa.rating_count}
                bookingCount={sherpa.booking_count}
                pendingBookings={pendingBookings}
                acceptedBookings={acceptedBookings}
                completedBookings={completedBookings}
                pendingProposals={pendingProposals}
                earnedKrw={earnedKrw}
                viewCount={sherpa.view_count}
              />
            }
            bookings={
              <BookingsView bookings={allBookings} myUserId={session.user.id} />
            }
            proposals={
              <ProposalsView proposals={proposals} myUserId={session.user.id} />
            }
            reviews={<ReviewsView reviews={reviews} />}
            profile={<ProfileEditor sherpa={sherpa} />}
          />
        </div>
      </main>

      <Footer />
    </div>
  );
}

function StatsView({
  rating,
  ratingCount,
  bookingCount,
  pendingBookings,
  acceptedBookings,
  completedBookings,
  pendingProposals,
  earnedKrw,
  viewCount,
}: {
  rating: number;
  ratingCount: number;
  bookingCount: number;
  pendingBookings: number;
  acceptedBookings: number;
  completedBookings: number;
  pendingProposals: number;
  earnedKrw: number;
  viewCount: number;
}) {
  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
      <StatCard
        label="평점"
        value={
          ratingCount > 0
            ? `${rating.toFixed(2)}`
            : "—"
        }
        sub={ratingCount > 0 ? `${ratingCount}개 후기` : "후기 없음"}
        icon={<Star className="w-4 h-4 text-amber-400" />}
        accent="text-amber-600"
      />
      <StatCard
        label="총 매칭"
        value={bookingCount.toString()}
        sub={`완료 ${completedBookings} · 진행 ${acceptedBookings}`}
        icon={<CheckCircle2 className="w-4 h-4 text-emerald-500" />}
        accent="text-emerald-600"
      />
      <StatCard
        label="누적 매칭금액"
        value={`${(earnedKrw / 10000).toLocaleString("ko-KR")}만원`}
        sub="완료 예약 합계"
        icon={<Wallet className="w-4 h-4 text-blue-500" />}
        accent="text-blue-600"
      />
      <StatCard
        label="프로필 조회"
        value={viewCount.toString()}
        sub="누적 페이지 뷰"
        icon={<Users className="w-4 h-4 text-slate-500" />}
        accent="text-slate-700"
      />

      <ActionCard
        href="#bookings"
        icon={<Inbox className="w-5 h-5 text-amber-500" />}
        title={`처리 대기 예약 ${pendingBookings}건`}
        desc="여행자가 기다리고 있어요"
      />
      <ActionCard
        href="#proposals"
        icon={<Send className="w-5 h-5 text-blue-500" />}
        title={`보낸 제안 ${pendingProposals}건`}
        desc="여행자 응답 대기 중"
      />
      <ActionCard
        href="/sherpa/open-trips"
        icon={<Mountain className="w-5 h-5 text-emerald-500" />}
        title="공개된 여행 둘러보기"
        desc="새 일정에 제안 보내기"
      />
      <ActionCard
        href="/sherpa"
        icon={<ExternalLink className="w-5 h-5 text-slate-500" />}
        title="셰르파 홈"
        desc="다른 셰르파 둘러보기"
      />
    </div>
  );
}

function StatCard({
  label,
  value,
  sub,
  icon,
  accent,
}: {
  label: string;
  value: string;
  sub: string;
  icon: React.ReactNode;
  accent: string;
}) {
  return (
    <div className="bg-white rounded-2xl border border-slate-200 p-4">
      <div className="flex items-center gap-1.5 text-xs text-slate-500 mb-2">
        {icon}
        {label}
      </div>
      <p className={`text-2xl font-bold ${accent} tracking-tight`}>{value}</p>
      <p className="text-xs text-slate-400 mt-0.5">{sub}</p>
    </div>
  );
}

function ActionCard({
  href,
  icon,
  title,
  desc,
}: {
  href: string;
  icon: React.ReactNode;
  title: string;
  desc: string;
}) {
  return (
    <Link
      href={href}
      className="bg-white rounded-2xl border border-slate-200 hover:border-emerald-300 hover:shadow-md p-4 transition-all"
    >
      <div className="mb-2">{icon}</div>
      <p className="text-sm font-bold text-slate-900">{title}</p>
      <p className="text-xs text-slate-500 mt-0.5">{desc}</p>
    </Link>
  );
}

function BookingsView({
  bookings,
  myUserId,
}: {
  bookings: Array<{
    id: string;
    destination_city: string;
    start_date: string;
    end_date: string;
    duration_type: string;
    party_size: number;
    notes: string;
    contact_name: string;
    contact_email: string;
    contact_phone: string | null;
    estimated_price_krw: number | null;
    status: string;
    created_at: string;
  }>;
  myUserId: string;
}) {
  if (bookings.length === 0) {
    return (
      <EmptyState
        title="아직 받은 예약이 없어요"
        sub="공개 프로필을 통해 여행자가 직접 예약 요청을 보낼 수 있어요."
      />
    );
  }
  return (
    <div className="space-y-3">
      {bookings.map((b) => {
        const showThread = b.status === "accepted" || b.status === "completed";
        return (
          <div
            key={b.id}
            className="bg-white rounded-2xl border border-slate-200 p-5"
          >
            <div className="flex items-center justify-between mb-3 flex-wrap gap-2">
              <div className="flex items-center gap-2 text-xs text-slate-500">
                <Calendar className="w-3 h-3" />
                {new Date(b.created_at).toLocaleString("ko-KR")}
              </div>
              <span
                className={`text-[10px] px-2 py-0.5 rounded-full font-bold uppercase ${
                  STATUS_COLOR[b.status] ?? "bg-slate-100 text-slate-500"
                }`}
              >
                {STATUS_LABEL[b.status] ?? b.status}
              </span>
            </div>

            <div className="flex items-center gap-3 mb-2 flex-wrap">
              <h3 className="font-bold text-slate-900">{b.contact_name}</h3>
              <a
                href={`mailto:${b.contact_email}`}
                className="text-xs text-blue-600 hover:underline"
              >
                {b.contact_email}
              </a>
              {b.contact_phone && (
                <a
                  href={`tel:${b.contact_phone}`}
                  className="text-xs text-blue-600 hover:underline"
                >
                  {b.contact_phone}
                </a>
              )}
            </div>

            <div className="flex items-center gap-3 text-xs text-slate-500 mb-3 flex-wrap">
              <span>📍 {b.destination_city}</span>
              <span>
                📅 {b.start_date} ~ {b.end_date}
              </span>
              <span>👥 {b.party_size}명</span>
              <span>⏱ {durationLabel(b.duration_type)}</span>
              {b.estimated_price_krw && (
                <span className="font-semibold text-emerald-600">
                  {formatRate(b.estimated_price_krw)}
                </span>
              )}
            </div>

            {b.notes && (
              <div className="bg-slate-50 rounded-xl p-3 text-sm text-slate-700 mb-3 whitespace-pre-line">
                {b.notes}
              </div>
            )}

            <BookingActions bookingId={b.id} currentStatus={b.status} />

            {showThread && (
              <div className="mt-4 pt-4 border-t border-slate-100">
                <MessageThread
                  bookingId={b.id}
                  myRole="sherpa"
                  myUserId={myUserId}
                  partnerName={b.contact_name}
                />
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}

function ProposalsView({
  proposals,
  myUserId,
}: {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  proposals: any[];
  myUserId: string;
}) {
  if (proposals.length === 0) {
    return (
      <EmptyState
        title="아직 보낸 제안이 없어요"
        sub="공개된 여행 일정에 제안을 보내보세요."
        cta={{ href: "/sherpa/open-trips", label: "공개 여행 둘러보기" }}
      />
    );
  }
  return (
    <div className="space-y-3">
      {proposals.map((p) => (
        <div
          key={p.id}
          className="bg-white rounded-2xl border border-slate-200 p-5"
        >
          <div className="flex items-center justify-between mb-3 flex-wrap gap-2">
            <div className="flex items-center gap-2 text-xs text-slate-500">
              <Calendar className="w-3 h-3" />
              {new Date(p.created_at).toLocaleString("ko-KR")}
            </div>
            <span
              className={`text-[10px] px-2 py-0.5 rounded-full font-bold uppercase ${
                STATUS_COLOR[p.status] ?? "bg-slate-100 text-slate-500"
              }`}
            >
              {STATUS_LABEL[p.status] ?? p.status}
            </span>
          </div>

          <h3 className="font-bold text-slate-900 mb-1">
            {p.travel_plans?.title ?? "여행"}
          </h3>
          <p className="text-xs text-slate-500 mb-3">
            📍 {p.travel_plans?.destination} · {p.travel_plans?.days}박
          </p>

          <div className="flex items-center justify-between bg-emerald-50 rounded-xl p-3 mb-3">
            <span className="text-xs text-slate-500">제안가</span>
            <span className="text-lg font-bold text-emerald-700">
              {formatRate(p.proposed_price_krw)}
            </span>
          </div>

          <p className="text-xs font-semibold text-slate-500 mb-1">제안 범위</p>
          <p className="text-sm text-slate-800 mb-3">{p.proposed_scope}</p>

          <p className="text-xs font-semibold text-slate-500 mb-1">메시지</p>
          <p className="text-sm text-slate-700 leading-relaxed line-clamp-3 whitespace-pre-line">
            {p.message}
          </p>

          {p.status === "accepted" && (
            <div className="mt-4 pt-4 border-t border-slate-100">
              <MessageThread
                proposalId={p.id}
                myRole="sherpa"
                myUserId={myUserId}
                partnerName={p.travel_plans?.title ?? "여행자"}
              />
            </div>
          )}
        </div>
      ))}
    </div>
  );
}

function ReviewsView({
  reviews,
}: {
  reviews: Array<{
    id: string;
    rating: number;
    comment: string;
    sherpa_reply: string | null;
    sherpa_replied_at: string | null;
    created_at: string;
    client_name: string | null;
    status: string;
  }>;
}) {
  if (reviews.length === 0) {
    return (
      <EmptyState
        title="아직 받은 후기가 없어요"
        sub="첫 매칭이 완료되면 여행자가 후기를 남길 수 있어요."
      />
    );
  }
  return (
    <div className="space-y-3">
      {reviews.map((r) => (
        <div
          key={r.id}
          className="bg-white border border-slate-200 rounded-2xl p-5"
        >
          <div className="flex items-center justify-between mb-3 flex-wrap gap-2">
            <div className="flex items-center gap-2">
              <div className="inline-flex">
                {[1, 2, 3, 4, 5].map((n) => (
                  <Star
                    key={n}
                    className={`w-4 h-4 ${
                      r.rating >= n
                        ? "fill-amber-400 text-amber-400"
                        : "text-slate-200"
                    }`}
                  />
                ))}
              </div>
              <span className="text-sm font-semibold text-slate-700">
                {r.client_name ?? "익명 여행자"}
              </span>
            </div>
            <span className="text-xs text-slate-400">
              {new Date(r.created_at).toLocaleDateString("ko-KR")}
            </span>
          </div>

          <p className="text-sm text-slate-700 leading-relaxed mb-2 whitespace-pre-line">
            {r.comment}
          </p>

          {r.sherpa_reply ? (
            <div className="mt-3 pl-3 border-l-2 border-emerald-200 bg-emerald-50/40 rounded-r-xl p-3">
              <p className="text-[11px] font-bold text-emerald-700 uppercase tracking-wider mb-1">
                나의 답글
              </p>
              <p className="text-xs text-slate-700 leading-relaxed whitespace-pre-line">
                {r.sherpa_reply}
              </p>
            </div>
          ) : (
            <ReplyForm reviewId={r.id} />
          )}
        </div>
      ))}
    </div>
  );
}

function EmptyState({
  title,
  sub,
  cta,
}: {
  title: string;
  sub: string;
  cta?: { href: string; label: string };
}) {
  return (
    <div className="bg-white rounded-3xl border border-dashed border-slate-200 p-14 text-center">
      <Inbox className="w-10 h-10 mx-auto text-slate-300 mb-3" />
      <p className="text-slate-700 font-semibold mb-1">{title}</p>
      <p className="text-sm text-slate-500 mb-4">{sub}</p>
      {cta && (
        <Link
          href={cta.href}
          className="inline-flex items-center gap-1 px-4 py-2 rounded-full bg-emerald-500 text-white text-sm font-semibold hover:bg-emerald-600 transition-colors"
        >
          {cta.label}
        </Link>
      )}
    </div>
  );
}

function durationLabel(d: string): string {
  return (
    {
      hourly: "시간제",
      half_day: "반나절",
      full_day: "종일",
      multi_day: "다중일",
    }[d] ?? d
  );
}

function NotASherpa() {
  return (
    <div className="flex flex-col min-h-screen bg-white">
      <Header />
      <main className="flex-1 pt-24 pb-20 flex items-center justify-center">
        <div className="max-w-md mx-auto px-6 text-center">
          <Mountain className="w-12 h-12 mx-auto text-slate-300 mb-4" />
          <h1 className="text-2xl font-bold text-slate-900 mb-2">
            셰르파 전용 페이지입니다
          </h1>
          <p className="text-slate-500 mb-6">
            대시보드는 셰르파로 등록된 사용자만 접근할 수 있어요.
          </p>
          <Link
            href="/sherpa/become"
            className="inline-flex items-center gap-1.5 px-6 py-3 rounded-full bg-emerald-500 text-white font-semibold hover:bg-emerald-600 transition-colors"
          >
            셰르파 신청하기
          </Link>
        </div>
      </main>
      <Footer />
    </div>
  );
}

function Pending() {
  return (
    <div className="flex flex-col min-h-screen bg-white">
      <Header />
      <main className="flex-1 pt-24 pb-20 flex items-center justify-center">
        <div className="max-w-md mx-auto px-6 text-center">
          <Mountain className="w-12 h-12 mx-auto text-amber-400 mb-4" />
          <h1 className="text-2xl font-bold text-slate-900 mb-2">검수 중입니다</h1>
          <p className="text-slate-500 mb-2">
            신청해주신 셰르파 프로필이 운영팀 검수 중이에요.
          </p>
          <p className="text-sm text-slate-400">평균 2~3 영업일 소요됩니다.</p>
        </div>
      </main>
      <Footer />
    </div>
  );
}

function Rejected({ reason }: { reason: string | null }) {
  return (
    <div className="flex flex-col min-h-screen bg-white">
      <Header />
      <main className="flex-1 pt-24 pb-20 flex items-center justify-center">
        <div className="max-w-md mx-auto px-6 text-center">
          <AlertCircle className="w-12 h-12 mx-auto text-rose-400 mb-4" />
          <h1 className="text-2xl font-bold text-slate-900 mb-2">
            신청이 거절됐어요
          </h1>
          {reason && (
            <p className="text-sm text-slate-600 bg-slate-50 rounded-xl p-3 mb-4">
              {reason}
            </p>
          )}
          <p className="text-sm text-slate-500">
            궁금한 점이 있으시면 운영팀에 문의해주세요.
          </p>
        </div>
      </main>
      <Footer />
    </div>
  );
}

