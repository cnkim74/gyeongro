import Link from "next/link";
import { Star, Sparkles, ArrowRight } from "lucide-react";
import {
  SPECIALTY_BY_ID,
  LANGUAGE_BY_CODE,
  COUNTRY_FLAGS,
  formatRate,
  type SherpaListItem,
} from "@/lib/sherpa";
import {
  matchScoreColor,
  type MatchableSherpa,
  type MatchableTrip,
} from "@/lib/matching";

export interface ScoredSherpa extends SherpaListItem {
  match_score: number;
  match_reasons: string[];
}

interface Props {
  sherpas: ScoredSherpa[];
}

export default function RecommendedSherpas({ sherpas }: Props) {
  if (sherpas.length === 0) return null;

  return (
    <div className="bg-gradient-to-br from-indigo-50 via-white to-purple-50 border border-indigo-100 rounded-3xl p-6 mb-8">
      <div className="flex items-center gap-2 mb-1">
        <Sparkles className="w-5 h-5 text-indigo-500" />
        <h2 className="text-lg font-bold text-slate-900">추천 셰르파</h2>
      </div>
      <p className="text-sm text-slate-500 mb-5">
        이 여행에 가장 잘 맞는 셰르파입니다. 직접 예약을 보내거나, 매칭을
        공개해 다른 셰르파의 제안도 함께 받아보세요.
      </p>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
        {sherpas.map((s) => {
          const meta = matchScoreColor(s.match_score);
          return (
            <Link
              key={s.slug}
              href={`/sherpa/${s.slug}`}
              target="_blank"
              className="group relative bg-white rounded-2xl border border-slate-200 hover:border-indigo-300 hover:shadow-lg p-4 transition-all"
            >
              <span
                className={`absolute -top-2 -right-2 inline-flex items-center gap-0.5 px-2 py-0.5 rounded-full text-[10px] font-bold ${meta.bg} ${meta.text}`}
              >
                {s.match_score}%
              </span>

              <div className="flex items-start gap-2 mb-2">
                {s.avatar_url ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={s.avatar_url}
                    alt={s.display_name}
                    className="w-10 h-10 rounded-xl object-cover bg-slate-100"
                  />
                ) : (
                  <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center text-white text-base font-bold">
                    {s.display_name.charAt(0)}
                  </div>
                )}
                <div className="flex-1 min-w-0">
                  <h3 className="font-bold text-slate-900 truncate text-sm">
                    {s.display_name}
                  </h3>
                  <p className="text-[11px] text-slate-500 truncate">
                    <span className="mr-1">
                      {COUNTRY_FLAGS[s.countries[0]] ?? "🌍"}
                    </span>
                    {s.cities[0]}
                    {s.languages.length > 0 && (
                      <span className="text-slate-400">
                        {" "}
                        · {s.languages.map((l) => LANGUAGE_BY_CODE[l]?.label ?? l).join(", ")}
                      </span>
                    )}
                  </p>
                </div>
              </div>

              {s.match_reasons.length > 0 && (
                <ul className="text-[11px] text-indigo-600 space-y-0.5 mb-2">
                  {s.match_reasons.slice(0, 2).map((r, i) => (
                    <li key={i}>· {r}</li>
                  ))}
                </ul>
              )}

              <div className="flex flex-wrap gap-1 mb-3">
                {s.specialties.slice(0, 2).map((sp) => {
                  const m = SPECIALTY_BY_ID[sp];
                  return (
                    <span
                      key={sp}
                      className="inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded-full bg-emerald-50 text-emerald-700 text-[10px] font-medium"
                    >
                      {m?.emoji} {m?.label ?? sp}
                    </span>
                  );
                })}
              </div>

              <div className="flex items-center justify-between pt-2 border-t border-slate-100">
                <div className="flex items-center gap-1 text-[11px]">
                  {s.rating_count > 0 ? (
                    <span className="inline-flex items-center gap-0.5 font-semibold text-amber-600">
                      <Star className="w-3 h-3 fill-amber-400 text-amber-400" />
                      {Number(s.rating_avg ?? 0).toFixed(2)}
                    </span>
                  ) : (
                    <span className="text-slate-400">신규</span>
                  )}
                </div>
                <span className="text-xs font-bold text-emerald-600 inline-flex items-center gap-0.5">
                  {s.full_day_rate_krw ? `${formatRate(s.full_day_rate_krw)}/일` : "문의"}
                  <ArrowRight className="w-3 h-3 group-hover:translate-x-0.5 transition-transform" />
                </span>
              </div>
            </Link>
          );
        })}
      </div>
    </div>
  );
}

// Helper for server-side use
export type { MatchableSherpa, MatchableTrip };
