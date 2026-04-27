"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { CheckCircle2, XCircle, Archive, Loader2 } from "lucide-react";

interface Props {
  clinicId: string;
  currentStatus: string;
}

export default function ReviewActions({ clinicId, currentStatus }: Props) {
  const router = useRouter();
  const [busy, setBusy] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const act = async (action: "publish" | "reject" | "archive") => {
    let reason: string | null = null;
    if (action === "reject") {
      reason = window.prompt("거절 사유를 적어주세요 (선택):") ?? "";
    }
    if (action === "archive" && !confirm("게시 종료하시겠어요?")) return;
    setBusy(action);
    setError(null);
    try {
      const res = await fetch(`/api/admin/medical/clinics/${clinicId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action, reason: reason || null }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "처리 실패");
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "오류");
    } finally {
      setBusy(null);
    }
  };

  return (
    <div className="space-y-2">
      {error && (
        <p className="text-xs text-rose-600 bg-rose-50 px-2 py-1 rounded">{error}</p>
      )}
      <div className="flex gap-2">
        {currentStatus !== "published" && (
          <button
            onClick={() => act("publish")}
            disabled={busy !== null}
            className="flex-1 px-3 py-2 rounded-xl bg-emerald-500 text-white text-xs font-semibold hover:bg-emerald-600 disabled:opacity-50 inline-flex items-center justify-center gap-1"
          >
            {busy === "publish" ? (
              <Loader2 className="w-3 h-3 animate-spin" />
            ) : (
              <CheckCircle2 className="w-3 h-3" />
            )}
            게시
          </button>
        )}
        {currentStatus === "pending" && (
          <button
            onClick={() => act("reject")}
            disabled={busy !== null}
            className="flex-1 px-3 py-2 rounded-xl bg-slate-100 text-slate-700 text-xs font-semibold hover:bg-slate-200 disabled:opacity-50 inline-flex items-center justify-center gap-1"
          >
            <XCircle className="w-3 h-3" />
            거절
          </button>
        )}
        {currentStatus === "published" && (
          <button
            onClick={() => act("archive")}
            disabled={busy !== null}
            className="flex-1 px-3 py-2 rounded-xl bg-slate-100 text-slate-700 text-xs font-semibold hover:bg-slate-200 disabled:opacity-50 inline-flex items-center justify-center gap-1"
          >
            <Archive className="w-3 h-3" />
            게시중단
          </button>
        )}
      </div>
    </div>
  );
}
