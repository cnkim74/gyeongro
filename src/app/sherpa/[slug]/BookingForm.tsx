"use client";

import { useState, useMemo } from "react";
import { Loader2, AlertCircle, CheckCircle, Send } from "lucide-react";

interface Props {
  sherpaId: string;
  sherpaName: string;
  defaultCity: string;
  hourly: number | null;
  halfDay: number | null;
  fullDay: number | null;
  languages: string[];
}

type Duration = "hourly" | "half_day" | "full_day" | "multi_day";

export default function BookingForm({
  sherpaId,
  sherpaName,
  defaultCity,
  hourly,
  halfDay,
  fullDay,
}: Props) {
  const [destinationCity, setDestinationCity] = useState(defaultCity);
  const [startDate, setStartDate] = useState(() => {
    const d = new Date();
    d.setDate(d.getDate() + 14);
    return d.toISOString().slice(0, 10);
  });
  const [endDate, setEndDate] = useState(() => {
    const d = new Date();
    d.setDate(d.getDate() + 14);
    return d.toISOString().slice(0, 10);
  });
  const [duration, setDuration] = useState<Duration>("half_day");
  const [hours, setHours] = useState(2);
  const [partySize, setPartySize] = useState(2);
  const [notes, setNotes] = useState("");
  const [contactName, setContactName] = useState("");
  const [contactEmail, setContactEmail] = useState("");
  const [contactPhone, setContactPhone] = useState("");

  const [submitting, setSubmitting] = useState(false);
  const [done, setDone] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const estimatedPrice = useMemo(() => {
    if (duration === "hourly" && hourly) return hourly * hours;
    if (duration === "half_day" && halfDay) return halfDay;
    if (duration === "full_day" && fullDay) return fullDay;
    if (duration === "multi_day" && fullDay) {
      const start = new Date(`${startDate}T00:00:00`);
      const end = new Date(`${endDate}T00:00:00`);
      const diff = Math.max(
        1,
        Math.round((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24)) + 1
      );
      return fullDay * diff;
    }
    return 0;
  }, [duration, hours, hourly, halfDay, fullDay, startDate, endDate]);

  const canSubmit =
    contactName.trim() &&
    /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(contactEmail) &&
    notes.trim().length > 5 &&
    destinationCity.trim() &&
    !submitting;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!canSubmit) return;
    setSubmitting(true);
    setError(null);
    try {
      const res = await fetch("/api/sherpa/book", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          sherpaId,
          destinationCity: destinationCity.trim(),
          startDate,
          endDate,
          durationType: duration,
          durationHours: duration === "hourly" ? hours : null,
          partySize,
          notes: notes.trim(),
          contactName: contactName.trim(),
          contactEmail: contactEmail.trim().toLowerCase(),
          contactPhone: contactPhone.trim() || null,
          estimatedPriceKrw: estimatedPrice || null,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "전송 실패");
      setDone(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : "오류가 발생했어요.");
    } finally {
      setSubmitting(false);
    }
  };

  if (done) {
    return (
      <div className="text-center py-8">
        <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-emerald-50 text-emerald-500 mb-4">
          <CheckCircle className="w-8 h-8" />
        </div>
        <h3 className="text-lg font-bold text-slate-900 mb-2">
          예약 요청이 전송됐어요
        </h3>
        <p className="text-sm text-slate-600 leading-relaxed">
          {sherpaName} 셰르파에게 요청이 전달됐습니다.
          <br />
          평균 응답 시간 내에 확인 후 회신드립니다.
        </p>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <div>
          <label className="block text-xs font-semibold text-slate-700 mb-1">
            도시
          </label>
          <input
            type="text"
            value={destinationCity}
            onChange={(e) => setDestinationCity(e.target.value)}
            className="w-full px-3 py-2 rounded-xl border border-slate-200 focus:border-emerald-400 focus:ring-2 focus:ring-emerald-100 outline-none text-slate-900 text-sm"
            required
          />
        </div>
        <div>
          <label className="block text-xs font-semibold text-slate-700 mb-1">
            인원
          </label>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setPartySize(Math.max(1, partySize - 1))}
              className="w-8 h-8 rounded-full border border-slate-200 hover:bg-slate-50 text-slate-700 font-bold"
            >
              -
            </button>
            <span className="flex-1 text-center font-semibold">
              {partySize}명
            </span>
            <button
              type="button"
              onClick={() => setPartySize(Math.min(20, partySize + 1))}
              className="w-8 h-8 rounded-full border border-slate-200 hover:bg-slate-50 text-slate-700 font-bold"
            >
              +
            </button>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <div>
          <label className="block text-xs font-semibold text-slate-700 mb-1">
            시작일
          </label>
          <input
            type="date"
            value={startDate}
            min={new Date().toISOString().slice(0, 10)}
            onChange={(e) => {
              setStartDate(e.target.value);
              if (e.target.value > endDate) setEndDate(e.target.value);
            }}
            className="w-full px-3 py-2 rounded-xl border border-slate-200 focus:border-emerald-400 focus:ring-2 focus:ring-emerald-100 outline-none text-slate-900 text-sm"
            required
          />
        </div>
        <div>
          <label className="block text-xs font-semibold text-slate-700 mb-1">
            종료일
          </label>
          <input
            type="date"
            value={endDate}
            min={startDate}
            onChange={(e) => setEndDate(e.target.value)}
            className="w-full px-3 py-2 rounded-xl border border-slate-200 focus:border-emerald-400 focus:ring-2 focus:ring-emerald-100 outline-none text-slate-900 text-sm"
            required
          />
        </div>
      </div>

      <div>
        <label className="block text-xs font-semibold text-slate-700 mb-2">
          이용 시간
        </label>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
          {[
            { id: "hourly", label: "시간제", price: hourly, suffix: "/시간" },
            { id: "half_day", label: "반나절", price: halfDay, suffix: "(4h)" },
            { id: "full_day", label: "종일", price: fullDay, suffix: "(8h)" },
            { id: "multi_day", label: "다중일", price: fullDay, suffix: "/일" },
          ].map((d) => (
            <button
              key={d.id}
              type="button"
              onClick={() => setDuration(d.id as Duration)}
              disabled={!d.price}
              className={`p-2.5 rounded-xl border-2 text-center transition-all ${
                duration === d.id
                  ? "border-emerald-500 bg-emerald-50"
                  : "border-slate-200 hover:border-slate-300"
              } disabled:opacity-40 disabled:cursor-not-allowed`}
            >
              <div className="text-xs font-semibold text-slate-900">
                {d.label}
              </div>
              <div className="text-[10px] text-slate-500 mt-0.5">
                {d.price ? `${(d.price / 10000).toFixed(0)}만원${d.suffix}` : "-"}
              </div>
            </button>
          ))}
        </div>
        {duration === "hourly" && (
          <div className="mt-2 flex items-center gap-2">
            <span className="text-xs text-slate-600">시간:</span>
            {[2, 3, 4, 6].map((h) => (
              <button
                key={h}
                type="button"
                onClick={() => setHours(h)}
                className={`px-3 py-1 rounded-full text-xs font-medium ${
                  hours === h
                    ? "bg-emerald-500 text-white"
                    : "bg-slate-100 text-slate-600"
                }`}
              >
                {h}시간
              </button>
            ))}
          </div>
        )}
      </div>

      <div>
        <label className="block text-xs font-semibold text-slate-700 mb-1">
          요청 사항 <span className="text-rose-500">*</span>
        </label>
        <textarea
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          placeholder="어떤 도움이 필요한지, 관심사, 특이사항을 적어주세요."
          rows={4}
          className="w-full px-3 py-2 rounded-xl border border-slate-200 focus:border-emerald-400 focus:ring-2 focus:ring-emerald-100 outline-none text-slate-900 text-sm resize-none"
          required
          minLength={6}
        />
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <div>
          <label className="block text-xs font-semibold text-slate-700 mb-1">
            이름 <span className="text-rose-500">*</span>
          </label>
          <input
            type="text"
            value={contactName}
            onChange={(e) => setContactName(e.target.value)}
            className="w-full px-3 py-2 rounded-xl border border-slate-200 focus:border-emerald-400 focus:ring-2 focus:ring-emerald-100 outline-none text-slate-900 text-sm"
            required
          />
        </div>
        <div>
          <label className="block text-xs font-semibold text-slate-700 mb-1">
            이메일 <span className="text-rose-500">*</span>
          </label>
          <input
            type="email"
            value={contactEmail}
            onChange={(e) => setContactEmail(e.target.value)}
            className="w-full px-3 py-2 rounded-xl border border-slate-200 focus:border-emerald-400 focus:ring-2 focus:ring-emerald-100 outline-none text-slate-900 text-sm"
            required
          />
        </div>
      </div>

      <div>
        <label className="block text-xs font-semibold text-slate-700 mb-1">
          연락처 (선택)
        </label>
        <input
          type="tel"
          value={contactPhone}
          onChange={(e) => setContactPhone(e.target.value)}
          placeholder="010-1234-5678"
          className="w-full px-3 py-2 rounded-xl border border-slate-200 focus:border-emerald-400 focus:ring-2 focus:ring-emerald-100 outline-none text-slate-900 text-sm"
        />
      </div>

      {/* Estimated price */}
      {estimatedPrice > 0 && (
        <div className="bg-emerald-50 rounded-xl p-3 flex items-center justify-between">
          <span className="text-xs text-slate-600">예상 비용</span>
          <span className="text-lg font-bold text-emerald-700">
            {estimatedPrice.toLocaleString("ko-KR")}원
          </span>
        </div>
      )}

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
        예약 요청 보내기
      </button>

      <p className="text-[11px] text-slate-400 text-center leading-relaxed">
        결제는 셰르파와 직접 협의 후 진행됩니다. (현재 MVP — 추후 안전결제 도입 예정)
      </p>
    </form>
  );
}
