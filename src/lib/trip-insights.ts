// 회원 여행 일정 관심사 분석 (관리자) — 서버 전용
//
// 두 가지를 합쳐서 봄
//  - 생성 요청: AI 플래너를 돌린 기록 (ai_runs, action='planner') — 저장 안 한 일정도 관심의 신호
//  - 저장: 회원이 '내 여행'에 저장한 일정 (travel_plans) — 더 강한 관심
// 목적지는 띄어쓰기·'여행' 같은 말을 정리해서 같은 곳끼리 묶음

import { getSupabaseServiceClient } from "./supabase";
import { listAdminIds } from "./admin";
import { themeLabel, PLANNER_STYLES } from "./planner-options";

export type Count = { key: string; label: string; count: number };
export type DestinationStat = {
  key: string;
  label: string;
  requests: number;
  saves: number;
  users: number;
  /** 이 목적지를 다룬 공개 블로그 글 수 */
  blogPosts: number;
};

export type TripInsights = {
  days: number;
  totals: { requests: number; saves: number; users: number; saveRate: number };
  destinations: DestinationStat[];
  themes: Count[];
  styles: Count[];
  lengths: Count[];
  party: Count[];
  budgets: Count[];
  months: Count[];
  /** 여행 출발 월 (날짜를 고른 요청만) */
  travelMonths: Count[];
  weekly: { week: string; requests: number; saves: number }[];
};

const COUNTRY_PREFIX = /^(대한민국|한국|일본|중국|대만|태국|베트남|필리핀|미국|캐나다|프랑스|이탈리아|스페인|영국|독일|호주)\s+(?=\S)/;

export function destinationKey(s: string): string {
  return String(s ?? "")
    .toLowerCase()
    .trim()
    .replace(/\(.*?\)/g, "")
    .replace(COUNTRY_PREFIX, "") // "일본 도쿄" = "도쿄"
    .replace(/\d+\s*박\s*\d+\s*일|당일치기/g, "")
    .replace(/\s*(자유여행|여행|투어|일정)\s*$/g, "")
    .replace(/[\s,·.\-_/]+/g, "")
    .trim();
}

type Run = { user_id: string | null; created_at: string; meta: Record<string, unknown> | null };
type Plan = {
  user_id: string;
  destination: string;
  days: number;
  people: number;
  budget: number;
  travel_style: string | null;
  themes: string[] | null;
  created_at: string;
};

function bump(map: Map<string, Count>, key: string, label: string, n = 1) {
  const c = map.get(key) ?? { key, label, count: 0 };
  c.count += n;
  map.set(key, c);
}

const sorted = (m: Map<string, Count>) => [...m.values()].sort((a, b) => b.count - a.count);

function lengthBucket(nights: number): [string, string] {
  if (nights <= 1) return ["1", "당일·1박"];
  if (nights === 2) return ["2", "2박"];
  if (nights === 3) return ["3", "3박"];
  if (nights <= 5) return ["4-5", "4~5박"];
  if (nights <= 9) return ["6-9", "6~9박"];
  return ["10+", "10박 이상"];
}

function partyBucket(n: number): [string, string] {
  if (n <= 1) return ["1", "혼자"];
  if (n === 2) return ["2", "2명"];
  if (n <= 4) return ["3-4", "3~4명 (가족·친구)"];
  return ["5+", "5명 이상 (단체)"];
}

function budgetBucket(perPerson: number): [string, string] {
  if (perPerson < 500_000) return ["a", "1인 50만 원 미만"];
  if (perPerson < 1_000_000) return ["b", "50~100만 원"];
  if (perPerson < 2_000_000) return ["c", "100~200만 원"];
  if (perPerson < 4_000_000) return ["d", "200~400만 원"];
  return ["e", "400만 원 이상"];
}

function weekStart(iso: string): string {
  const d = new Date(iso);
  const day = (d.getUTCDay() + 6) % 7; // 월요일 시작
  d.setUTCDate(d.getUTCDate() - day);
  return d.toISOString().slice(0, 10);
}

