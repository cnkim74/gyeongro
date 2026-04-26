"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Phone, ArrowRight, Loader2, AlertCircle, Briefcase, Plane } from "lucide-react";

function formatPhone(input: string): string {
  const digits = input.replace(/[^\d]/g, "").slice(0, 11);
  if (digits.length < 4) return digits;
  if (digits.length < 8) return `${digits.slice(0, 3)}-${digits.slice(3)}`;
  if (digits.length === 10)
    return `${digits.slice(0, 3)}-${digits.slice(3, 6)}-${digits.slice(6)}`;
  return `${digits.slice(0, 3)}-${digits.slice(3, 7)}-${digits.slice(7)}`;
}

export default function OnboardingForm({ callbackUrl }: { callbackUrl: string }) {
  const router = useRouter();
  const [phone, setPhone] = useState("");
  const [role, setRole] = useState<"user" | "business">("user");
  const [businessName, setBusinessName] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    if (role === "business" && !businessName.trim()) {
      setError("길잡이(기업회원)는 사업체 이름을 입력해주세요.");
      return;
    }
    setSubmitting(true);
    try {
      const res = await fetch("/api/profile/onboarding", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          phone,
          role,
          businessName: role === "business" ? businessName.trim() : null,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "저장 실패");
      router.replace(callbackUrl);
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "오류가 발생했어요.");
      setSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      {/* 회원 유형 선택 */}
      <div>
        <label className="text-sm font-semibold text-gray-700 mb-3 block">
          회원 유형
        </label>
        <div className="grid grid-cols-2 gap-3">
          <button
            type="button"
            onClick={() => setRole("user")}
            className={`p-4 rounded-2xl border-2 text-left transition-all ${
              role === "user"
                ? "border-blue-500 bg-blue-50"
                : "border-gray-200 hover:border-gray-300"
            }`}
          >
            <div className="flex items-center gap-2 mb-1">
              <Plane className="w-5 h-5 text-blue-500" />
              <span className="text-2xl">🧳</span>
            </div>
            <p className="font-bold text-gray-900">여행자</p>
            <p className="text-xs text-gray-500 mt-0.5">개인 회원</p>
          </button>
          <button
            type="button"
            onClick={() => setRole("business")}
            className={`p-4 rounded-2xl border-2 text-left transition-all ${
              role === "business"
                ? "border-emerald-500 bg-emerald-50"
                : "border-gray-200 hover:border-gray-300"
            }`}
          >
            <div className="flex items-center gap-2 mb-1">
              <Briefcase className="w-5 h-5 text-emerald-500" />
              <span className="text-2xl">🧭</span>
            </div>
            <p className="font-bold text-gray-900">길잡이</p>
            <p className="text-xs text-gray-500 mt-0.5">기업·광고주</p>
          </button>
        </div>
      </div>

      {/* 기업회원이면 사업체 이름 */}
      {role === "business" && (
        <div>
          <label className="flex items-center gap-2 text-sm font-semibold text-gray-700 mb-3">
            <Briefcase className="w-4 h-4 text-emerald-500" />
            사업체 이름
          </label>
          <input
            type="text"
            value={businessName}
            onChange={(e) => setBusinessName(e.target.value)}
            placeholder="예: 마이리얼트립, 스카이스캐너..."
            required={role === "business"}
            maxLength={100}
            className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-emerald-400 focus:ring-2 focus:ring-emerald-100 outline-none text-gray-900 placeholder-gray-400"
          />
        </div>
      )}

      {/* 휴대전화 */}
      <div>
        <label className="flex items-center gap-2 text-sm font-semibold text-gray-700 mb-3">
          <Phone className="w-4 h-4 text-blue-500" />
          휴대전화 번호
        </label>
        <input
          type="tel"
          inputMode="numeric"
          autoComplete="tel"
          value={phone}
          onChange={(e) => setPhone(formatPhone(e.target.value))}
          placeholder="010-1234-5678"
          required
          className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-blue-400 focus:ring-2 focus:ring-blue-100 outline-none transition text-gray-900 placeholder-gray-400 text-lg tracking-wide"
        />
      </div>

      {error && (
        <div className="flex items-center gap-2 px-4 py-3 rounded-xl bg-red-50 text-red-700 text-sm">
          <AlertCircle className="w-4 h-4 shrink-0" />
          {error}
        </div>
      )}

      <button
        type="submit"
        disabled={submitting || phone.replace(/[^\d]/g, "").length < 10}
        className="w-full py-4 rounded-2xl bg-gradient-to-r from-blue-500 to-indigo-600 text-white font-bold text-lg flex items-center justify-center gap-2 hover:shadow-xl hover:shadow-blue-500/25 hover:-translate-y-0.5 transition-all disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:translate-y-0"
      >
        {submitting ? (
          <Loader2 className="w-5 h-5 animate-spin" />
        ) : (
          <>
            완료하고 시작하기
            <ArrowRight className="w-5 h-5" />
          </>
        )}
      </button>
    </form>
  );
}
