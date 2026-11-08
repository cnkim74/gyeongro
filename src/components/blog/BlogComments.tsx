"use client";

// 블로그 댓글 — 공개 / 🔒 비밀 댓글, 답글 1단계, 답글 알림 켜기
import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Loader2, Lock, MessageCircle, CornerDownRight, Trash2 } from "lucide-react";
import PushToggle from "@/components/PushToggle";
import type { BlogCommentView } from "@/lib/blog-comments";

function timeAgo(iso: string) {
  const d = (Date.now() - new Date(iso).getTime()) / 1000;
  if (d < 60) return "방금";
  if (d < 3600) return `${Math.floor(d / 60)}분 전`;
  if (d < 86400) return `${Math.floor(d / 3600)}시간 전`;
  if (d < 86400 * 7) return `${Math.floor(d / 86400)}일 전`;
  return new Date(iso).toLocaleDateString("ko-KR", { year: "numeric", month: "short", day: "numeric" });
}

function Composer({
  postId,
  parentId,
  forcePrivate,
  placeholder,
  onDone,
  autoFocus,
}: {
  postId: string;
  parentId?: string;
  forcePrivate?: boolean;
  placeholder: string;
  onDone: () => void;
  autoFocus?: boolean;
}) {
  const router = useRouter();
  const [text, setText] = useState("");
  const [priv, setPriv] = useState(false);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!text.trim()) return;
    setBusy(true);
    setErr(null);
    try {
      const r = await fetch("/api/blog/comments", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ postId, parentId: parentId ?? null, content: text, isPrivate: forcePrivate || priv }),
      });
      const j = await r.json();
      if (!r.ok) throw new Error(j.error ?? "등록 실패");
      setText("");
      setPriv(false);
      onDone();
      router.refresh();
    } catch (e) {
      setErr(e instanceof Error ? e.message : "등록 실패");
    } finally {
      setBusy(false);
    }
  };

  return (
    <form onSubmit={submit}>
      <textarea
        value={text}
        onChange={(e) => setText(e.target.value)}
        placeholder={placeholder}
        rows={parentId ? 2 : 3}
        maxLength={2000}
        autoFocus={autoFocus}
        className="w-full rounded-2xl border border-slate-200 px-4 py-3 text-[15px] leading-relaxed focus:outline-none focus:border-blue-400 resize-y"
      />
      <div className="mt-2 flex flex-wrap items-center justify-between gap-2">
        {forcePrivate ? (
          <span className="inline-flex items-center gap-1 text-xs text-slate-500">
            <Lock className="w-3.5 h-3.5" /> 비밀 댓글의 답글은 자동으로 비밀이에요
          </span>
        ) : (
          <label className="inline-flex items-center gap-1.5 text-sm text-slate-600 cursor-pointer select-none">
            <input type="checkbox" checked={priv} onChange={(e) => setPriv(e.target.checked)} className="w-4 h-4 accent-blue-600" />
            <Lock className="w-3.5 h-3.5" /> 비밀 댓글 <span className="text-xs text-slate-400">(글쓴이와 나만 보여요)</span>
          </label>
        )}
        <button
          type="submit"
          disabled={busy || !text.trim()}
          className="inline-flex items-center gap-1.5 px-4 py-2 rounded-full bg-slate-900 text-white text-sm font-bold disabled:opacity-40"
        >
          {busy && <Loader2 className="w-4 h-4 animate-spin" />}
          {parentId ? "답글 등록" : "댓글 등록"}
        </button>
      </div>
      {err && <p className="mt-1 text-xs text-rose-600">{err}</p>}
    </form>
  );
}

