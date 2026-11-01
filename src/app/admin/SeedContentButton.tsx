"use client";

import { useState } from "react";
import { Loader2, Sparkles } from "lucide-react";

export default function SeedContentButton() {
  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null);

  const run = async () => {
    if (!confirm("커뮤니티 게시판과 스토리에 샘플 글을 채울까요?\n(관리자 계정으로 '[Pothos 에디터]' 표기와 함께 등록돼요)")) return;
    setLoading(true);
    setMsg(null);
    try {
      const r = await fetch("/api/admin/seed-content", { method: "POST" });
      const j = await r.json();
      if (!r.ok) throw new Error(j.error ?? "실패");
      const parts = [
        j.boardCreated ? "여행 유튜브 게시판 생성" : null,
        `글 ${j.posts}개`,
        `스토리 ${j.stories}개 등록`,
        j.storiesUpdated ? `기존 스토리 ${j.storiesUpdated}개 최신 내용으로 갱신` : null,
        j.skipped ? `이미 있는 ${j.skipped}개는 건너뜀` : null,
        j.missingBoards?.length ? `게시판 없음: ${j.missingBoards.join(", ")}` : null,
      ].filter(Boolean);
      setMsg({ ok: true, text: parts.join(" · ") });
    } catch (e) {
      setMsg({ ok: false, text: e instanceof Error ? e.message : "실패" });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="rounded-3xl p-6 border border-violet-100 bg-gradient-to-br from-violet-50 via-white to-blue-50">
      <h2 className="text-lg font-bold text-gray-900">샘플 콘텐츠 채우기</h2>
      <p className="text-[15px] text-gray-600 mt-1 mb-4">
        비어 있는 공지·자유·여행 팁·질문답변·여행 유튜브 게시판과 스토리에 에디터 글을 채워요. 여러 번 눌러도 중복되지 않아요.
      </p>
      <button
        onClick={run}
        disabled={loading}
        className="inline-flex items-center gap-2 px-5 py-3 rounded-2xl bg-violet-600 text-white text-[15px] font-bold disabled:opacity-50"
      >
        {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : <Sparkles className="w-5 h-5" />}
        샘플 콘텐츠 채우기
      </button>
      {msg && <p className={`mt-3 text-[15px] font-semibold ${msg.ok ? "text-emerald-600" : "text-rose-600"}`}>{msg.text}</p>}
    </div>
  );
}
