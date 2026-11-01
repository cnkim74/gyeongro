"use client";

// 블로그 관리 대시보드 — 지금 AI로 쓰기 · 자동 작성 설정 · 글 카드(발행/네이버 원고/대표 이미지)

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import BlogCover from "@/components/blog/BlogCover";
import { COVER_STYLES, COVER_STYLE_KEYS, formatBlogDate } from "@/lib/blog-utils";
import type { BlogPost } from "@/lib/blog";
import type { BlogAutoSettings, AutoMode } from "@/lib/blog-auto";
import { AlertCircle, Copy, Check, Loader2, PenSquare, Sparkles, X, ExternalLink, Palette } from "lucide-react";

const WEEK_DAYS: Record<number, string> = {
  1: "월",
  2: "화·금",
  3: "월·수·금",
  4: "월·화·목·토",
  5: "월~금",
  6: "월~토",
  7: "매일",
};

function CopyButton({ text, label = "복사" }: { text: string; label?: string }) {
  const [done, setDone] = useState(false);
  return (
    <button
      type="button"
      onClick={async () => {
        await navigator.clipboard.writeText(text);
        setDone(true);
        setTimeout(() => setDone(false), 1500);
      }}
      className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg bg-slate-900 text-white text-xs font-bold"
    >
      {done ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />} {done ? "복사됨" : label}
    </button>
  );
}

