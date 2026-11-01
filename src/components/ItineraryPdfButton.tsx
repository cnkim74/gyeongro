"use client";

// 여행 일정 PDF 저장 버튼 — 누를 때만 PDF 라이브러리를 불러와 브라우저에서 바로 만듦

import { useState } from "react";
import { FileDown, Loader2 } from "lucide-react";
import type { Itinerary } from "@/components/ItineraryView";

function fileNameOf(itinerary: Itinerary, destination: string) {
  const base = (itinerary.title || `${destination} 여행 일정`).replace(/[\\/:*?"<>|]/g, "").trim().slice(0, 60);
  return `${base || "여행 일정"}.pdf`;
}

export default function ItineraryPdfButton({
  itinerary,
  destination,
  className = "",
}: {
  itinerary: Itinerary;
  destination: string;
  className?: string;
}) {
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState("");

  const onClick = async () => {
    setBusy(true);
    setErr("");
    try {
      const { buildItineraryPdf } = await import("@/lib/itinerary-pdf");
      const blob = await buildItineraryPdf(itinerary, destination);
      const name = fileNameOf(itinerary, destination);

      // 휴대폰: 공유 시트(파일 저장·카카오톡 전송 등)가 가능하면 그걸로
      const file = new File([blob], name, { type: "application/pdf" });
      const touch = typeof window !== "undefined" && window.matchMedia?.("(pointer: coarse)").matches;
      if (touch && typeof navigator.canShare === "function" && navigator.canShare({ files: [file] })) {
        try {
          await navigator.share({ files: [file], title: name });
          return;
        } catch (e) {
          if (e instanceof DOMException && e.name === "AbortError") return; // 사용자가 닫음
          // 공유 실패 시 아래 다운로드로
        }
      }

      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = name;
      document.body.appendChild(a);
      a.rel = "noopener";
      a.click();
      setTimeout(() => {
        a.remove();
        URL.revokeObjectURL(url);
      }, 60_000);
    } catch (e) {
      console.error(e);
      setErr("PDF를 만들지 못했어요. 잠시 후 다시 시도해 주세요.");
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className={className}>
      <button
        type="button"
        onClick={onClick}
        disabled={busy}
        className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-2xl bg-white text-blue-700 text-[15px] font-bold shadow-sm hover:bg-blue-50 disabled:opacity-70"
      >
        {busy ? <Loader2 className="w-4 h-4 animate-spin" /> : <FileDown className="w-4 h-4" />}
        {busy ? "PDF 만드는 중…" : "PDF로 저장"}
      </button>
      {err && <p className="mt-2 text-sm text-red-100">{err}</p>}
    </div>
  );
}
