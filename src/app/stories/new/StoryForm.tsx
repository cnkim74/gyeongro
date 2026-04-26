"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  ArrowLeft,
  Loader2,
  AlertCircle,
  Plus,
  Trash2,
  Image as ImageIcon,
  MapPin,
} from "lucide-react";

interface Section {
  title: string;
  image_url: string;
  content: string;
}

export default function StoryForm() {
  const router = useRouter();
  const [title, setTitle] = useState("");
  const [subtitle, setSubtitle] = useState("");
  const [destination, setDestination] = useState("");
  const [coverImageUrl, setCoverImageUrl] = useState("");
  const [intro, setIntro] = useState("");
  const [durationText, setDurationText] = useState("");
  const [tags, setTags] = useState("");
  const [sections, setSections] = useState<Section[]>([
    { title: "", image_url: "", content: "" },
  ]);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const updateSection = (idx: number, field: keyof Section, value: string) => {
    setSections((prev) =>
      prev.map((s, i) => (i === idx ? { ...s, [field]: value } : s))
    );
  };

  const addSection = () => {
    setSections((prev) => [...prev, { title: "", image_url: "", content: "" }]);
  };

  const removeSection = (idx: number) => {
    setSections((prev) => prev.filter((_, i) => i !== idx));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSubmitting(true);

    const validSections = sections.filter(
      (s) => s.title.trim() || s.content.trim()
    );

    try {
      const res = await fetch("/api/stories", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
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
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "등록 실패");
      router.push(`/stories/${data.id}`);
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "오류가 발생했어요.");
      setSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      <div>
        <label className="text-sm font-semibold text-slate-700 mb-2 block">
          제목 <span className="text-red-500">*</span>
        </label>
        <input
          type="text"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="당신의 여행 이야기 한 줄로"
          required
          maxLength={200}
          className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:border-blue-400 focus:ring-2 focus:ring-blue-100 outline-none text-slate-900"
        />
      </div>

      <div>
        <label className="text-sm font-semibold text-slate-700 mb-2 block">
          부제 (선택)
        </label>
        <input
          type="text"
          value={subtitle}
          onChange={(e) => setSubtitle(e.target.value)}
          placeholder="더 짧은 한 줄 소개"
          className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:border-blue-400 focus:ring-2 focus:ring-blue-100 outline-none text-slate-900"
        />
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <label className="text-sm font-semibold text-slate-700 mb-2 flex items-center gap-1.5">
            <MapPin className="w-4 h-4 text-blue-500" />
            여행지
          </label>
          <input
            type="text"
            value={destination}
            onChange={(e) => setDestination(e.target.value)}
            placeholder="예: 제주, 도쿄..."
            className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:border-blue-400 outline-none text-slate-900"
          />
        </div>
        <div>
          <label className="text-sm font-semibold text-slate-700 mb-2 block">
            여행 기간
          </label>
          <input
            type="text"
            value={durationText}
            onChange={(e) => setDurationText(e.target.value)}
            placeholder="예: 3박 4일, 2주 등"
            className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:border-blue-400 outline-none text-slate-900"
          />
        </div>
      </div>

      <div>
        <label className="text-sm font-semibold text-slate-700 mb-2 flex items-center gap-1.5">
          <ImageIcon className="w-4 h-4 text-blue-500" />
          커버 이미지 URL
        </label>
        <input
          type="url"
          value={coverImageUrl}
          onChange={(e) => setCoverImageUrl(e.target.value)}
          placeholder="https://..."
          className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:border-blue-400 outline-none text-slate-900 font-mono text-sm"
        />
      </div>

      <div>
        <label className="text-sm font-semibold text-slate-700 mb-2 block">
          서문 (선택)
        </label>
        <textarea
          value={intro}
          onChange={(e) => setIntro(e.target.value)}
          placeholder="이 여행을 떠난 이유, 처음 마음 등"
          rows={4}
          className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:border-blue-400 outline-none text-slate-900 resize-y"
        />
      </div>

      <div>
        <label className="text-sm font-semibold text-slate-700 mb-2 block">
          태그 (쉼표로 구분)
        </label>
        <input
          type="text"
          value={tags}
          onChange={(e) => setTags(e.target.value)}
          placeholder="혼자, 미식, 힐링, 도시"
          className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:border-blue-400 outline-none text-slate-900"
        />
      </div>

      {/* Sections (챕터별) */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <label className="text-sm font-semibold text-slate-700">
            스토리 챕터
          </label>
          <button
            type="button"
            onClick={addSection}
            className="inline-flex items-center gap-1 text-sm font-semibold text-blue-600 hover:text-blue-700"
          >
            <Plus className="w-4 h-4" />
            챕터 추가
          </button>
        </div>

        <div className="space-y-4">
          {sections.map((section, idx) => (
            <div
              key={idx}
              className="bg-slate-50 rounded-2xl p-5 border border-slate-100"
            >
              <div className="flex items-center justify-between mb-3">
                <span className="text-xs font-bold text-slate-500">
                  CHAPTER {idx + 1}
                </span>
                {sections.length > 1 && (
                  <button
                    type="button"
                    onClick={() => removeSection(idx)}
                    className="text-slate-400 hover:text-red-500"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                )}
              </div>

              <input
                type="text"
                value={section.title}
                onChange={(e) => updateSection(idx, "title", e.target.value)}
                placeholder="챕터 제목"
                className="w-full px-3 py-2 rounded-lg border border-slate-200 mb-2 text-slate-900 font-semibold"
              />
              <input
                type="url"
                value={section.image_url}
                onChange={(e) => updateSection(idx, "image_url", e.target.value)}
                placeholder="이미지 URL (선택)"
                className="w-full px-3 py-2 rounded-lg border border-slate-200 mb-2 text-slate-900 text-sm font-mono"
              />
              <textarea
                value={section.content}
                onChange={(e) => updateSection(idx, "content", e.target.value)}
                placeholder="여기에 이 챕터의 이야기를 자유롭게..."
                rows={6}
                className="w-full px-3 py-2 rounded-lg border border-slate-200 text-slate-900 resize-y"
              />
            </div>
          ))}
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
          {submitting ? <Loader2 className="w-5 h-5 animate-spin" /> : "스토리 발행"}
        </button>
      </div>
    </form>
  );
}
