"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { CheckCircle2, XCircle, Loader2, Flag } from "lucide-react";

interface Props {
  bookingId: string;
  currentStatus: string;
}

export default function BookingActions({ bookingId, currentStatus }: Props) {
  const router = useRouter();
  const [busy, setBusy] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const act = async (action: "accept" | "decline" | "complete") => {
    let message: string | null = null;
    let declinedReason: string | null = null;
    if (action === "accept") {
      message = window.prompt("여행자에게 보낼 메시지 (선택):") ?? "";
    } else if (action === "decline") {
      declinedReason = window.prompt("거절 사유 (선택):") ?? "";
    } else if (action === "complete") {
      if (!confirm("이 예약을 완료 처리하시겠어요?")) return;
    }
    setBusy(action);
    setError(null);
    try {
      const res = await fetch(`/api/sherpa/bookings/${bookingId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action,
          message: message || null,
          declinedReason: declinedReason || null,
        }),
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

  if (currentStatus === "completed") {
    return (
      <span className="text-xs font-semibold text-emerald-600 inline-flex items-center gap-1">
        <CheckCircle2 className="w-3.5 h-3.5" />
        완료
      </span>
    );
  }

  if (currentStatus === "declined") {
    return (
      <span className="text-xs text-slate-400">거절됨</span>
    );
  }

  if (currentStatus === "cancelled") {
    return <span className="text-xs text-slate-400">취소됨</span>;
  }

  return (
    <div className="flex flex-col gap-1.5">
      {error && <p className="text-[11px] text-rose-600">{error}</p>}
      <div className="flex gap-1.5">
        {currentStatus === "pending" && (
          <>
            <button
              onClick={() => act("accept")}
              disabled={busy !== null}
              className="px-3 py-1.5 rounded-lg bg-emerald-500 text-white text-xs font-semibold hover:bg-emerald-600 disabled:opacity-50 inline-flex items-center gap-1"
            >
              {busy === "accept" ? (
                <Loader2 className="w-3 h-3 animate-spin" />
              ) : (
                <CheckCircle2 className="w-3 h-3" />
              )}
              수락
            </button>
            <button
              onClick={() => act("decline")}
              disabled={busy !== null}
              className="px-3 py-1.5 rounded-lg bg-slate-100 text-slate-700 text-xs font-semibold hover:bg-slate-200 disabled:opacity-50 inline-flex items-center gap-1"
            >
              <XCircle className="w-3 h-3" />
              거절
            </button>
          </>
        )}
        {currentStatus === "accepted" && (
          <button
            onClick={() => act("complete")}
            disabled={busy !== null}
            className="px-3 py-1.5 rounded-lg bg-blue-500 text-white text-xs font-semibold hover:bg-blue-600 disabled:opacity-50 inline-flex items-center gap-1"
          >
            {busy === "complete" ? (
              <Loader2 className="w-3 h-3 animate-spin" />
            ) : (
              <Flag className="w-3 h-3" />
            )}
            완료 처리
          </button>
        )}
      </div>
    </div>
  );
}
