// 첫 글 이벤트 배너 — 커뮤니티·스토리·여행 준비 페이지
import Link from "next/link";
import { Gift } from "lucide-react";
import { FIRST_POST_EVENT, firstPostEventDeadline, isFirstPostEventActive } from "@/lib/events";

export default function FirstPostEventBanner({
  href = "/board",
  cta = "글쓰러 가기",
}: {
  href?: string;
  cta?: string;
}) {
  if (!isFirstPostEventActive()) return null;
  return (
    <div className="rounded-3xl p-5 sm:p-6 mb-6 text-white bg-gradient-to-r from-fuchsia-500 via-rose-500 to-orange-400 shadow-[0_14px_36px_-16px_rgba(244,63,94,0.7)]">
      <div className="flex flex-col sm:flex-row sm:items-center gap-4">
        <div className="flex items-start gap-3 flex-1">
          <span className="shrink-0 w-12 h-12 rounded-2xl bg-white/20 flex items-center justify-center">
            <Gift className="w-6 h-6" />
          </span>
          <div>
            <p className="text-sm font-semibold text-white/90">🎉 첫 글 이벤트 · {firstPostEventDeadline()}</p>
            <p className="text-lg sm:text-xl font-bold leading-snug">
              첫 여행 후기·꿀팁·유튜브를 올리면
              <br className="sm:hidden" /> AI 플래너 {FIRST_POST_EVENT.reward}회 이용권을 드려요
            </p>
            <p className="text-sm text-white/85 mt-1">계정당 1회 · 30자 이상 글 · 이용권 {FIRST_POST_EVENT.validDays}일간 사용 가능</p>
          </div>
        </div>
        <Link
          href={href}
          className="shrink-0 inline-flex items-center justify-center px-6 py-3.5 rounded-2xl bg-white text-rose-600 text-base font-bold shadow-md"
        >
          {cta}
        </Link>
      </div>
    </div>
  );
}
