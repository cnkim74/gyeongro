"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Loader2, AlertCircle, ArrowLeft } from "lucide-react";

const CATEGORIES = [
  { id: "free", label: "💬 자유" },
  { id: "tip", label: "💡 여행 팁" },
  { id: "question", label: "❓ 질문" },
  { id: "review", label: "⭐ 후기" },
];

interface Props {
  postId?: string;
  initialTitle?: string;
  initialContent?: string;
  initialCategory?: string;
}

export default function PostForm({
  postId,
  initialTitle = "",
  initialContent = "",
  initialCategory = "free",
}: Props) {
  const router = useRouter();
  const [title, setTitle] = useState(initialTitle);
  const [content, setContent] = useState(initialContent);
  const [category, setCategory] = useState(initialCategory);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const isEdit = !!postId;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSubmitting(true);

    try {
      const url = isEdit ? `/api/posts/${postId}` : "/api/posts";
      const method = isEdit ? "PATCH" : "POST";
      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title, content, category }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "저장 실패");

      router.push(`/board/${isEdit ? postId : data.id}`);
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "오류가 발생했어요.");
      setSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      <div>
        <label className="text-sm font-semibold text-gray-700 mb-2 block">
          카테고리
        </label>
        <div className="flex gap-2 flex-wrap">
          {CATEGORIES.map((c) => (
            <button
              key={c.id}
              type="button"
              onClick={() => setCategory(c.id)}
              className={`px-4 py-2 rounded-full text-sm font-medium transition-all ${
                category === c.id
                  ? "bg-blue-500 text-white shadow-md"
                  : "bg-gray-100 text-gray-600 hover:bg-blue-50 hover:text-blue-600"
              }`}
            >
              {c.label}
            </button>
          ))}
        </div>
      </div>

      <div>
        <label className="text-sm font-semibold text-gray-700 mb-2 block">
          제목
        </label>
        <input
          type="text"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="제목을 입력하세요"
          required
          maxLength={200}
          className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-blue-400 focus:ring-2 focus:ring-blue-100 outline-none text-gray-900 placeholder-gray-400"
        />
      </div>

      <div>
        <label className="text-sm font-semibold text-gray-700 mb-2 block">
          내용
        </label>
        <textarea
          value={content}
          onChange={(e) => setContent(e.target.value)}
          placeholder="내용을 입력하세요"
          required
          rows={12}
          className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-blue-400 focus:ring-2 focus:ring-blue-100 outline-none text-gray-900 placeholder-gray-400 resize-y"
        />
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
          className="px-5 py-3 rounded-2xl border border-gray-200 text-gray-700 font-medium hover:bg-gray-50 disabled:opacity-50 flex items-center gap-2"
        >
          <ArrowLeft className="w-4 h-4" />
          취소
        </button>
        <button
          type="submit"
          disabled={submitting || !title.trim() || !content.trim()}
          className="flex-1 py-3 rounded-2xl bg-gradient-to-r from-blue-500 to-indigo-600 text-white font-bold flex items-center justify-center gap-2 hover:shadow-xl hover:shadow-blue-500/25 disabled:opacity-40 disabled:cursor-not-allowed transition-all"
        >
          {submitting ? (
            <Loader2 className="w-5 h-5 animate-spin" />
          ) : isEdit ? (
            "수정 완료"
          ) : (
            "등록"
          )}
        </button>
      </div>
    </form>
  );
}
