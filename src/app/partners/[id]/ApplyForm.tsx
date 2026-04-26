"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Send, Loader2, AlertCircle } from "lucide-react";

export default function ApplyForm({ postId }: { postId: string }) {
  const router = useRouter();
  const [message, setMessage] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSubmitting(true);
    try {
      const res = await fetch(`/api/partners/${postId}/applications`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "신청 실패");
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "오류가 발생했어요.");
      setSubmitting(false);
    }
  };

  return (
    <div className="bg-white rounded-3xl border border-slate-100 p-6">
      <h3 className="font-bold text-slate-900 mb-4">함께 떠나고 싶어요</h3>
      <form onSubmit={handleSubmit} className="space-y-4">
        <textarea
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          placeholder="자신을 간단히 소개하고, 함께하고 싶은 이유를 적어주세요"
          rows={4}
          className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:border-blue-400 focus:ring-2 focus:ring-blue-100 outline-none text-slate-900 resize-y"
        />
        {error && (
          <div className="flex items-center gap-2 px-4 py-3 rounded-xl bg-red-50 text-red-700 text-sm">
            <AlertCircle className="w-4 h-4 shrink-0" />
            {error}
          </div>
        )}
        <button
          type="submit"
          disabled={submitting}
          className="w-full inline-flex items-center justify-center gap-2 px-5 py-3 rounded-2xl bg-slate-900 text-white font-bold hover:bg-slate-800 disabled:opacity-50 transition-colors"
        >
          {submitting ? (
            <Loader2 className="w-4 h-4 animate-spin" />
          ) : (
            <Send className="w-4 h-4" />
          )}
          신청하기
        </button>
      </form>
    </div>
  );
}
