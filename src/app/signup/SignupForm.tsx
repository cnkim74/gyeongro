"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import Image from "next/image";
import { useRouter, useSearchParams } from "next/navigation";
import { signIn } from "next-auth/react";
import {
  Loader2,
  CheckCircle2,
  XCircle,
  AlertCircle,
  Sparkles,
  Eye,
  EyeOff,
} from "lucide-react";
import { AVATAR_PRESETS } from "@/lib/avatars";

const NICKNAME_RE = /^[A-Za-z0-9가-힣]{2,12}$/;
const PASSWORD_RE = /^(?=.*[A-Za-z])(?=.*\d).{8,}$/;
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function formatPhone(input: string): string {
  const digits = input.replace(/[^\d]/g, "").slice(0, 11);
  if (digits.length < 4) return digits;
  if (digits.length < 8) return `${digits.slice(0, 3)}-${digits.slice(3)}`;
  if (digits.length === 10)
    return `${digits.slice(0, 3)}-${digits.slice(3, 6)}-${digits.slice(6)}`;
  return `${digits.slice(0, 3)}-${digits.slice(3, 7)}-${digits.slice(7)}`;
}

type CheckState = "idle" | "checking" | "available" | "taken" | "invalid";

export default function SignupForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const callbackUrl = searchParams.get("callbackUrl") ?? "/";

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [passwordConfirm, setPasswordConfirm] = useState("");
  const [nickname, setNickname] = useState("");
  const [phone, setPhone] = useState("");
  const [avatarPreset, setAvatarPreset] = useState<string>("wanderer");
  const [showPassword, setShowPassword] = useState(false);

  // 서버 응답: { value, result } — value가 현재 입력과 다르면 'checking'으로 간주
  type ServerResult = { value: string; result: "available" | "taken" } | null;
  const [emailServer, setEmailServer] = useState<ServerResult>(null);
  const [nicknameServer, setNicknameServer] = useState<ServerResult>(null);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // 이메일 중복 체크 (debounced)
  useEffect(() => {
    if (!email || !EMAIL_RE.test(email)) return;
    const handle = setTimeout(async () => {
      try {
        const res = await fetch(
          `/api/auth/check?field=email&value=${encodeURIComponent(email)}`
        );
        const data = await res.json();
        setEmailServer({ value: email, result: data.available ? "available" : "taken" });
      } catch {
        setEmailServer(null);
      }
    }, 400);
    return () => clearTimeout(handle);
  }, [email]);

  // 닉네임 중복 체크 (debounced)
  useEffect(() => {
    if (!nickname || !NICKNAME_RE.test(nickname)) return;
    const handle = setTimeout(async () => {
      try {
        const res = await fetch(
          `/api/auth/check?field=nickname&value=${encodeURIComponent(nickname)}`
        );
        const data = await res.json();
        setNicknameServer({ value: nickname, result: data.available ? "available" : "taken" });
      } catch {
        setNicknameServer(null);
      }
    }, 400);
    return () => clearTimeout(handle);
  }, [nickname]);

  // 렌더 시 파생: 형식 검증 + 서버 응답 일치 여부
  const emailCheck: CheckState = !email
    ? "idle"
    : !EMAIL_RE.test(email)
    ? "invalid"
    : emailServer?.value === email
    ? emailServer.result
    : "checking";
  const nicknameCheck: CheckState = !nickname
    ? "idle"
    : !NICKNAME_RE.test(nickname)
    ? "invalid"
    : nicknameServer?.value === nickname
    ? nicknameServer.result
    : "checking";

  const passwordValid = !password || PASSWORD_RE.test(password);
  const passwordMatch = !passwordConfirm || password === passwordConfirm;

  const canSubmit =
    EMAIL_RE.test(email) &&
    emailCheck === "available" &&
    PASSWORD_RE.test(password) &&
    password === passwordConfirm &&
    (nickname === "" || nicknameCheck === "available") &&
    !submitting;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!canSubmit) return;
    setSubmitting(true);
    setError(null);

    try {
      const res = await fetch("/api/auth/signup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email,
          password,
          nickname: nickname || null,
          phone: phone || null,
          avatarPreset,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "가입 실패");

      // 자동 로그인
      const result = await signIn("credentials", {
        email,
        password,
        redirect: false,
      });
      if (result?.error) {
        setError("가입은 됐지만 자동 로그인에 실패했어요. 로그인 페이지에서 다시 시도해주세요.");
        router.push("/login");
        return;
      }
      router.push(callbackUrl);
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "가입 중 오류가 발생했어요.");
    } finally {
      setSubmitting(false);
    }
  };

  const renderCheckIcon = (state: CheckState) => {
    if (state === "checking")
      return <Loader2 className="w-4 h-4 animate-spin text-slate-400" />;
    if (state === "available")
      return <CheckCircle2 className="w-4 h-4 text-emerald-500" />;
    if (state === "taken" || state === "invalid")
      return <XCircle className="w-4 h-4 text-red-500" />;
    return null;
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      {/* 이메일 */}
      <div>
        <label className="block text-sm font-semibold text-slate-700 mb-2">
          이메일 <span className="text-red-500">*</span>
        </label>
        <div className="relative">
          <input
            type="email"
            autoComplete="email"
            value={email}
            onChange={(e) => setEmail(e.target.value.trim())}
            placeholder="example@email.com"
            className="w-full px-4 py-3 pr-10 rounded-xl border border-slate-200 focus:border-blue-400 focus:ring-2 focus:ring-blue-100 outline-none transition text-slate-900"
            required
          />
          <div className="absolute right-3 top-1/2 -translate-y-1/2">
            {renderCheckIcon(emailCheck)}
          </div>
        </div>
        {emailCheck === "taken" && (
          <p className="text-xs text-red-500 mt-1.5">이미 가입된 이메일입니다.</p>
        )}
        {emailCheck === "invalid" && email && (
          <p className="text-xs text-red-500 mt-1.5">올바른 이메일 형식이 아닙니다.</p>
        )}
      </div>

      {/* 비밀번호 */}
      <div>
        <label className="block text-sm font-semibold text-slate-700 mb-2">
          비밀번호 <span className="text-red-500">*</span>
        </label>
        <div className="relative">
          <input
            type={showPassword ? "text" : "password"}
            autoComplete="new-password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="영문 + 숫자 포함 8자 이상"
            className="w-full px-4 py-3 pr-10 rounded-xl border border-slate-200 focus:border-blue-400 focus:ring-2 focus:ring-blue-100 outline-none transition text-slate-900"
            required
            minLength={8}
          />
          <button
            type="button"
            onClick={() => setShowPassword(!showPassword)}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
            tabIndex={-1}
          >
            {showPassword ? (
              <EyeOff className="w-4 h-4" />
            ) : (
              <Eye className="w-4 h-4" />
            )}
          </button>
        </div>
        {!passwordValid && (
          <p className="text-xs text-red-500 mt-1.5">
            영문과 숫자를 포함해 8자 이상 입력해주세요.
          </p>
        )}
      </div>

      {/* 비밀번호 확인 */}
      <div>
        <label className="block text-sm font-semibold text-slate-700 mb-2">
          비밀번호 확인 <span className="text-red-500">*</span>
        </label>
        <input
          type={showPassword ? "text" : "password"}
          autoComplete="new-password"
          value={passwordConfirm}
          onChange={(e) => setPasswordConfirm(e.target.value)}
          placeholder="비밀번호 다시 입력"
          className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:border-blue-400 focus:ring-2 focus:ring-blue-100 outline-none transition text-slate-900"
          required
        />
        {!passwordMatch && (
          <p className="text-xs text-red-500 mt-1.5">비밀번호가 일치하지 않습니다.</p>
        )}
      </div>

      {/* 닉네임 */}
      <div>
        <label className="block text-sm font-semibold text-slate-700 mb-2">
          닉네임 <span className="text-slate-400 text-xs font-normal">(선택, 나중에 설정 가능)</span>
        </label>
        <div className="relative">
          <input
            type="text"
            value={nickname}
            onChange={(e) => setNickname(e.target.value.trim())}
            placeholder="한글/영문/숫자 2~12자"
            className="w-full px-4 py-3 pr-10 rounded-xl border border-slate-200 focus:border-blue-400 focus:ring-2 focus:ring-blue-100 outline-none transition text-slate-900"
            maxLength={12}
          />
          <div className="absolute right-3 top-1/2 -translate-y-1/2">
            {renderCheckIcon(nicknameCheck)}
          </div>
        </div>
        {nicknameCheck === "taken" && (
          <p className="text-xs text-red-500 mt-1.5">이미 사용 중인 닉네임입니다.</p>
        )}
        {nicknameCheck === "invalid" && nickname && (
          <p className="text-xs text-red-500 mt-1.5">한글/영문/숫자 2~12자만 가능합니다.</p>
        )}
        {nicknameCheck === "available" && (
          <p className="text-xs text-emerald-500 mt-1.5">사용 가능한 닉네임입니다.</p>
        )}
      </div>

      {/* 휴대폰 */}
      <div>
        <label className="block text-sm font-semibold text-slate-700 mb-2">
          휴대폰 번호 <span className="text-slate-400 text-xs font-normal">(선택)</span>
        </label>
        <input
          type="tel"
          inputMode="numeric"
          value={phone}
          onChange={(e) => setPhone(formatPhone(e.target.value))}
          placeholder="010-1234-5678"
          className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:border-blue-400 focus:ring-2 focus:ring-blue-100 outline-none transition text-slate-900"
        />
      </div>

      {/* 아바타 선택 */}
      <div>
        <label className="block text-sm font-semibold text-slate-700 mb-2">
          프로필 캐릭터 <span className="text-slate-400 text-xs font-normal">(나중에 변경 가능)</span>
        </label>
        <div className="grid grid-cols-3 sm:grid-cols-5 gap-2">
          {AVATAR_PRESETS.map((a) => (
            <button
              key={a.id}
              type="button"
              onClick={() => setAvatarPreset(a.id)}
              className={`relative p-2 rounded-2xl border-2 transition-all ${
                avatarPreset === a.id
                  ? "border-blue-500 bg-blue-50 ring-2 ring-blue-100"
                  : "border-slate-200 hover:border-slate-300 bg-white"
              }`}
              title={a.label}
            >
              <Image
                src={a.url}
                alt={a.label}
                width={64}
                height={64}
                className="w-full h-auto"
                unoptimized
              />
              {avatarPreset === a.id && (
                <CheckCircle2 className="absolute -top-1.5 -right-1.5 w-5 h-5 text-blue-500 bg-white rounded-full" />
              )}
              <p className="text-[10px] text-slate-500 mt-1 truncate">{a.label}</p>
            </button>
          ))}
        </div>
      </div>

      {error && (
        <div className="flex items-start gap-2 p-3 rounded-xl bg-red-50 text-red-700 text-sm">
          <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
          {error}
        </div>
      )}

      <button
        type="submit"
        disabled={!canSubmit}
        className="w-full py-3.5 rounded-2xl bg-gradient-to-r from-blue-500 to-indigo-600 text-white font-bold flex items-center justify-center gap-2 hover:shadow-xl hover:shadow-blue-500/25 hover:-translate-y-0.5 transition-all disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:translate-y-0 disabled:shadow-none"
      >
        {submitting ? (
          <Loader2 className="w-5 h-5 animate-spin" />
        ) : (
          <Sparkles className="w-5 h-5" />
        )}
        Pothos 시작하기
      </button>

      <p className="text-center text-xs text-slate-400 leading-relaxed">
        가입 시 Pothos의{" "}
        <Link href="#" className="underline hover:text-slate-600">
          이용약관
        </Link>
        과{" "}
        <Link href="#" className="underline hover:text-slate-600">
          개인정보처리방침
        </Link>
        에 동의한 것으로 간주됩니다
      </p>
    </form>
  );
}
