// 구글 애널리틱스(GA4) 방문 통계 읽기 — 서버 전용
//
// 필요한 것
//  - GA4_PROPERTY_ID: GA4 '속성 ID' (숫자, 예: 512345678) — Vercel 환경변수
//  - 서치콘솔에 쓰는 서비스 계정(GOOGLE_SC_CLIENT_EMAIL / GOOGLE_SC_PRIVATE_KEY)을
//    GA4 속성 '액세스 관리'에 '뷰어'로 추가 + 구글 클라우드에서 'Google Analytics Data API' 사용 설정

import { googleToken } from "./search-index";

const SCOPE = "https://www.googleapis.com/auth/analytics.readonly";

export function gaPropertyId(): string | null {
  const id = (process.env.GA4_PROPERTY_ID ?? "").replace(/^properties\//, "").trim();
  return /^\d+$/.test(id) ? id : null;
}

export function gaReady() {
  return {
    tag: /^G-[A-Z0-9]+$/.test(process.env.NEXT_PUBLIC_GA_ID ?? ""),
    property: !!gaPropertyId(),
    serviceAccount: !!(process.env.GOOGLE_SC_CLIENT_EMAIL && process.env.GOOGLE_SC_PRIVATE_KEY),
    serviceAccountEmail: process.env.GOOGLE_SC_CLIENT_EMAIL ?? null,
  };
}

type Row = { dimensionValues?: { value: string }[]; metricValues?: { value: string }[] };
export type Report = { rows: Row[]; error?: string };

async function call(path: "runReport" | "runRealtimeReport", body: unknown): Promise<Report> {
  const id = gaPropertyId();
  if (!id) return { rows: [], error: "GA4_PROPERTY_ID 없음" };
  try {
    const token = await googleToken(SCOPE);
    const r = await fetch(`https://analyticsdata.googleapis.com/v1beta/properties/${id}:${path}`, {
      method: "POST",
      headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
      body: JSON.stringify(body),
      cache: "no-store",
    });
    const j = (await r.json()) as { rows?: Row[]; error?: { message?: string; status?: string } };
    if (!r.ok) return { rows: [], error: j.error?.message ?? `GA API ${r.status}` };
    return { rows: j.rows ?? [] };
  } catch (e) {
    return { rows: [], error: e instanceof Error ? e.message : "GA 오류" };
  }
}

const d = (v?: { value: string }) => v?.value ?? "";
const n = (v?: { value: string }) => Number(v?.value ?? 0) || 0;

export type GaSummary = {
  users: number;
  newUsers: number;
  sessions: number;
  views: number;
  avgSessionSec: number;
  engagementRate: number;
};

const SUMMARY_METRICS = ["activeUsers", "newUsers", "sessions", "screenPageViews", "averageSessionDuration", "engagementRate"];

function toSummary(row?: Row): GaSummary {
  const m = row?.metricValues ?? [];
  return {
    users: n(m[0]),
    newUsers: n(m[1]),
    sessions: n(m[2]),
    views: n(m[3]),
    avgSessionSec: n(m[4]),
    engagementRate: n(m[5]),
  };
}

export type GaDashboard = {
  days: number;
  error: string | null;
  summary: GaSummary;
  previous: GaSummary;
  daily: { date: string; users: number; views: number }[];
  pages: { path: string; title: string; views: number; users: number }[];
  channels: { name: string; sessions: number; users: number }[];
  sources: { name: string; sessions: number }[];
  countries: { name: string; users: number }[];
  cities: { name: string; users: number }[];
  devices: { name: string; users: number }[];
  realtime: { users: number; pages: { name: string; users: number }[]; error: string | null };
};

export async function gaDashboard(days: number): Promise<GaDashboard> {
  const range = { startDate: `${days - 1}daysAgo`, endDate: "today" };
  const prevRange = { startDate: `${days * 2 - 1}daysAgo`, endDate: `${days}daysAgo` };
  const metric = (name: string) => ({ name });
  const desc = (metricName: string) => [{ metric: { metricName }, desc: true }];

  const [sum, prev, daily, pages, channels, sources, countries, cities, devices, rt, rtPages] = await Promise.all([
    call("runReport", { dateRanges: [range], metrics: SUMMARY_METRICS.map(metric) }),
    call("runReport", { dateRanges: [prevRange], metrics: SUMMARY_METRICS.map(metric) }),
    call("runReport", {
      dateRanges: [range],
      dimensions: [{ name: "date" }],
      metrics: [metric("activeUsers"), metric("screenPageViews")],
      orderBys: [{ dimension: { dimensionName: "date" } }],
    }),
    call("runReport", {
      dateRanges: [range],
      dimensions: [{ name: "pagePath" }, { name: "pageTitle" }],
      metrics: [metric("screenPageViews"), metric("activeUsers")],
      orderBys: desc("screenPageViews"),
      limit: 25,
    }),
    call("runReport", {
      dateRanges: [range],
      dimensions: [{ name: "sessionDefaultChannelGroup" }],
      metrics: [metric("sessions"), metric("activeUsers")],
      orderBys: desc("sessions"),
      limit: 10,
    }),
    call("runReport", {
      dateRanges: [range],
      dimensions: [{ name: "sessionSourceMedium" }],
      metrics: [metric("sessions")],
      orderBys: desc("sessions"),
      limit: 12,
    }),
    call("runReport", {
      dateRanges: [range],
      dimensions: [{ name: "country" }],
      metrics: [metric("activeUsers")],
      orderBys: desc("activeUsers"),
      limit: 10,
    }),
    call("runReport", {
      dateRanges: [range],
      dimensions: [{ name: "city" }],
      metrics: [metric("activeUsers")],
      orderBys: desc("activeUsers"),
      limit: 10,
    }),
    call("runReport", {
      dateRanges: [range],
      dimensions: [{ name: "deviceCategory" }],
      metrics: [metric("activeUsers")],
      orderBys: desc("activeUsers"),
    }),
    call("runRealtimeReport", { metrics: [metric("activeUsers")] }),
    call("runRealtimeReport", {
      dimensions: [{ name: "unifiedScreenName" }],
      metrics: [metric("activeUsers")],
      orderBys: desc("activeUsers"),
      limit: 8,
    }),
  ]);

  return {
    days,
    error: sum.error ?? null,
    summary: toSummary(sum.rows[0]),
    previous: toSummary(prev.rows[0]),
    daily: daily.rows.map((r) => ({
      date: d(r.dimensionValues?.[0]),
      users: n(r.metricValues?.[0]),
      views: n(r.metricValues?.[1]),
    })),
    pages: pages.rows.map((r) => ({
      path: d(r.dimensionValues?.[0]),
      title: d(r.dimensionValues?.[1]),
      views: n(r.metricValues?.[0]),
      users: n(r.metricValues?.[1]),
    })),
    channels: channels.rows.map((r) => ({ name: d(r.dimensionValues?.[0]), sessions: n(r.metricValues?.[0]), users: n(r.metricValues?.[1]) })),
    sources: sources.rows.map((r) => ({ name: d(r.dimensionValues?.[0]), sessions: n(r.metricValues?.[0]) })),
    countries: countries.rows.map((r) => ({ name: d(r.dimensionValues?.[0]), users: n(r.metricValues?.[0]) })),
    cities: cities.rows.map((r) => ({ name: d(r.dimensionValues?.[0]), users: n(r.metricValues?.[0]) })),
    devices: devices.rows.map((r) => ({ name: d(r.dimensionValues?.[0]), users: n(r.metricValues?.[0]) })),
    realtime: {
      users: n(rt.rows[0]?.metricValues?.[0]),
      pages: rtPages.rows.map((r) => ({ name: d(r.dimensionValues?.[0]), users: n(r.metricValues?.[0]) })),
      error: rt.error ?? null,
    },
  };
}
