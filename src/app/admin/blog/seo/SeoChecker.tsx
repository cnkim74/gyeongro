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
  focus?: string;
  keyword?: Basic[];
  queries?: { query: string; clicks: number; impressions: number; position: number }[] | null;
};
type Post = { id: string; slug: string; title: string; published_at: string | null; focus_keyword?: string | null };

function Badge({ tone, children }: { tone: "ok" | "no" | "warn" | "gray"; children: React.ReactNode }) {
  const cls = {
    ok: "bg-emerald-50 text-emerald-700",
    no: "bg-rose-50 text-rose-600",
    warn: "bg-amber-50 text-amber-700",
    gray: "bg-gray-100 text-gray-500",
  }[tone];
  return <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold ${cls}`}>{children}</span>;
}

function NaverCell({ r, title }: { r?: Result["naver"]; title: string }) {
  if (r?.status === "no-key") {
    // 네이버 검색 API 없이 — 눌러서 네이버에서 직접 확인
    return (
      <a href={`https://search.naver.com/search.naver?where=web&query=${encodeURIComponent(title)}`} target="_blank" rel="noopener noreferrer">
        <Badge tone="gray">직접 확인 ↗</Badge>
      </a>
    );
  }
  if (!r) return <Badge tone="gray">미점검</Badge>;
  if (r.status === "indexed") return <Badge tone="ok">노출 · {r.rank}위</Badge>;
  if (r.status === "not-found") return <Badge tone="no">아직 안 보임</Badge>;
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
  setup: {
    naverApi: boolean;
    googleConsole: boolean;
    naverVerification: boolean;
    naverHow: string;
    googleVerification: boolean;
    googleHow: string;
  };
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

  // 필수: 검색엔진 등록 / 선택: 점검 화면에서 자동 확인용 API
  const steps: { ok: boolean; label: string; desc: string; href: string; optional?: boolean; copy?: boolean }[] = [
    { ok: true, label: "사이트맵 (/sitemap.xml)", desc: "공개 글·스토리가 자동으로 들어가요 — 구글·네이버에 제출", href: `${site}/sitemap.xml`, copy: true },
    { ok: true, label: "robots.txt", desc: "검색엔진 수집 허용 + 사이트맵 안내", href: `${site}/robots.txt` },
    { ok: true, label: "RSS (/rss.xml)", desc: "새 글 알림용 피드 — 네이버 'RSS 제출'·구글 사이트맵에 제출", href: `${site}/rss.xml`, copy: true },
    {
      ok: setup.naverVerification,
      label: "네이버 서치어드바이저 등록",
      desc: setup.naverVerification ? `소유 확인됨 (${setup.naverHow})` : "서치어드바이저에서 사이트 등록·소유 확인",
      href: "https://searchadvisor.naver.com/console/board",
    },
    {
      ok: setup.googleVerification,
      label: "구글 서치 콘솔 등록",
      desc: setup.googleVerification ? `소유 확인됨 (${setup.googleHow})` : "서치 콘솔에서 도메인 등록·소유 확인",
      href: "https://search.google.com/search-console",
    },
    {
      ok: setup.naverApi,
      optional: true,
      label: "네이버 노출 자동 확인 (선택)",
      desc: setup.naverApi ? "연결됨" : "검색 API 키가 있을 때만 (없으면 글마다 '직접 확인' 버튼으로)",
      href: "https://developers.naver.com/apps/#/register",
    },
    {
      ok: setup.googleConsole,
      optional: true,
      label: "구글 색인 자동 확인 (선택)",
      desc: setup.googleConsole ? "연결됨" : "서비스 계정 → Vercel GOOGLE_SC_CLIENT_EMAIL / GOOGLE_SC_PRIVATE_KEY",
      href: "https://console.cloud.google.com/apis/library/searchconsole.googleapis.com",
    },
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
        <h2 className="font-bold text-gray-900 mb-1">준비 상태</h2>
        <p className="text-xs text-gray-500 mb-3">
          ✅ 완료 · ❌ 해야 할 일 · 점선 = 선택 (안 해도 검색 노출에는 영향 없고, 이 화면에서 결과를 자동으로 보여주는 기능만 꺼져 있어요)
        </p>
        <ul className="grid sm:grid-cols-2 gap-2">
          {steps.map((s) => (
            <li key={s.label} className="flex items-start gap-2 rounded-2xl bg-gray-50 px-3 py-2.5">
              {s.ok ? (
                <CheckCircle2 className="w-5 h-5 text-emerald-500 shrink-0" />
              ) : s.optional ? (
                <span className="w-5 h-5 shrink-0 rounded-full border-2 border-dashed border-gray-300" />
              ) : (
                <XCircle className="w-5 h-5 text-rose-400 shrink-0" />
              )}
              <div className="min-w-0">
                <a href={s.href} target="_blank" rel="noopener noreferrer" className="text-sm font-bold text-gray-900 hover:text-blue-600 inline-flex items-center gap-1">
                  {s.label} <ExternalLink className="w-3 h-3" />
                </a>
                <p className="text-xs text-gray-500">{s.desc}</p>
                {s.copy && <CopyUrl url={s.href} />}
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
                      <p className="text-xs text-gray-400 truncate">
                        {p.focus_keyword ? <span className="font-semibold text-blue-600">🎯 {p.focus_keyword}</span> : <span className="text-amber-600">🎯 핵심 키워드 없음</span>} · /blog/{p.slug}
                      </p>
                    </button>
                    <div className="flex flex-wrap items-center gap-1.5">
                      <span className="text-[11px] text-gray-400">네이버</span>
                      <NaverCell r={r?.naver} title={p.title} />
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
                      {/* 핵심 키워드 점검 */}
                      <div className="rounded-xl bg-white border border-blue-100 p-3">
                        {r.focus ? (
                          <>
                            <div className="flex flex-wrap items-center justify-between gap-2 mb-2">
                              <p className="text-xs font-bold text-blue-700">🎯 핵심 키워드 &lsquo;{r.focus}&rsquo; 점검</p>
                              {(r.keyword ?? []).some((b) => !b.ok) && (
                                <a href={`/admin/blog/${p.id}`} className="text-xs font-bold text-white bg-blue-600 rounded-lg px-2.5 py-1">
                                  수정에서 &lsquo;AI로 키워드 반영&rsquo; →
                                </a>
                              )}
                            </div>
                            <div className="grid sm:grid-cols-2 gap-1.5">
                              {(r.keyword ?? []).map((b) => (
                                <p key={b.label} className="flex items-start gap-1.5 text-xs">
                                  <span className={b.ok ? "text-emerald-600" : "text-rose-500"}>{b.ok ? "✓" : "✗"}</span>
                                  <span>
                                    <b className="text-gray-800">{b.label}</b> <span className="text-gray-500">— {b.tip}</span>
                                  </span>
                                </p>
                              ))}
                            </div>
                          </>
                        ) : (
                          <p className="text-xs text-amber-700">
                            핵심 키워드가 없어요. <a href={`/admin/blog/${p.id}`} className="font-bold underline">수정</a>에서 &lsquo;AI 추천&rsquo;으로 정해 주세요.
                          </p>
                        )}
                      </div>

                      {/* 구글 실제 검색어 */}
                      {r.queries === null || r.queries === undefined ? (
                        <p className="text-xs text-gray-400">구글 서치콘솔 API를 연결하면 이 글이 실제로 노출된 검색어와 순위가 여기 나와요.</p>
                      ) : r.queries.length === 0 ? (
                        <p className="text-xs text-gray-500">아직 구글 검색 노출 기록이 없어요 (색인 후 며칠~몇 주 걸려요).</p>
                      ) : (
                        <div className="rounded-xl bg-white border border-gray-100 p-3">
                          <p className="text-xs font-bold text-gray-700 mb-2">구글에서 실제로 노출된 검색어 (최근 90일)</p>
                          <table className="w-full text-xs">
                            <thead className="text-gray-400">
                              <tr>
                                <th className="text-left font-semibold pb-1">검색어</th>
                                <th className="text-right font-semibold pb-1">노출</th>
                                <th className="text-right font-semibold pb-1">클릭</th>
                                <th className="text-right font-semibold pb-1">평균 순위</th>
                              </tr>
                            </thead>
                            <tbody>
                              {r.queries.map((q) => (
                                <tr key={q.query} className="border-t border-gray-50">
                                  <td className="py-1 text-gray-800">{q.query}</td>
                                  <td className="py-1 text-right tabular-nums">{q.impressions}</td>
                                  <td className="py-1 text-right tabular-nums">{q.clicks}</td>
                                  <td className={`py-1 text-right tabular-nums font-bold ${q.position <= 10 ? "text-emerald-600" : "text-gray-600"}`}>{q.position}위</td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                          <p className="mt-1 text-[11px] text-gray-400">평균 순위 10위 안이면 검색 1페이지예요.</p>
                        </div>
                      )}

                      <div className="flex flex-wrap gap-2">
                        <a href={`https://search.naver.com/search.naver?query=${encodeURIComponent(r.focus || p.title)}`} target="_blank" rel="noopener noreferrer" className="px-3 py-1.5 rounded-lg bg-green-600 text-white text-xs font-bold">
                          네이버에서 &lsquo;{r.focus || "제목"}&rsquo; 검색
                        </a>
                        <a href={`https://www.google.com/search?q=${encodeURIComponent(r.focus || p.title)}`} target="_blank" rel="noopener noreferrer" className="px-3 py-1.5 rounded-lg bg-blue-600 text-white text-xs font-bold">
                          구글에서 &lsquo;{r.focus || "제목"}&rsquo; 검색
                        </a>
                        <a href={`https://www.google.com/search?q=${encodeURIComponent(`site:${r.url}`)}`} target="_blank" rel="noopener noreferrer" className="px-3 py-1.5 rounded-lg border border-gray-200 text-xs font-bold text-gray-700">
                          색인 확인 (site:)
                        </a>
                        <RequestButton
                          url={r.url}
                          label="네이버 웹페이지 수집 요청"
                          open="https://searchadvisor.naver.com/console/board"
                          hint="서치어드바이저에서 pothostravel.com → 요청 → 웹 페이지 수집에 붙여 넣으세요"
                        />
                        <RequestButton
                          url={r.url}
                          label="구글 색인 생성 요청"
                          open={`https://search.google.com/search-console?resource_id=${encodeURIComponent(`sc-domain:${new URL(site).host}`)}`}
                          hint="서치 콘솔 맨 위 'URL 검사' 칸에 붙여 넣고 → 색인 생성 요청을 누르세요"
                        />
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

/** 글 주소를 복사한 뒤 콘솔을 새 탭으로 열기 — 콘솔 안 특정 페이지 주소는 계정·형식에 따라 404가 나서 홈으로 연다 */
function RequestButton({ url, label, open, hint }: { url: string; label: string; open: string; hint: string }) {
  const [copied, setCopied] = useState(false);
  return (
    <span className="inline-flex flex-col">
      <button
        type="button"
        onClick={async () => {
          try {
            await navigator.clipboard.writeText(url);
            setCopied(true);
          } catch {
            // 복사가 막힌 브라우저 — 주소를 아래에 보여줌
            setCopied(true);
          }
          window.open(open, "_blank", "noopener,noreferrer");
        }}
        className="px-3 py-1.5 rounded-lg border border-gray-200 text-xs font-bold text-gray-700 hover:bg-white"
      >
        {label}
      </button>
      {copied && (
        <span className="mt-1 max-w-[260px] text-[11px] leading-snug text-emerald-700">
          ✓ 글 주소를 복사했어요. {hint}
          <br />
          <span className="text-gray-400 break-all select-all">{url}</span>
        </span>
      )}
    </span>
  );
}

/** 주소 복사 버튼 (사이트맵·RSS 제출용) */
function CopyUrl({ url }: { url: string }) {
  const [done, setDone] = useState(false);
  return (
    <div className="mt-1.5 flex items-center gap-1.5">
      <code className="min-w-0 truncate rounded-md bg-white border border-gray-200 px-2 py-1 text-[11px] text-gray-700 select-all">{url}</code>
      <button
        type="button"
        onClick={async () => {
          try {
            await navigator.clipboard.writeText(url);
          } catch {
            // 복사가 막힌 브라우저 — 주소를 직접 선택해서 복사
          }
          setDone(true);
          setTimeout(() => setDone(false), 1500);
        }}
        className="shrink-0 px-2.5 py-1 rounded-md bg-slate-900 text-white text-[11px] font-bold"
      >
        {done ? "복사됨 ✓" : "주소 복사"}
      </button>
    </div>
  );
}

