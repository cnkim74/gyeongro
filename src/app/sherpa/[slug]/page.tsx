import Link from "next/link";
import { notFound } from "next/navigation";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { getSupabaseServiceClient } from "@/lib/supabase";
import { getLocale, createTranslator } from "@/lib/i18n";
import type { MessageKey } from "@/messages";
import {
  SPECIALTY_BY_ID,
  LANGUAGE_BY_CODE,
  COUNTRY_FLAGS,
  formatRate,
} from "@/lib/sherpa";
import ReviewsList, { type Review } from "@/components/ReviewsList";
import {
  ArrowLeft,
  Star,
  MessageCircle,
  Clock,
  ShieldCheck,
  MapPin,
} from "lucide-react";
import BookingForm from "./BookingForm";

export const dynamic = "force-dynamic";

interface PageProps {
  params: Promise<{ slug: string }>;
}

export async function generateMetadata({ params }: PageProps) {
  const { slug } = await params;
  const supabase = getSupabaseServiceClient();
  const { data } = await supabase
    .from("sherpas")
    .select("display_name, tagline")
    .eq("slug", slug)
    .eq("status", "published")
    .maybeSingle();
  if (!data) return { title: "셰르파 - Pothos" };
  return {
    title: `${data.display_name} 셰르파 - Pothos`,
    description: data.tagline ?? undefined,
  };
}

