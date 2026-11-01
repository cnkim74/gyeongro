"use client";

// 블로그 글 쓰기·수정 (관리자) — 마크다운 + 버튼 도구 + 미리보기

import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import BlogMarkdown from "@/components/blog/BlogMarkdown";
import BlogCover from "@/components/blog/BlogCover";
import { normalizeSlug, readMinutes, tocOf, type BlogFaq } from "@/lib/blog-utils";
import type { BlogPost } from "@/lib/blog";
import { ArrowLeft, ImagePlus, Loader2, Plus, Trash2, Eye, PenLine } from "lucide-react";

const TEMPLATE = `여행을 준비하다 보면 꼭 한 번은 드는 궁금증이 있어요. 이 글에서는 ○○을(를) 처음 준비하는 분 눈높이로 정리했어요.

## 한 줄로 정리하면

- **핵심 1**: 설명
- **핵심 2**: 설명

## 언제 가면 좋을까?

계절·날씨·축제 시기를 정리해요.

> 💡 팁: 꼭 알아두면 좋은 내용을 이렇게 강조할 수 있어요.

## 추천 일정

| 일차 | 코스 | 포인트 |
| --- | --- | --- |
| Day 1 | 장소 → 장소 | 설명 |
| Day 2 | 장소 → 장소 | 설명 |

## 예산은 얼마나?

항목별 대략적인 비용을 적어요.

## 마무리

정리하는 말. [Pothos AI 플래너](/planner)로 바로 일정을 만들어 보세요.
`;

const TOOLS: { label: string; before: string; after?: string; block?: boolean }[] = [
  { label: "큰 제목", before: "## ", block: true },
  { label: "작은 제목", before: "### ", block: true },
  { label: "굵게", before: "**", after: "**" },
  { label: "목록", before: "- ", block: true },
  { label: "번호 목록", before: "1. ", block: true },
  { label: "팁 박스", before: "> 💡 ", block: true },
  { label: "링크", before: "[", after: "](https://)" },
  { label: "표", before: "| 구분 | 내용 |\n| --- | --- |\n| 항목 | 설명 |\n", block: true },
  { label: "구분선", before: "\n---\n", block: true },
];

async function uploadImage(file: File): Promise<string> {
  const r = await fetch("/api/admin/hero/upload-url", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ contentType: file.type, size: file.size }),
  });
  const j = await r.json();
  if (!r.ok) throw new Error(j.error ?? "업로드를 준비하지 못했어요.");
  const fd = new FormData();
  fd.append("cacheControl", "31536000");
  fd.append("", file);
  const up = await fetch(j.signedUrl, {
    method: "PUT",
    headers: j.apikey ? { apikey: j.apikey, "x-upsert": "false" } : { "x-upsert": "false" },
    body: fd,
  });
  if (!up.ok) throw new Error(`업로드 실패 (${up.status})`);
  return j.publicUrl as string;
}

