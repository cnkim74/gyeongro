// 환율 (원화 기준) — GET -> { rates: { JPY: 원/1엔, ... }, updatedAt, source, live }
// 1순위 FXRatesAPI (당일 실시간 시세, 수 분 간격 갱신)
// 실패하면 ExchangeRate-API(하루 1회) → 유럽중앙은행(Frankfurter) 순으로 대체
// 5분 캐시

import { CURRENCY_CODES } from "@/lib/currency";

export const revalidate = 300;

type Out = { rates: Record<string, number>; updatedAt: string; source: string; live: boolean };

async function fromFxRatesApi(): Promise<Out | null> {
  const r = await fetch(`https://api.fxratesapi.com/latest?base=KRW&currencies=${CURRENCY_CODES.join(",")}&places=10`, {
    next: { revalidate: 300 },
  });
  if (!r.ok) return null;
  const j = (await r.json()) as { success?: boolean; rates?: Record<string, number>; timestamp?: number; date?: string };
  if (!j.success || !j.rates) return null;
  const rates: Record<string, number> = {};
  for (const c of CURRENCY_CODES) if (j.rates[c]) rates[c] = 1 / j.rates[c];
  if (!rates.USD || !rates.JPY) return null;
  return {
    rates,
    updatedAt: j.timestamp ? new Date(j.timestamp * 1000).toISOString() : (j.date ?? new Date().toISOString()),
    source: "FXRatesAPI",
    live: true,
  };
}

async function fromErApi(): Promise<Out | null> {
  const r = await fetch("https://open.er-api.com/v6/latest/KRW", { next: { revalidate: 3600 } });
  if (!r.ok) return null;
  const j = (await r.json()) as { result?: string; rates?: Record<string, number>; time_last_update_unix?: number };
  if (j.result !== "success" || !j.rates) return null;
  const rates: Record<string, number> = {};
  for (const c of CURRENCY_CODES) if (j.rates[c]) rates[c] = 1 / j.rates[c]; // 1 외화 = ? 원
  return {
    rates,
    updatedAt: new Date((j.time_last_update_unix ?? Date.now() / 1000) * 1000).toISOString(),
    source: "ExchangeRate-API",
    live: false,
  };
}

async function fromFrankfurter(): Promise<Out | null> {
  const r = await fetch("https://api.frankfurter.dev/v1/latest?base=KRW", { next: { revalidate: 3600 } });
  if (!r.ok) return null;
  const j = (await r.json()) as { date?: string; rates?: Record<string, number> };
  if (!j.rates) return null;
  const rates: Record<string, number> = {};
  for (const c of CURRENCY_CODES) if (j.rates[c]) rates[c] = 1 / j.rates[c];
  return { rates, updatedAt: `${j.date}T16:00:00Z`, source: "European Central Bank", live: false };
}

export async function GET() {
  try {
    const out =
      (await fromFxRatesApi().catch(() => null)) ??
      (await fromErApi().catch(() => null)) ??
      (await fromFrankfurter().catch(() => null));
    if (!out) return Response.json({ error: "환율을 불러오지 못했어요." }, { status: 502 });
    return Response.json(out, { headers: { "Cache-Control": "public, s-maxage=300, stale-while-revalidate=600" } });
  } catch {
    return Response.json({ error: "환율을 불러오지 못했어요." }, { status: 502 });
  }
}
