"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  Phone,
  ArrowRight,
  Loader2,
  AlertCircle,
  Building2,
  Plane,
  Mountain,
} from "lucide-react";

type OnboardingRole = "user" | "business" | "sherpa";

interface RoleCard {
  id: OnboardingRole;
  label: string;
  icon: React.ReactNode;
  emoji: string;
  description: string;
  next: string;
  iconColor: string;
  active: string;
  inactive: string;
}

const ROLE_CARDS: RoleCard[] = [
  {
    id: "user",
    label: "여행자",
    icon: <Plane className="w-5 h-5" />,
    emoji: "🧳",
    description: "여행 계획·셰르파 만나기",
    next: "",
    iconColor: "text-blue-500",
    active: "border-blue-500 bg-blue-50",
    inactive: "border-gray-200 hover:border-gray-300",
  },
  {
    id: "sherpa",
    label: "셰르파",
    icon: <Mountain className="w-5 h-5" />,
    emoji: "🏔️",
    description: "현지 가이드로 활동",
    next: "/sherpa/become",
    iconColor: "text-amber-500",
    active: "border-amber-500 bg-amber-50",
    inactive: "border-gray-200 hover:border-gray-300",
  },
  {
    id: "business",
    label: "파트너",
    icon: <Building2 className="w-5 h-5" />,
    emoji: "🏢",
    description: "기업·클리닉·여행사",
    next: "",
    iconColor: "text-emerald-500",
    active: "border-emerald-500 bg-emerald-50",
    inactive: "border-gray-200 hover:border-gray-300",
  },
];

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
  const [role, setRole] = useState<OnboardingRole>("user");
  const [businessName, setBusinessName] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    if (role === "business" && !businessName.trim()) {
      setError("파트너(기업회원)는 사업체 이름을 입력해주세요.");
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

      const roleNext = ROLE_CARDS.find((c) => c.id === role)?.next ?? "";
      const next =
        callbackUrl !== "/" || !roleNext ? callbackUrl : roleNext;
      router.replace(next);
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
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
          {ROLE_CARDS.map((c) => {
            const active = role === c.id;
            return (
              <button
                key={c.id}
                type="button"
                onClick={() => setRole(c.id)}
                className={`p-3 rounded-2xl border-2 text-left transition-all ${
                  active ? c.active : c.inactive
                }`}
              >
                <div className="flex items-center gap-1.5 mb-1">
                  <span className={c.iconColor}>{c.icon}</span>
                  <span className="text-lg">{c.emoji}</span>
                </div>
                <p className="font-bold text-gray-900 text-sm">{c.label}</p>
                <p className="text-[11px] text-gray-500 mt-0.5">{c.description}</p>
              </button>
            );
          })}
        </div>
        {role === "sherpa" && (
          <p className="text-[11px] text-amber-700 mt-2 flex items-start gap-1">
            <Mountain className="w-3 h-3 mt-0.5 shrink-0" />
            <span>저장 후 셰르파 신청 페이지로 이동합니다. 운영팀 검수 후 활동 가능해요.</span>
          </p>
        )}
      </div>

      {/* 파트너면 사업체 이름 */}
      {role === "business" && (
        <div>
          <label className="flex items-center gap-2 text-sm font-semibold text-gray-700 mb-3">
            <Building2 className="w-4 h-4 text-emerald-500" />
            사업체 이름
          </label>
          <input
            type="text"
            value={businessName}
            onChange={(e) => setBusinessName(e.target.value)}
            placeholder="예: 마이리얼트립, 강남○○병원..."
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
