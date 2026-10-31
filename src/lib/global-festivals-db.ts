// 해외 축제 — DB (AI 큐레이션 후 관리자가 게시한 항목) · 서버 전용
// 테이블이 아직 없으면(마이그레이션 전) 빈 목록 → 고정 목록만 표시

import { getSupabaseServiceClient } from "./supabase";
import type { GlobalFestival } from "./global-festivals";

export interface GlobalFestivalRow {
  id: string;
  name: string;
  name_en: string | null;
  country: string;
  flag: string | null;
  city: string;
  destination: string;
  start_date: string | null;
  end_date: string | null;
  months: number[];
  period: string | null;
  summary: string | null;
  emoji: string | null;
  source_url: string | null;
  status: "pending" | "published" | "rejected";
  created_at: string;
}

export function rowToFestival(r: GlobalFestivalRow): GlobalFestival {
  return {
    id: `db-${r.id}`,
    name: r.name,
    nameEn: r.name_en ?? "",
    country: r.country,
    flag: r.flag ?? "🌍",
    city: r.city,
    destination: r.destination,
    months: r.months ?? [],
    period: r.period ?? "",
    summary: r.summary ?? "",
    emoji: r.emoji ?? "🎉",
    startDate: r.start_date,
    endDate: r.end_date,
    sourceUrl: r.source_url,
  };
}

/** 게시된 해외 축제 (지난 축제 제외) */
export async function listPublishedGlobalFestivals(): Promise<GlobalFestival[]> {
  try {
    const supabase = getSupabaseServiceClient();
    const today = new Date(Date.now() + 9 * 3600 * 1000).toISOString().slice(0, 10);
    const { data, error } = await supabase
      .from("global_festivals")
      .select("*")
      .eq("status", "published")
      .or(`end_date.is.null,end_date.gte.${today}`)
      .order("start_date", { ascending: true, nullsFirst: false })
      .limit(500);
    if (error || !data) return [];
    return (data as GlobalFestivalRow[]).map(rowToFestival);
  } catch {
    return [];
  }
}

export async function getPublishedGlobalFestival(id: string): Promise<GlobalFestival | null> {
  const uuid = id.replace(/^db-/, "");
  if (!/^[0-9a-f-]{36}$/i.test(uuid)) return null;
  try {
    const supabase = getSupabaseServiceClient();
    const { data } = await supabase
      .from("global_festivals")
      .select("*")
      .eq("id", uuid)
      .eq("status", "published")
      .maybeSingle();
    return data ? rowToFestival(data as GlobalFestivalRow) : null;
  } catch {
    return null;
  }
}
