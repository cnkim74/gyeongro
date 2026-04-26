import Link from "next/link";
import { notFound } from "next/navigation";
import { auth } from "@/lib/auth";
import { isAdmin } from "@/lib/admin";
import { getSupabaseServiceClient } from "@/lib/supabase";
import Header from "@/components/Header";
import RoleBadge from "@/components/RoleBadge";
import {
  ArrowLeft,
  MapPin,
  Calendar,
  Users,
  Wallet,
  MessageSquare,
} from "lucide-react";
import type { UserRole } from "@/lib/admin";
import ApplyForm from "./ApplyForm";
import OwnerActions from "./OwnerActions";
import ApplicationDecisionButtons from "./ApplicationDecisionButtons";

export const dynamic = "force-dynamic";

const GENDER_LABEL: Record<string, string> = {
  male: "남성",
  female: "여성",
};

const AGE_LABEL: Record<string, string> = {
  "20s": "20대",
  "30s": "30대",
  "40s": "40대",
  "50s+": "50대 이상",
  "20s_30s": "20-30대",
};

interface ApplicationRow {
  id: string;
  user_id: string;
  message: string | null;
  status: string;
  created_at: string;
}

export default async function PartnerDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = getSupabaseServiceClient();

  await supabase
    .from("partner_posts")
    .select("view_count")
    .eq("id", id)
    .single()
    .then(async ({ data }) => {
      if (data) {
        await supabase
          .from("partner_posts")
          .update({ view_count: (data.view_count ?? 0) + 1 })
          .eq("id", id);
      }
    });

  const { data: post } = await supabase
    .from("partner_posts")
    .select("*")
    .eq("id", id)
    .single();

  if (!post || post.is_deleted) notFound();

  const { data: author } = await supabase
    .schema("next_auth")
    .from("users")
    .select("name, image, custom_image, role")
    .eq("id", post.user_id)
    .single();

  const session = await auth();
  const currentUserId = session?.user?.id ?? null;
  const adminFlag = currentUserId ? await isAdmin(currentUserId) : false;
  const isOwner = currentUserId === post.user_id;

  let applications: ApplicationRow[] = [];
  let myApplication: ApplicationRow | null = null;
  let appUsersMap: Record<string, { name: string | null; image: string | null; role: UserRole }> = {};

  if (currentUserId) {
    const { data: appData } = await supabase
      .from("partner_applications")
      .select("id, user_id, message, status, created_at")
      .eq("post_id", id);
    applications = (appData ?? []) as ApplicationRow[];
    myApplication = applications.find((a) => a.user_id === currentUserId) ?? null;

    if (isOwner && applications.length > 0) {
      const appUserIds = applications.map((a) => a.user_id);
      const { data: appUsers } = await supabase
        .schema("next_auth")
        .from("users")
        .select("id, name, image, custom_image, role")
        .in("id", appUserIds);
      for (const u of appUsers ?? []) {
        const role: UserRole =
          u.role === "admin" || u.role === "business" || u.role === "user" ? u.role : "user";
        appUsersMap[u.id] = {
          name: u.name,
          image: u.custom_image ?? u.image,
          role,
        };
      }
    }
  }

  const authorRole: UserRole =
    author?.role === "admin" || author?.role === "business" || author?.role === "user"
      ? author.role
      : "user";
  const authorName = author?.name ?? "익명";
  const authorImage = author?.custom_image ?? author?.image ?? null;

  return (
    <div className="flex flex-col min-h-screen bg-white">
      <Header />
      <main className="flex-1 pt-24 pb-16">
        <div className="max-w-3xl mx-auto px-6">
          <Link
            href="/partners"
            className="inline-flex items-center gap-2 text-sm text-slate-500 hover:text-slate-800 mb-6"
          >
            <ArrowLeft className="w-4 h-4" /> 동료 모집 목록
          </Link>

          <article className="bg-white rounded-3xl border border-slate-100 p-8 mb-6">
            <div className="flex items-center gap-2 mb-4 flex-wrap">
              <span className="inline-flex items-center gap-1 text-xs font-semibold text-blue-600 bg-blue-50 px-2.5 py-1 rounded-full">
                <MapPin className="w-3 h-3" />
                {post.destination}
              </span>
              {post.status !== "open" && (
                <span className="text-xs px-2 py-0.5 rounded-full bg-slate-100 text-slate-500 font-semibold">
                  {post.status === "closed" ? "마감" : "완료"}
                </span>
              )}
            </div>

            <h1 className="text-3xl font-bold text-slate-900 mb-4 break-words">
              {post.title}
            </h1>

            <div className="flex items-center justify-between mb-6 pb-6 border-b border-slate-100">
              <div className="flex items-center gap-3">
                {authorImage ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={authorImage}
                    alt={authorName}
                    className="w-10 h-10 rounded-full object-cover"
                  />
                ) : (
                  <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center text-white font-bold">
                    {authorName.charAt(0).toUpperCase()}
                  </div>
                )}
                <div>
                  <div className="flex items-center gap-1.5">
                    <p className="text-sm font-semibold text-slate-900">{authorName}</p>
                    <RoleBadge role={authorRole} size="xs" />
                  </div>
                  <p className="text-xs text-slate-400">
                    {new Date(post.created_at).toLocaleDateString("ko-KR")}
                  </p>
                </div>
              </div>
              {(isOwner || adminFlag) && <OwnerActions postId={post.id} />}
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-6">
              <div className="flex items-center gap-2 px-4 py-3 bg-slate-50 rounded-xl">
                <Users className="w-4 h-4 text-blue-500" />
                <div>
                  <p className="text-xs text-slate-500">모집 인원</p>
                  <p className="text-sm font-bold text-slate-900">
                    {post.current_people} / {post.max_people}명
                  </p>
                </div>
              </div>
              {(post.start_date || post.end_date) && (
                <div className="flex items-center gap-2 px-4 py-3 bg-slate-50 rounded-xl">
                  <Calendar className="w-4 h-4 text-blue-500" />
                  <div>
                    <p className="text-xs text-slate-500">일정</p>
                    <p className="text-sm font-bold text-slate-900">
                      {post.start_date ?? "?"}
                      {post.end_date && ` ~ ${post.end_date}`}
                    </p>
                  </div>
                </div>
              )}
              {post.gender_pref && (
                <div className="flex items-center gap-2 px-4 py-3 bg-slate-50 rounded-xl">
                  <Users className="w-4 h-4 text-blue-500" />
                  <div>
                    <p className="text-xs text-slate-500">성별</p>
                    <p className="text-sm font-bold text-slate-900">
                      {GENDER_LABEL[post.gender_pref] ?? post.gender_pref}
                    </p>
                  </div>
                </div>
              )}
              {post.age_range && (
                <div className="flex items-center gap-2 px-4 py-3 bg-slate-50 rounded-xl">
                  <Users className="w-4 h-4 text-blue-500" />
                  <div>
                    <p className="text-xs text-slate-500">연령대</p>
                    <p className="text-sm font-bold text-slate-900">
                      {AGE_LABEL[post.age_range] ?? post.age_range}
                    </p>
                  </div>
                </div>
              )}
              {post.budget_text && (
                <div className="flex items-center gap-2 px-4 py-3 bg-slate-50 rounded-xl">
                  <Wallet className="w-4 h-4 text-blue-500" />
                  <div>
                    <p className="text-xs text-slate-500">예산</p>
                    <p className="text-sm font-bold text-slate-900">{post.budget_text}</p>
                  </div>
                </div>
              )}
              {post.contact_method && (isOwner || myApplication?.status === "accepted") && (
                <div className="flex items-center gap-2 px-4 py-3 bg-emerald-50 rounded-xl">
                  <MessageSquare className="w-4 h-4 text-emerald-500" />
                  <div>
                    <p className="text-xs text-emerald-600">연락 방법</p>
                    <p className="text-sm font-bold text-emerald-900">{post.contact_method}</p>
                  </div>
                </div>
              )}
            </div>

            {post.description && (
              <div className="text-slate-700 leading-relaxed whitespace-pre-wrap break-words">
                {post.description}
              </div>
            )}
          </article>

          {/* 신청 또는 신청자 목록 */}
          {!currentUserId ? (
            <div className="bg-blue-50 rounded-3xl p-6 text-center">
              <p className="text-sm text-slate-700 mb-3">
                동료에 합류 신청하려면 로그인이 필요해요
              </p>
              <Link
                href={`/login?callbackUrl=/partners/${id}`}
                className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full bg-slate-900 text-white text-sm font-semibold hover:bg-slate-800"
              >
                로그인하기
              </Link>
            </div>
          ) : isOwner ? (
            <div className="bg-white rounded-3xl border border-slate-100 p-6">
              <h3 className="font-bold text-slate-900 mb-4">
                신청자 ({applications.length}명)
              </h3>
              {applications.length === 0 ? (
                <p className="text-sm text-slate-400 text-center py-6">
                  아직 신청한 사람이 없어요
                </p>
              ) : (
                <div className="space-y-3">
                  {applications.map((app) => {
                    const u = appUsersMap[app.user_id];
                    return (
                      <div
                        key={app.id}
                        className="bg-slate-50 rounded-2xl p-4"
                      >
                        <div className="flex items-start justify-between gap-3 mb-2">
                          <div className="flex items-center gap-2">
                            {u?.image ? (
                              // eslint-disable-next-line @next/next/no-img-element
                              <img
                                src={u.image}
                                alt={u.name ?? ""}
                                className="w-9 h-9 rounded-full object-cover"
                              />
                            ) : (
                              <div className="w-9 h-9 rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center text-white text-sm font-bold">
                                {(u?.name ?? "익").charAt(0).toUpperCase()}
                              </div>
                            )}
                            <div>
                              <div className="flex items-center gap-1.5">
                                <p className="text-sm font-semibold text-slate-900">
                                  {u?.name ?? "익명"}
                                </p>
                                {u?.role && <RoleBadge role={u.role} size="xs" />}
                              </div>
                              <p className="text-xs text-slate-400">
                                {new Date(app.created_at).toLocaleDateString("ko-KR")}
                              </p>
                            </div>
                          </div>
                          {app.status === "pending" ? (
                            <ApplicationDecisionButtons
                              postId={post.id}
                              applicationId={app.id}
                            />
                          ) : (
                            <span
                              className={`text-xs px-2.5 py-1 rounded-full font-semibold ${
                                app.status === "accepted"
                                  ? "bg-emerald-100 text-emerald-700"
                                  : "bg-slate-100 text-slate-500"
                              }`}
                            >
                              {app.status === "accepted" ? "수락됨" : "거절됨"}
                            </span>
                          )}
                        </div>
                        {app.message && (
                          <p className="text-sm text-slate-600 leading-relaxed pl-11">
                            {app.message}
                          </p>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          ) : myApplication ? (
            <div
              className={`rounded-3xl p-6 text-center ${
                myApplication.status === "accepted"
                  ? "bg-emerald-50"
                  : myApplication.status === "rejected"
                    ? "bg-slate-100"
                    : "bg-blue-50"
              }`}
            >
              <p className="text-sm font-semibold text-slate-900 mb-1">
                {myApplication.status === "pending"
                  ? "신청이 접수되었어요"
                  : myApplication.status === "accepted"
                    ? "🎉 수락되었어요! 위 연락 방법으로 연락해보세요"
                    : "아쉽지만 거절되었어요"}
              </p>
              {myApplication.message && (
                <p className="text-xs text-slate-500 mt-2">
                  내가 보낸 메시지: {myApplication.message}
                </p>
              )}
            </div>
          ) : post.status === "open" ? (
            <ApplyForm postId={post.id} />
          ) : (
            <div className="bg-slate-50 rounded-3xl p-6 text-center text-sm text-slate-500">
              마감된 모집이에요
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
