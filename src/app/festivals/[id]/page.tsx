import Link from "next/link";
import { notFound } from "next/navigation";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { ArrowLeft, CalendarDays, MapPin, Clock, Ticket, Phone, Globe, Sparkles, Users } from "lucide-react";
import { getFestival, formatYmd } from "@/lib/tourapi";

export const dynamic = "force-dynamic";

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const f = await getFestival(id);
  return { title: f ? `${f.title} - Pothos 축제` : "축제 - Pothos" };
}

export default async function FestivalDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const f = await getFestival(id);
  if (!f) notFound();

  const photos = [f.image, ...f.images].filter((u, i, a): u is string => !!u && a.indexOf(u) === i).slice(0, 6);
  const rows: { icon: React.ReactNode; label: string; value: string | null }[] = [
    { icon: <CalendarDays className="w-5 h-5" />, label: "기간", value: `${formatYmd(f.startDate)} ~ ${formatYmd(f.endDate)}` },
    { icon: <MapPin className="w-5 h-5" />, label: "장소", value: [f.place, f.addr].filter(Boolean).join(" · ") || null },
    { icon: <Clock className="w-5 h-5" />, label: "시간", value: f.playtime },
    { icon: <Ticket className="w-5 h-5" />, label: "요금", value: f.fee },
    { icon: <Users className="w-5 h-5" />, label: "관람 연령", value: f.ageLimit },
    { icon: <Phone className="w-5 h-5" />, label: "문의", value: [f.sponsor, f.tel].filter(Boolean).join(" · ") || null },
  ];

  return (
    <div className="flex flex-col min-h-screen bg-gray-50">
      <Header />
      <main className="flex-1 pt-24 pb-28">
        <div className="max-w-3xl mx-auto px-4">
          <Link href="/festivals" className="inline-flex items-center gap-1.5 text-[15px] text-gray-500 hover:text-gray-800 mb-4">
            <ArrowLeft className="w-4 h-4" /> 축제 목록
          </Link>

          {photos.length > 0 && (
            <div className="rounded-3xl overflow-hidden mb-3 aspect-[16/10] bg-gray-100">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={photos[0]} alt={f.title} className="w-full h-full object-cover" />
            </div>
          )}
          {photos.length > 1 && (
            <div className="flex gap-2 overflow-x-auto mb-6">
              {photos.slice(1).map((u) => (
                // eslint-disable-next-line @next/next/no-img-element
                <img key={u} src={u} alt="" className="h-24 w-36 object-cover rounded-2xl shrink-0" loading="lazy" />
              ))}
            </div>
          )}

          <h1 className="text-[28px] sm:text-3xl font-extrabold text-gray-900 leading-snug mb-5">{f.title}</h1>

          <div className="bg-white rounded-3xl border border-gray-100 shadow-sm divide-y divide-gray-100 mb-6">
            {rows
              .filter((r) => r.value)
              .map((r) => (
                <div key={r.label} className="flex gap-3 p-4">
                  <span className="text-rose-500 shrink-0 mt-0.5">{r.icon}</span>
                  <span className="w-16 shrink-0 text-[15px] font-semibold text-gray-500">{r.label}</span>
                  <span className="text-[15px] text-gray-900 whitespace-pre-line leading-relaxed">{r.value}</span>
                </div>
              ))}
          </div>

          <div className="flex flex-wrap gap-2 mb-6">
            {f.lat != null && f.lng != null && (
              <>
                <a
                  href={`https://map.kakao.com/link/map/${encodeURIComponent(f.title)},${f.lat},${f.lng}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="px-4 py-2.5 rounded-full bg-yellow-300 text-gray-900 text-[15px] font-semibold"
                >
                  카카오맵
                </a>
                <a
                  href={`https://www.google.com/maps/search/?api=1&query=${f.lat},${f.lng}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="px-4 py-2.5 rounded-full bg-white border border-gray-200 text-gray-800 text-[15px] font-semibold"
                >
                  구글 지도
                </a>
              </>
            )}
            {f.homepage && (
              <a
                href={f.homepage}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-full bg-white border border-gray-200 text-gray-800 text-[15px] font-semibold"
              >
                <Globe className="w-4 h-4" /> 공식 홈페이지
              </a>
            )}
          </div>

          {f.overview && (
            <section className="bg-white rounded-3xl border border-gray-100 shadow-sm p-6 mb-6">
              <h2 className="text-xl font-bold text-gray-900 mb-3">축제 소개</h2>
              <p className="text-base text-gray-700 leading-relaxed whitespace-pre-line">{f.overview}</p>
            </section>
          )}

          <p className="text-sm text-gray-400">
            출처: 한국관광공사 · 일정·요금은 변경될 수 있으니 공식 홈페이지에서 확인해 주세요.
          </p>
        </div>
      </main>

      {/* 하단 고정 CTA */}
      <div className="fixed bottom-0 inset-x-0 z-40 bg-white/95 backdrop-blur border-t border-gray-100 p-4">
        <div className="max-w-3xl mx-auto">
          <Link
            href={`/planner?festival=${f.contentId}`}
            className="w-full inline-flex items-center justify-center gap-2 py-4 rounded-2xl bg-gradient-to-r from-rose-500 to-orange-500 text-white text-lg font-bold shadow-lg"
          >
            <Sparkles className="w-5 h-5" /> 이 축제로 여행 일정 만들기
          </Link>
        </div>
      </div>
      <Footer />
    </div>
  );
}