export default async function SherpaDetailPage({ params }: PageProps) {
  const { slug } = await params;
  const locale = await getLocale();
  const t = createTranslator(locale);
  const supabase = getSupabaseServiceClient();

  const { data: sherpa } = await supabase
    .from("sherpas")
    .select("*")
    .eq("slug", slug)
    .eq("status", "published")
    .maybeSingle();

  if (!sherpa) notFound();

  // 조회수 증가 (best-effort)
  await supabase
    .from("sherpas")
    .update({ view_count: (sherpa.view_count ?? 0) + 1 })
    .eq("id", sherpa.id);

  // Localized DB content
  const tagline =
    locale !== "ko" && sherpa.tagline_en ? sherpa.tagline_en : sherpa.tagline;
  const bio = locale !== "ko" && sherpa.bio_en ? sherpa.bio_en : sherpa.bio;
  const cities =
    locale !== "ko" && sherpa.cities_en && sherpa.cities_en.length > 0
      ? sherpa.cities_en
      : sherpa.cities;

  // 후기 목록 (visible)
  const { data: reviewsRaw } = await supabase
    .from("sherpa_reviews")
    .select(
      "id, rating, comment, sherpa_reply, sherpa_replied_at, created_at, client_id"
    )
    .eq("sherpa_id", sherpa.id)
    .eq("status", "visible")
    .order("created_at", { ascending: false })
    .limit(50);

  // 작성자 닉네임 매핑
  const clientIds = (reviewsRaw ?? [])
    .map((r) => r.client_id)
    .filter((v): v is string => !!v);
  let clientNameMap: Record<string, string> = {};
  if (clientIds.length > 0) {
    const { data: users } = await supabase
      .schema("next_auth")
      .from("users")
      .select("id, nickname, name")
      .in("id", clientIds);
    clientNameMap = Object.fromEntries(
      (users ?? []).map((u) => [
        u.id,
        u.nickname ?? u.name ?? "익명 여행자",
      ])
    );
  }
  const reviews: Review[] = (reviewsRaw ?? []).map((r) => ({
    id: r.id,
    rating: r.rating,
    comment: r.comment,
    sherpa_reply: r.sherpa_reply,
    sherpa_replied_at: r.sherpa_replied_at,
    created_at: r.created_at,
    client_name: r.client_id ? clientNameMap[r.client_id] ?? null : null,
  }));

  return (
    <div className="flex flex-col min-h-screen bg-white">
      <Header />

      <main className="flex-1 pt-24 pb-20">
        <div className="max-w-5xl mx-auto px-6">
          <Link
            href="/sherpa"
            className="inline-flex items-center gap-1.5 text-sm text-slate-500 hover:text-slate-800 mb-6"
          >
            <ArrowLeft className="w-4 h-4" /> {t("sherpa.detail.back")}
          </Link>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Left: profile */}
            <div className="lg:col-span-2">
              {/* Hero */}
              <div className="bg-gradient-to-br from-emerald-50 via-white to-teal-50 rounded-3xl border border-emerald-100 p-7 mb-6">
                <div className="flex items-start gap-4 mb-5">
                  {sherpa.avatar_url ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={sherpa.avatar_url}
                      alt={sherpa.display_name}
                      className="w-20 h-20 rounded-3xl object-cover bg-white"
                    />
                  ) : (
                    <div className="w-20 h-20 rounded-3xl bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center text-white text-3xl font-bold">
                      {sherpa.display_name.charAt(0)}
                    </div>
                  )}
                  <div className="flex-1">
                    <h1 className="text-2xl sm:text-3xl font-bold text-slate-900 tracking-tight">
                      {sherpa.display_name}
                    </h1>
                    {tagline && <p className="text-slate-600 mt-1">{tagline}</p>}
                    <div className="flex items-center gap-3 text-xs mt-3 flex-wrap">
                      {sherpa.rating_count > 0 && (
                        <span className="inline-flex items-center gap-0.5 font-semibold text-amber-600">
                          <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
                          {Number(sherpa.rating_avg ?? 0).toFixed(2)}
                          <span className="text-slate-400 font-normal">
                            ({t("sherpa.detail.reviews").replace("{count}", String(sherpa.rating_count))})
                          </span>
                        </span>
                      )}
                      <span className="text-slate-500 inline-flex items-center gap-0.5">
                        <MessageCircle className="w-3 h-3" />
                        {t("sherpa.detail.matches").replace("{count}", String(sherpa.booking_count))}
                      </span>
                      {sherpa.avg_response_hours != null && (
                        <span className="text-slate-500 inline-flex items-center gap-0.5">
                          <Clock className="w-3 h-3" />
                          {t("sherpa.detail.response").replace("{hours}", String(sherpa.avg_response_hours))}
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                {/* Verified badges */}
                {(sherpa.verified_id || sherpa.verified_local) && (
                  <div className="flex flex-wrap gap-2 mb-5">
                    {sherpa.verified_id && (
                      <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-emerald-100 text-emerald-700 text-xs font-semibold">
                        <ShieldCheck className="w-3 h-3" />
                        {t("sherpa.detail.verified_id")}
                      </span>
                    )}
                    {sherpa.verified_local && (
                      <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-blue-100 text-blue-700 text-xs font-semibold">
                        <MapPin className="w-3 h-3" />
                        {t("sherpa.detail.verified_local")}
                      </span>
                    )}
                  </div>
                )}

                {/* Bio */}
                <div className="prose prose-sm max-w-none text-slate-700 leading-relaxed">
                  {(bio ?? "").split("\n").map((p: string, i: number) => (
                    <p key={i} className="mb-3 last:mb-0">
                      {p}
                    </p>
                  ))}
                </div>
              </div>

              {/* Activity area */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-6">
                <div className="bg-white border border-slate-200 rounded-2xl p-5">
                  <h3 className="text-xs font-bold tracking-wider uppercase text-slate-500 mb-3">
                    {t("sherpa.detail.activity_area")}
                  </h3>
                  <div className="space-y-2">
                    {cities.map((city: string, i: number) => (
                      <div
                        key={i}
                        className="flex items-center gap-2 text-sm text-slate-700"
                      >
                        <span>
                          {COUNTRY_FLAGS[sherpa.countries[0]] ?? "🌍"}
                        </span>
                        {city}
                      </div>
                    ))}
                  </div>
                </div>

                <div className="bg-white border border-slate-200 rounded-2xl p-5">
                  <h3 className="text-xs font-bold tracking-wider uppercase text-slate-500 mb-3">
                    {t("sherpa.detail.languages")}
                  </h3>
                  <div className="flex flex-wrap gap-2">
                    {sherpa.languages.map((l: string) => {
                      const meta = LANGUAGE_BY_CODE[l];
                      return (
                        <span
                          key={l}
                          className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-slate-100 text-slate-700 text-xs font-medium"
                        >
                          <span>{meta?.emoji}</span>
                          {meta?.label ?? l}
                        </span>
                      );
                    })}
                  </div>
                </div>
              </div>

              {/* Specialties */}
              <div className="bg-white border border-slate-200 rounded-2xl p-5 mb-6">
                <h3 className="text-xs font-bold tracking-wider uppercase text-slate-500 mb-3">
                  {t("sherpa.detail.specialties")}
                </h3>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                  {sherpa.specialties.map((s: string) => {
                    const specialtyLabel = t(
                      `sherpa.specialty.${s}` as MessageKey
                    );
                    const meta = SPECIALTY_BY_ID[s];
                    return (
                      <div
                        key={s}
                        className="flex items-center gap-2 px-3 py-2 rounded-xl bg-emerald-50 text-emerald-700"
                      >
                        <span className="text-lg">{meta?.emoji}</span>
                        <span className="text-xs font-semibold">
                          {specialtyLabel || meta?.label || s}
                        </span>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Reviews */}
              <section>
                <h2 className="text-lg font-bold text-slate-900 mb-4 tracking-tight">
                  후기 {sherpa.rating_count > 0 ? `(${sherpa.rating_count})` : ""}
                </h2>
                <ReviewsList
                  reviews={reviews}
                  averageRating={sherpa.rating_avg}
                  totalCount={sherpa.rating_count}
                />
              </section>

              {/* Disclaimer */}
              <div className="text-xs text-slate-400 leading-relaxed bg-slate-50 rounded-2xl p-4 border border-slate-100">
                <ShieldCheck className="w-4 h-4 inline mr-1 text-slate-500" />
                {t("sherpa.detail.disclaimer")}
              </div>
            </div>

            {/* Right: pricing + booking */}
            <aside className="lg:sticky lg:top-24 h-fit space-y-4">
              <div className="bg-white border border-slate-200 rounded-2xl p-5">
                <h3 className="text-sm font-bold text-slate-900 mb-3">
                  {t("sherpa.detail.pricing")}
                </h3>
                <div className="space-y-2 text-sm">
                  {sherpa.hourly_rate_krw && (
                    <div className="flex items-center justify-between">
                      <span className="text-slate-600">
                        {t("sherpa.detail.pricing.hourly")}
                      </span>
                      <span className="font-bold text-slate-900">
                        {formatRate(sherpa.hourly_rate_krw)}
                      </span>
                    </div>
                  )}
                  {sherpa.half_day_rate_krw && (
                    <div className="flex items-center justify-between">
                      <span className="text-slate-600">
                        {t("sherpa.detail.pricing.half_day")}
                      </span>
                      <span className="font-bold text-slate-900">
                        {formatRate(sherpa.half_day_rate_krw)}
                      </span>
                    </div>
                  )}
                  {sherpa.full_day_rate_krw && (
                    <div className="flex items-center justify-between">
                      <span className="text-slate-600">
                        {t("sherpa.detail.pricing.full_day")}
                      </span>
                      <span className="font-bold text-slate-900">
                        {formatRate(sherpa.full_day_rate_krw)}
                      </span>
                    </div>
                  )}
                </div>
              </div>

              <div className="bg-white border border-slate-200 rounded-2xl p-5">
                <h3 className="text-sm font-bold text-slate-900 mb-3">
                  {t("sherpa.detail.book.title")}
                </h3>
                <BookingForm
                  sherpaId={sherpa.id}
                  sherpaName={sherpa.display_name}
                  defaultCity={cities[0] ?? ""}
                  hourly={sherpa.hourly_rate_krw}
                  halfDay={sherpa.half_day_rate_krw}
                  fullDay={sherpa.full_day_rate_krw}
                  languages={sherpa.languages}
                  labels={{
                    intro: t("book.intro"),
                    city: t("book.field.city"),
                    party: t("book.field.party"),
                    start: t("book.field.start"),
                    end: t("book.field.end"),
                    duration: t("book.field.duration"),
                    durationHourly: t("book.field.duration.hourly"),
                    durationHalfDay: t("book.field.duration.half_day"),
                    durationFullDay: t("book.field.duration.full_day"),
                    durationMultiDay: t("book.field.duration.multi_day"),
                    notes: t("book.field.notes"),
                    notesPlaceholder: t("book.field.notes_placeholder"),
                    name: t("book.field.name"),
                    email: t("book.field.email"),
                    phone: t("book.field.phone"),
                    estimated: t("book.field.estimated"),
                    submit: t("book.submit"),
                    successTitle: t("book.success.title"),
                    successBody: t("book.success.body"),
                    disclaimer: t("book.disclaimer"),
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
