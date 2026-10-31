"use client";

// 해외 축제 AI 큐레이션 — 나라·연·월로 웹 검색 후보 생성 → 출처 확인 후 게시/거절
import { useState } from "react";
import { useRouter } from "next/navigation";
import { Loader2, Search, ExternalLink, Check, X, Trash2 } from "lucide-react";
import type { GlobalFestivalRow } from "@/lib/global-festivals-db";

const COUNTRIES = [
  "일본", "중국", "대만", "홍콩", "태국", "베트남", "필리핀", "인도네시아", "싱가포르", "말레이시아",
  "인도", "미국", "캐나다", "멕시코", "브라질", "영국", "프랑스", "독일", "스페인", "이탈리아",
  "포르투갈", "네덜란드", "오스트리아", "스위스", "체코", "호주", "뉴질랜드", "아랍에미리트", "튀르키예",
];

const STATUS: Record<GlobalFestivalRow["status"], { label: string; cls: string }> = {
  pending: { label: "검수 대기", cls: "bg-amber-100 text-amber-800" },
  published: { label: "게시됨", cls: "bg-emerald-100 text-emerald-800" },
  rejected: { label: "거절", cls: "bg-gray-100 text-gray-500" },
};

export default function GlobalFestivalManager({
  initial,
  tableMissing,
}: {
  initial: GlobalFestivalRow[];
  tableMissing: boolean;
}) {
  const router = useRouter();
  const now = new Date();
  const [country, setCountry] = useState("일본");
  const [year, setYear] = useState(now.getFullYear());
  const [month, setMonth] = useState(now.getMonth() + 2 > 12 ? 1 : now.getMonth() + 2);
  const [count, setCount] = useState(6);
  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null);
  const [filter, setFilter] = useState<"pending" | "published" | "rejected" | "all">("pending");
  const [busy, setBusy] = useState<string | null>(null);

  const curate = async () => {
    setLoading(true);
    setMsg(null);
    try {
      const r = await fetch("/api/admin/global-festivals/curate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ country, year, month, count }),
      });
      const j = await r.json();
      if (!r.ok) throw new Error(j.error ?? "실패");
      setMsg({
        ok: true,
        text: j.inserted > 0 ? `후보 ${j.inserted}개를 찾았어요${j.skipped ? ` (이미 있는 ${j.skipped}개 제외)` : ""}. 출처를 확인하고 게시해 주세요.` : j.note ?? "새 후보가 없어요.",
      });
      setFilter("pending");
      router.refresh();
    } catch (e) {
      setMsg({ ok: false, text: e instanceof Error ? e.message : "실패" });
    } finally {
      setLoading(false);
    }
  };

  const act = async (id: string, action: "published" | "rejected" | "delete") => {
    setBusy(id);
    try {
      const r =
        action === "delete"
          ? await fetch(`/api/admin/global-festivals/${id}`, { method: "DELETE" })
          : await fetch(`/api/admin/global-festivals/${id}`, {
              method: "PATCH",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ status: action }),
            });
      if (!r.ok) throw new Error((await r.json()).error ?? "실패");
      router.refresh();
    } catch (e) {
      alert(e instanceof Error ? e.message : "실패");
    } finally {
      setBusy(null);
    }
  };

  const rows = initial.filter((r) => filter === "all" || r.status === filter);
  const sel = "px-3 py-3 rounded-xl border border-gray-200 bg-white text-base";

  return (
    <div className="p-5 sm:p-8 max-w-5xl">
      <h1 className="text-2xl font-bold text-gray-900">해외 축제 큐레이션</h1>
      <p className="text-[15px] text-gray-500 mt-1 mb-6">
        AI가 웹 검색으로 실제 개최일과 출처를 찾아 후보를 만들어요. 출처를 확인한 뒤 게시하면 축제 페이지 &lsquo;세계 대표 축제&rsquo;에 나와요.
      </p>

      {tableMissing && (
        <div className="mb-6 rounded-2xl bg-amber-50 border border-amber-200 p-4 text-[15px] text-amber-900">
          먼저 Supabase SQL Editor 에서 <code>supabase/migration_global_festivals.sql</code> 을 실행해 주세요.
        </div>
      )}

      <div className="rounded-3xl border border-gray-100 bg-white shadow-sm p-5 mb-6">
        <div className="flex flex-wrap gap-2 items-end">
          <label className="text-sm font-semibold text-gray-600">
            나라
            <select className={`${sel} block mt-1`} value={country} onChange={(e) => setCountry(e.target.value)}>
              {COUNTRIES.map((c) => (
                <option key={c}>{c}</option>
              ))}
            </select>
          </label>
          <label className="text-sm font-semibold text-gray-600">
            연도
            <select className={`${sel} block mt-1`} value={year} onChange={(e) => setYear(Number(e.target.value))}>
              {[now.getFullYear(), now.getFullYear() + 1].map((y) => (
                <option key={y} value={y}>{y}년</option>
              ))}
            </select>
          </label>
          <label className="text-sm font-semibold text-gray-600">
            월
            <select className={`${sel} block mt-1`} value={month} onChange={(e) => setMonth(Number(e.target.value))}>
              {Array.from({ length: 12 }, (_, i) => i + 1).map((m) => (
                <option key={m} value={m}>{m}월</option>
              ))}
            </select>
          </label>
          <label className="text-sm font-semibold text-gray-600">
            개수
            <select className={`${sel} block mt-1`} value={count} onChange={(e) => setCount(Number(e.target.value))}>
              {[3, 6, 10].map((n) => (
                <option key={n} value={n}>{n}개</option>
              ))}
            </select>
          </label>
          <button
            onClick={curate}
            disabled={loading || tableMissing}
            className="inline-flex items-center gap-2 px-5 py-3 rounded-xl bg-blue-600 text-white text-base font-bold disabled:opacity-50"
          >
            {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : <Search className="w-5 h-5" />}
            {loading ? "웹에서 찾는 중… (1~2분)" : "AI로 축제 찾기"}
          </button>
        </div>
        {msg && <p className={`mt-3 text-[15px] font-semibold ${msg.ok ? "text-emerald-600" : "text-rose-600"}`}>{msg.text}</p>}
        <p className="mt-3 text-sm text-gray-400">웹 검색을 쓰므로 1회 실행에 수십~수백 원의 AI 사용료가 들어요.</p>
      </div>

      <div className="flex gap-2 mb-4">
        {(["pending", "published", "rejected", "all"] as const).map((f) => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={`px-4 py-2 rounded-full text-sm font-semibold ${filter === f ? "bg-slate-900 text-white" : "bg-white border border-gray-200 text-gray-600"}`}
          >
            {f === "all" ? "전체" : STATUS[f].label} ({f === "all" ? initial.length : initial.filter((r) => r.status === f).length})
          </button>
        ))}
      </div>

      {rows.length === 0 ? (
        <p className="text-[15px] text-gray-500 bg-white rounded-2xl p-8 text-center">항목이 없어요.</p>
      ) : (
        <ul className="space-y-3">
          {rows.map((r) => (
            <li key={r.id} className="rounded-2xl border border-gray-100 bg-white p-4">
              <div className="flex flex-wrap items-start gap-3">
                <span className="text-3xl">{r.emoji ?? "🎉"}</span>
                <div className="flex-1 min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <p className="text-base font-bold text-gray-900">{r.name}</p>
                    <span className={`px-2 py-0.5 rounded-full text-xs font-bold ${STATUS[r.status].cls}`}>{STATUS[r.status].label}</span>
                  </div>
                  <p className="text-sm text-gray-500">
                    {r.flag} {r.country} · {r.city} → 플래너 목적지 {r.destination} · {r.name_en}
                  </p>
                  <p className="text-[15px] font-semibold text-rose-600 mt-1">
                    {r.start_date}
                    {r.end_date && r.end_date !== r.start_date ? ` ~ ${r.end_date}` : ""} {r.period ? `(${r.period})` : ""}
                  </p>
                  {r.summary && <p className="text-[15px] text-gray-700 mt-1">{r.summary}</p>}
                  {r.source_url && (
                    <a href={r.source_url} target="_blank" rel="noopener noreferrer" className="mt-1 inline-flex items-center gap-1 text-sm font-semibold text-blue-600 break-all">
                      출처 확인 <ExternalLink className="w-3.5 h-3.5" />
                    </a>
                  )}
                </div>
                <div className="flex gap-1.5">
                  {r.status !== "published" && (
                    <button onClick={() => act(r.id, "published")} disabled={busy === r.id} className="inline-flex items-center gap-1 px-3 py-2 rounded-xl bg-emerald-600 text-white text-sm font-bold disabled:opacity-50">
                      <Check className="w-4 h-4" /> 게시
                    </button>
                  )}
                  {r.status !== "rejected" && (
                    <button onClick={() => act(r.id, "rejected")} disabled={busy === r.id} className="inline-flex items-center gap-1 px-3 py-2 rounded-xl border border-gray-200 text-sm font-semibold text-gray-600 disabled:opacity-50">
                      <X className="w-4 h-4" /> 거절
                    </button>
                  )}
                  <button onClick={() => confirm("삭제할까요?") && act(r.id, "delete")} disabled={busy === r.id} className="px-2 py-2 rounded-xl text-gray-400 hover:text-rose-600" aria-label="삭제">
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
