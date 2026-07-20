import Link from "next/link";
import { signIn, auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { LogoMark } from "@/components/Logo";
import LoginForm from "./LoginForm";
import GoogleButton from "./GoogleButton";

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

          <div className="mt-6">
            <div className="flex items-center gap-3 mb-4">
              <div className="flex-1 h-px bg-slate-200" />
              <span className="text-xs text-slate-400 font-medium">
                또는 소셜 계정으로
              </span>
              <div className="flex-1 h-px bg-slate-200" />
            </div>

            <div className="grid grid-cols-3 gap-2">
              <GoogleButton target={target} />

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