export default function BlogEditor({ initial }: { initial?: BlogPost }) {
  const router = useRouter();
  const [title, setTitle] = useState(initial?.title ?? "");
  const [slug, setSlug] = useState(initial?.slug ?? "");
  const [category, setCategory] = useState(initial?.category ?? "");
  const [excerpt, setExcerpt] = useState(initial?.excerpt ?? "");
  const [cover, setCover] = useState(initial?.cover_image_url ?? "");
  const [content, setContent] = useState(initial?.content ?? "");
  const [tags, setTags] = useState((initial?.tags ?? []).join(", "));
  const [faq, setFaq] = useState<BlogFaq[]>(initial?.faq ?? []);
  const [published, setPublished] = useState(initial?.is_published ?? false);
  const [tab, setTab] = useState<"write" | "preview">("write");
  const [busy, setBusy] = useState<"" | "save" | "delete" | "cover" | "image">("");
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null);
  const area = useRef<HTMLTextAreaElement>(null);

  const insert = (before: string, after = "", block = false) => {
    const el = area.current;
    if (!el) return setContent((c) => c + before + after);
    const { selectionStart: s, selectionEnd: e } = el;
    const sel = content.slice(s, e);
    const needNl = block && s > 0 && content[s - 1] !== "\n" ? "\n" : "";
    const next = content.slice(0, s) + needNl + before + sel + after + content.slice(e);
    setContent(next);
    requestAnimationFrame(() => {
      el.focus();
      const pos = s + needNl.length + before.length + sel.length;
      el.setSelectionRange(pos, pos);
    });
  };

  const onImage = async (file: File | undefined, target: "cover" | "image") => {
    if (!file) return;
    setBusy(target);
    setMsg(null);
    try {
      const url = await uploadImage(file);
      if (target === "cover") setCover(url);
      else insert(`\n![${file.name.replace(/\.[^.]+$/, "")}](${url})\n`, "", true);
    } catch (e) {
      setMsg({ ok: false, text: e instanceof Error ? e.message : "업로드 실패" });
    } finally {
      setBusy("");
    }
  };

  const save = async (publish: boolean) => {
    setBusy("save");
    setMsg(null);
    try {
      const body = { title, slug, category, excerpt, cover_image_url: cover, content, tags, faq, is_published: publish };
      const r = await fetch(initial ? `/api/admin/blog/${initial.id}` : "/api/admin/blog", {
        method: initial ? "PATCH" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      const j = await r.json();
      if (!r.ok) throw new Error(j.error ?? "저장하지 못했어요.");
      setPublished(publish);
      setSlug(j.post.slug);
      setMsg({ ok: true, text: publish ? "공개했어요! /blog 에서 바로 볼 수 있어요." : "임시저장했어요." });
      if (!initial) router.replace(`/admin/blog/${j.post.id}`);
      else router.refresh();
    } catch (e) {
      setMsg({ ok: false, text: e instanceof Error ? e.message : "저장 실패" });
    } finally {
      setBusy("");
    }
  };

  const remove = async () => {
    if (!initial || !confirm("이 글을 삭제할까요? 되돌릴 수 없어요.")) return;
    setBusy("delete");
    const r = await fetch(`/api/admin/blog/${initial.id}`, { method: "DELETE" });
    if (r.ok) router.push("/admin/blog");
    else {
      setBusy("");
      setMsg({ ok: false, text: "삭제하지 못했어요." });
    }
  };

  const input = "w-full rounded-xl border border-gray-200 px-3.5 py-2.5 text-[15px] focus:outline-none focus:ring-2 focus:ring-blue-500";
  const label = "block text-sm font-bold text-gray-700 mb-1.5";

  return (
    <div className="p-6 sm:p-8 max-w-4xl">
      <Link href="/admin/blog" className="inline-flex items-center gap-1 text-sm text-gray-500 hover:text-gray-800 mb-4">
        <ArrowLeft className="w-4 h-4" /> 블로그 관리
      </Link>
      <h1 className="text-2xl font-bold text-gray-900 mb-6">{initial ? "글 수정" : "새 글 쓰기"}</h1>

      <div className="space-y-5">
        <div>
          <label className={label}>제목</label>
          <input className={input} value={title} onChange={(e) => setTitle(e.target.value)} placeholder="예: 교토 단풍 여행, 언제 가야 제일 예쁠까?" />
        </div>
        <div className="grid sm:grid-cols-2 gap-4">
          <div>
            <label className={label}>주소 (영문)</label>
            <div className="flex items-center gap-1 text-sm text-gray-400">
              <span className="shrink-0">/blog/</span>
              <input
                className={input}
                value={slug}
                onChange={(e) => setSlug(e.target.value)}
                onBlur={() => setSlug(normalizeSlug(slug))}
                placeholder="kyoto-autumn-guide"
              />
            </div>
            <p className="text-xs text-gray-400 mt-1">비워두면 자동으로 만들어요. 영문·숫자·하이픈(-)만.</p>
          </div>
          <div>
            <label className={label}>대표 해시태그</label>
            <input className={input} value={category} onChange={(e) => setCategory(e.target.value)} placeholder="일본여행" />
          </div>
        </div>
        <div>
          <label className={label}>요약 (목록·검색 결과에 보여요)</label>
          <textarea className={`${input} h-20`} value={excerpt} onChange={(e) => setExcerpt(e.target.value)} maxLength={300} />
        </div>

        {/* 커버 */}
        <div>
          <label className={label}>커버 사진 (없으면 제목으로 자동 디자인)</label>
          <div className="grid sm:grid-cols-[240px_1fr] gap-4 items-start">
            <div className="aspect-[16/10] rounded-xl overflow-hidden bg-gray-100">
              <BlogCover title={title || "제목을 입력하세요"} category={category} image={cover || null} />
            </div>
            <div className="space-y-2">
              <label className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl border border-gray-200 text-sm font-semibold cursor-pointer hover:bg-gray-50">
                {busy === "cover" ? <Loader2 className="w-4 h-4 animate-spin" /> : <ImagePlus className="w-4 h-4" />} 사진 올리기
                <input type="file" accept="image/jpeg,image/png,image/webp" hidden onChange={(e) => onImage(e.target.files?.[0], "cover")} />
              </label>
              <input className={input} value={cover} onChange={(e) => setCover(e.target.value)} placeholder="또는 사진 주소 (https://...)" />
              {cover && (
                <button type="button" onClick={() => setCover("")} className="text-sm text-red-500">
                  커버 사진 빼기
                </button>
              )}
            </div>
          </div>
        </div>

        {/* 본문 */}
        <div>
          <div className="flex flex-wrap items-center justify-between gap-2 mb-2">
            <label className="text-sm font-bold text-gray-700">본문</label>
            <div className="flex gap-1 rounded-xl bg-gray-100 p-1">
              <button type="button" onClick={() => setTab("write")} className={`inline-flex items-center gap-1 px-3 py-1.5 rounded-lg text-sm font-semibold ${tab === "write" ? "bg-white shadow-sm" : "text-gray-500"}`}>
                <PenLine className="w-4 h-4" /> 쓰기
              </button>
              <button type="button" onClick={() => setTab("preview")} className={`inline-flex items-center gap-1 px-3 py-1.5 rounded-lg text-sm font-semibold ${tab === "preview" ? "bg-white shadow-sm" : "text-gray-500"}`}>
                <Eye className="w-4 h-4" /> 미리보기
              </button>
            </div>
          </div>

          {tab === "write" ? (
            <>
              <div className="flex flex-wrap gap-1.5 mb-2">
                {TOOLS.map((t) => (
                  <button key={t.label} type="button" onClick={() => insert(t.before, t.after, t.block)} className="px-3 py-1.5 rounded-lg border border-gray-200 bg-white text-xs font-semibold text-gray-700 hover:bg-gray-50">
                    {t.label}
                  </button>
                ))}
                <label className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg border border-gray-200 bg-white text-xs font-semibold text-gray-700 hover:bg-gray-50 cursor-pointer">
                  {busy === "image" ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <ImagePlus className="w-3.5 h-3.5" />} 사진
                  <input type="file" accept="image/jpeg,image/png,image/webp" hidden onChange={(e) => onImage(e.target.files?.[0], "image")} />
                </label>
                <button type="button" onClick={() => insert("\nhttps://www.youtube.com/watch?v=영상ID\n", "", true)} className="px-3 py-1.5 rounded-lg border border-gray-200 bg-white text-xs font-semibold text-gray-700 hover:bg-gray-50">
                  유튜브
                </button>
                {!content.trim() && (
                  <button type="button" onClick={() => setContent(TEMPLATE)} className="px-3 py-1.5 rounded-lg bg-blue-600 text-xs font-bold text-white">
                    글 틀 넣기
                  </button>
                )}
              </div>
              <textarea
                ref={area}
                className={`${input} h-[520px] font-mono text-sm leading-relaxed`}
                value={content}
                onChange={(e) => setContent(e.target.value)}
                placeholder={"## 로 시작하면 큰 제목(목차에 자동 표시)\n- 로 시작하면 목록\n> 💡 로 시작하면 팁 박스\n유튜브 주소만 한 줄에 쓰면 영상 플레이어"}
              />
              <p className="text-xs text-gray-400 mt-1">
                약 {readMinutes(content)}분 분량 · 목차 {tocOf(content).length}개 · 사진은 커서 위치에 들어가요. 사진 설명은 ![설명](주소) 의 [설명] 부분.
              </p>
            </>
          ) : (
            <div className="rounded-2xl border border-gray-200 bg-white p-6 sm:p-8 min-h-[300px]">
              {content.trim() ? <BlogMarkdown content={content} /> : <p className="text-gray-400">본문이 비어 있어요.</p>}
            </div>
          )}
        </div>

        {/* 태그 */}
        <div>
          <label className={label}>태그 (쉼표로 구분)</label>
          <input className={input} value={tags} onChange={(e) => setTags(e.target.value)} placeholder="교토, 단풍, 일본여행" />
        </div>

        {/* FAQ */}
        <div>
          <label className={label}>자주 묻는 질문 (검색 노출에 도움)</label>
          <div className="space-y-3">
            {faq.map((f, i) => (
              <div key={i} className="rounded-xl border border-gray-200 p-3 space-y-2">
                <div className="flex gap-2">
                  <input className={input} value={f.q} placeholder="질문" onChange={(e) => setFaq((p) => p.map((x, j) => (j === i ? { ...x, q: e.target.value } : x)))} />
                  <button type="button" onClick={() => setFaq((p) => p.filter((_, j) => j !== i))} className="shrink-0 p-2 text-gray-400 hover:text-red-500" aria-label="질문 삭제">
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
                <textarea className={`${input} h-20`} value={f.a} placeholder="답변" onChange={(e) => setFaq((p) => p.map((x, j) => (j === i ? { ...x, a: e.target.value } : x)))} />
              </div>
            ))}
            {faq.length < 12 && (
              <button type="button" onClick={() => setFaq((p) => [...p, { q: "", a: "" }])} className="inline-flex items-center gap-1 text-sm font-semibold text-blue-600">
                <Plus className="w-4 h-4" /> 질문 추가
              </button>
            )}
          </div>
        </div>

        {msg && <p className={`text-sm font-semibold ${msg.ok ? "text-emerald-600" : "text-red-600"}`}>{msg.text}</p>}

        <div className="sticky bottom-0 -mx-6 sm:-mx-8 px-6 sm:px-8 py-4 bg-white/95 backdrop-blur border-t border-gray-100 flex flex-wrap items-center gap-2">
          <button type="button" disabled={!!busy || !title.trim()} onClick={() => save(true)} className="inline-flex items-center gap-1.5 px-5 py-2.5 rounded-xl bg-blue-600 text-white text-sm font-bold disabled:opacity-50">
            {busy === "save" && <Loader2 className="w-4 h-4 animate-spin" />} {published ? "저장 (공개 유지)" : "공개하기"}
          </button>
          <button type="button" disabled={!!busy || !title.trim()} onClick={() => save(false)} className="px-5 py-2.5 rounded-xl border border-gray-200 text-sm font-bold text-gray-700 disabled:opacity-50">
            {published ? "비공개로 전환" : "임시저장"}
          </button>
          {initial && (
            <>
              <Link href={`/blog/${slug}`} target="_blank" className="px-4 py-2.5 text-sm font-semibold text-gray-600 hover:text-gray-900">
                글 보기 ↗
              </Link>
              <button type="button" disabled={!!busy} onClick={remove} className="ml-auto px-4 py-2.5 text-sm font-semibold text-red-500">
                삭제
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