function Item({
  c,
  viewerId,
  isAdmin,
  isReply,
  onReply,
}: {
  c: BlogCommentView;
  viewerId: string | null;
  isAdmin: boolean;
  isReply?: boolean;
  onReply?: () => void;
}) {
  const router = useRouter();
  const [deleting, setDeleting] = useState(false);
  const canDelete = !c.isDeleted && (c.mine || isAdmin);
  const remove = async () => {
    if (!confirm("이 댓글을 지울까요?")) return;
    setDeleting(true);
    try {
      const r = await fetch(`/api/blog/comments/${c.id}`, { method: "DELETE" });
      if (!r.ok) throw new Error();
      router.refresh();
    } catch {
      alert("삭제 실패");
    } finally {
      setDeleting(false);
    }
  };

  return (
    <div className="flex gap-3">
      {isReply && <CornerDownRight className="w-4 h-4 mt-2.5 shrink-0 text-slate-300" />}
      <div
        className={`w-9 h-9 shrink-0 rounded-full flex items-center justify-center text-sm font-bold overflow-hidden ${
          c.author.isAdmin ? "bg-gradient-to-br from-blue-600 to-indigo-600 text-white" : "bg-slate-100 text-slate-500"
        }`}
      >
        {c.author.image && !c.author.isAdmin ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={c.author.image} alt="" className="w-full h-full object-cover" />
        ) : c.author.isAdmin ? (
          "P"
        ) : (
          c.author.name.slice(0, 1)
        )}
      </div>
      <div className="flex-1 min-w-0">
        <p className="flex flex-wrap items-center gap-x-1.5 text-sm">
          <b className="text-slate-900">{c.author.name}</b>
          {c.author.isAdmin && <span className="px-1.5 py-0.5 rounded-md bg-blue-50 text-blue-600 text-[10px] font-bold">글쓴이</span>}
          {c.isPrivate && <Lock className="w-3.5 h-3.5 text-slate-400" aria-label="비밀 댓글" />}
          <span className="text-xs text-slate-400">{timeAgo(c.createdAt)}</span>
        </p>
        {c.isDeleted ? (
          <p className="mt-1 text-sm text-slate-400">삭제된 댓글이에요.</p>
        ) : c.content === null ? (
          <p className="mt-1 inline-flex items-center gap-1 text-sm text-slate-400">
            <Lock className="w-3.5 h-3.5" /> 비밀 댓글이에요. 글쓴이와 작성자만 볼 수 있어요.
          </p>
        ) : (
          <p className="mt-1 text-[15px] text-slate-700 leading-relaxed whitespace-pre-wrap break-words">{c.content}</p>
        )}
        <div className="mt-1.5 flex items-center gap-3 text-xs font-semibold text-slate-400">
          {onReply && viewerId && !c.isDeleted && c.content !== null && (
            <button type="button" onClick={onReply} className="hover:text-blue-600">
              답글
            </button>
          )}
          {canDelete && (
            <button type="button" onClick={remove} disabled={deleting} className="inline-flex items-center gap-0.5 hover:text-rose-600">
              <Trash2 className="w-3 h-3" /> 삭제
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

export default function BlogComments({
  postId,
  slug,
  comments,
  total,
  viewerId,
  isAdmin,
}: {
  postId: string;
  slug: string;
  comments: BlogCommentView[] | null;
  total: number;
  viewerId: string | null;
  isAdmin: boolean;
}) {
  const [replyTo, setReplyTo] = useState<string | null>(null);
  const [posted, setPosted] = useState(false);

  if (comments === null) {
    // 댓글 테이블이 아직 없음 — 관리자에게만 안내
    return isAdmin ? (
      <p className="mt-16 rounded-2xl bg-amber-50 px-4 py-3 text-sm text-amber-800">
        댓글 기능을 켜려면 Supabase에서 <b>supabase/migration_blog_comments.sql</b> 을 실행해 주세요. (관리자에게만 보이는 안내)
      </p>
    ) : null;
  }

  return (
    <section id="comments" className="mt-16 scroll-mt-28">
      <h2 className="flex items-center gap-2 text-xl font-extrabold text-slate-900">
        <MessageCircle className="w-5 h-5 text-blue-600" /> 댓글 {total > 0 && <span className="text-blue-600">{total}</span>}
      </h2>
      <p className="mt-1 text-sm text-slate-500">궁금한 점이나 여행 팁을 남겨 주세요. 개인적인 질문은 🔒 비밀 댓글로 남기면 글쓴이만 볼 수 있어요.</p>

      <div className="mt-5">
        {viewerId ? (
          <>
            <Composer postId={postId} placeholder="댓글을 남겨 주세요" onDone={() => setPosted(true)} />
            {posted && !isAdmin && (
              <div className="mt-3 rounded-2xl bg-blue-50 px-4 py-3">
                <p className="text-sm text-slate-700 mb-2">답글이 달리면 알려 드릴까요? (알림이 꺼져 있으면 이메일로 알려 드려요)</p>
                <PushToggle compact label="답글 알림" />
              </div>
            )}
          </>
        ) : (
          <Link
            href={`/login?callbackUrl=${encodeURIComponent(`/blog/${slug}#comments`)}`}
            className="block rounded-2xl border border-dashed border-slate-300 px-4 py-5 text-center text-sm font-semibold text-slate-500 hover:border-blue-400 hover:text-blue-600"
          >
            로그인하고 댓글 남기기
          </Link>
        )}
      </div>

      {comments.length > 0 && (
        <ul className="mt-8 space-y-6">
          {comments.map((c) => (
            <li key={c.id} id={`c-${c.id}`} className="scroll-mt-28">
              <Item c={c} viewerId={viewerId} isAdmin={isAdmin} onReply={() => setReplyTo(replyTo === c.id ? null : c.id)} />
              {(c.replies.length > 0 || replyTo === c.id) && (
                <div className="mt-4 ml-6 sm:ml-12 space-y-4 border-l-2 border-slate-100 pl-3 sm:pl-4">
                  {c.replies.map((r) => (
                    <div key={r.id} id={`c-${r.id}`} className="scroll-mt-28">
                      <Item c={r} viewerId={viewerId} isAdmin={isAdmin} isReply />
                    </div>
                  ))}
                  {replyTo === c.id && viewerId && (
                    <Composer
                      postId={postId}
                      parentId={c.id}
                      forcePrivate={c.isPrivate}
                      placeholder={`${c.author.name} 님에게 답글`}
                      onDone={() => setReplyTo(null)}
                      autoFocus
                    />
                  )}
                </div>
              )}
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
