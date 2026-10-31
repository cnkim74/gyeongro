"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Loader2, AlertCircle, ArrowLeft } from "lucide-react";
import YouTubeEmbed from "@/components/YouTubeEmbed";
import { extractYouTube, channelLabel } from "@/lib/youtube";

interface Props {
  boardId: string;
  boardSlug: string;
  postId?: string;
  initialTitle?: string;
  initialContent?: string;
}

export default function PostForm({
  boardId,
  boardSlug,
  postId,
  initialTitle = "",
  initialContent = "",
}: Props) {
  const router = useRouter();
  const [title, setTitle] = useState(initialTitle);
  const isYouTube = boardSlug === "youtube";
  // 유튜브 게시판: 본문 첫 줄의 유튜브 주소를 별도 칸으로 분리해서 편집
  const initialYt = isYouTube ? extractYouTube(initialContent) : null;
  const initialUrl = initialYt
    ? initialContent.split("\n")[0].trim().match(/youtu/) ? initialContent.split("\n")[0].trim() : ""
    : "";
  const [ytUrl, setYtUrl] = useState(initialUrl);
  const [content, setContent] = useState(
    initialUrl ? initialContent.split("\n").slice(1).join("\n").replace(/^\n+/, "") : initialContent
  );
  const ytPreview = isYouTube ? extractYouTube(ytUrl) : null;
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
        body: JSON.stringify({
          title,
          // 유튜브 주소는 본문 첫 줄에 넣어 저장 (목록 썸네일·상세 영상에 사용)
          content: isYouTube && ytUrl.trim() ? `${ytUrl.trim()}\n\n${content.trim()}`.trim() : content,
          board_id: boardId,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "저장 실패");

      router.push(`/board/${boardSlug}/${isEdit ? postId : data.id}`);
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

      {isYouTube && (
        <div className="rounded-2xl border border-red-100 bg-gradient-to-br from-red-50 to-white p-4 space-y-3">
          <label className="text-base font-bold text-gray-900 block">▶ 유튜브 주소</label>
          <input
            type="url"
            value={ytUrl}
            onChange={(e) => setYtUrl(e.target.value)}
            placeholder="영상 또는 채널 주소 (예: https://youtu.be/... 또는 https://www.youtube.com/@내채널)"
            className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-red-400 focus:ring-2 focus:ring-red-100 outline-none text-gray-900 placeholder-gray-400"
          />
          <p className="text-sm text-gray-500">내 여행 영상이나 채널, 도움이 된 여행 정보 영상을 소개해 주세요.</p>
          {ytPreview && ytPreview.videoIds[0] && <YouTubeEmbed id={ytPreview.videoIds[0]} title={title} />}
          {ytPreview && !ytPreview.videoIds[0] && ytPreview.channels[0] && (
            <p className="text-[15px] font-semibold text-red-600">채널: {channelLabel(ytPreview.channels[0])}</p>
          )}
          {ytUrl.trim() && ytPreview && ytPreview.videoIds.length === 0 && ytPreview.channels.length === 0 && (
            <p className="text-sm text-rose-600">유튜브 영상 또는 채널 주소를 넣어 주세요.</p>
          )}
        </div>
      )}

      <div>
        <label className="text-sm font-semibold text-gray-700 mb-2 block">
          {isYouTube ? "소개 (선택)" : "내용"}
        </label>
        <textarea
          value={content}
          onChange={(e) => setContent(e.target.value)}
          placeholder={isYouTube ? "어떤 영상인지, 어디가 좋았는지 짧게 소개해 주세요" : "내용을 입력하세요"}
          required={!isYouTube}
          rows={isYouTube ? 5 : 12}
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
          disabled={
            submitting ||
            !title.trim() ||
            (isYouTube
              ? !ytPreview || (ytPreview.videoIds.length === 0 && ytPreview.channels.length === 0)
              : !content.trim())
          }
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
