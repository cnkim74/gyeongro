import Link from "next/link";
import { signIn, auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { MapPin, ArrowLeft, Sparkles } from "lucide-react";

export const metadata = {
  title: "회원가입 - Pothos",
};

export default async function SignupPage({
  searchParams,
}: {
  searchParams: Promise<{ callbackUrl?: string }>;
}) {
  const session = await auth();
  const { callbackUrl } = await searchParams;
  if (session?.user) redirect(callbackUrl || "/");

  const target = callbackUrl || "/";

  return (
    <div className="min-h-screen flex flex-col bg-gradient-to-br from-blue-50 via-white to-indigo-50">
      <header className="p-5">
        <Link
          href="/"
          className="inline-flex items-center gap-2 text-sm text-gray-500 hover:text-gray-800"
        >
          <ArrowLeft className="w-4 h-4" /> 홈으로
        </Link>
      </header>

      <main className="flex-1 flex items-center justify-center px-4 py-10">
        <div className="w-full max-w-md">
          <div className="text-center mb-10">
            <Link href="/" className="inline-flex items-center gap-2 mb-6">
              <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center shadow-lg">
                <MapPin className="w-6 h-6 text-white" />
              </div>
            </Link>
            <h1 className="text-3xl font-bold text-gray-900 mb-2">
              Pothos 시작하기
            </h1>
            <p className="text-gray-500 text-sm">
              3초 만에 가입하고 AI 여행 플래너를 무료로 이용하세요
            </p>
          </div>

          <div className="bg-blue-50 border border-blue-100 rounded-2xl p-4 mb-5 flex items-start gap-3">
            <Sparkles className="w-4 h-4 text-blue-500 shrink-0 mt-0.5" />
            <div>
              <p className="text-sm font-semibold text-blue-900 mb-0.5">
                별도 가입 절차 없이 3초 만에 시작
              </p>
              <p className="text-xs text-blue-700/80">
                아래 계정으로 바로 가입됩니다. 비밀번호 관리 필요 없어요.
              </p>
            </div>
          </div>

          <div className="bg-white rounded-3xl border border-gray-100 shadow-sm p-8 space-y-3">
            <form
              action={async () => {
                "use server";
                await signIn("google", { redirectTo: target });
              }}
            >
              <button className="w-full flex items-center justify-center gap-3 py-3.5 rounded-2xl border border-gray-200 hover:bg-gray-50 transition-all font-medium text-gray-700">
                <svg className="w-5 h-5" viewBox="0 0 24 24">
                  <path
                    fill="#4285F4"
                    d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                  />
                  <path
                    fill="#34A853"
                    d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                  />
                  <path
                    fill="#FBBC05"
                    d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                  />
                  <path
                    fill="#EA4335"
                    d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                  />
                </svg>
                Google로 가입하기
              </button>
            </form>

            <form
              action={async () => {
                "use server";
                await signIn("naver", { redirectTo: target });
              }}
            >
              <button className="w-full flex items-center justify-center gap-3 py-3.5 rounded-2xl bg-[#03C75A] text-white hover:bg-[#02b351] transition-all font-semibold">
                <span className="font-black text-lg">N</span>
                네이버로 가입하기
              </button>
            </form>

            <form
              action={async () => {
                "use server";
                await signIn("kakao", { redirectTo: target });
              }}
            >
              <button className="w-full flex items-center justify-center gap-3 py-3.5 rounded-2xl bg-[#FEE500] text-[#3C1E1E] hover:bg-[#fdd835] transition-all font-semibold">
                <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M12 3C6.48 3 2 6.58 2 11c0 2.85 1.85 5.36 4.66 6.8L5.5 22l4.38-2.84c.69.1 1.4.15 2.12.15 5.52 0 10-3.58 10-8s-4.48-8-10-8z" />
                </svg>
                카카오로 가입하기
              </button>
            </form>
          </div>

          <p className="text-center text-sm text-gray-500 mt-6">
            이미 계정이 있으신가요?{" "}
            <Link
              href="/login"
              className="font-semibold text-blue-600 hover:text-blue-700"
            >
              로그인
            </Link>
          </p>

          <p className="text-center text-xs text-gray-400 mt-6 leading-relaxed">
            회원가입 시 Pothos의{" "}
            <a href="#" className="underline hover:text-gray-600">
              이용약관
            </a>
            과{" "}
            <a href="#" className="underline hover:text-gray-600">
              개인정보처리방침
            </a>
            에<br />
            동의한 것으로 간주됩니다
          </p>
        </div>
      </main>
    </div>
  );
}
