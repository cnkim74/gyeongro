"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Send, Loader2, MessageCircle, Trash2 } from "lucide-react";

interface CommentItem {
  id: string;
  content: string;
  created_at: string;
  user_id: string;
  author: { name: string | null; image: string | null };
}

interface Props {
  postId: string;
  comments: CommentItem[];
  currentUserId: string | null;
  isAdmin: boolean;
}

export default function CommentSection({
  postId,
  comments,
  currentUserId,
  isAdmin,
}: Props) {
  const router = useRouter();
  const [content, setContent] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!content.trim()) return;
    setSubmitting(true);
    try {
      const res = await fetch(`/api/posts/${postId}/comments`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ content }),
      });
      if (!res.ok) throw new Error();
      setContent("");
      router.refresh();
    } catch {
      alert("댓글 등록 실패");
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (commentId: string) => {
    if (!confirm("이 댓글을 삭제하시겠어요?")) return;
    setDeletingId(commentId);
    try {
      const res = await fetch(`/api/comments/${commentId}`, { method: "DELETE" });
      if (!res.ok) throw new Error();
      router.refresh();
    } catch {
      alert("삭제 실패");
    } finally {
      setDeletingId(null);
    }
  };

  return (
    <div className="bg-white rounded-3xl border border-gray-100 p-6">
      <h2 className="font-bold text-gray-900 mb-5 flex items-center gap-2">
        <MessageCircle className="w-5 h-5 text-blue-500" />
        댓글 {comments.length}
      </h2>

      {currentUserId ? (
        <form onSubmit={handleSubmit} className="mb-6">
          <textarea
            value={content}
            onChange={(e) => setContent(e.target.value)}
            placeholder="댓글을 입력하세요"
            rows={3}
            className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-blue-400 focus:ring-2 focus:ring-blue-100 outline-none text-gray-900 placeholder-gray-400 resize-none"
          />
          <div className="flex justify-end mt-2">
            <button
              type="submit"
              disabled={submitting || !content.trim()}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-blue-500 text-white text-sm font-semibold hover:bg-blue-600 disabled:opacity-50"
            >
              {submitting ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Send className="w-4 h-4" />
              )}
              등록
            </button>
          </div>
        </form>
      ) : (
        <div className="bg-blue-50 rounded-2xl p-4 mb-6 text-center text-sm text-gray-700">
          댓글을 작성하려면{" "}
          <Link
            href={`/login?callbackUrl=/board/${postId}`}
            className="font-semibold text-blue-600 hover:underline"
          >
            로그인
          </Link>
          이 필요해요
        </div>
      )}

      {comments.length === 0 ? (
        <p className="text-center text-sm text-gray-400 py-8">
          아직 댓글이 없어요. 첫 댓글을 남겨보세요!
        </p>
      ) : (
        <div className="space-y-4">
          {comments.map((c) => {
            const canDelete = currentUserId === c.user_id || isAdmin;
            return (
              <div key={c.id} className="flex gap-3 group">
                {c.author.image ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={c.author.image}
                    alt={c.author.name ?? "익명"}
                    className="w-9 h-9 rounded-full object-cover shrink-0"
                  />
                ) : (
                  <div className="w-9 h-9 rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center text-white text-sm font-bold shrink-0">
                    {(c.author.name ?? "익").charAt(0).toUpperCase()}
                  </div>
                )}
                <div className="flex-1">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-semibold text-gray-900">
                        {c.author.name ?? "익명"}
                      </span>
                      <span className="text-xs text-gray-400">
                        {new Date(c.created_at).toLocaleString("ko-KR")}
                      </span>
                    </div>
                    {canDelete && (
                      <button
                        onClick={() => handleDelete(c.id)}
                        disabled={deletingId === c.id}
                        className="p-1 rounded text-gray-300 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-opacity disabled:opacity-50"
                        aria-label="삭제"
                      >
                        {deletingId === c.id ? (
                          <Loader2 className="w-3.5 h-3.5 animate-spin" />
                        ) : (
                          <Trash2 className="w-3.5 h-3.5" />
                        )}
                      </button>
                    )}
                  </div>
                  <p className="text-sm text-gray-700 mt-1 whitespace-pre-wrap break-words">
                    {c.content}
                  </p>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
