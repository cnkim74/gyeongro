"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Check, X, Loader2 } from "lucide-react";

export default function ApplicationDecisionButtons({
  postId,
  applicationId,
}: {
  postId: string;
  applicationId: string;
}) {
  const router = useRouter();
  const [loading, setLoading] = useState<"accept" | "reject" | null>(null);

  const decide = async (status: "accepted" | "rejected") => {
    setLoading(status === "accepted" ? "accept" : "reject");
    try {
      const res = await fetch(
        `/api/partners/${postId}/applications/${applicationId}`,
        {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ status }),
        }
      );
      if (!res.ok) throw new Error();
      router.refresh();
    } catch {
      alert("처리 실패");
    } finally {
      setLoading(null);
    }
  };

  return (
    <div className="flex gap-1.5">
      <button
        onClick={() => decide("accepted")}
        disabled={loading !== null}
        className="inline-flex items-center gap-1 px-3 py-1.5 rounded-full bg-emerald-500 text-white text-xs font-semibold hover:bg-emerald-600 disabled:opacity-50"
      >
        {loading === "accept" ? <Loader2 className="w-3 h-3 animate-spin" /> : <Check className="w-3 h-3" />}
        수락
      </button>
      <button
        onClick={() => decide("rejected")}
        disabled={loading !== null}
        className="inline-flex items-center gap-1 px-3 py-1.5 rounded-full bg-slate-200 text-slate-700 text-xs font-semibold hover:bg-slate-300 disabled:opacity-50"
      >
        {loading === "reject" ? <Loader2 className="w-3 h-3 animate-spin" /> : <X className="w-3 h-3" />}
        거절
      </button>
    </div>
  );
}
