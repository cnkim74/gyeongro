"use client";

// 이메일 가입 회원 — AI 플래너를 쓰기 전 6자리 코드로 이메일 인증
import { useState } from "react";
import { Loader2, MailCheck } from "lucide-react";

export default function EmailVerifyBox({ onVerified }: { onVerified: () => void }) {
  const [sentTo, setSentTo] = useState<string | null>(null);
  const [code, setCode] = useState("");
  const [busy, setBusy] = useState<"send" | "confirm" | null>(null);
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null);

  const call = async (body: Record<string, unknown>) => {
    const r = await fetch("/api/auth/verify-email", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) });
    const j = await r.json();
    if (!r.ok) throw new Error(j.error ?? "실패");
    return j;
  };

  return (
    <div className="rounded-2xl border border-blue-100 bg-blue-50/70 p-5">
      <p className="flex items-center gap-2 font-bold text-gray-900">
        <MailCheck className="w-5 h-5 text-blue-600" /> 이메일 인증 후 AI 여행 설계를 시작할 수 있어요
      </p>
      <p className="mt-1 text-sm text-gray-600">가입한 이메일로 6자리 코드를 보내 드려요. 한 번만 인증하면 돼요.</p>

      {!sentTo ? (
        <button
          type="button"
          disabled={busy === "send"}
          onClick={async () => {
            setBusy("send");
            setMsg(null);
            try {
              const j = await call({ action: "send" });
              setSentTo(j.email);
            } catch (e) {
              setMsg({ ok: false, text: e instanceof Error ? e.message : "보내기 실패" });
            } finally {
              setBusy(null);
            }
          }}
          className="mt-4 w-full inline-flex items-center justify-center gap-2 py-3.5 rounded-xl bg-gradient-to-r from-blue-500 to-indigo-600 text-white font-bold disabled:opacity-50"
        >
          {busy === "send" && <Loader2 className="w-4 h-4 animate-spin" />} 인증 코드 받기
        </button>
      ) : (
        <div className="mt-4">
          <p className="text-sm text-gray-700">
            <b>{sentTo}</b> 로 코드를 보냈어요. 메일이 안 보이면 스팸함도 확인해 주세요.
          </p>
          <div className="mt-2 flex gap-2">
            <input
              inputMode="numeric"
              autoComplete="one-time-code"
              maxLength={6}
              value={code}
              onChange={(e) => setCode(e.target.value.replace(/\D/g, ""))}
              placeholder="6자리 코드"
              className="flex-1 min-w-0 rounded-xl border border-gray-200 bg-white px-4 py-3 text-lg tracking-[0.4em] font-bold text-center"
            />
            <button
              type="button"
              disabled={busy === "confirm" || code.length !== 6}
              onClick={async () => {
                setBusy("confirm");
                setMsg(null);
                try {
                  await call({ action: "confirm", code });
                  setMsg({ ok: true, text: "인증됐어요! 이제 AI 여행 설계를 시작할 수 있어요." });
                  onVerified();
                } catch (e) {
                  setMsg({ ok: false, text: e instanceof Error ? e.message : "확인 실패" });
                } finally {
                  setBusy(null);
                }
              }}
              className="shrink-0 px-5 rounded-xl bg-gray-900 text-white font-bold disabled:opacity-40"
            >
              {busy === "confirm" ? <Loader2 className="w-4 h-4 animate-spin" /> : "확인"}
            </button>
          </div>
          <button
            type="button"
            onClick={() => {
              setSentTo(null);
              setCode("");
              setMsg(null);
            }}
            className="mt-2 text-xs font-semibold text-gray-500 hover:text-gray-800"
          >
            코드 다시 받기
          </button>
        </div>
      )}
      {msg && <p className={`mt-2 text-sm font-semibold ${msg.ok ? "text-emerald-600" : "text-rose-600"}`}>{msg.text}</p>}
    </div>
  );
}