export async function tripInsights(days: number, excludeAdmins: boolean): Promise<TripInsights> {
  const supabase = getSupabaseServiceClient();
  const since = new Date(Date.now() - days * 86400000).toISOString();
  const [runsRes, plansRes, blogRes, admins] = await Promise.all([
    supabase
      .from("ai_runs")
      .select("user_id, created_at, meta")
      .eq("action", "planner")
      .eq("ok", true)
      .gte("created_at", since)
      .order("created_at", { ascending: false })
      .limit(10000),
    supabase
      .from("travel_plans")
      .select("user_id, destination, days, people, budget, travel_style, themes, created_at")
      .gte("created_at", since)
      .order("created_at", { ascending: false })
      .limit(10000),
    supabase.from("blog_posts").select("*").eq("is_published", true).limit(500),
    excludeAdmins ? listAdminIds() : Promise.resolve([] as string[]),
  ]);
  const adminSet = new Set(admins);
  const runs = ((runsRes.data ?? []) as Run[]).filter((r) => !r.user_id || !adminSet.has(r.user_id));
  const plans = ((plansRes.data ?? []) as Plan[]).filter((p) => !adminSet.has(p.user_id));
  const blogs = (blogRes.data ?? []) as { title: string; tags?: string[] | null; focus_keyword?: string | null; category?: string | null }[];
  const blogText = blogs.map((b) => destinationKey([b.title, b.focus_keyword ?? "", b.category ?? "", ...(b.tags ?? [])].join(" ")));

  // 목적지
  const dest = new Map<string, DestinationStat & { labels: Map<string, number>; userSet: Set<string> }>();
  const touch = (raw: string, userId: string | null, kind: "requests" | "saves") => {
    const key = destinationKey(raw);
    if (!key) return;
    const d =
      dest.get(key) ??
      ({ key, label: raw, requests: 0, saves: 0, users: 0, blogPosts: 0, labels: new Map(), userSet: new Set() } as DestinationStat & {
        labels: Map<string, number>;
        userSet: Set<string>;
      });
    d[kind]++;
    const label = String(raw).trim();
    d.labels.set(label, (d.labels.get(label) ?? 0) + 1);
    if (userId) d.userSet.add(userId);
    dest.set(key, d);
  };
  for (const r of runs) touch(String(r.meta?.destination ?? ""), r.user_id, "requests");
  for (const p of plans) touch(p.destination, p.user_id, "saves");
  const destinations: DestinationStat[] = [...dest.values()]
    .map((d) => ({
      key: d.key,
      label: [...d.labels.entries()].sort((a, b) => b[1] - a[1])[0]?.[0] ?? d.label,
      requests: d.requests,
      saves: d.saves,
      users: d.userSet.size,
      blogPosts: blogText.filter((t) => t.includes(d.key)).length,
    }))
    .sort((a, b) => b.users - a.users || b.requests + b.saves * 2 - (a.requests + a.saves * 2));

  // 테마·스타일·일수·인원·예산 — 생성 요청에 정보가 있으면 요청 기준, 없으면(예전 기록) 저장 일정으로 보충
  const themes = new Map<string, Count>();
  const styles = new Map<string, Count>();
  const lengths = new Map<string, Count>();
  const party = new Map<string, Count>();
  const budgets = new Map<string, Count>();
  const travelMonths = new Map<string, Count>();
  const addProfile = (o: { themes?: unknown; style?: unknown; days?: unknown; people?: unknown; budget?: unknown }) => {
    for (const t of Array.isArray(o.themes) ? o.themes : []) bump(themes, String(t), themeLabel(String(t)));
    if (typeof o.style === "string" && o.style) bump(styles, o.style, PLANNER_STYLES[o.style] ?? o.style);
    const nights = Number(o.days);
    if (nights > 0) {
      const [k, l] = lengthBucket(nights);
      bump(lengths, k, l);
    }
    const ppl = Number(o.people);
    if (ppl > 0) {
      const [k, l] = partyBucket(ppl);
      bump(party, k, l);
      const b = Number(o.budget);
      if (b > 0) {
        const [bk, bl] = budgetBucket(b / ppl);
        bump(budgets, bk, bl);
      }
    }
  };
  const richRuns = runs.filter((r) => r.meta && "people" in r.meta);
  for (const r of richRuns) {
    addProfile({ themes: r.meta?.themes, style: r.meta?.style, days: Number(r.meta?.days) - 1, people: r.meta?.people, budget: r.meta?.budget });
    const sd = typeof r.meta?.startDate === "string" ? r.meta.startDate : "";
    if (sd) bump(travelMonths, sd.slice(0, 7), `${Number(sd.slice(5, 7))}월 출발`);
  }
  // 상세 기록이 없는 예전 기간은 저장 일정으로
  const richSince = richRuns.length ? richRuns[richRuns.length - 1].created_at : new Date().toISOString();
  for (const p of plans.filter((p) => p.created_at < richSince)) {
    addProfile({ themes: p.themes, style: p.travel_style, days: p.days, people: p.people, budget: p.budget });
  }

  // 월별 · 주별
  const months = new Map<string, Count>();
  for (const r of runs) bump(months, r.created_at.slice(0, 7), `${r.created_at.slice(0, 4)}.${r.created_at.slice(5, 7)}`);
  const weeklyMap = new Map<string, { week: string; requests: number; saves: number }>();
  for (const r of runs) {
    const w = weekStart(r.created_at);
    const e = weeklyMap.get(w) ?? { week: w, requests: 0, saves: 0 };
    e.requests++;
    weeklyMap.set(w, e);
  }
  for (const p of plans) {
    const w = weekStart(p.created_at);
    const e = weeklyMap.get(w) ?? { week: w, requests: 0, saves: 0 };
    e.saves++;
    weeklyMap.set(w, e);
  }

  const users = new Set<string>([...runs.map((r) => r.user_id ?? "").filter(Boolean), ...plans.map((p) => p.user_id)]);
  return {
    days,
    totals: {
      requests: runs.length,
      saves: plans.length,
      users: users.size,
      saveRate: runs.length ? Math.round((plans.length / runs.length) * 100) : 0,
    },
    destinations,
    themes: sorted(themes),
    styles: sorted(styles),
    lengths: sorted(lengths),
    party: sorted(party),
    budgets: [...budgets.values()].sort((a, b) => a.key.localeCompare(b.key)),
    months: [...months.values()].sort((a, b) => a.key.localeCompare(b.key)),
    travelMonths: [...travelMonths.values()].sort((a, b) => a.key.localeCompare(b.key)),
    weekly: [...weeklyMap.values()].sort((a, b) => a.week.localeCompare(b.week)).slice(-16),
  };
}
