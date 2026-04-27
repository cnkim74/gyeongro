"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Loader2, AlertCircle, CheckCircle, Send } from "lucide-react";

interface Props {
  tripId: string;
  budgetMax: number | null;
}

export default function ProposalForm({ tripId, budgetMax }: Props) {
  const router = useRouter();
  const [price, setPrice] = useState("");
  const [scope, setScope] = useState("");
  const [message, setMessage] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [done, setDone] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const priceNumber = price ? Number(price) * 10000 : 0;
  const overBudget =
    !!budgetMax && priceNumber > 0 && priceNumber > budgetMax;

  const canSubmit =
    priceNumber > 0 &&
    scope.trim().length >= 5 &&
    message.trim().length >= 20 &&
    !submitting;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!canSubmit) return;
    setSubmitting(true);
    setError(null);
    try {
      const res = await fetch("/api/sherpa/proposals", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          tripId,
          proposedPriceKrw: priceNumber,
          proposedScope: scope.trim(),
          message: message.trim(),
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "제출 실패");
      setDone(true);
      setTimeout(() => router.push("/sherpa/open-trips"), 1200);
    } catch (err) {
      setError(err instanceof Error ? err.message : "오류가 발생했어요.");
    } finally {
      setSubmitting(false);
    }
  };

  if (done) {
    return (
      <div className="text-center py-8">
        <CheckCircle className="w-12 h-12 mx-auto text-emerald-500 mb-3" />
        <p className="font-bold text-slate-900 mb-1">제안 제출 완료</p>
        <p className="text-sm text-slate-500">
          여행자가 검토 후 회신드립니다.
        </p>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label className="block text-xs font-semibold text-slate-700 mb-1.5">
          제안 가격 <span className="text-rose-500">*</span>
        </label>
        <div className="relative">
          <input
            type="number"
            inputMode="numeric"
            min={0}
            value={price}
            onChange={(e) => setPrice(e.target.value)}
            placeholder="50"
            className="w-full px-3 py-3 pr-12 rounded-xl border border-slate-200 focus:border-emerald-400 focus:ring-2 focus:ring-emerald-100 outline-none text-slate-900"
            required
          />
          <span className="absolute right-3 top-1/2 -translate-y-1/2 text-sm text-slate-400">
            만원
          </span>
        </div>
        {overBudget && (
          <p className="text-xs text-amber-600 mt-1">
            여행자 예산({(budgetMax! / 10000).toLocaleString("ko-KR")}만원)을
            초과합니다. 협의 가능하면 메시지에 사유를 적어주세요.
          </p>
        )}
        {budgetMax && !overBudget && (
          <p className="text-xs text-slate-400 mt-1">
            여행자 예산: 최대 {(budgetMax / 10000).toLocaleString("ko-KR")}만원
          </p>
        )}
      </div>

      <div>
        <label className="block text-xs font-semibold text-slate-700 mb-1.5">
          제안 범위 <span className="text-rose-500">*</span>
        </label>
        <input
          type="text"
          value={scope}
          onChange={(e) => setScope(e.target.value)}
          placeholder="예: Day 2 종일 동행 + Day 3 오전 안내"
          className="w-full px-3 py-3 rounded-xl border border-slate-200 focus:border-emerald-400 focus:ring-2 focus:ring-emerald-100 outline-none text-slate-900"
          required
        />
      </div>

      <div>
        <label className="block text-xs font-semibold text-slate-700 mb-1.5">
          어필 메시지 <span className="text-rose-500">*</span>
        </label>
        <textarea
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          placeholder="왜 본인이 이 여행에 도움이 되는지, 어떤 가치를 더할 수 있는지 진솔하게 적어주세요. (최소 20자)"
          rows={6}
          className="w-full px-3 py-3 rounded-xl border border-slate-200 focus:border-emerald-400 focus:ring-2 focus:ring-emerald-100 outline-none text-slate-900 resize-none"
          required
          minLength={20}
        />
        <p className="text-xs text-slate-400 mt-1">{message.length}자</p>
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
        className="w-full py-3 rounded-2xl bg-gradient-to-r from-emerald-500 to-teal-600 text-white font-bold flex items-center justify-center gap-2 hover:shadow-xl hover:shadow-emerald-500/25 hover:-translate-y-0.5 transition-all disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:translate-y-0"
      >
        {submitting ? (
          <Loader2 className="w-4 h-4 animate-spin" />
        ) : (
          <Send className="w-4 h-4" />
        )}
        제안 제출
      </button>

      <p className="text-[11px] text-slate-400 text-center">
        제출 후에는 여행자가 수락/거절할 때까지 대기 상태입니다. 본인이
        철회할 수도 있어요.
      </p>
    </form>
  );
}
