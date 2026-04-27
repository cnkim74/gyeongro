import { Star, MessageSquare } from "lucide-react";

export interface Review {
  id: string;
  rating: number;
  comment: string;
  sherpa_reply: string | null;
  sherpa_replied_at: string | null;
  created_at: string;
  client_name?: string | null;
}

interface Props {
  reviews: Review[];
  averageRating?: number | null;
  totalCount?: number;
}

export default function ReviewsList({ reviews, averageRating, totalCount }: Props) {
  if (reviews.length === 0) {
    return (
      <div className="bg-slate-50 rounded-2xl border border-dashed border-slate-200 p-10 text-center">
        <Star className="w-8 h-8 mx-auto text-slate-300 mb-2" />
        <p className="text-sm text-slate-500">아직 후기가 없어요.</p>
        <p className="text-xs text-slate-400 mt-1">
          첫 매칭이 끝나면 여행자가 후기를 남길 수 있어요.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {(averageRating != null || totalCount != null) && (
        <div className="flex items-baseline gap-3">
          {averageRating != null && (
            <div className="flex items-center gap-1">
              <Star className="w-5 h-5 fill-amber-400 text-amber-400" />
              <span className="text-2xl font-bold text-amber-600">
                {Number(averageRating).toFixed(2)}
              </span>
            </div>
          )}
          {totalCount != null && (
            <span className="text-sm text-slate-500">
              · {totalCount}개 후기
            </span>
          )}
        </div>
      )}

      <div className="space-y-3">
        {reviews.map((r) => (
          <div
            key={r.id}
            className="bg-white border border-slate-200 rounded-2xl p-5"
          >
            <div className="flex items-center justify-between mb-2 flex-wrap gap-2">
              <div className="flex items-center gap-2">
                <Stars rating={r.rating} />
                <span className="text-xs font-semibold text-slate-700">
                  {r.client_name ?? "익명 여행자"}
                </span>
              </div>
              <span className="text-xs text-slate-400">
                {new Date(r.created_at).toLocaleDateString("ko-KR")}
              </span>
            </div>

            <p className="text-sm text-slate-700 leading-relaxed whitespace-pre-line">
              {r.comment}
            </p>

            {r.sherpa_reply && (
              <div className="mt-3 pl-3 border-l-2 border-emerald-200 bg-emerald-50/40 rounded-r-xl p-3">
                <div className="flex items-center gap-1.5 mb-1">
                  <MessageSquare className="w-3 h-3 text-emerald-600" />
                  <span className="text-[11px] font-bold text-emerald-700 uppercase tracking-wider">
                    셰르파 답글
                  </span>
                  {r.sherpa_replied_at && (
                    <span className="text-[10px] text-slate-400">
                      · {new Date(r.sherpa_replied_at).toLocaleDateString("ko-KR")}
                    </span>
                  )}
                </div>
                <p className="text-xs text-slate-700 leading-relaxed whitespace-pre-line">
                  {r.sherpa_reply}
                </p>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

function Stars({ rating }: { rating: number }) {
  return (
    <div className="inline-flex items-center">
      {[1, 2, 3, 4, 5].map((n) => (
        <Star
          key={n}
          className={`w-3.5 h-3.5 ${
            rating >= n
              ? "fill-amber-400 text-amber-400"
              : "text-slate-200"
          }`}
        />
      ))}
    </div>
  );
}
