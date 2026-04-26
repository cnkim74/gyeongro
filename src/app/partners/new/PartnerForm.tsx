"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  ArrowLeft,
  Loader2,
  AlertCircle,
  MapPin,
  Calendar,
  Users,
  MessageSquare,
} from "lucide-react";

const GENDER_OPTIONS = [
  { value: "", label: "상관없음" },
  { value: "male", label: "남성" },
  { value: "female", label: "여성" },
];

const AGE_OPTIONS = [
  { value: "", label: "상관없음" },
  { value: "20s", label: "20대" },
  { value: "30s", label: "30대" },
  { value: "40s", label: "40대" },
  { value: "50s+", label: "50대 이상" },
  { value: "20s_30s", label: "20-30대" },
];

export default function PartnerForm() {
  const router = useRouter();
  const [title, setTitle] = useState("");
  const [destination, setDestination] = useState("");
  const [description, setDescription] = useState("");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [maxPeople, setMaxPeople] = useState(2);
  const [genderPref, setGenderPref] = useState("");
  const [ageRange, setAgeRange] = useState("");
  const [budgetText, setBudgetText] = useState("");
  const [contactMethod, setContactMethod] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSubmitting(true);
    try {
      const res = await fetch("/api/partners", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title,
          description,
          destination,
          start_date: startDate || null,
          end_date: endDate || null,
          max_people: maxPeople,
          gender_pref: genderPref || null,
          age_range: ageRange || null,
          budget_text: budgetText,
          contact_method: contactMethod,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "등록 실패");
      router.push(`/partners/${data.id}`);
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "오류가 발생했어요.");
      setSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      <div>
        <label className="text-sm font-semibold text-slate-700 mb-2 block">
          제목 <span className="text-red-500">*</span>
        </label>
        <input
          type="text"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="예: 5월 첫째주 제주도 동행 구해요"
          required
          maxLength={200}
          className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:border-blue-400 focus:ring-2 focus:ring-blue-100 outline-none text-slate-900"
        />
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <label className="text-sm font-semibold text-slate-700 mb-2 flex items-center gap-1.5">
            <MapPin className="w-4 h-4 text-blue-500" />
            목적지 <span className="text-red-500">*</span>
          </label>
          <input
            type="text"
            value={destination}
            onChange={(e) => setDestination(e.target.value)}
            placeholder="예: 제주, 도쿄..."
            required
            className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:border-blue-400 focus:ring-2 focus:ring-blue-100 outline-none text-slate-900"
          />
        </div>

        <div>
          <label className="text-sm font-semibold text-slate-700 mb-2 flex items-center gap-1.5">
            <Users className="w-4 h-4 text-blue-500" />
            모집 인원 (본인 포함)
          </label>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setMaxPeople(Math.max(2, maxPeople - 1))}
              className="w-10 h-10 rounded-full border border-slate-200 hover:bg-slate-50 font-bold"
            >
              -
            </button>
            <input
              type="number"
              value={maxPeople}
              onChange={(e) =>
                setMaxPeople(Math.min(20, Math.max(2, Number(e.target.value))))
              }
              min={2}
              max={20}
              className="flex-1 px-4 py-3 rounded-xl border border-slate-200 text-center font-bold"
            />
            <button
              type="button"
              onClick={() => setMaxPeople(Math.min(20, maxPeople + 1))}
              className="w-10 h-10 rounded-full border border-slate-200 hover:bg-slate-50 font-bold"
            >
              +
            </button>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <label className="text-sm font-semibold text-slate-700 mb-2 flex items-center gap-1.5">
            <Calendar className="w-4 h-4 text-blue-500" />
            출발일
          </label>
          <input
            type="date"
            value={startDate}
            onChange={(e) => setStartDate(e.target.value)}
            className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:border-blue-400 focus:ring-2 focus:ring-blue-100 outline-none text-slate-900"
          />
        </div>

        <div>
          <label className="text-sm font-semibold text-slate-700 mb-2 flex items-center gap-1.5">
            <Calendar className="w-4 h-4 text-blue-500" />
            귀국일
          </label>
          <input
            type="date"
            value={endDate}
            onChange={(e) => setEndDate(e.target.value)}
            className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:border-blue-400 focus:ring-2 focus:ring-blue-100 outline-none text-slate-900"
          />
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <label className="text-sm font-semibold text-slate-700 mb-2 block">
            성별 선호
          </label>
          <select
            value={genderPref}
            onChange={(e) => setGenderPref(e.target.value)}
            className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:border-blue-400 outline-none text-slate-900"
          >
            {GENDER_OPTIONS.map((o) => (
              <option key={o.value} value={o.value}>
                {o.label}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="text-sm font-semibold text-slate-700 mb-2 block">
            연령대
          </label>
          <select
            value={ageRange}
            onChange={(e) => setAgeRange(e.target.value)}
            className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:border-blue-400 outline-none text-slate-900"
          >
            {AGE_OPTIONS.map((o) => (
              <option key={o.value} value={o.value}>
                {o.label}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div>
        <label className="text-sm font-semibold text-slate-700 mb-2 block">
          예상 예산 (선택)
        </label>
        <input
          type="text"
          value={budgetText}
          onChange={(e) => setBudgetText(e.target.value)}
          placeholder="예: 1인당 약 100만원"
          className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:border-blue-400 focus:ring-2 focus:ring-blue-100 outline-none text-slate-900"
        />
      </div>

      <div>
        <label className="text-sm font-semibold text-slate-700 mb-2 block">
          상세 설명
        </label>
        <textarea
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder="여행 컨셉, 대략적인 일정, 함께하고 싶은 사람의 성향 등을 자유롭게 적어주세요"
          rows={6}
          className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:border-blue-400 focus:ring-2 focus:ring-blue-100 outline-none text-slate-900 resize-y"
        />
      </div>

      <div>
        <label className="text-sm font-semibold text-slate-700 mb-2 flex items-center gap-1.5">
          <MessageSquare className="w-4 h-4 text-blue-500" />
          연락 방법 (선택)
        </label>
        <input
          type="text"
          value={contactMethod}
          onChange={(e) => setContactMethod(e.target.value)}
          placeholder="예: 카카오톡 ID, 인스타그램, 이메일"
          className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:border-blue-400 focus:ring-2 focus:ring-blue-100 outline-none text-slate-900"
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
          className="px-5 py-3 rounded-2xl border border-slate-200 text-slate-700 font-medium hover:bg-slate-50 disabled:opacity-50 flex items-center gap-2"
        >
          <ArrowLeft className="w-4 h-4" /> 취소
        </button>
        <button
          type="submit"
          disabled={submitting || !title.trim() || !destination.trim()}
          className="flex-1 py-3 rounded-2xl bg-slate-900 text-white font-bold flex items-center justify-center gap-2 hover:bg-slate-800 disabled:opacity-40 transition-all"
        >
          {submitting ? <Loader2 className="w-5 h-5 animate-spin" /> : "모집 등록"}
        </button>
      </div>
    </form>
  );
}
