"use client";

// 여행 중 어디서든 바로 쓰는 환율 계산기 — 화면 오른쪽 아래 둥근 버튼 → 아래에서 올라오는 계산기
// 관리자·환율 페이지에서는 숨김

import { useState } from "react";
import { usePathname } from "next/navigation";
import Link from "next/link";
import { X } from "lucide-react";
import ExchangeCalculator from "@/components/ExchangeCalculator";

export default function FxQuickButton() {
  const pathname = usePathname() ?? "";
  const [open, setOpen] = useState(false);
  // 글쓰기·수정 화면에서는 입력을 가리지 않게 숨김
  if (pathname.startsWith("/admin") || pathname.startsWith("/exchange") || pathname.startsWith("/festivals/") || /\/(new|edit)$/.test(pathname)) return null;

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="fixed z-40 right-4 bottom-[calc(1rem+env(safe-area-inset-bottom))] inline-flex items-center gap-1.5 pl-3 pr-4 h-12 rounded-full bg-emerald-600 text-white font-bold text-sm shadow-lg shadow-emerald-900/25 hover:bg-emerald-700 active:scale-95 transition"
        aria-label="환율 계산기 열기"
      >
        <span className="text-lg">💱</span> 환율
      </button>

      {open && (
        <div className="fixed inset-0 z-50 bg-black/40 flex items-end sm:items-center justify-center" onClick={() => setOpen(false)}>
          <div
            className="w-full sm:max-w-md bg-white rounded-t-3xl sm:rounded-3xl p-5 pb-[calc(1.25rem+env(safe-area-inset-bottom))] shadow-2xl"
            onClick={(e) => e.stopPropagation()}
            role="dialog"
            aria-label="환율 계산기"
          >
            <div className="relative mb-2 h-6">
              <div className="mx-auto mt-1 h-1.5 w-10 rounded-full bg-gray-200 sm:hidden" />
              <button type="button" onClick={() => setOpen(false)} className="absolute right-0 -top-1 p-1.5 rounded-full text-gray-400 hover:bg-gray-100" aria-label="닫기">
                <X className="w-5 h-5" />
              </button>
            </div>
            <ExchangeCalculator variant="plain" remember />
            <Link href="/exchange" onClick={() => setOpen(false)} className="mt-3 block text-center text-xs font-semibold text-emerald-700">
              전체 화면으로 보기 →
            </Link>
          </div>
        </div>
      )}
    </>
  );
}
