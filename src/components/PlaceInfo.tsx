"use client";

// 장소 정보 패널 — 구글 평점·리뷰 수·사진·영업시간·웹사이트 + 국내는 네이버 블로그 후기
// 버튼을 눌렀을 때만 불러옴 (구글 상세정보는 월 1,000건 무료 후 유료라 미리 불러오지 않음)

import { useState } from "react";
import { Star, Globe, Clock, ExternalLink, Loader2, Info, BookOpen } from "lucide-react";
import type { PlaceGeo } from "@/components/ItineraryView";
import { isInKorea } from "@/components/TripMap";

interface Details {
  rating: number | null;
  userRatingCount: number | null;
  weekdayHours: string[] | null;
  websiteUri: string | null;
  googleMapsUri: string | null;
  photoUri: string | null;
  photoAttributions: { name: string; uri: string | null }[];
}

interface Blog {
  title: string;
  link: string;
  description: string;
  blogger: string;
  date: string;
}

export default function PlaceInfo({
  name,
  geo,
  city,
}: {
  name: string;
  geo?: PlaceGeo | null;
  city?: string;
}) {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [details, setDetails] = useState<Details | null>(null);
  const [blogs, setBlogs] = useState<Blog[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [showHours, setShowHours] = useState(false);

  const korea = geo ? isInKorea(geo.lat, geo.lng) : false;

  const toggle = async () => {
    const next = !open;
    setOpen(next);
    if (!next || details || loading) return;
    setLoading(true);
    setError(null);
    try {
      const [d, b] = await Promise.all([
        geo?.placeId
          ? fetch(`/api/places/details?id=${encodeURIComponent(geo.placeId)}`).then((r) =>
              r.ok ? (r.json() as Promise<Details>) : null
            )
          : Promise.resolve(null),
        korea
          ? fetch(`/api/places/blogs?q=${encodeURIComponent(`${name.replace(/\(.*\)$/, "").trim()} ${city ?? ""}`.trim())}`)
              .then((r) => (r.ok ? r.json() : null))
              .then((j: { items?: Blog[] } | null) => j?.items ?? [])
          : Promise.resolve([] as Blog[]),
      ]);
      setDetails(d);
      setBlogs(b);
      if (!d && (!b || b.length === 0)) setError("장소 정보를 찾지 못했어요.");
    } catch {
      setError("정보를 불러오지 못했어요.");
    } finally {
      setLoading(false);
    }
  };

  // 오늘 요일 (Google weekdayDescriptions 는 월요일부터)
  const todayIdx = (new Date().getDay() + 6) % 7;

  if (!geo?.placeId) return null;

  return (
    <div className="mt-2">
      <button
        onClick={toggle}
        className="inline-flex items-center gap-1 text-[11px] font-semibold text-slate-600 hover:text-blue-600 px-2 py-0.5 rounded-full bg-slate-100 hover:bg-blue-50"
      >
        <Info className="w-3 h-3" />
        {open ? "정보 닫기" : "평점·사진·후기"}
      </button>

      {open && (
        <div className="mt-2 rounded-xl border border-slate-200 bg-white overflow-hidden">
          {loading && (
            <div className="flex items-center gap-2 p-3 text-xs text-slate-500">
              <Loader2 className="w-3.5 h-3.5 animate-spin" /> 불러오는 중…
            </div>
          )}
          {error && !loading && <p className="p-3 text-xs text-slate-500">{error}</p>}

          {details && !loading && (
            <>
              {details.photoUri && (
                <div className="relative">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={details.photoUri}
                    alt={name}
                    className="w-full h-40 object-cover"
                    loading="lazy"
                  />
                  {details.photoAttributions.length > 0 && (
                    <div className="absolute bottom-0 right-0 bg-black/50 text-white text-[9px] px-1.5 py-0.5">
                      사진:{" "}
                      {details.photoAttributions.map((a, i) =>
                        a.uri ? (
                          <a key={i} href={a.uri} target="_blank" rel="noopener noreferrer" className="underline">
                            {a.name}
                          </a>
                        ) : (
                          <span key={i}>{a.name}</span>
                        )
                      )}
                    </div>
                  )}
                </div>
              )}
              <div className="p-3 space-y-2">
                {details.rating != null && (
                  <div className="flex items-center gap-1.5 text-sm">
                    <Star className="w-4 h-4 text-amber-400 fill-amber-400" />
                    <span className="font-bold text-slate-900">{details.rating.toFixed(1)}</span>
                    {details.userRatingCount != null && (
                      <span className="text-xs text-slate-500">
                        (리뷰 {details.userRatingCount.toLocaleString("ko-KR")}개)
                      </span>
                    )}
                  </div>
                )}

                {details.weekdayHours && details.weekdayHours.length > 0 && (
                  <div className="text-xs text-slate-600">
                    <button
                      onClick={() => setShowHours(!showHours)}
                      className="inline-flex items-center gap-1 hover:text-blue-600"
                    >
                      <Clock className="w-3 h-3" />
                      <span>오늘 {details.weekdayHours[todayIdx]?.replace(/^[^:]+:\s*/, "") ?? ""}</span>
                      <span className="text-slate-400">{showHours ? "▲" : "▼"}</span>
                    </button>
                    {showHours && (
                      <ul className="mt-1 ml-4 space-y-0.5 text-[11px] text-slate-500">
                        {details.weekdayHours.map((h, i) => (
                          <li key={i} className={i === todayIdx ? "font-semibold text-slate-800" : ""}>
                            {h}
                          </li>
                        ))}
                      </ul>
                    )}
                  </div>
                )}

                <div className="flex flex-wrap gap-3 text-xs font-semibold">
                  {details.googleMapsUri && (
                    <a
                      href={details.googleMapsUri}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1 text-blue-600 hover:text-blue-800"
                    >
                      <ExternalLink className="w-3 h-3" /> 구글 리뷰 보기
                    </a>
                  )}
                  {details.websiteUri && (
                    <a
                      href={details.websiteUri}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1 text-slate-600 hover:text-blue-600"
                    >
                      <Globe className="w-3 h-3" /> 공식 웹사이트
                    </a>
                  )}
                </div>
                <p className="text-[9px] text-slate-400">장소 정보 제공: Google</p>
              </div>
            </>
          )}

          {blogs && blogs.length > 0 && !loading && (
            <div className="border-t border-slate-100 p-3">
              <p className="text-[11px] font-bold text-emerald-700 mb-2 inline-flex items-center gap-1">
                <BookOpen className="w-3 h-3" /> 네이버 블로그 후기
              </p>
              <ul className="space-y-2">
                {blogs.map((b, i) => (
                  <li key={i}>
                    <a href={b.link} target="_blank" rel="noopener noreferrer" className="block group">
                      <p className="text-xs font-semibold text-slate-800 group-hover:text-blue-600 line-clamp-1">
                        {b.title}
                      </p>
                      <p className="text-[11px] text-slate-500 line-clamp-2">{b.description}</p>
                      <p className="text-[10px] text-slate-400 mt-0.5">
                        {b.blogger}
                        {b.date && ` · ${b.date}`}
                      </p>
                    </a>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
