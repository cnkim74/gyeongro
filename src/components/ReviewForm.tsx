"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  Star,
  Loader2,
  AlertCircle,
  CheckCircle2,
  Send,
} from "lucide-react";

interface Props {
  sherpaId: string;
  sherpaName: string;
  bookingId?: string;
  proposalId?: string;
}

export default function ReviewForm({
  sherpaId,
  sherpaName,
  bookingId,
  proposalId,
}: Props) {
  const router = useRouter();
  const [rating, setRating] = useState(0);
  const [hoverRating, setHoverRating] = useState(0);
  const [comment, setComment] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [done, setDone] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const canSubmit =
    rating >= 1 && rating <= 5 && comment.trim().length >= 10 && !submitting;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!canSubmit) return;
    setSubmitting(true);
    setError(null);
    try {
      const res = await fetch("/api/sherpa/reviews", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          sherpaId,
          bookingId,
          proposalId,
          rating,
          comment: comment.trim(),
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "전송 실패");
      setDone(true);
      setTimeout(() => router.refresh(), 800);
    } catch (err) {
      setError(err instanceof Error ? err.message : "오류가 발생했어요.");
    } finally {
      setSubmitting(false);
    }
  };

  if (done) {
    return (
      <div className="bg-emerald-50 border border-emerald-200 rounded-2xl p-5 text-center">
        <CheckCircle2 className="w-10 h-10 mx-auto text-emerald-500 mb-2" />
        <p className="font-bold text-emerald-900 mb-1">후기 작성 완료!</p>
        <p className="text-sm text-emerald-700">
          {sherpaName} 셰르파의 프로필에 게시됐어요.
        </p>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <p className="text-sm font-semibold text-slate-700 mb-2">
          {sherpaName} 셰르파는 어땠나요?
        </p>
        <div
          className="flex items-center gap-1"
          onMouseLeave={() => setHoverRating(0)}
        >
          {[1, 2, 3, 4, 5].map((n) => {
            const filled = (hoverRating || rating) >= n;
            return (
              <button
                key={n}
                type="button"
                onClick={() => setRating(n)}
                onMouseEnter={() => setHoverRating(n)}
                className="p-1 transition-transform hover:scale-110"
                aria-label={`${n} stars`}
              >
                <Star
                  className={`w-8 h-8 ${
                    filled
                      ? "fill-amber-400 text-amber-400"
                      : "text-slate-300"
                  }`}
                />
              </button>
            );
          })}
          {rating > 0 && (
            <span className="ml-3 text-sm font-semibold text-amber-600">
              {rating}점
            </span>
          )}
        </div>
      </div>

      <div>
        <label className="block text-xs font-semibold text-slate-700 mb-1.5">
          후기 내용 <span className="text-rose-500">*</span>
          <span className="text-slate-400 font-normal ml-1">
            (최소 10자)
          </span>
        </label>
        <textarea
          value={comment}
          onChange={(e) => setComment(e.target.value)}
          placeholder="셰르파의 안내·지식·소통·전반적인 경험을 솔직하게 적어주세요."
          rows={5}
          className="w-full px-3 py-2.5 rounded-xl border border-slate-200 focus:border-amber-400 focus:ring-2 focus:ring-amber-100 outline-none text-slate-900 text-sm resize-none"
          required
          minLength={10}
          maxLength={2000}
        />
        <p className="text-xs text-slate-400 mt-1 text-right">
          {comment.length} / 2000
        </p>
      </div>

      {error && (
        <div className="flex items-start gap-2 p-3 rounded-xl bg-rose-50 text-rose-700 text-sm">
          <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
          {error}
        </div>
      )}

      <button
        type="submit"
        disabled={!canSubmit}
        className="w-full py-3 rounded-2xl bg-gradient-to-r from-amber-400 to-orange-500 text-white font-bold flex items-center justify-center gap-2 hover:shadow-xl hover:shadow-amber-500/25 hover:-translate-y-0.5 transition-all disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:translate-y-0"
      >
        {submitting ? (
          <Loader2 className="w-4 h-4 animate-spin" />
        ) : (
          <Send className="w-4 h-4" />
        )}
        후기 등록
      </button>

      <p className="text-[11px] text-slate-400 text-center">
        후기는 셰르파의 공개 프로필에 게시되며, 부적절한 내용은 운영팀이 숨길 수 있습니다.
      </p>
    </form>
  );
}
