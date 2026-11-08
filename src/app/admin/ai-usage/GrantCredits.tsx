"use client";

// 관리자: 회원에게 고급 AI 이용권 지급
import { useState } from "react";
import { Gift, Loader2 } from "lucide-react";

export default function GrantCredits() {
  const [email, setEmail] = useState("");
  const [amount, setAmount] = useState(3);
  const [days, setDays] = useState(90);
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null);

  const grant = async () => {
    setBusy(true);
    setMsg(null);
    try {
      const r = await fetch("/api/admin/credits", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, amount, days }),
      });
      const j = await r.json();
      if (!r.ok) throw new Error(j.error ?? "실패");
      setMsg({ ok: true, text: `${j.userName ?? email}님에게 고급 AI ${amount}회 이용권(${days}일)을 지급했어요.` });
      setEmail("");
    } catch (e) {
      setMsg({ ok: false, text: e instanceof Error ? e.message : "실패" });
    } finally {
      setBusy(false);
    }
  };

  const input = "rounded-xl border border-gray-200 px-3 py-2.5 text-sm";
  return (
    <section className="mb-8 rounded-2xl border border-gray-200 bg-white p-5">
      <h2 className="flex items-center gap-2 font-bold text-gray-900 mb-1">
        <Gift className="w-5 h-5 text-amber-500" /> 고급 AI 이용권 지급
      </h2>
      <p className="text-xs text-gray-500 mb-3">이벤트 당첨·불편 보상·테스트용. 회원 가입 이메일로 지급해요.</p>
      <div className="flex flex-wrap gap-2 items-center">
        <input className={`${input} flex-1 min-w-[200px]`} value={email} onChange={(e) => setEmail(e.target.value)} placeholder="회원 이메일" type="email" />
        <label className="text-sm text-gray-600 flex items-center gap-1">
          <input className={`${input} w-20`} type="number" min={1} max={100} value={amount} onChange={(e) => setAmount(Number(e.target.value))} /> 회
        </label>
        <label className="text-sm text-gray-600 flex items-center gap-1">
          <input className={`${input} w-24`} type="number" min={1} max={730} value={days} onChange={(e) => setDays(Number(e.target.value))} /> 일 유효
        </label>
        <button type="button" onClick={grant} disabled={busy || !email.trim()} className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-amber-500 text-white text-sm font-bold disabled:opacity-50">
          {busy && <Loader2 className="w-4 h-4 animate-spin" />} 지급
        </button>
      </div>
      {msg && <p className={`mt-2 text-sm font-semibold ${msg.ok ? "text-emerald-600" : "text-red-600"}`}>{msg.text}</p>}
    </section>
  );
}
