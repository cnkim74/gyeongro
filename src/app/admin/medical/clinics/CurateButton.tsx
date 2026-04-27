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

interface Procedure {
  slug: string;
  name_ko: string;
  emoji: string | null;
}

const COUNTRIES: Array<{ code: string; label: string; emoji: string }> = [
  { code: "KR", label: "대한민국", emoji: "🇰🇷" },
  { code: "JP", label: "일본", emoji: "🇯🇵" },
  { code: "TR", label: "터키", emoji: "🇹🇷" },
  { code: "TH", label: "태국", emoji: "🇹🇭" },
  { code: "HU", label: "헝가리", emoji: "🇭🇺" },
  { code: "CZ", label: "체코", emoji: "🇨🇿" },
  { code: "MY", label: "말레이시아", emoji: "🇲🇾" },
  { code: "VN", label: "베트남", emoji: "🇻🇳" },
];

interface Props {
  procedures: Procedure[];
}

export default function CurateButton({ procedures }: Props) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [procedureSlug, setProcedureSlug] = useState(procedures[0]?.slug ?? "");
  const [country, setCountry] = useState("TR");
  const [direction, setDirection] = useState<"inbound" | "outbound">("outbound");
  const [count, setCount] = useState(5);
  const [submitting, setSubmitting] = useState(false);
  const [result, setResult] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async () => {
    setSubmitting(true);
    setError(null);
    setResult(null);
    try {
      const res = await fetch("/api/admin/medical/curate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ procedureSlug, country, direction, count }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "실패");
      setResult(`${data.inserted}개 클리닉이 검수 대기 목록에 추가됐어요.`);
      setTimeout(() => {
        setOpen(false);
        setResult(null);
        router.replace("/admin/medical/clinics?status=pending");
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
          <div className="relative bg-white rounded-3xl shadow-2xl w-full max-w-md p-6">
            <button
              onClick={() => !submitting && setOpen(false)}
              className="absolute top-4 right-4 p-1.5 rounded-full hover:bg-slate-100 text-slate-400"
            >
              <X className="w-4 h-4" />
            </button>

            <div className="flex items-center gap-2 mb-1">
              <Sparkles className="w-5 h-5 text-purple-500" />
              <h2 className="text-lg font-bold text-slate-900">
                AI 클리닉 큐레이션
              </h2>
            </div>
            <p className="text-xs text-slate-500 mb-5">
              AI가 후보 클리닉을 생성해 검수 대기 상태로 저장합니다.
              <br />
              <span className="text-amber-600 font-medium">
                ⚠ 환각 가능성 — 게시 전 운영자 확인 필수
              </span>
            </p>

            <div className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-2">
                  시술
                </label>
                <div className="grid grid-cols-3 gap-2">
                  {procedures.map((p) => (
                    <button
                      key={p.slug}
                      type="button"
                      onClick={() => setProcedureSlug(p.slug)}
                      className={`p-2.5 rounded-xl border-2 text-center transition-all ${
                        procedureSlug === p.slug
                          ? "border-purple-500 bg-purple-50"
                          : "border-slate-200 hover:border-slate-300"
                      }`}
                    >
                      <div className="text-xl">{p.emoji}</div>
                      <div className="text-xs font-semibold text-slate-900 mt-0.5">
                        {p.name_ko}
                      </div>
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-2">
                  방향
                </label>
                <div className="grid grid-cols-2 gap-2">
                  {[
                    { id: "inbound" as const, label: "Inbound (외→KR)" },
                    { id: "outbound" as const, label: "Outbound (KR→외)" },
                  ].map((d) => (
                    <button
                      key={d.id}
                      type="button"
                      onClick={() => setDirection(d.id)}
                      className={`px-3 py-2 rounded-xl border-2 text-xs font-semibold transition-all ${
                        direction === d.id
                          ? "border-purple-500 bg-purple-50 text-purple-700"
                          : "border-slate-200 text-slate-600 hover:border-slate-300"
                      }`}
                    >
                      {d.label}
                    </button>
                  ))}
                </div>
              </div>

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
                  생성 개수: {count}개
                </label>
                <input
                  type="range"
                  min={1}
                  max={10}
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
                disabled={submitting || !procedureSlug}
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
                    {count}개 후보 생성
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
