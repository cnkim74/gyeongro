"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import {
  Loader2,
  Send,
  AlertCircle,
  MessageCircle,
  RefreshCw,
} from "lucide-react";

interface Message {
  id: string;
  sender_id: string;
  sender_role: "traveler" | "sherpa";
  body: string;
  created_at: string;
  read_at: string | null;
}

interface Props {
  bookingId?: string;
  proposalId?: string;
  myRole: "traveler" | "sherpa";
  myUserId: string;
  partnerName?: string;
  partnerAvatar?: string | null;
}

export default function MessageThread({
  bookingId,
  proposalId,
  myRole,
  partnerName = "상대방",
  partnerAvatar,
}: Props) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [loading, setLoading] = useState(true);
  const [posting, setPosting] = useState(false);
  const [body, setBody] = useState("");
  const [error, setError] = useState<string | null>(null);
  const listEndRef = useRef<HTMLDivElement>(null);

  const fetchMessages = useCallback(async () => {
    try {
      const params = new URLSearchParams();
      if (bookingId) params.set("bookingId", bookingId);
      else if (proposalId) params.set("proposalId", proposalId);
      const res = await fetch(`/api/messages?${params}`, { cache: "no-store" });
      const data = await res.json();
      if (res.ok) {
        setMessages(data.messages ?? []);
      } else {
        setError(data.error ?? "불러오기 실패");
      }
    } catch {
      setError("네트워크 오류");
    } finally {
      setLoading(false);
    }
  }, [bookingId, proposalId]);

  useEffect(() => {
    // 비동기 패턴으로 초기 fetch (effect body에서 직접 setState 회피)
    const tid = setTimeout(() => {
      void fetchMessages();
    }, 0);
    // 30초마다 자동 갱신
    const interval = setInterval(() => {
      void fetchMessages();
    }, 30000);
    return () => {
      clearTimeout(tid);
      clearInterval(interval);
    };
  }, [fetchMessages]);

  useEffect(() => {
    listEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages.length]);

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (body.trim().length === 0) return;
    setPosting(true);
    setError(null);
    try {
      const res = await fetch("/api/messages", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          bookingId: bookingId ?? null,
          proposalId: proposalId ?? null,
          body: body.trim(),
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "전송 실패");
      setBody("");
      await fetchMessages();
    } catch (err) {
      setError(err instanceof Error ? err.message : "오류");
    } finally {
      setPosting(false);
    }
  };

  return (
    <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden">
      <div className="flex items-center justify-between px-4 py-3 border-b border-slate-100 bg-slate-50/60">
        <div className="flex items-center gap-2">
          <MessageCircle className="w-4 h-4 text-blue-500" />
          <span className="text-sm font-bold text-slate-900">
            {partnerName}와의 메시지
          </span>
        </div>
        <button
          onClick={fetchMessages}
          disabled={loading}
          className="text-slate-400 hover:text-slate-700 disabled:opacity-50"
          aria-label="새로고침"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${loading ? "animate-spin" : ""}`} />
        </button>
      </div>

      <div className="max-h-[400px] overflow-y-auto p-4 space-y-3">
        {loading && messages.length === 0 ? (
          <div className="flex items-center justify-center py-10 text-slate-400">
            <Loader2 className="w-5 h-5 animate-spin" />
          </div>
        ) : messages.length === 0 ? (
          <div className="text-center text-sm text-slate-400 py-10">
            아직 메시지가 없어요. 먼저 인사를 건네보세요.
          </div>
        ) : (
          messages.map((m) => (
            <MessageBubble
              key={m.id}
              message={m}
              isMine={m.sender_role === myRole}
              partnerAvatar={partnerAvatar}
              partnerName={partnerName}
            />
          ))
        )}
        <div ref={listEndRef} />
      </div>

      <form
        onSubmit={handleSend}
        className="border-t border-slate-100 p-3 bg-white"
      >
        {error && (
          <div className="flex items-start gap-2 p-2 mb-2 rounded-lg bg-rose-50 text-rose-700 text-xs">
            <AlertCircle className="w-3.5 h-3.5 shrink-0 mt-0.5" />
            {error}
          </div>
        )}
        <div className="flex gap-2">
          <textarea
            value={body}
            onChange={(e) => setBody(e.target.value)}
            placeholder="메시지를 입력하세요..."
            rows={2}
            maxLength={4000}
            className="flex-1 px-3 py-2 rounded-xl border border-slate-200 focus:border-blue-400 focus:ring-2 focus:ring-blue-100 outline-none text-slate-900 text-sm resize-none"
            onKeyDown={(e) => {
              if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) {
                handleSend(e);
              }
            }}
          />
          <button
            type="submit"
            disabled={posting || body.trim().length === 0}
            className="px-3 py-2 rounded-xl bg-blue-500 text-white text-sm font-semibold hover:bg-blue-600 disabled:opacity-40 disabled:cursor-not-allowed inline-flex items-center gap-1 self-end"
          >
            {posting ? (
              <Loader2 className="w-3.5 h-3.5 animate-spin" />
            ) : (
              <Send className="w-3.5 h-3.5" />
            )}
            전송
          </button>
        </div>
        <p className="text-[10px] text-slate-400 mt-1.5">
          ⌘/Ctrl + Enter 로 전송
        </p>
      </form>
    </div>
  );
}

function MessageBubble({
  message,
  isMine,
  partnerAvatar,
  partnerName,
}: {
  message: Message;
  isMine: boolean;
  partnerAvatar?: string | null;
  partnerName: string;
}) {
  const time = new Date(message.created_at);
  const timeLabel = time.toLocaleTimeString("ko-KR", {
    hour: "2-digit",
    minute: "2-digit",
  });
  const dateLabel = time.toLocaleDateString("ko-KR");

  if (isMine) {
    return (
      <div className="flex justify-end">
        <div className="max-w-[75%]">
          <div className="bg-blue-500 text-white rounded-2xl rounded-br-sm px-3.5 py-2 text-sm leading-relaxed whitespace-pre-line">
            {message.body}
          </div>
          <p className="text-[10px] text-slate-400 mt-1 text-right">
            {dateLabel} {timeLabel}
            {message.read_at && (
              <span className="ml-1 text-emerald-500">· 읽음</span>
            )}
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex gap-2 items-start">
      {partnerAvatar ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={partnerAvatar}
          alt={partnerName}
          className="w-8 h-8 rounded-full object-cover bg-slate-100 shrink-0"
        />
      ) : (
        <div className="w-8 h-8 rounded-full bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center text-white text-xs font-bold shrink-0">
          {partnerName.charAt(0)}
        </div>
      )}
      <div className="max-w-[75%]">
        <div className="bg-slate-100 text-slate-900 rounded-2xl rounded-bl-sm px-3.5 py-2 text-sm leading-relaxed whitespace-pre-line">
          {message.body}
        </div>
        <p className="text-[10px] text-slate-400 mt-1">
          {dateLabel} {timeLabel}
        </p>
      </div>
    </div>
  );
}
