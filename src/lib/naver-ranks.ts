// 네이버 순위 직접 기록 (관리자) — 네이버 검색 API 신규 발급이 막혀 자동 확인이 안 되므로
// 관리자가 네이버에서 확인한 순위를 적어 두는 곳. Supabase 비공개 버킷 'private-config/naver-ranks.json'
import { getSupabaseServiceClient } from "./supabase";

const BUCKET = "private-config";
const PATH = "naver-ranks.json";

export type NaverRank = { rank: number | null; keyword: string; at: string };

export async function getNaverRanks(): Promise<Record<string, NaverRank>> {
  try {
    const { data, error } = await getSupabaseServiceClient().storage.from(BUCKET).download(PATH);
    if (error || !data) return {};
    return JSON.parse(await data.text()) as Record<string, NaverRank>;
  } catch {
    return {};
  }
}

/** rank: 1~100 = 순위, 0 = 100위 밖/안 보임, null = 기록 지움 */
export async function setNaverRank(postId: string, rank: number | null, keyword: string): Promise<Record<string, NaverRank>> {
  const supabase = getSupabaseServiceClient();
  const { data: bucket } = await supabase.storage.getBucket(BUCKET);
  if (!bucket) await supabase.storage.createBucket(BUCKET, { public: false });
  const all = await getNaverRanks();
  if (rank === null) delete all[postId];
  else all[postId] = { rank, keyword: keyword.slice(0, 60), at: new Date().toISOString() };
  const { error } = await supabase.storage
    .from(BUCKET)
    .upload(PATH, new Blob([JSON.stringify(all)], { type: "application/json" }), { upsert: true, contentType: "application/json", cacheControl: "0" });
  if (error) throw new Error(error.message);
  return all;
}