export default function BlogDashboard({
  initialPosts,
  initialSettings,
  tableMissing,
  autoReady,
  cronSecret,
}: {
  initialPosts: BlogPost[];
  initialSettings: BlogAutoSettings;
  tableMissing: boolean;
  autoReady: boolean;
  cronSecret: boolean;
}) {
  const router = useRouter();
  const [posts, setPosts] = useState(initialPosts);
  const [settings, setSettings] = useState(initialSettings);
  const [topicsText, setTopicsText] = useState(initialSettings.topics.join("\n"));
  const [topic, setTopic] = useState("");
  const [publishNow, setPublishNow] = useState(true);
  const [writing, setWriting] = useState(false);
  const [savingSettings, setSavingSettings] = useState(false);
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null);
  const [settingsMsg, setSettingsMsg] = useState<{ ok: boolean; text: string } | null>(null);
  const [naverPost, setNaverPost] = useState<BlogPost | null>(null);
  const [coverPost, setCoverPost] = useState<BlogPost | null>(null);
  const [busyId, setBusyId] = useState<string | null>(null);

  const published = posts.filter((p) => p.is_published).length;
  const naverPending = posts.filter((p) => p.naver_draft && !p.naver_posted).length;
  const views = posts.reduce((s, p) => s + (p.view_count ?? 0), 0);

  const write = async () => {
    setWriting(true);
    setMsg(null);
    try {
      const r = await fetch("/api/admin/blog/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ topic, publish: publishNow }),
      });
      const j = await r.json();
      if (!r.ok) throw new Error(j.error ?? "글을 쓰지 못했어요.");
      setMsg({ ok: true, text: `"${j.title}" ${j.published ? "발행" : "초안 저장"} 완료 (AI 비용 약 ₩${j.costKrw.toLocaleString()})` });
      setTopic("");
      router.refresh(); // 서버에서 새 목록 받아오기
    } catch (e) {
      setMsg({ ok: false, text: e instanceof Error ? e.message : "실패" });
    } finally {
      setWriting(false);
    }
  };

  const saveSettings = async (patch: Partial<BlogAutoSettings> = {}) => {
    const next = { ...settings, ...patch, topics: topicsText.split("\n").map((t) => t.trim()).filter(Boolean) };
    setSettings(next);
    setSavingSettings(true);
    setSettingsMsg(null);
    try {
      const r = await fetch("/api/admin/blog/settings", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(next),
      });
      const j = await r.json();
      if (!r.ok) throw new Error(j.error ?? "저장 실패");
      setSettings(j);
      setSettingsMsg({ ok: true, text: "저장했어요." });
    } catch (e) {
      setSettingsMsg({ ok: false, text: e instanceof Error ? e.message : "저장 실패" });
    } finally {
      setSavingSettings(false);
    }
  };

  const quick = async (p: BlogPost, patch: Record<string, unknown>) => {
    setBusyId(p.id);
    try {
      const r = await fetch(`/api/admin/blog/${p.id}/quick`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(patch),
      });
      const j = await r.json();
      if (!r.ok) throw new Error(j.error ?? "실패");
      setPosts((list) => list.map((x) => (x.id === p.id ? (j.post as BlogPost) : x)));
      return j.post as BlogPost;
    } catch (e) {
      alert(e instanceof Error ? e.message : "실패");
      return null;
    } finally {
      setBusyId(null);
    }
  };

  const remove = async (p: BlogPost) => {
    if (!confirm(`"${p.title}" 글을 삭제할까요? 되돌릴 수 없어요.`)) return;
    setBusyId(p.id);
    const r = await fetch(`/api/admin/blog/${p.id}`, { method: "DELETE" });
    setBusyId(null);
    if (r.ok) setPosts((list) => list.filter((x) => x.id !== p.id));
  };

  // 서버에서 새 목록을 받아오면(router.refresh) 화면 목록 갱신
  const [prevInitial, setPrevInitial] = useState(initialPosts);
  if (initialPosts !== prevInitial) {
    setPrevInitial(initialPosts);
    setPosts(initialPosts);
  }

  const card = "bg-white rounded-3xl border border-gray-100 p-6 sm:p-7";
  const modes: { key: AutoMode; title: string; desc: string }[] = [
    { key: "off", title: "끄기", desc: "자동으로 쓰지 않음" },
    { key: "review", title: "검토 후 발행", desc: "초안으로 저장, 확인 후 발행" },
    { key: "auto", title: "완전 자동", desc: "작성 즉시 홈페이지에 발행" },
  ];

  return (
    <div className="p-5 sm:p-8 max-w-6xl">
      <div className="flex flex-wrap items-end justify-between gap-3 mb-2">
        <h1 className="text-3xl font-extrabold text-gray-900">블로그 관리</h1>
        <Link href="/admin/blog/new" className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl border border-gray-200 bg-white text-sm font-bold text-gray-700">
          <PenSquare className="w-4 h-4" /> 직접 쓰기
        </Link>
      </div>
      <p className="text-[15px] text-gray-500 mb-6">
        AI가 검색 유입용 여행 글을 써서 홈페이지 블로그(/blog)에 올리고, 같은 주제의 네이버 블로그 원고와 스레드 홍보 글도 함께 만들어요.
      </p>

      {(tableMissing || !autoReady) && (
        <div className="mb-6 rounded-2xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900 flex gap-3">
          <AlertCircle className="w-5 h-5 shrink-0" />
          <p>
            {tableMissing ? (
              <>블로그 표가 없어요. <code className="px-1 bg-white rounded">supabase/migration_blog.sql</code> 을 먼저 실행해 주세요.</>
            ) : (
              <>AI 자동 작성용 항목이 아직 없어요. Supabase SQL Editor에서 <code className="px-1 bg-white rounded">supabase/migration_blog_auto.sql</code> 을 한 번 실행해 주세요.</>
            )}
          </p>
        </div>
      )}

      <div className="grid lg:grid-cols-2 gap-5 mb-10">
        {/* 지금 글 쓰기 */}
        <section className={card}>
          <h2 className="text-lg font-extrabold text-gray-900">✍️ 지금 글 쓰기</h2>
          <p className="text-sm text-gray-500 mt-1 mb-4 leading-relaxed">
            주제를 비워 두면 AI가 요즘 여행자들이 많이 검색할 주제를 직접 골라요. 웹 검색으로 사실을 확인하며 쓰고, 무료 사진(출처 표기)도 넣어요. 보통 1~3분 걸려요.
          </p>
          <div className="flex gap-2">
            <input
              className="flex-1 min-w-0 rounded-2xl border border-gray-200 px-4 py-3 text-[15px] focus:outline-none focus:ring-2 focus:ring-blue-500"
              value={topic}
              onChange={(e) => setTopic(e.target.value)}
              placeholder="예: 삿포로 눈축제 2박 3일 / 다낭 우기 여행"
              disabled={writing}
            />
            <button
              type="button"
              onClick={write}
              disabled={writing || tableMissing || !autoReady}
              className="shrink-0 inline-flex items-center gap-1.5 px-5 rounded-2xl bg-slate-900 text-white font-bold disabled:opacity-50"
            >
              {writing ? <Loader2 className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />}
              {writing ? "쓰는 중…" : "AI로 작성"}
            </button>
          </div>
          <label className="mt-3 inline-flex items-center gap-2 text-sm text-gray-600">
            <input type="checkbox" checked={publishNow} onChange={(e) => setPublishNow(e.target.checked)} /> 작성 후 바로 발행 (끄면 초안 저장)
          </label>
          {msg && <p className={`mt-3 text-sm font-semibold ${msg.ok ? "text-emerald-600" : "text-red-600"}`}>{msg.text}</p>}

          <div className="grid grid-cols-3 gap-3 mt-6">
            {[
              ["발행된 글", published],
              ["네이버 올릴 원고", naverPending],
              ["누적 조회", views],
            ].map(([l, v]) => (
              <div key={String(l)} className="rounded-2xl bg-gray-50 py-4 text-center">
                <p className="text-xs font-semibold text-gray-500">{l}</p>
                <p className="text-2xl font-extrabold text-gray-900 mt-1">{Number(v).toLocaleString()}</p>
              </div>
            ))}
          </div>
        </section>

        {/* 자동 작성 */}
        <section className={card}>
          <h2 className="text-lg font-extrabold text-gray-900">📅 자동 작성</h2>
          <p className="text-sm text-gray-500 mt-1 mb-4 leading-relaxed">
            정해진 요일 오전 8시대에 AI가 글을 써요. 네이버 원고·스레드 홍보 글도 함께 만들어져요.
          </p>
          <div className="grid grid-cols-3 gap-2 mb-5">
            {modes.map((m) => (
              <button
                key={m.key}
                type="button"
                onClick={() => saveSettings({ mode: m.key })}
                className={`text-left rounded-2xl border p-3 transition-colors ${
                  settings.mode === m.key ? "bg-slate-900 border-slate-900 text-white" : "bg-white border-gray-200 text-gray-900 hover:bg-gray-50"
                }`}
              >
                <p className="font-bold text-sm">{m.title}</p>
                <p className={`text-[11px] mt-0.5 leading-snug ${settings.mode === m.key ? "text-white/70" : "text-gray-500"}`}>{m.desc}</p>
              </button>
            ))}
          </div>

          <div className="grid sm:grid-cols-[130px_1fr] gap-4">
            <div>
              <label className="block text-sm font-bold text-gray-700 mb-1.5">주당 횟수</label>
              <select
                className="w-full rounded-xl border border-gray-200 px-3 py-2.5 text-[15px]"
                value={settings.perWeek}
                onChange={(e) => setSettings((s) => ({ ...s, perWeek: Number(e.target.value) }))}
              >
                {[1, 2, 3, 4, 5, 6, 7].map((n) => (
                  <option key={n} value={n}>
                    {n}회
                  </option>
                ))}
              </select>
              <p className="text-[11px] text-gray-400 mt-1">{WEEK_DAYS[settings.perWeek]}</p>
            </div>
            <div>
              <label className="block text-sm font-bold text-gray-700 mb-1.5">주제 목록 (한 줄에 하나, 비우면 AI가 선택)</label>
              <textarea
                className="w-full h-28 rounded-xl border border-gray-200 px-3 py-2.5 text-sm"
                value={topicsText}
                onChange={(e) => setTopicsText(e.target.value)}
                placeholder={"오사카 3박 4일 첫 여행 코스\n다낭 우기 여행 괜찮을까\n유럽 기차 패스 vs 구간권"}
              />
            </div>
          </div>

          <div className="mt-4">
            <label className="block text-sm font-bold text-gray-700 mb-1.5">블로그 컨셉 (AI 글쓰기 방향)</label>
            <textarea
              className="w-full h-24 rounded-xl border border-gray-200 px-3 py-2.5 text-sm"
              value={settings.concept}
              onChange={(e) => setSettings((s) => ({ ...s, concept: e.target.value }))}
            />
          </div>

          <div className="mt-4 rounded-2xl bg-gray-50 p-4">
            <p className="text-sm font-bold text-gray-800 mb-2">🎨 대표 이미지 기본 템플릿</p>
            <div className="flex flex-wrap gap-2 mb-3">
              {(["ai", "fixed"] as const).map((m) => (
                <button
                  key={m}
                  type="button"
                  onClick={() => setSettings((s) => ({ ...s, coverMode: m }))}
                  className={`px-3.5 py-2 rounded-full text-sm font-bold ${settings.coverMode === m ? "bg-slate-900 text-white" : "bg-white border border-gray-200 text-gray-700"}`}
                >
                  {m === "ai" ? "AI가 글마다 어울리는 색 선택" : "항상 아래 색 사용"}
                </button>
              ))}
            </div>
            <div className="flex flex-wrap gap-2">
              {COVER_STYLE_KEYS.map((k) => (
                <button
                  key={k}
                  type="button"
                  title={COVER_STYLES[k].label}
                  onClick={() => setSettings((s) => ({ ...s, coverStyle: k }))}
                  className={`w-9 h-9 rounded-full ring-offset-2 ${settings.coverStyle === k ? "ring-2 ring-slate-900" : ""}`}
                  style={{ background: `linear-gradient(135deg, ${COVER_STYLES[k].from}, ${COVER_STYLES[k].to})` }}
                />
              ))}
            </div>
            <label className="mt-3 flex items-center gap-2 text-sm text-gray-600">
              <input type="checkbox" checked={settings.photos} onChange={(e) => setSettings((s) => ({ ...s, photos: e.target.checked }))} />
              무료 사진 자동 넣기 (위키미디어 공용 · 출처 자동 표기 · 키 필요 없음)
            </label>
          </div>

          <div className="mt-4 flex flex-wrap items-center gap-3">
            <button
              type="button"
              onClick={() => saveSettings()}
              disabled={savingSettings}
              className="inline-flex items-center gap-1.5 px-5 py-2.5 rounded-xl bg-blue-600 text-white text-sm font-bold disabled:opacity-50"
            >
              {savingSettings && <Loader2 className="w-4 h-4 animate-spin" />} 설정 저장
            </button>
            {settingsMsg && <span className={`text-sm font-semibold ${settingsMsg.ok ? "text-emerald-600" : "text-red-600"}`}>{settingsMsg.text}</span>}
            {settings.lastRunDate && <span className="text-xs text-gray-400">마지막 자동 작성 {settings.lastRunDate}</span>}
          </div>
          {!cronSecret && settings.mode !== "off" && (
            <p className="mt-3 text-[11px] text-gray-400 leading-relaxed">
              보안 권장: Vercel 환경변수에 <code>CRON_SECRET</code>(아무 긴 문자열)을 추가하면 예약 작성 주소를 Vercel만 호출할 수 있어요. 없어도 하루 1편 이상은 쓰지 않아요.
            </p>
          )}
        </section>
      </div>

      {/* 글 카드 */}
      {posts.length === 0 ? (
        <div className="rounded-3xl border border-dashed border-gray-300 p-12 text-center text-gray-500">아직 글이 없어요. 위에서 AI로 첫 글을 써 보세요!</div>
      ) : (
        <div className="grid md:grid-cols-2 gap-5">
          {posts.map((p) => (
            <article key={p.id} className="bg-white rounded-3xl border border-gray-100 p-5 flex flex-col">
              <div className="flex items-center gap-2 mb-3">
                <span className={`px-2.5 py-1 rounded-full text-xs font-bold ${p.is_published ? "bg-emerald-50 text-emerald-700" : "bg-gray-100 text-gray-500"}`}>
                  {p.is_published ? "발행됨" : "초안"}
                </span>
                {p.naver_draft && (
                  <span className={`px-2.5 py-1 rounded-full text-xs font-bold ${p.naver_posted ? "bg-green-50 text-green-700" : "bg-orange-50 text-orange-600"}`}>
                    {p.naver_posted ? "네이버 완료" : "네이버 대기"}
                  </span>
                )}
                {p.source === "ai" && <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-blue-50 text-blue-600">AI</span>}
                <span className="ml-auto text-xs text-gray-400">
                  {p.is_published ? `발행 ${formatBlogDate(p.published_at)}` : `작성 ${formatBlogDate(p.created_at)}`}
                </span>
              </div>
              <div className="relative aspect-[16/9] rounded-2xl overflow-hidden">
                <BlogCover title={p.title} category={p.category} image={p.cover_image_url} coverStyle={p.cover_style} />
                {autoReady && (
                  <button
                    type="button"
                    onClick={() => setCoverPost(p)}
                    className="absolute right-3 bottom-3 inline-flex items-center gap-1 px-3 py-1.5 rounded-full bg-black/60 text-white text-xs font-bold backdrop-blur"
                  >
                    <Palette className="w-3.5 h-3.5" /> 대표 이미지 편집
                  </button>
                )}
              </div>
              <h3 className="mt-4 text-lg font-extrabold text-gray-900 leading-snug">{p.title}</h3>
              {p.category && <p className="text-sm font-semibold text-blue-600 mt-1">#{p.category}</p>}
              {p.excerpt && <p className="text-sm text-gray-500 mt-2 line-clamp-2">{p.excerpt}</p>}
              <div className="mt-auto pt-4 flex flex-wrap items-center gap-2">
                <Link href={`/blog/${p.slug}`} target="_blank" className="inline-flex items-center gap-1 text-sm font-bold text-blue-600 mr-auto">
                  {p.is_published ? "홈페이지에서 보기" : "미리보기"} <ExternalLink className="w-3.5 h-3.5" />
                </Link>
                <button type="button" onClick={() => remove(p)} disabled={busyId === p.id} className="px-2 py-2 text-sm text-gray-400 hover:text-red-500">
                  삭제
                </button>
                <Link href={`/admin/blog/${p.id}`} className="px-3.5 py-2 rounded-xl bg-gray-100 text-sm font-bold text-gray-700">
                  수정
                </Link>
                {p.naver_draft && (
                  <button type="button" onClick={() => setNaverPost(p)} className="px-3.5 py-2 rounded-xl bg-green-50 text-sm font-bold text-green-700">
                    네이버 원고
                  </button>
                )}
                <button
                  type="button"
                  disabled={busyId === p.id}
                  onClick={() => quick(p, { is_published: !p.is_published })}
                  className={`px-3.5 py-2 rounded-xl text-sm font-bold ${p.is_published ? "bg-slate-900 text-white" : "bg-blue-600 text-white"}`}
                >
                  {busyId === p.id ? "…" : p.is_published ? "발행 취소" : "발행"}
                </button>
              </div>
            </article>
          ))}
        </div>
      )}

      {/* 네이버 원고·스레드 글 */}
      {naverPost && (
        <div className="fixed inset-0 z-50 bg-black/40 flex items-end sm:items-center justify-center p-0 sm:p-6" onClick={() => setNaverPost(null)}>
          <div className="bg-white w-full sm:max-w-2xl max-h-[90vh] overflow-y-auto rounded-t-3xl sm:rounded-3xl p-6" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-start justify-between gap-3 mb-4">
              <div>
                <h3 className="text-lg font-extrabold text-gray-900">네이버 원고 · 스레드 글</h3>
                <p className="text-xs text-gray-500 mt-1">홈페이지 글과 문장이 겹치지 않게 새로 쓴 원고예요. 복사해서 붙여 넣으세요.</p>
              </div>
              <button type="button" onClick={() => setNaverPost(null)} className="p-1 text-gray-400">
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="flex items-center justify-between mb-2">
              <p className="text-sm font-bold text-gray-800">네이버 블로그 제목</p>
              <CopyButton text={naverPost.title} />
            </div>
            <p className="rounded-xl bg-gray-50 px-3 py-2 text-sm mb-4">{naverPost.title}</p>
            <div className="flex items-center justify-between mb-2">
              <p className="text-sm font-bold text-gray-800">네이버 블로그 본문</p>
              <CopyButton text={naverPost.naver_draft ?? ""} />
            </div>
            <pre className="rounded-xl bg-gray-50 px-3 py-3 text-sm whitespace-pre-wrap font-sans max-h-72 overflow-y-auto mb-4">{naverPost.naver_draft}</pre>
            {naverPost.threads_text && (
              <>
                <div className="flex items-center justify-between mb-2">
                  <p className="text-sm font-bold text-gray-800">스레드 홍보 글</p>
                  <CopyButton text={naverPost.threads_text} />
                </div>
                <pre className="rounded-xl bg-gray-50 px-3 py-3 text-sm whitespace-pre-wrap font-sans mb-4">{naverPost.threads_text}</pre>
              </>
            )}
            <div className="flex flex-wrap gap-2">
              <a href="https://blog.naver.com/GoBlogWrite.naver" target="_blank" rel="noopener noreferrer" className="px-4 py-2.5 rounded-xl bg-green-600 text-white text-sm font-bold">
                네이버 블로그 글쓰기 열기
              </a>
              <a href="https://www.threads.net/" target="_blank" rel="noopener noreferrer" className="px-4 py-2.5 rounded-xl bg-black text-white text-sm font-bold">
                스레드 열기
              </a>
              <button
                type="button"
                onClick={async () => {
                  const updated = await quick(naverPost, { naver_posted: !naverPost.naver_posted });
                  if (updated) setNaverPost(updated);
                }}
                className="ml-auto px-4 py-2.5 rounded-xl border border-gray-200 text-sm font-bold text-gray-700"
              >
                {naverPost.naver_posted ? "네이버 대기로 되돌리기" : "네이버에 올렸어요 ✓"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 대표 이미지 편집 */}
      {coverPost && (
        <div className="fixed inset-0 z-50 bg-black/40 flex items-end sm:items-center justify-center p-0 sm:p-6" onClick={() => setCoverPost(null)}>
          <div className="bg-white w-full sm:max-w-lg rounded-t-3xl sm:rounded-3xl p-6" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-extrabold text-gray-900">대표 이미지 편집</h3>
              <button type="button" onClick={() => setCoverPost(null)} className="p-1 text-gray-400">
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="aspect-[16/9] rounded-2xl overflow-hidden mb-4">
              <BlogCover title={coverPost.title} category={coverPost.category} image={coverPost.cover_image_url} coverStyle={coverPost.cover_style} />
            </div>
            <p className="text-sm font-bold text-gray-700 mb-2">템플릿 색</p>
            <div className="flex flex-wrap gap-2 mb-4">
              {COVER_STYLE_KEYS.map((k) => (
                <button
                  key={k}
                  type="button"
                  title={COVER_STYLES[k].label}
                  onClick={async () => {
                    const u = await quick(coverPost, { cover_style: k });
                    if (u) setCoverPost(u);
                  }}
                  className={`w-9 h-9 rounded-full ring-offset-2 ${coverPost.cover_style === k ? "ring-2 ring-slate-900" : ""}`}
                  style={{ background: `linear-gradient(135deg, ${COVER_STYLES[k].from}, ${COVER_STYLES[k].to})` }}
                />
              ))}
              <button
                type="button"
                onClick={async () => {
                  const u = await quick(coverPost, { cover_style: null });
                  if (u) setCoverPost(u);
                }}
                className={`px-3 h-9 rounded-full border text-xs font-bold ${!coverPost.cover_style ? "border-slate-900" : "border-gray-200"} text-gray-700`}
              >
                {coverPost.cover_image_url ? "사진만" : "자동 색"}
              </button>
            </div>
            {coverPost.cover_image_url && (
              <button
                type="button"
                onClick={async () => {
                  const u = await quick(coverPost, { cover_image_url: null });
                  if (u) setCoverPost(u);
                }}
                className="text-sm font-semibold text-red-500"
              >
                사진 빼고 색 템플릿만 쓰기
              </button>
            )}
            <p className="text-xs text-gray-400 mt-3">사진을 바꾸려면 &apos;수정&apos;에서 커버 사진을 올려 주세요.</p>
          </div>
        </div>
      )}
    </div>
  );
}
