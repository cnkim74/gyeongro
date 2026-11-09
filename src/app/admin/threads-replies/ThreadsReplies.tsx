"use client";

import { useState } from "react";
import Link from "next/link";
import { ArrowLeft, Loader2, RefreshCw, Send, SkipForward, Sparkles, ExternalLink } from "lucide-react";
import type { ThreadsComment } from "@/lib/threads-replies";

const KIND: Record<string, { label: string; cls: string }> = {
  thanks: { label: "감사·칭찬", cls: "bg-emerald-50 text-emerald-700" },
  question: { label: "질문", cls: "bg-blue-50 text-blue-700" },
  other: { label: "의견", cls: "bg-gray-100 text-gray-600" },
  spam: { label: "스팸 의심", cls: "bg-rose-50 text-rose-600" },
};

export default function ThreadsReplies({
  initial,
  username,
}: {
  initial: { lastChecked: string | null; items: ThreadsComment[] };
  username: string | null;
}) {
  const [data, setData] = useState(initial);
  const [tab, setTab] = useState<"pending" | "done">("pending");
  const [busy, setBusy] = useState<string | null>(null);
  const [drafts, setDrafts] = useState<Record<string, string>>({});
  const [msg, setMsg] = useState<string | null>(null);

  const call = async (body: Record<string, unknown>) => {
    const r = await fetch("/api/admin/threads/replies", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) });
    const j = await r.json();
    if (!r.ok) throw new Error(j.error ?? "실패");
    return j;
  };
  const reload = async () => setData(await (await fetch("/api/admin/threads/replies")).json());

  const pending = data.items.filter((i) => i.status === "pending");
  const done = data.items.filter((i) => i.status !== "pending");
  const list = tab === "pending" ? pending : done;

  return (
    <div className="p-5 sm:p-8 max-w-4xl">
      <Link href="/admin/blog" className="inline-flex items-center gap-1 text-sm text-gray-500 hover:text-gray-800">
        <ArrowLeft className="w-4 h-4" /> 블로그 관리
      </Link>
      <div className="mt-3 flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-3xl font-extrabold text-gray-900">🧵 스레드 댓글</h1>
          <p className="text-sm text-gray-500 mt-1">
            {username ? `@${username}` : "스레드 미연결"} 최근 14일 글에 달린 댓글이에요. AI가 쓴 초안을 확인·수정하고 보내세요.
            {data.lastChecked && ` · 마지막 확인 ${new Date(data.lastChecked).toLocaleString("ko-KR", { dateStyle: "short", timeStyle: "short" })}`}
          </p>
        </div>
        <button
          type="button"
          disabled={busy === "refresh"}
          onClick={async () => {
            setBusy("refresh");
            setMsg(null);
            try {
              const r = await call({ action: "refresh" });
              setMsg(r.error ? r.error : `새 댓글 ${r.added}개${r.autoSent ? ` (감사 답글 자동 ${r.autoSent}개)` : ""}`);
              await reload();
            } catch (e) {
              setMsg(e instanceof Error ? e.message : "확인 실패");
            } finally {
              setBusy(null);
            }
          }}
          className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-black text-white text-sm font-bold disabled:opacity-50"
        >
          {busy === "refresh" ? <Loader2 className="w-4 h-4 animate-spin" /> : <RefreshCw className="w-4 h-4" />} 지금 새로 확인
        </button>
      </div>
      {msg && <p className="mt-3 text-sm font-semibold text-gray-700">{msg}</p>}

      <div className="mt-6 flex gap-2">
        <button type="button" onClick={() => setTab("pending")} className={`px-3.5 py-1.5 rounded-full text-sm font-bold ${tab === "pending" ? "bg-gray-900 text-white" : "bg-gray-100 text-gray-600"}`}>
          답글 기다림 {pending.length}
        </button>
        <button type="button" onClick={() => setTab("done")} className={`px-3.5 py-1.5 rounded-full text-sm font-bold ${tab === "done" ? "bg-gray-900 text-white" : "bg-gray-100 text-gray-600"}`}>
          처리됨 {done.length}
        </button>
      </div>

      {list.length === 0 ? (
        <p className="mt-6 text-sm text-gray-500">{tab === "pending" ? "답글을 기다리는 댓글이 없어요. 👍" : "아직 처리한 댓글이 없어요."}</p>
      ) : (
        <ul className="mt-4 space-y-3">
          {list.map((c) => {
            const k = KIND[c.kind] ?? KIND.other;
            const draft = drafts[c.id] ?? c.draft;
            return (
              <li key={c.id} className="rounded-2xl border border-gray-100 bg-white p-4">
                <p className="text-[11px] text-gray-400 line-clamp-1">
                  내 글: {c.postText}
                  {c.postLink && (
                    <a href={c.postLink} target="_blank" rel="noopener noreferrer" className="ml-1 inline-flex items-center gap-0.5 text-blue-600">
                      보기 <ExternalLink className="w-3 h-3" />
                    </a>
                  )}
                </p>
                <p className="mt-2 flex flex-wrap items-center gap-2 text-xs">
                  <b className="text-gray-900">@{c.username}</b>
                  <span className={`px-1.5 py-0.5 rounded font-bold ${k.cls}`}>{k.label}</span>
                  <span className="text-gray-400">{new Date(c.timestamp).toLocaleString("ko-KR", { dateStyle: "short", timeStyle: "short" })}</span>
                  {c.status !== "pending" && (
                    <span className="text-gray-400">
                      · {c.status === "sent" ? "답글 보냄" : c.status === "auto-sent" ? "감사 답글 자동" : "건너뜀"}
                    </span>
                  )}
                </p>
                <p className="mt-1.5 text-[15px] text-gray-800 whitespace-pre-wrap break-words">{c.text}</p>

                {c.status === "pending" ? (
                  <div className="mt-3">
                    <textarea
                      className="w-full rounded-xl border border-gray-200 px-3 py-2 text-sm"
                      rows={2}
                      maxLength={500}
                      value={draft}
                      onChange={(e) => setDrafts((d) => ({ ...d, [c.id]: e.target.value }))}
                      placeholder="답글을 써 주세요"
                    />
                    <div className="mt-2 flex flex-wrap gap-2">
                      <button
                        type="button"
                        disabled={!!busy || !draft.trim()}
                        onClick={async () => {
                          setBusy(c.id);
                          try {
                            await call({ action: "send", id: c.id, text: draft });
                            await reload();
                          } catch (e) {
                            alert(e instanceof Error ? e.message : "보내기 실패");
                          } finally {
                            setBusy(null);
                          }
                        }}
                        className="inline-flex items-center gap-1 px-3.5 py-2 rounded-xl bg-black text-white text-xs font-bold disabled:opacity-40"
                      >
                        {busy === c.id ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Send className="w-3.5 h-3.5" />} 답글 보내기
                      </button>
                      <button
                        type="button"
                        disabled={!!busy}
                        onClick={async () => {
                          setBusy(`r-${c.id}`);
                          try {
                            const r = await call({ action: "redraft", id: c.id });
                            setDrafts((d) => ({ ...d, [c.id]: r.draft }));
                          } catch (e) {
                            alert(e instanceof Error ? e.message : "다시 쓰기 실패");
                          } finally {
                            setBusy(null);
                          }
                        }}
                        className="inline-flex items-center gap-1 px-3 py-2 rounded-xl border border-gray-200 text-xs font-bold text-gray-700 disabled:opacity-40"
                      >
                        {busy === `r-${c.id}` ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Sparkles className="w-3.5 h-3.5" />} AI 다시 쓰기
                      </button>
                      <button
                        type="button"
                        disabled={!!busy}
                        onClick={async () => {
                          await call({ action: "skip", id: c.id }).catch(() => null);
                          await reload();
                        }}
                        className="inline-flex items-center gap-1 px-3 py-2 rounded-xl text-xs font-bold text-gray-400 hover:text-gray-700"
                      >
                        <SkipForward className="w-3.5 h-3.5" /> 건너뛰기
                      </button>
                    </div>
                  </div>
                ) : (
                  c.sentText && <p className="mt-2 rounded-xl bg-gray-50 px-3 py-2 text-sm text-gray-700">↳ {c.sentText}</p>
                )}
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
