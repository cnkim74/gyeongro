import Link from "next/link";
import { Mail, Share2, PlayCircle } from "lucide-react";
import { LogoMark } from "./Logo";

export default function Footer() {
  return (
    <footer className="bg-slate-950 text-slate-400">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-10">
          <div className="md:col-span-2">
            <Link href="/" className="flex items-center gap-2 mb-4">
              <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-blue-600 to-indigo-600 flex items-center justify-center text-white">
                <LogoMark size={18} />
              </div>
              <span
                className="text-xl font-bold text-white tracking-tight"
                style={{ letterSpacing: "-0.02em" }}
              >
                Pothos
              </span>
            </Link>
            <p className="text-sm leading-relaxed text-slate-500 max-w-sm">
              <span className="text-slate-300 font-medium">먼 곳을 향한 동경.</span>
              <br />
              AI가 설계하는 맞춤 여행, 함께 떠날 동료, 영감이 되는 스토리.
              모든 여정의 시작이 여기 있습니다.
            </p>
            <div className="flex items-center gap-4 mt-6">
              <a
                href="#"
                className="w-9 h-9 rounded-full bg-slate-800 flex items-center justify-center hover:bg-blue-600 transition-colors"
                aria-label="공유"
              >
                <Share2 className="w-4 h-4" />
              </a>
              <a
                href="#"
                className="w-9 h-9 rounded-full bg-slate-800 flex items-center justify-center hover:bg-red-600 transition-colors"
                aria-label="유튜브"
              >
                <PlayCircle className="w-4 h-4" />
              </a>
              <a
                href="#"
                className="w-9 h-9 rounded-full bg-slate-800 flex items-center justify-center hover:bg-blue-500 transition-colors"
                aria-label="이메일"
              >
                <Mail className="w-4 h-4" />
              </a>
            </div>
          </div>

          <div>
            <h4 className="text-white font-semibold mb-4 text-sm">서비스</h4>
            <ul className="space-y-3 text-sm">
              <li>
                <Link href="/planner" className="hover:text-white transition-colors">
                  AI 여행 플래너
                </Link>
              </li>
              <li>
                <Link href="/themes" className="hover:text-white transition-colors">
                  테마 여행
                </Link>
              </li>
              <li>
                <Link href="/partners" className="hover:text-white transition-colors">
                  동료 찾기
                </Link>
              </li>
              <li>
                <Link href="/stories" className="hover:text-white transition-colors">
                  여행 스토리
                </Link>
              </li>
              <li>
                <Link href="/reviews" className="hover:text-white transition-colors">
                  여행 후기
                </Link>
              </li>
              <li>
                <Link href="/board" className="hover:text-white transition-colors">
                  커뮤니티
                </Link>
              </li>
            </ul>
          </div>

          <div>
            <h4 className="text-white font-semibold mb-4 text-sm">Pothos</h4>
            <ul className="space-y-3 text-sm">
              <li>
                <Link href="/about" className="hover:text-white transition-colors">
                  브랜드 스토리
                </Link>
              </li>
              <li>
                <a href="#" className="hover:text-white transition-colors">채용</a>
              </li>
              <li>
                <a href="#" className="hover:text-white transition-colors">이용약관</a>
              </li>
              <li>
                <a href="#" className="hover:text-white transition-colors">개인정보처리방침</a>
              </li>
            </ul>
          </div>
        </div>

        <div className="border-t border-slate-800 mt-12 pt-8 flex flex-col sm:flex-row items-center justify-between gap-4">
          <p className="text-xs text-slate-600">
            © 2026 Pothos. All rights reserved.
          </p>
          <p className="text-xs text-slate-600 italic">
            Wherever you long for.
          </p>
        </div>
      </div>
    </footer>
  );
}
