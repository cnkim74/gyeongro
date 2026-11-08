"use client";

// 스토리 쓰기·수정 — 표지·챕터 사진 바로 올리기, 챕터별 유튜브·참고 링크

import { useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, Loader2, AlertCircle, Plus, Trash2, Image as ImageIcon, MapPin, Camera, X, Link2 } from "lucide-react";
import { SquarePlay as Youtube } from "lucide-react";
import { uploadImage } from "@/lib/upload-client";

interface Section {
  title: string;
  image_url: string;
  content: string;
  image_credit?: string;
  image_credit_url?: string;
  videos?: { url: string; title: string }[];
  links?: { label: string; url: string }[];
}

export interface StoryInitial {
  id: string;
  title: string;
  subtitle: string | null;
  destination: string | null;
  cover_image_url: string | null;
  intro: string | null;
  duration_text: string | null;
  tags: string[] | null;
  sections: Section[] | null;
}

const empty = (): Section => ({ title: "", image_url: "", content: "" });

/** 사진 올리기 버튼 + 미리보기 */
function PhotoField({
  value,
  onChange,
  label,
  big = false,
}: {
  value: string;
  onChange: (v: string) => void;
  label: string;
  big?: boolean;
}) {
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState("");
  const [showUrl, setShowUrl] = useState(false);

  const pick = async (file?: File) => {
    if (!file) return;
    setBusy(true);
    setErr("");
    try {
      onChange(await uploadImage(file));
    } catch (e) {
      setErr(e instanceof Error ? e.message : "업로드 실패");
    } finally {
      setBusy(false);
    }
  };

  return (
    <div>
      {value ? (
        <div className={`relative overflow-hidden rounded-xl bg-slate-100 ${big ? "aspect-[16/9]" : "aspect-[16/9] max-w-sm"}`}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={value} alt="" className="w-full h-full object-cover" />
          <div className="absolute right-2 top-2 flex gap-1.5">
            <label className="cursor-pointer px-3 py-1.5 rounded-full bg-black/60 text-white text-xs font-bold backdrop-blur">
              {busy ? "올리는 중…" : "바꾸기"}
              <input type="file" accept="image/*" hidden disabled={busy} onChange={(e) => pick(e.target.files?.[0])} />
            </label>
            <button type="button" onClick={() => onChange("")} className="p-1.5 rounded-full bg-black/60 text-white" aria-label="사진 빼기">
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      ) : (
        <label
          className={`flex flex-col items-center justify-center gap-1.5 rounded-xl border-2 border-dashed border-slate-200 bg-white text-slate-500 cursor-pointer hover:border-blue-300 hover:text-blue-600 transition ${
            big ? "py-10" : "py-6"
          }`}
        >
          {busy ? <Loader2 className="w-6 h-6 animate-spin" /> : <Camera className="w-6 h-6" />}
          <span className="text-sm font-semibold">{busy ? "사진 올리는 중…" : label}</span>
          <span className="text-[11px] text-slate-400">휴대폰 갤러리·카메라에서 바로 (10MB까지, 큰 사진은 자동으로 줄여요)</span>
          <input type="file" accept="image/*" hidden disabled={busy} onChange={(e) => pick(e.target.files?.[0])} />
        </label>
      )}
      {err && <p className="mt-1 text-xs text-red-600">{err}</p>}
      <button type="button" onClick={() => setShowUrl((v) => !v)} className="mt-1 text-[11px] text-slate-400 hover:text-slate-600">
        {showUrl ? "주소 입력 닫기" : "또는 사진 주소(URL)로 넣기"}
      </button>
      {showUrl && (
        <input
          type="url"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder="https://..."
          className="mt-1 w-full px-3 py-2 rounded-lg border border-slate-200 text-slate-900 text-sm font-mono"
        />
      )}
    </div>
  );
}

