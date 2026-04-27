import Link from "next/link";
import { signIn, auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { LogoMark } from "@/components/Logo";
import LoginForm from "./LoginForm";

export const metadata = {
  title: "로그인 - Pothos",
};

export default async function LoginPage({
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
          className="inline-flex items-center gap-2 text-sm text-slate-500 hover:text-slate-800"
        >
          <ArrowLeft className="w-4 h-4" /> 홈으로
        </Link>
      </header>

      <main className="flex-1 flex items-center justify-center px-4 py-10">
        <div className="w-full max-w-md">
          <div className="text-center mb-8">
            <Link href="/" className="inline-flex items-center gap-2 mb-6">
              <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center shadow-lg text-white">
                <LogoMark size={22} />
              </div>
            </Link>
            <h1 className="text-3xl font-bold text-slate-900 mb-2">
              Pothos에 오신 것을 환영해요
            </h1>
            <p className="text-slate-500 text-sm">
              로그인하고 나만의 여행 계획을 저장하세요
            </p>
          </div>

          <div className="bg-white rounded-3xl border border-slate-100 shadow-sm p-7">
            <LoginForm />
          </div>

          {/* 소셜 로그인 */}
          <div className="mt-6">
            <div className="flex items-center gap-3 mb-4">
              <div className="flex-1 h-px bg-slate-200" />
              <span className="text-xs text-slate-400 font-medium">
                또는 소셜 계정으로
              </span>
              <div className="flex-1 h-px bg-slate-200" />
            </div>

            <div className="grid grid-cols-3 gap-2">
              <form
                action={async () => {
                  "use server";
                  await signIn("google", { redirectTo: target });
                }}
              >
                <button
                  className="w-full flex items-center justify-center gap-2 py-3 rounded-2xl border border-slate-200 hover:bg-slate-50 transition-all text-sm font-medium text-slate-700"
                  title="Google로 로그인"
                >
                  <svg className="w-4 h-4" viewBox="0 0 24 24">
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
                  Google
                </button>
              </form>

              <form
                action={async () => {
                  "use server";
                  await signIn("naver", { redirectTo: target });
                }}
              >
                <button
                  className="w-full flex items-center justify-center gap-2 py-3 rounded-2xl bg-[#03C75A] text-white hover:bg-[#02b351] transition-all text-sm font-semibold"
                  title="Naver로 로그인"
                >
                  <span className="font-black">N</span>
                  Naver
                </button>
              </form>

              <form
                action={async () => {
                  "use server";
                  await signIn("kakao", { redirectTo: target });
                }}
              >
                <button
                  className="w-full flex items-center justify-center gap-2 py-3 rounded-2xl bg-[#FEE500] text-[#3C1E1E] hover:bg-[#fdd835] transition-all text-sm font-semibold"
                  title="Kakao로 로그인"
                >
                  <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M12 3C6.48 3 2 6.58 2 11c0 2.85 1.85 5.36 4.66 6.8L5.5 22l4.38-2.84c.69.1 1.4.15 2.12.15 5.52 0 10-3.58 10-8s-4.48-8-10-8z" />
                  </svg>
                  Kakao
                </button>
              </form>
            </div>
          </div>

          <p className="text-center text-sm text-slate-500 mt-6">
            처음이신가요?{" "}
            <Link
              href="/signup"
              className="font-semibold text-blue-600 hover:text-blue-700"
            >
              회원가입
            </Link>
          </p>
        </div>
      </main>
    </div>
  );
}
