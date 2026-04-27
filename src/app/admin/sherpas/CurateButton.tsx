"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  Sparkles,
  Loader2,
  X,
  AlertCircle,
  CheckCircle2,
} from "lucide-react";
import { SHERPA_SPECIALTIES } from "@/lib/sherpa";

const COUNTRIES: Array<{ code: string; label: string; emoji: string }> = [
  { code: "KR", label: "대한민국", emoji: "🇰🇷" },
  { code: "JP", label: "일본", emoji: "🇯🇵" },
  { code: "TR", label: "터키", emoji: "🇹🇷" },
  { code: "TH", label: "태국", emoji: "🇹🇭" },
  { code: "FR", label: "프랑스", emoji: "🇫🇷" },
  { code: "IT", label: "이탈리아", emoji: "🇮🇹" },
  { code: "VN", label: "베트남", emoji: "🇻🇳" },
  { code: "TW", label: "대만", emoji: "🇹🇼" },
];

export default function CurateButton() {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [country, setCountry] = useState("JP");
  const [city, setCity] = useState("도쿄");
  const [count, setCount] = useState(4);
  const [specialties, setSpecialties] = useState<string[]>([]);
  const [submitting, setSubmitting] = useState(false);
  const [result, setResult] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const toggle = (id: string) =>
    setSpecialties((s) => (s.includes(id) ? s.filter((x) => x !== id) : [...s, id]));

  const handleSubmit = async () => {
    setSubmitting(true);
    setError(null);
    setResult(null);
    try {
      const res = await fetch("/api/admin/sherpas/curate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ country, city, count, specialties }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "실패");
      setResult(`${data.inserted}명의 셰르파 후보가 검수 대기로 추가됐어요.`);
      setTimeout(() => {
        setOpen(false);
        setResult(null);
        router.replace("/admin/sherpas?status=pending");
        router.refresh();
      }, 1500);
    } catch (err) {
      setError(err instanceof Error ? err.message : "오류");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="inline-flex items-center gap-1.5 px-4 py-2 rounded-full bg-gradient-to-r from-purple-500 to-indigo-600 text-white text-sm font-semibold hover:shadow-lg hover:shadow-purple-500/25 hover:-translate-y-0.5 transition-all"
      >
        <Sparkles className="w-4 h-4" />
        AI 큐레이션
      </button>

      {open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div
            className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm"
            onClick={() => !submitting && setOpen(false)}
          />
          <div className="relative bg-white rounded-3xl shadow-2xl w-full max-w-md p-6 max-h-[90vh] overflow-y-auto">
            <button
              onClick={() => !submitting && setOpen(false)}
              className="absolute top-4 right-4 p-1.5 rounded-full hover:bg-slate-100 text-slate-400"
            >
              <X className="w-4 h-4" />
            </button>

            <div className="flex items-center gap-2 mb-1">
              <Sparkles className="w-5 h-5 text-purple-500" />
              <h2 className="text-lg font-bold text-slate-900">
                AI 셰르파 후보 생성
              </h2>
            </div>
            <p className="text-xs text-slate-500 mb-5">
              AI가 셰르파 프로필 템플릿을 생성합니다. 운영자가 실제 사람과 매칭하거나 거절합니다.
              <br />
              <span className="text-amber-600 font-medium">
                ⚠ 가상 프로필 — 실제 사람과 연결 후 게시
              </span>
            </p>

            <div className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-2">
                  국가
                </label>
                <div className="grid grid-cols-4 gap-1.5">
                  {COUNTRIES.map((c) => (
                    <button
                      key={c.code}
                      type="button"
                      onClick={() => setCountry(c.code)}
                      className={`p-2 rounded-xl border-2 text-center transition-all ${
                        country === c.code
                          ? "border-purple-500 bg-purple-50"
                          : "border-slate-200 hover:border-slate-300"
                      }`}
                    >
                      <div>{c.emoji}</div>
                      <div className="text-[10px] text-slate-700 mt-0.5">
                        {c.label}
                      </div>
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-2">
                  도시
                </label>
                <input
                  type="text"
                  value={city}
                  onChange={(e) => setCity(e.target.value)}
                  placeholder="예: 도쿄, 서울 강남, 이스탄불"
                  className="w-full px-3 py-2.5 rounded-xl border border-slate-200 focus:border-purple-400 focus:ring-2 focus:ring-purple-100 outline-none text-slate-900 text-sm"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-2">
                  전문 분야 (선택, 미선택 시 다양하게)
                </label>
                <div className="flex flex-wrap gap-1">
                  {SHERPA_SPECIALTIES.map((s) => (
                    <button
                      key={s.id}
                      type="button"
                      onClick={() => toggle(s.id)}
                      className={`px-2.5 py-1 rounded-full text-xs font-medium transition-colors ${
                        specialties.includes(s.id)
                          ? "bg-purple-500 text-white"
                          : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                      }`}
                    >
                      {s.emoji} {s.label}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-2">
                  생성 개수: {count}명
                </label>
                <input
                  type="range"
                  min={1}
                  max={8}
                  value={count}
                  onChange={(e) => setCount(Number(e.target.value))}
                  className="w-full accent-purple-500"
                />
              </div>

              {error && (
                <div className="flex items-start gap-2 p-3 rounded-xl bg-rose-50 text-rose-700 text-sm">
                  <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                  {error}
                </div>
              )}

              {result && (
                <div className="flex items-start gap-2 p-3 rounded-xl bg-emerald-50 text-emerald-700 text-sm">
                  <CheckCircle2 className="w-4 h-4 shrink-0 mt-0.5" />
                  {result}
                </div>
              )}

              <button
                onClick={handleSubmit}
                disabled={submitting || !city.trim()}
                className="w-full py-3 rounded-2xl bg-gradient-to-r from-purple-500 to-indigo-600 text-white font-bold flex items-center justify-center gap-2 hover:shadow-xl hover:shadow-purple-500/25 transition-all disabled:opacity-40"
              >
                {submitting ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    AI 생성 중... (10~30초)
                  </>
                ) : (
                  <>
                    <Sparkles className="w-4 h-4" />
                    {count}명 후보 생성
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
