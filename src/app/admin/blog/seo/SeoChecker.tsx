"use client";

// 블로그 검색 노출 점검 — 네이버(검색 API) · 구글(Search Console) · 기본 점검 · 수집 요청

import { useState } from "react";
import Link from "next/link";
import { ArrowLeft, CheckCircle2, XCircle, Loader2, ExternalLink, Send, Search } from "lucide-react";

type Basic = { ok: boolean; label: string; tip: string };
type Result = {
  url: string;
  naver: { status: string; rank?: number; message?: string };
  google: { status: string; coverage?: string; lastCrawl?: string | null; message?: string };
  basics: Basic[];
};
type Post = { id: string; slug: string; title: string; published_at: string | null };

function Badge({ tone, children }: { tone: "ok" | "no" | "warn" | "gray"; children: React.ReactNode }) {
  const cls = {
    ok: "bg-emerald-50 text-emerald-700",
    no: "bg-rose-50 text-rose-600",
    warn: "bg-amber-50 text-amber-700",
    gray: "bg-gray-100 text-gray-500",
  }[tone];
  return <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold ${cls}`}>{children}</span>;
}

function NaverCell({ r }: { r?: Result["naver"] }) {
  if (!r) return <Badge tone="gray">미점검</Badge>;
  if (r.status === "indexed") return <Badge tone="ok">노출 · {r.rank}위</Badge>;
  if (r.status === "not-found") return <Badge tone="no">아직 안 보임</Badge>;
  if (r.status === "no-key") return <Badge tone="gray">API 키 필요</Badge>;
  return <Badge tone="warn">오류</Badge>;
}

function GoogleCell({ r }: { r?: Result["google"] }) {
  if (!r) return <Badge tone="gray">미점검</Badge>;
  if (r.status === "indexed") return <Badge tone="ok">색인됨</Badge>;
  if (r.status === "not-indexed") return <Badge tone="no">{r.coverage ?? "색인 안 됨"}</Badge>;
  if (r.status === "no-key") return <Badge tone="gray">서치콘솔 연결 필요</Badge>;
  return <Badge tone="warn">오류</Badge>;
}

export default function SeoChecker({
  posts,
  setup,
  site,
}: {
  posts: Post[];
  setup: { naverApi: boolean; googleConsole: boolean; naverVerification: boolean; googleVerification: boolean };
  site: string;
}) {
  const [results, setResults] = useState<Record<string, Result>>({});
  const [busy, setBusy] = useState<string | null>(null);
  const [open, setOpen] = useState<string | null>(null);
  const [pingMsg, setPingMsg] = useState<string | null>(null);

  const check = async (p: Post) => {
    setBusy(p.id);
    try {
      const r = await fetch(`/api/admin/blog/seo?id=${p.id}`);
      const j = await r.json();
      if (r.ok) setResults((m) => ({ ...m, [p.id]: j }));
    } finally {
      setBusy(null);
    }
  };

  const checkAll = async () => {
    for (const p of posts) {
      await check(p);
    }
  };

  const ping = async () => {
    setBusy("ping");
    setPingMsg(null);
    try {
      const r = await fetch("/api/admin/blog/seo", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "indexnow" }),
      });
      const j = await r.json();
      if (!r.ok) throw new Error(j.error ?? "실패");
      setPingMsg(
        `공개 글 ${j.count}개 수집 요청 — ` +
          (j.results as { engine: string; ok: boolean; status: number }[]).map((x) => `${x.engine} ${x.ok ? "접수" : `실패(${x.status})`}`).join(" · ")
      );
    } catch (e) {
      setPingMsg(e instanceof Error ? e.message : "실패");
    } finally {
      setBusy(null);
    }
  };

  const steps = [
    { ok: true, label: "사이트맵 (/sitemap.xml)", desc: "공개 글이 자동으로 들어가요", href: `${site}/sitemap.xml` },
    { ok: true, label: "robots.txt", desc: "검색엔진 수집 허용 + 사이트맵 안내", href: `${site}/robots.txt` },
    { ok: setup.naverVerification, label: "네이버 서치어드바이저 소유 확인", desc: "Vercel 환경변수 NAVER_SITE_VERIFICATION", href: "https://searchadvisor.naver.com/console/board" },
    { ok: setup.googleVerification, label: "구글 서치 콘솔 소유 확인", desc: "Vercel 환경변수 GOOGLE_SITE_VERIFICATION (도메인 DNS 인증이면 불필요)", href: "https://search.google.com/search-console" },
    { ok: setup.naverApi, label: "네이버 검색 API (노출 확인용)", desc: "NAVER_SEARCH_CLIENT_ID / SECRET", href: "https://developers.naver.com/apps/#/register" },
    { ok: setup.googleConsole, label: "구글 서치콘솔 API (색인 확인용)", desc: "GOOGLE_SC_CLIENT_EMAIL / GOOGLE_SC_PRIVATE_KEY", href: "https://console.cloud.google.com/apis/library/searchconsole.googleapis.com" },
  ];

  return (
    <div className="p-5 sm:p-8 max-w-5xl">
      <Link href="/admin/blog" className="inline-flex items-center gap-1 text-sm text-gray-500 hover:text-gray-800 mb-4">
        <ArrowLeft className="w-4 h-4" /> 블로그 관리
      </Link>
      <h1 className="text-2xl font-extrabold text-gray-900">🔎 검색 노출 점검</h1>
      <p className="text-[15px] text-gray-500 mt-1 mb-6">공개한 블로그 글이 네이버·구글 검색에 잡히는지 확인하고, 새 글 수집을 요청해요.</p>

      {/* 준비 상태 */}
      <section className="bg-white rounded-3xl border border-gray-100 p-5 sm:p-6 mb-6">
        <h2 className="font-bold text-gray-900 mb-3">준비 상태</h2>
        <ul className="grid sm:grid-cols-2 gap-2">
          {steps.map((s) => (
            <li key={s.label} className="flex items-start gap-2 rounded-2xl bg-gray-50 px-3 py-2.5">
              {s.ok ? <CheckCircle2 className="w-5 h-5 text-emerald-500 shrink-0" /> : <XCircle className="w-5 h-5 text-gray-300 shrink-0" />}
              <div className="min-w-0">
                <a href={s.href} target="_blank" rel="noopener noreferrer" className="text-sm font-bold text-gray-900 hover:text-blue-600 inline-flex items-center gap-1">
                  {s.label} <ExternalLink className="w-3 h-3" />
                </a>
                <p className="text-xs text-gray-500">{s.desc}</p>
              </div>
            </li>
          ))}
        </ul>
        <div className="mt-4 flex flex-wrap items-center gap-2">
          <button type="button" onClick={ping} disabled={busy === "ping"} className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-green-600 text-white text-sm font-bold disabled:opacity-50">
            {busy === "ping" ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />} 네이버·Bing에 수집 요청 (IndexNow)
          </button>
          <span className="text-xs text-gray-500">글을 발행·수정하면 자동으로도 요청해요. 구글은 IndexNow를 받지 않아서 사이트맵으로 수집해요.</span>
        </div>
        {pingMsg && <p className="mt-2 text-sm font-semibold text-gray-700">{pingMsg}</p>}
      </section>

      {/* 글별 점검 */}
      <section className="bg-white rounded-3xl border border-gray-100 p-5 sm:p-6">
        <div className="flex flex-wrap items-center justify-between gap-2 mb-4">
          <h2 className="font-bold text-gray-900">공개 글 {posts.length}개</h2>
          <button type="button" onClick={checkAll} disabled={!!busy || posts.length === 0} className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-slate-900 text-white text-sm font-bold disabled:opacity-50">
            <Search className="w-4 h-4" /> 전체 점검
          </button>
        </div>
        {posts.length === 0 ? (
          <p className="text-sm text-gray-500 py-6 text-center">공개된 글이 없어요.</p>
        ) : (
          <div className="divide-y divide-gray-100">
            {posts.map((p) => {
              const r = results[p.id];
              const basicsOk = r ? r.basics.filter((b) => b.ok).length : 0;
              return (
                <div key={p.id} className="py-3">
                  <div className="flex flex-wrap items-center gap-2">
                    <button type="button" onClick={() => setOpen(open === p.id ? null : p.id)} className="min-w-0 flex-1 text-left">
                      <p className="font-semibold text-gray-900 truncate">{p.title}</p>
                      <p className="text-xs text-gray-400 truncate">/blog/{p.slug}</p>
                    </button>
                    <div className="flex flex-wrap items-center gap-1.5">
                      <span className="text-[11px] text-gray-400">네이버</span>
                      <NaverCell r={r?.naver} />
                      <span className="text-[11px] text-gray-400 ml-1">구글</span>
                      <GoogleCell r={r?.google} />
                      {r && <Badge tone={basicsOk >= r.basics.length - 1 ? "ok" : "warn"}>기본 {basicsOk}/{r.basics.length}</Badge>}
                      <button type="button" onClick={() => check(p)} disabled={!!busy} className="ml-1 px-3 py-1.5 rounded-lg border border-gray-200 text-xs font-bold text-gray-700 disabled:opacity-50">
                        {busy === p.id ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : "점검"}
                      </button>
                    </div>
                  </div>
                  {r && open === p.id && (
                    <div className="mt-3 rounded-2xl bg-gray-50 p-4 text-sm space-y-3">
                      <div className="grid sm:grid-cols-2 gap-2">
                        {r.basics.map((b) => (
                          <p key={b.label} className="flex items-start gap-1.5">
                            {b.ok ? <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" /> : <XCircle className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />}
                            <span>
                              <b className="text-gray-800">{b.label}</b> <span className="text-gray-500">— {b.tip}</span>
                            </span>
                          </p>
                        ))}
                      </div>
                      {r.google.lastCrawl && <p className="text-xs text-gray-500">구글 마지막 수집: {new Date(r.google.lastCrawl).toLocaleString("ko-KR")}</p>}
                      {(r.naver.message || r.google.message) && (
                        <p className="text-xs text-gray-500">
                          {r.naver.message && `네이버: ${r.naver.message} `}
                          {r.google.message && `구글: ${r.google.message}`}
                        </p>
                      )}
                      <div className="flex flex-wrap gap-2">
                        <a href={`https://search.naver.com/search.naver?query=${encodeURIComponent(p.title)}`} target="_blank" rel="noopener noreferrer" className="px-3 py-1.5 rounded-lg bg-green-600 text-white text-xs font-bold">
                          네이버에서 직접 검색
                        </a>
                        <a href={`https://www.google.com/search?q=${encodeURIComponent(`site:${r.url}`)}`} target="_blank" rel="noopener noreferrer" className="px-3 py-1.5 rounded-lg bg-blue-600 text-white text-xs font-bold">
                          구글 site: 검색
                        </a>
                        <a href="https://searchadvisor.naver.com/console/board" target="_blank" rel="noopener noreferrer" className="px-3 py-1.5 rounded-lg border border-gray-200 text-xs font-bold text-gray-700">
                          네이버 웹페이지 수집 요청
                        </a>
                        <a href={`https://search.google.com/search-console/inspect?resource_id=${encodeURIComponent(`sc-domain:${new URL(site).host}`)}&id=${encodeURIComponent(r.url)}`} target="_blank" rel="noopener noreferrer" className="px-3 py-1.5 rounded-lg border border-gray-200 text-xs font-bold text-gray-700">
                          구글 색인 생성 요청
                        </a>
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
        <p className="mt-4 text-[11px] text-gray-400 leading-relaxed">
          새 글은 보통 네이버 며칠~2주, 구글 며칠~몇 주 뒤에 검색에 잡혀요. 네이버 노출 확인은 글 제목으로 네이버 웹문서 검색 상위 30개 안에 우리 글이 있는지 봐요.
        </p>
      </section>
    </div>
  );
}
