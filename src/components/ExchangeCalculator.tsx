"use client";

// 환율 계산기 — 외화 ↔ 원화 양방향, 통화 선택, 빠른 금액 버튼
// variant="card": 여행 준비 페이지 도구 카드 / variant="compact": 일정 결과(여행지 통화 자동 선택)

import { useEffect, useMemo, useState } from "react";
import { ArrowDownUp, Loader2, RefreshCw } from "lucide-react";
import { CURRENCIES, currencyInfo } from "@/lib/currency";

type Rates = { rates: Record<string, number>; updatedAt: string; source: string };

// 같은 페이지에서 여러 번 불러오지 않도록 공유
let cache: Promise<Rates> | null = null;
function loadRates(): Promise<Rates> {
  if (!cache) {
    cache = fetch("/api/exchange")
      .then((r) => (r.ok ? r.json() : Promise.reject(new Error("fail"))))
      .catch((e) => {
        cache = null;
        throw e;
      });
  }
  return cache;
}

function fmt(n: number, max = 2): string {
  if (!Number.isFinite(n)) return "";
  return n.toLocaleString("ko-KR", { maximumFractionDigits: max });
}

function parse(v: string): number {
  return Number(v.replace(/[^0-9.]/g, "")) || 0;
}

export default function ExchangeCalculator({
  defaultCurrency = "JPY",
  variant = "card",
}: {
  defaultCurrency?: string;
  variant?: "card" | "compact";
}) {
  const [data, setData] = useState<Rates | null>(null);
  const [error, setError] = useState(false);
  const [code, setCode] = useState(currencyInfo(defaultCurrency) ? defaultCurrency : "JPY");
  const info = currencyInfo(code)!;
  const [foreign, setForeign] = useState(String(info.unit === 100 ? 1000 : 100));
  const [krw, setKrw] = useState<string | null>(null); // 원화 칸을 직접 고쳤을 때만 값

  useEffect(() => {
    let alive = true;
    loadRates()
      .then((d) => alive && setData(d))
      .catch(() => alive && setError(true));
    return () => {
      alive = false;
    };
  }, []);

  const rate = data?.rates[code] ?? 0; // 1 외화 = rate 원
  const foreignNum = krw !== null && rate ? parse(krw) / rate : parse(foreign);
  const krwNum = krw !== null ? parse(krw) : parse(foreign) * rate;

  const updated = useMemo(() => {
    if (!data) return "";
    const d = new Date(data.updatedAt);
    return d.toLocaleString("ko-KR", { timeZone: "Asia/Seoul", month: "numeric", day: "numeric", hour: "2-digit", minute: "2-digit" });
  }, [data]);

  const quick = info.unit === 100 ? [1000, 5000, 10000, 50000] : code === "USD" || code === "EUR" || code === "GBP" || code === "CHF" ? [10, 50, 100, 500] : [100, 500, 1000, 5000];

  const compact = variant === "compact";
  const box = compact
    ? "rounded-2xl border border-emerald-100 bg-gradient-to-br from-emerald-50 via-white to-teal-50 p-4 sm:p-5"
    : "min-w-0 rounded-3xl p-5 sm:p-6 border border-emerald-100 bg-gradient-to-br from-emerald-50 via-white to-teal-50 shadow-[0_10px_30px_-16px_rgba(16,185,129,0.4)]";
  const input = "w-full min-w-0 bg-transparent text-xl sm:text-2xl font-extrabold text-gray-900 focus:outline-none tabular-nums";

  return (
    <section className={box}>
      <div className="flex items-start justify-between gap-2 mb-1">
        <h2 className={`flex items-center gap-2 font-bold text-gray-900 ${compact ? "text-lg" : "text-xl"}`}>💱 환율 계산기</h2>
        {data && (
          <span className="text-[11px] text-gray-400 text-right leading-tight pt-1">
            {updated} 기준
          </span>
        )}
      </div>
      {!compact && <p className="text-[15px] text-gray-500 mb-4">여행 경비를 원화로 바로 계산해 보세요</p>}

      {error ? (
        <div className="py-6 text-center text-sm text-gray-500">
          환율을 불러오지 못했어요.{" "}
          <button
            type="button"
            className="inline-flex items-center gap-1 font-semibold text-emerald-700"
            onClick={() => {
              setError(false);
              loadRates().then(setData).catch(() => setError(true));
            }}
          >
            <RefreshCw className="w-3.5 h-3.5" /> 다시 시도
          </button>
        </div>
      ) : !data ? (
        <div className="py-8 flex justify-center text-gray-400">
          <Loader2 className="w-5 h-5 animate-spin" />
        </div>
      ) : (
        <>
          <div className={`rounded-2xl bg-white border border-gray-100 px-4 py-3 ${compact ? "mt-2" : ""}`}>
            <div className="flex items-center gap-2">
              {/* 보이는 건 국기+코드, 누르면 전체 목록 (이름까지) */}
              <label className="relative shrink-0 w-[104px] rounded-xl bg-gray-50 border border-gray-200 px-2.5 py-1.5 text-sm font-semibold text-gray-800 flex items-center justify-between">
                <span>
                  {info.flag} {code}
                </span>
                <span className="text-gray-400 text-xs">▾</span>
                <select
                  value={code}
                  onChange={(e) => {
                    const next = currencyInfo(e.target.value)!;
                    setCode(next.code);
                    setForeign(String(next.unit === 100 ? 1000 : 100));
                    setKrw(null);
                  }}
                  className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                  aria-label="통화 선택"
                >
                  {CURRENCIES.map((c) => (
                    <option key={c.code} value={c.code}>
                      {c.flag} {c.code} {c.name}
                    </option>
                  ))}
                </select>
              </label>
              <input
                inputMode="decimal"
                className={`${input} text-right`}
                value={krw !== null ? fmt(foreignNum) : foreign}
                onChange={(e) => {
                  setForeign(e.target.value.replace(/[^0-9.,]/g, ""));
                  setKrw(null);
                }}
                aria-label={`${info.name} 금액`}
              />
            </div>
            <p className="mt-1 text-[11px] text-gray-400">{info.name}</p>
          </div>

          <div className="flex justify-center -my-2 relative z-10">
            <span className="w-8 h-8 rounded-full bg-emerald-500 text-white flex items-center justify-center shadow">
              <ArrowDownUp className="w-4 h-4" />
            </span>
          </div>

          <div className="rounded-2xl bg-white border border-gray-100 px-4 py-3">
            <div className="flex items-center gap-2">
              <span className="shrink-0 w-[104px] rounded-xl bg-gray-50 border border-gray-200 px-2.5 py-1.5 text-sm font-semibold text-gray-800">🇰🇷 KRW</span>
              <input
                inputMode="numeric"
                className={`${input} text-right`}
                value={krw !== null ? krw : fmt(krwNum, 0)}
                onChange={(e) => setKrw(e.target.value.replace(/[^0-9,]/g, ""))}
                aria-label="원화 금액"
              />
            </div>
          </div>

          <div className="flex flex-wrap gap-1.5 mt-3">
            {quick.map((q) => (
              <button
                key={q}
                type="button"
                onClick={() => {
                  setForeign(String(q));
                  setKrw(null);
                }}
                className="px-3 py-1.5 rounded-full bg-white border border-emerald-100 text-xs font-semibold text-emerald-700 hover:bg-emerald-50"
              >
                {fmt(q)} {code}
              </button>
            ))}
          </div>

          <p className="mt-3 text-sm font-semibold text-gray-700">
            {info.flag} {fmt(info.unit)} {code} ≈ {fmt(rate * info.unit, rate * info.unit < 100 ? 2 : 0)}원
          </p>
          <p className="mt-1 text-[11px] text-gray-400 leading-relaxed">
            시장 기준 환율({data.source})이에요. 은행·카드·환전소 실제 환율은 수수료로 1~3% 다를 수 있어요.
          </p>
        </>
      )}
    </section>
  );
}