export default function StoryForm({ initial }: { initial?: StoryInitial }) {
  const router = useRouter();
  const editing = !!initial;
  const [title, setTitle] = useState(initial?.title ?? "");
  const [subtitle, setSubtitle] = useState(initial?.subtitle ?? "");
  const [destination, setDestination] = useState(initial?.destination ?? "");
  const [coverImageUrl, setCoverImageUrl] = useState(initial?.cover_image_url ?? "");
  const [intro, setIntro] = useState(initial?.intro ?? "");
  const [durationText, setDurationText] = useState(initial?.duration_text ?? "");
  const [tags, setTags] = useState((initial?.tags ?? []).join(", "));
  const [sections, setSections] = useState<Section[]>(initial?.sections?.length ? initial.sections : [empty()]);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const patchSection = (idx: number, patch: Partial<Section>) => {
    setSections((prev) => prev.map((s, i) => (i === idx ? { ...s, ...patch } : s)));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSubmitting(true);

    const validSections = sections
      .map((s) => ({
        ...s,
        videos: (s.videos ?? []).filter((v) => v.url.trim()),
        links: (s.links ?? []).filter((l) => l.url.trim()),
      }))
      .filter((s) => s.title.trim() || s.content.trim() || s.image_url || s.videos.length || s.links.length);

    const payload = {
      title,
      subtitle,
      destination,
      cover_image_url: coverImageUrl || null,
      intro,
      sections: validSections,
      tags: tags
        .split(",")
        .map((t) => t.trim())
        .filter(Boolean),
      duration_text: durationText,
    };

    try {
      const res = await fetch(editing ? `/api/stories/${initial!.id}` : "/api/stories", {
        method: editing ? "PATCH" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? (editing ? "수정 실패" : "등록 실패"));
      if (!editing && data.reward > 0) {
        alert(`🎉 첫 글 이벤트 당첨!\n고급 AI 플래너 ${data.reward}회 이용권이 지급됐어요. 일정 만들 때 '고급 AI'를 고르면 사용돼요.`);
      }
      router.push(`/stories/${editing ? initial!.id : data.id}`);
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "오류가 발생했어요.");
      setSubmitting(false);
    }
  };

  const input = "w-full px-4 py-3 rounded-xl border border-slate-200 focus:border-blue-400 focus:ring-2 focus:ring-blue-100 outline-none text-slate-900";

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      <div>
        <label className="text-sm font-semibold text-slate-700 mb-2 block">
          제목 <span className="text-red-500">*</span>
        </label>
        <input type="text" value={title} onChange={(e) => setTitle(e.target.value)} placeholder="당신의 여행 이야기 한 줄로" required maxLength={200} className={input} />
      </div>

      <div>
        <label className="text-sm font-semibold text-slate-700 mb-2 block">부제 (선택)</label>
        <input type="text" value={subtitle} onChange={(e) => setSubtitle(e.target.value)} placeholder="더 짧은 한 줄 소개" className={input} />
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <label className="text-sm font-semibold text-slate-700 mb-2 flex items-center gap-1.5">
            <MapPin className="w-4 h-4 text-blue-500" />
            여행지
          </label>
          <input type="text" value={destination} onChange={(e) => setDestination(e.target.value)} placeholder="예: 제주, 도쿄..." className={input} />
        </div>
        <div>
          <label className="text-sm font-semibold text-slate-700 mb-2 block">여행 기간</label>
          <input type="text" value={durationText} onChange={(e) => setDurationText(e.target.value)} placeholder="예: 3박 4일, 2주 등" className={input} />
        </div>
      </div>

      <div>
        <label className="text-sm font-semibold text-slate-700 mb-2 flex items-center gap-1.5">
          <ImageIcon className="w-4 h-4 text-blue-500" />
          표지 사진
        </label>
        <PhotoField value={coverImageUrl} onChange={setCoverImageUrl} label="표지 사진 올리기" big />
      </div>

      <div>
        <label className="text-sm font-semibold text-slate-700 mb-2 block">서문 (선택)</label>
        <textarea value={intro} onChange={(e) => setIntro(e.target.value)} placeholder="이 여행을 떠난 이유, 처음 마음 등" rows={4} className={`${input} resize-y`} />
      </div>

      <div>
        <label className="text-sm font-semibold text-slate-700 mb-2 block">태그 (쉼표로 구분)</label>
        <input type="text" value={tags} onChange={(e) => setTags(e.target.value)} placeholder="혼자, 미식, 힐링, 도시" className={input} />
      </div>

      {/* 챕터 */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <label className="text-sm font-semibold text-slate-700">스토리 챕터</label>
          <button type="button" onClick={() => setSections((p) => [...p, empty()])} className="inline-flex items-center gap-1 text-sm font-semibold text-blue-600 hover:text-blue-700">
            <Plus className="w-4 h-4" />
            챕터 추가
          </button>
        </div>

        <div className="space-y-4">
          {sections.map((section, idx) => {
            const videos = section.videos ?? [];
            const links = section.links ?? [];
            return (
              <div key={idx} className="bg-slate-50 rounded-2xl p-4 sm:p-5 border border-slate-100 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-slate-500">CHAPTER {idx + 1}</span>
                  {sections.length > 1 && (
                    <button type="button" onClick={() => setSections((p) => p.filter((_, i) => i !== idx))} className="text-slate-400 hover:text-red-500" aria-label="챕터 삭제">
                      <Trash2 className="w-4 h-4" />
                    </button>
                  )}
                </div>

                <input
                  type="text"
                  value={section.title}
                  onChange={(e) => patchSection(idx, { title: e.target.value })}
                  placeholder="챕터 제목"
                  className="w-full px-3 py-2 rounded-lg border border-slate-200 text-slate-900 font-semibold bg-white"
                />
                <PhotoField
                  value={section.image_url}
                  onChange={(v) => patchSection(idx, { image_url: v, ...(v !== section.image_url ? { image_credit: undefined, image_credit_url: undefined } : {}) })}
                  label="챕터 사진 올리기 (선택)"
                />
                <textarea
                  value={section.content}
                  onChange={(e) => patchSection(idx, { content: e.target.value })}
                  placeholder="여기에 이 챕터의 이야기를 자유롭게..."
                  rows={6}
                  className="w-full px-3 py-2 rounded-lg border border-slate-200 text-slate-900 resize-y bg-white"
                />

                {/* 유튜브 */}
                <div className="rounded-xl bg-white border border-slate-200 p-3">
                  <p className="flex items-center gap-1.5 text-xs font-bold text-slate-600 mb-2">
                    <Youtube className="w-4 h-4 text-red-600" /> 유튜브 영상 (선택, 최대 4개)
                  </p>
                  {videos.map((v, vi) => (
                    <div key={vi} className="flex gap-2 mb-2">
                      <input
                        type="url"
                        value={v.url}
                        onChange={(e) => patchSection(idx, { videos: videos.map((x, j) => (j === vi ? { ...x, url: e.target.value } : x)) })}
                        placeholder="https://youtu.be/..."
                        className="flex-1 min-w-0 px-3 py-2 rounded-lg border border-slate-200 text-sm"
                      />
                      <input
                        type="text"
                        value={v.title}
                        onChange={(e) => patchSection(idx, { videos: videos.map((x, j) => (j === vi ? { ...x, title: e.target.value } : x)) })}
                        placeholder="영상 설명 (선택)"
                        className="w-1/3 min-w-0 px-3 py-2 rounded-lg border border-slate-200 text-sm"
                      />
                      <button type="button" onClick={() => patchSection(idx, { videos: videos.filter((_, j) => j !== vi) })} className="shrink-0 p-2 text-slate-400 hover:text-red-500" aria-label="영상 빼기">
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                  ))}
                  {videos.length < 4 && (
                    <button type="button" onClick={() => patchSection(idx, { videos: [...videos, { url: "", title: "" }] })} className="text-xs font-semibold text-red-600">
                      + 영상 추가
                    </button>
                  )}
                </div>

                {/* 참고 링크 */}
                <div className="rounded-xl bg-white border border-slate-200 p-3">
                  <p className="flex items-center gap-1.5 text-xs font-bold text-slate-600 mb-2">
                    <Link2 className="w-4 h-4 text-blue-600" /> 참고 링크 (선택)
                  </p>
                  {links.map((l, li) => (
                    <div key={li} className="flex gap-2 mb-2">
                      <input
                        type="text"
                        value={l.label}
                        onChange={(e) => patchSection(idx, { links: links.map((x, j) => (j === li ? { ...x, label: e.target.value } : x)) })}
                        placeholder="이름 (예: 공식 관광 안내)"
                        className="w-1/3 min-w-0 px-3 py-2 rounded-lg border border-slate-200 text-sm"
                      />
                      <input
                        type="url"
                        value={l.url}
                        onChange={(e) => patchSection(idx, { links: links.map((x, j) => (j === li ? { ...x, url: e.target.value } : x)) })}
                        placeholder="https://..."
                        className="flex-1 min-w-0 px-3 py-2 rounded-lg border border-slate-200 text-sm"
                      />
                      <button type="button" onClick={() => patchSection(idx, { links: links.filter((_, j) => j !== li) })} className="shrink-0 p-2 text-slate-400 hover:text-red-500" aria-label="링크 빼기">
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                  ))}
                  {links.length < 12 && (
                    <button type="button" onClick={() => patchSection(idx, { links: [...links, { label: "", url: "" }] })} className="text-xs font-semibold text-blue-600">
                      + 링크 추가
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {error && (
        <div className="flex items-center gap-2 px-4 py-3 rounded-xl bg-red-50 text-red-700 text-sm">
          <AlertCircle className="w-4 h-4 shrink-0" />
          {error}
        </div>
      )}

      <div className="flex gap-3 pt-2">
        <button
          type="button"
          onClick={() => router.back()}
          disabled={submitting}
          className="px-5 py-3 rounded-2xl border border-slate-200 text-slate-700 font-medium hover:bg-slate-50 disabled:opacity-50 flex items-center gap-2"
        >
          <ArrowLeft className="w-4 h-4" /> 취소
        </button>
        <button
          type="submit"
          disabled={submitting || !title.trim()}
          className="flex-1 py-3 rounded-2xl bg-slate-900 text-white font-bold flex items-center justify-center gap-2 hover:bg-slate-800 disabled:opacity-40 transition-all"
        >
          {submitting ? <Loader2 className="w-5 h-5 animate-spin" /> : editing ? "수정 저장" : "스토리 발행"}
        </button>
      </div>
    </form>
  );
}
