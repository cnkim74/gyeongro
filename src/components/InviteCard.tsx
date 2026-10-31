"use client";

// 친구 초대 카드 — 인사말이 담긴 메시지를 공유(카카오톡 등)하거나 복사
import { useState } from "react";
import { Share2, Copy, Check } from "lucide-react";

const SITE = "https://pothostravel.com";
const MESSAGE =
  "Pothos에서 AI로 여행 일정 짜봤는데 동선이랑 맛집까지 지도로 다 나와서 편하더라! 축제 맞춤 일정도 돼. 같이 써 보자 ✈️";

export default function InviteCard() {
  const [copied, setCopied] = useState(false);

  const share = async () => {
    const data = { title: "Pothos - AI 여행 플래너", text: MESSAGE, url: SITE };
    if (typeof navigator !== "undefined" && navigator.share) {
      try {
        await navigator.share(data);
        return;
      } catch {
        // 사용자가 취소 → 복사로 대체하지 않음
        return;
      }
    }
    copy();
  };

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(`${MESSAGE}\n${SITE}`);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // 클립보드 사용 불가 환경
    }
  };

  return (
    <div className="rounded-3xl p-5 sm:p-6 border border-sky-100 bg-gradient-to-br from-sky-50 via-white to-indigo-50">
      <h2 className="text-lg font-bold text-gray-900">🙌 함께 여행할 친구를 초대해 주세요</h2>
      <p className="text-[15px] text-gray-600 mt-1">친구가 여행 후기를 남기면 친구도 첫 글 이벤트 이용권을 받아요.</p>
      <p className="mt-3 text-[15px] text-gray-800 bg-white rounded-2xl border border-gray-100 p-4 leading-relaxed">
        {MESSAGE}
        <br />
        <span className="text-blue-600">{SITE}</span>
      </p>
      <div className="flex gap-2 mt-3">
        <button
          onClick={share}
          className="flex-1 inline-flex items-center justify-center gap-2 py-3.5 rounded-2xl bg-sky-500 text-white text-base font-bold"
        >
          <Share2 className="w-5 h-5" /> 공유하기
        </button>
        <button
          onClick={copy}
          className="inline-flex items-center justify-center gap-2 px-5 rounded-2xl border border-gray-200 bg-white text-base font-semibold text-gray-700"
        >
          {copied ? <Check className="w-5 h-5 text-emerald-500" /> : <Copy className="w-5 h-5" />}
          {copied ? "복사됨" : "복사"}
        </button>
      </div>
    </div>
  );
}
