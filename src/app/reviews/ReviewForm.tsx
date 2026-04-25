"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Loader2, AlertCircle, ArrowLeft, MapPin, Sparkles } from "lucide-react";
import StarRating from "@/components/StarRating";

interface Trip {
  id: string;
  title: string;
  destination: string;
}

interface Props {
  reviewId?: string;
  initialTitle?: string;
  initialContent?: string;
  initialRating?: number;
  initialDestination?: string;
  initialTripId?: string | null;
  trips?: Trip[];
}

export default function ReviewForm({
  reviewId,
  initialTitle = "",
  initialContent = "",
  initialRating = 0,
  initialDestination = "",
  initialTripId = null,
  trips = [],
}: Props) {
  const router = useRouter();
  const [title, setTitle] = useState(initialTitle);
  const [content, setContent] = useState(initialContent);
  const [rating, setRating] = useState(initialRating);
  const [destination, setDestination] = useState(initialDestination);
  const [tripId, setTripId] = useState<string | null>(initialTripId);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const isEdit = !!reviewId;

  const handleTripSelect = (id: string) => {
    if (id === "") {
      setTripId(null);
      return;
    }
    setTripId(id);
    const t = trips.find((x) => x.id === id);
    if (t && !destination) setDestination(t.destination);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    if (rating < 1) {
      setError("별점을 선택해주세요.");
      return;
    }
    setSubmitting(true);
    try {
      const url = isEdit ? `/api/reviews/${reviewId}` : "/api/reviews";
      const method = isEdit ? "PATCH" : "POST";
      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title,
          content,
          rating,
          destination,
          trip_id: tripId,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "저장 실패");
      router.push(`/reviews/${isEdit ? reviewId : data.id}`);
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "오류가 발생했어요.");
      setSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      <div>
        <label className="text-sm font-semibold text-gray-700 mb-2 block">
          별점 <span className="text-red-500">*</span>
        </label>
        <div className="flex items-center gap-3 bg-gray-50 rounded-2xl p-4">
          <StarRating value={rating} onChange={setRating} size="lg" />
          {rating > 0 && (
            <span className="text-2xl font-bold text-gray-900">{rating}.0</span>
          )}
        </div>
      </div>

      {trips.length > 0 && !isEdit && (
        <div>
          <label className="text-sm font-semibold text-gray-700 mb-2 block flex items-center gap-1.5">
            <Sparkles className="w-4 h-4 text-blue-500" />
            저장한 여행 계획 연결 (선택)
          </label>
          <select
            value={tripId ?? ""}
            onChange={(e) => handleTripSelect(e.target.value)}
            className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-blue-400 focus:ring-2 focus:ring-blue-100 outline-none text-gray-900"
          >
            <option value="">선택 안 함</option>
            {trips.map((t) => (
              <option key={t.id} value={t.id}>
                {t.destination} - {t.title}
              </option>
            ))}
          </select>
        </div>
      )}

      <div>
        <label className="text-sm font-semibold text-gray-700 mb-2 block flex items-center gap-1.5">
          <MapPin className="w-4 h-4 text-blue-500" />
          여행지 (선택)
        </label>
        <input
          type="text"
          value={destination}
          onChange={(e) => setDestination(e.target.value)}
          placeholder="예: 제주도, 도쿄, 파리..."
          maxLength={100}
          className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-blue-400 focus:ring-2 focus:ring-blue-100 outline-none text-gray-900 placeholder-gray-400"
        />
      </div>

      <div>
        <label className="text-sm font-semibold text-gray-700 mb-2 block">
          제목 <span className="text-red-500">*</span>
        </label>
        <input
          type="text"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="후기 제목"
          required
          maxLength={200}
          className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-blue-400 focus:ring-2 focus:ring-blue-100 outline-none text-gray-900 placeholder-gray-400"
        />
      </div>

      <div>
        <label className="text-sm font-semibold text-gray-700 mb-2 block">
          후기 내용 <span className="text-red-500">*</span>
        </label>
        <textarea
          value={content}
          onChange={(e) => setContent(e.target.value)}
          placeholder="여행은 어떠셨나요? 좋았던 점, 아쉬웠던 점, 추천 코스 등을 자유롭게 작성해주세요."
          required
          rows={10}
          className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-blue-400 focus:ring-2 focus:ring-blue-100 outline-none text-gray-900 placeholder-gray-400 resize-y"
        />
      </div>

      {error && (
        <div className="flex items-center gap-2 px-4 py-3 rounded-xl bg-red-50 text-red-700 text-sm">
          <AlertCircle className="w-4 h-4 shrink-0" />
          {error}
        </div>
      )}

      <div className="flex gap-3 pt-2">
        <button
          type="button"
          onClick={() => router.back()}
          disabled={submitting}
          className="px-5 py-3 rounded-2xl border border-gray-200 text-gray-700 font-medium hover:bg-gray-50 disabled:opacity-50 flex items-center gap-2"
        >
          <ArrowLeft className="w-4 h-4" /> 취소
        </button>
        <button
          type="submit"
          disabled={submitting || !title.trim() || !content.trim() || rating < 1}
          className="flex-1 py-3 rounded-2xl bg-gradient-to-r from-blue-500 to-indigo-600 text-white font-bold flex items-center justify-center gap-2 hover:shadow-xl hover:shadow-blue-500/25 disabled:opacity-40 disabled:cursor-not-allowed transition-all"
        >
          {submitting ? (
            <Loader2 className="w-5 h-5 animate-spin" />
          ) : isEdit ? (
            "수정 완료"
          ) : (
            "후기 등록"
          )}
        </button>
      </div>
    </form>
  );
}
