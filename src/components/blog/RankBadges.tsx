"use client";

// 글 목록 순위 뱃지 — G-45 (구글, 서치콘솔 자동) · N-20 (네이버, 직접 기록)
import { useCallback, useEffect, useState } from "react";
import { createPortal } from "react-dom";

type PageRank = { position: number; query: string; impressions: number; clicks: number; isFocus: boolean };
type NaverRank = { rank: number | null; keyword: string; at: string };
export type RankData = { google: Record<string, PageRank> | null; naver: Record<string, NaverRank>; /** 불러온 시각 */ now: number };

/** 목록 화면에서 한 번만 불러오기 */
export function useRanks() {
  const [data, setData] = useState<RankData | null>(null);
  useEffect(() => {
    let alive = true;
    fetch("/api/admin/blog/ranks")
      .then((r) => (r.ok ? r.json() : null))
      .then((j) => alive && j && setData({ ...j, now: Date.now() }))
      .catch(() => {});
    return () => {
      alive = false;
    };
  }, []);
  const saveNaver = useCallback(async (postId: string, rank: number | null, keyword: string) => {
    const r = await fetch("/api/admin/blog/ranks", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ postId, rank, keyword }),
    });
    const j = await r.json();
    if (!r.ok) throw new Error(j.error ?? "저장 실패");
    const now = Date.now();
    setData((d) => (d ? { ...d, naver: j.naver, now } : { google: null, naver: j.naver, now }));
  }, []);
  return { data, saveNaver };
}

function tone(rank: number) {
  if (rank <= 10) return "bg-emerald-600 text-white"; // 1페이지
  if (rank <= 30) return "bg-amber-400 text-amber-950"; // 2~3페이지
  return "bg-gray-200 text-gray-600";
}

function daysAgo(iso: string, now: number) {
  const d = Math.floor((now - new Date(iso).getTime()) / 86400000);
  return d <= 0 ? "오늘" : `${d}일 전`;
}

export default function RankBadges({
  postId,
  slug,
  keyword,
  ranks,
  onSaveNaver,
}: {
  postId: string;
  slug: string;
  /** 네이버에서 검색해 볼 말 (핵심 키워드, 없으면 제목) */
  keyword: string;
  ranks: RankData | null;
  onSaveNaver: (postId: string, rank: number | null, keyword: string) => Promise<void>;
}) {
  const [editing, setEditing] = useState(false);
  const [value, setValue] = useState("");
  const [busy, setBusy] = useState(false);
  const [pos, setPos] = useState<{ top: number; left: number } | null>(null);

  if (!ranks) return <span className="inline-block w-14 h-5 rounded-md bg-gray-100 animate-pulse" aria-hidden />;

  const g = ranks.google?.[slug];
  const n = ranks.naver[postId];
  const gRank = g ? Math.max(1, Math.round(g.position)) : null;
  const nStale = n ? ranks.now - new Date(n.at).getTime() > 14 * 86400000 : false;

  const save = async (rank: number | null) => {
    setBusy(true);
    try {
      await onSaveNaver(postId, rank, keyword);
      setEditing(false);
    } catch (e) {
      alert(e instanceof Error ? e.message : "저장 실패");
    } finally {
      setBusy(false);
    }
  };

  return (
    <span className="inline-flex items-center gap-1">
      {ranks.google === null ? (
        <span title="구글 서치콘솔이 연결되지 않았어요" className="px-1.5 py-0.5 rounded-md text-[11px] font-extrabold bg-gray-100 text-gray-400">
          G ?
        </span>
      ) : gRank ? (
        <span
          title={`구글 '${g!.query}' 평균 ${g!.position}위 · 노출 ${g!.impressions} · 클릭 ${g!.clicks} (최근 28일${g!.isFocus ? ", 핵심 키워드" : ", 노출 가장 많은 검색어"})`}
          className={`px-1.5 py-0.5 rounded-md text-[11px] font-extrabold tabular-nums ${tone(gRank)}`}
        >
          G-{gRank}
        </span>
      ) : (
        <span title="최근 28일 구글 검색 노출 기록이 없어요" className="px-1.5 py-0.5 rounded-md text-[11px] font-extrabold bg-gray-100 text-gray-400">
          G –
        </span>
      )}

      <button
        type="button"
        onClick={(e) => {
          const r = e.currentTarget.getBoundingClientRect();
          setPos({ top: r.bottom + 6, left: Math.max(8, Math.min(r.left, window.innerWidth - 268)) });
          setValue(n?.rank ? String(n.rank) : "");
          setEditing((v) => !v);
        }}
        title={
          n
            ? `네이버 '${n.keyword}' ${n.rank ? `${n.rank}위` : "100위 밖"} · ${daysAgo(n.at, ranks.now)} 직접 확인 (눌러서 수정)`
            : "네이버 순위 — 눌러서 직접 확인·기록"
        }
        className={`px-1.5 py-0.5 rounded-md text-[11px] font-extrabold tabular-nums ${
          !n ? "bg-gray-100 text-gray-400 hover:bg-gray-200" : n.rank ? tone(n.rank) : "bg-gray-200 text-gray-500"
        } ${nStale ? "opacity-50" : ""}`}
      >
        {!n ? "N +" : n.rank ? `N-${n.rank}` : "N ×"}
      </button>

      {editing &&
        pos &&
        createPortal(
          <>
            <div className="fixed inset-0 z-[90]" onClick={() => setEditing(false)} />
            <div style={{ top: pos.top, left: pos.left }} className="fixed z-[91] w-[260px] rounded-2xl bg-white border border-gray-200 shadow-xl p-3 text-left">
              <p className="text-xs font-bold text-gray-800">네이버 순위 기록</p>
              <a
                href={`https://search.naver.com/search.naver?where=web&query=${encodeURIComponent(keyword)}`}
                target="_blank"
                rel="noopener noreferrer"
                className="mt-1.5 block text-xs font-bold text-green-700 hover:underline"
              >
                ① 네이버에서 &lsquo;{keyword.slice(0, 20)}&rsquo; 검색 ↗
              </a>
              <p className="mt-1 text-[11px] text-gray-500">② 우리 글이 몇 번째인지 세어서 적어 주세요 (웹문서 탭 기준)</p>
              <div className="mt-2 flex gap-1.5">
                <input
                  type="number"
                  min={1}
                  max={1000}
                  value={value}
                  onChange={(e) => setValue(e.target.value)}
                  placeholder="예: 7"
                  autoFocus
                  className="w-20 rounded-lg border border-gray-200 px-2 py-1.5 text-sm"
                />
                <button
                  type="button"
                  disabled={busy || !value}
                  onClick={() => save(Number(value))}
                  className="flex-1 rounded-lg bg-gray-900 text-white text-xs font-bold disabled:opacity-40"
                >
                  저장
                </button>
              </div>
              <div className="mt-2 flex gap-3 text-[11px] font-semibold">
                <button type="button" disabled={busy} onClick={() => save(0)} className="text-gray-500 hover:text-gray-800">
                  안 보임(100위 밖)
                </button>
                {n && (
                  <button type="button" disabled={busy} onClick={() => save(null)} className="text-rose-500 hover:text-rose-700">
                    기록 지우기
                  </button>
                )}
              </div>
              {n && <p className="mt-2 text-[11px] text-gray-400">마지막 기록: {daysAgo(n.at, ranks.now)}</p>}
            </div>
          </>,
          document.body
        )}
    </span>
  );
}
