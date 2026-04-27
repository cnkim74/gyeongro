"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Loader2, AlertCircle, CheckCircle, Send, Mountain } from "lucide-react";
import {
  SHERPA_SPECIALTIES,
  LANGUAGES,
  COUNTRY_FLAGS,
} from "@/lib/sherpa";

const COUNTRY_OPTIONS: Array<{ code: string; label: string }> = [
  { code: "KR", label: "대한민국" },
  { code: "JP", label: "일본" },
  { code: "TR", label: "터키" },
  { code: "TH", label: "태국" },
  { code: "FR", label: "프랑스" },
  { code: "IT", label: "이탈리아" },
  { code: "ES", label: "스페인" },
  { code: "DE", label: "독일" },
  { code: "US", label: "미국" },
  { code: "GB", label: "영국" },
  { code: "CN", label: "중국" },
  { code: "TW", label: "대만" },
  { code: "VN", label: "베트남" },
  { code: "HU", label: "헝가리" },
  { code: "MY", label: "말레이시아" },
];

interface Props {
  prefilledName: string | null;
  isLoggedIn: boolean;
}

export default function ApplyForm({ prefilledName, isLoggedIn }: Props) {
  const router = useRouter();

  const [displayName, setDisplayName] = useState(prefilledName ?? "");
  const [tagline, setTagline] = useState("");
  const [bio, setBio] = useState("");
  const [countries, setCountries] = useState<string[]>([]);
  const [cities, setCities] = useState("");
  const [languages, setLanguages] = useState<string[]>(["ko"]);
  const [specialties, setSpecialties] = useState<string[]>([]);
  const [hourlyRate, setHourlyRate] = useState<string>("");
  const [halfDayRate, setHalfDayRate] = useState<string>("");
  const [fullDayRate, setFullDayRate] = useState<string>("");
  const [agree, setAgree] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [done, setDone] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const toggle = <T,>(arr: T[], v: T): T[] =>
    arr.includes(v) ? arr.filter((x) => x !== v) : [...arr, v];

  const cityList = cities
    .split(",")
    .map((c) => c.trim())
    .filter(Boolean);

  const canSubmit =
    displayName.trim().length >= 2 &&
    bio.trim().length >= 30 &&
    countries.length > 0 &&
    cityList.length > 0 &&
    languages.length > 0 &&
    specialties.length > 0 &&
    agree &&
    !submitting;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!canSubmit) return;
    setSubmitting(true);
    setError(null);
    try {
      const res = await fetch("/api/sherpa/apply", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          displayName: displayName.trim(),
          tagline: tagline.trim() || null,
          bio: bio.trim(),
          countries,
          cities: cityList,
          languages,
          specialties,
          hourlyRate: hourlyRate ? Number(hourlyRate) * 10000 : null,
          halfDayRate: halfDayRate ? Number(halfDayRate) * 10000 : null,
          fullDayRate: fullDayRate ? Number(fullDayRate) * 10000 : null,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "신청 실패");
      setDone(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : "오류가 발생했어요.");
    } finally {
      setSubmitting(false);
    }
  };

  if (!isLoggedIn) {
    return (
      <div className="bg-amber-50 border border-amber-200 rounded-2xl p-6 text-center">
        <AlertCircle className="w-10 h-10 mx-auto text-amber-500 mb-3" />
        <p className="text-amber-900 font-semibold mb-1">로그인이 필요해요</p>
        <p className="text-sm text-amber-700 mb-4">
          셰르파 신청은 로그인한 사용자만 가능합니다.
        </p>
        <button
          onClick={() => router.push("/login?callbackUrl=/sherpa/become")}
          className="px-5 py-2.5 rounded-full bg-amber-500 text-white font-semibold hover:bg-amber-600 transition-colors"
        >
          로그인
        </button>
      </div>
    );
  }

  if (done) {
    return (
      <div className="text-center py-12">
        <div className="inline-flex items-center justify-center w-20 h-20 rounded-3xl bg-emerald-50 text-emerald-500 mb-5">
          <CheckCircle className="w-10 h-10" />
        </div>
        <h3 className="text-2xl font-bold text-slate-900 mb-3">
          셰르파 신청이 접수됐어요!
        </h3>
        <p className="text-slate-600 leading-relaxed mb-6">
          운영팀이 신청 내용과 신원을 검토한 후 승인 여부를 알려드립니다.
          <br />
          평균 2~3 영업일 소요됩니다.
        </p>
        <button
          onClick={() => router.push("/sherpa")}
          className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full bg-emerald-500 text-white font-semibold hover:bg-emerald-600 transition-colors"
        >
          셰르파 둘러보기
        </button>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* 기본 정보 */}
      <div className="space-y-4">
        <SectionTitle num="1" title="기본 정보" />

        <div>
          <Label required>활동명 / 닉네임</Label>
          <input
            type="text"
            value={displayName}
            onChange={(e) => setDisplayName(e.target.value)}
            placeholder="예: 지원, 도쿄예지"
            maxLength={30}
            className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:border-emerald-400 focus:ring-2 focus:ring-emerald-100 outline-none text-slate-900"
            required
          />
        </div>

        <div>
          <Label>한 줄 소개 (선택)</Label>
          <input
            type="text"
            value={tagline}
            onChange={(e) => setTagline(e.target.value)}
            placeholder="예: 강남·홍대 다 다녀본 진짜 동네 푸드 가이드"
            maxLength={80}
            className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:border-emerald-400 focus:ring-2 focus:ring-emerald-100 outline-none text-slate-900"
          />
        </div>

        <div>
          <Label required>자기소개 (최소 30자)</Label>
          <textarea
            value={bio}
            onChange={(e) => setBio(e.target.value)}
            placeholder="현지 거주 경력, 안내 경험, 강점, 어떤 여행자에게 도움이 될 수 있는지 자유롭게 적어주세요."
            rows={5}
            className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:border-emerald-400 focus:ring-2 focus:ring-emerald-100 outline-none text-slate-900 resize-none"
            required
          />
          <p className="text-xs text-slate-400 mt-1">
            {bio.length}자 / 최소 30자
          </p>
        </div>
      </div>

      {/* 활동 지역 */}
      <div className="space-y-4">
        <SectionTitle num="2" title="활동 지역" />

        <div>
          <Label required>활동 국가 (복수 선택 가능)</Label>
          <div className="grid grid-cols-3 sm:grid-cols-5 gap-2">
            {COUNTRY_OPTIONS.map((c) => (
              <button
                key={c.code}
                type="button"
                onClick={() => setCountries(toggle(countries, c.code))}
                className={`p-2 rounded-xl border-2 text-center transition-all ${
                  countries.includes(c.code)
                    ? "border-emerald-500 bg-emerald-50"
                    : "border-slate-200 hover:border-slate-300"
                }`}
              >
                <div className="text-xl">{COUNTRY_FLAGS[c.code]}</div>
                <div className="text-[10px] font-semibold text-slate-700 mt-0.5">
                  {c.label}
                </div>
              </button>
            ))}
          </div>
        </div>

        <div>
          <Label required>도시 / 지역</Label>
          <input
            type="text"
            value={cities}
            onChange={(e) => setCities(e.target.value)}
            placeholder="쉼표로 구분 (예: 서울, 부산, 도쿄)"
            className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:border-emerald-400 focus:ring-2 focus:ring-emerald-100 outline-none text-slate-900"
          />
        </div>
      </div>

      {/* 언어 */}
      <div className="space-y-4">
        <SectionTitle num="3" title="구사 언어" />
        <div className="grid grid-cols-3 sm:grid-cols-4 gap-2">
          {LANGUAGES.map((l) => (
            <button
              key={l.code}
              type="button"
              onClick={() => setLanguages(toggle(languages, l.code))}
              className={`p-2 rounded-xl border-2 text-center transition-all ${
                languages.includes(l.code)
                  ? "border-emerald-500 bg-emerald-50"
                  : "border-slate-200 hover:border-slate-300"
              }`}
            >
              <div className="text-lg">{l.emoji}</div>
              <div className="text-[10px] font-semibold text-slate-700 mt-0.5">
                {l.label}
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* 전문 분야 */}
      <div className="space-y-4">
        <SectionTitle num="4" title="전문 분야 (복수 선택)" />
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
          {SHERPA_SPECIALTIES.map((s) => (
            <button
              key={s.id}
              type="button"
              onClick={() => setSpecialties(toggle(specialties, s.id))}
              className={`p-3 rounded-xl border-2 text-center transition-all ${
                specialties.includes(s.id)
                  ? "border-emerald-500 bg-emerald-50"
                  : "border-slate-200 hover:border-slate-300"
              }`}
            >
              <div className="text-2xl">{s.emoji}</div>
              <div className="text-xs font-semibold text-slate-700 mt-1">
                {s.label}
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* 가격 */}
      <div className="space-y-4">
        <SectionTitle num="5" title="참고 가격 (만원)" />
        <p className="text-xs text-slate-500 -mt-2">
          제안 매칭 시 참고가일 뿐, 매번 여행자에게 별도 제안 가능합니다. 모두 비워두셔도 돼요.
        </p>
        <div className="grid grid-cols-3 gap-3">
          <RateInput label="시간당" value={hourlyRate} onChange={setHourlyRate} />
          <RateInput
            label="반나절 (4h)"
            value={halfDayRate}
            onChange={setHalfDayRate}
          />
          <RateInput label="종일 (8h)" value={fullDayRate} onChange={setFullDayRate} />
        </div>
      </div>

      {/* 동의 */}
      <div className="bg-slate-50 rounded-2xl p-4 text-sm">
        <label className="flex items-start gap-3 cursor-pointer">
          <input
            type="checkbox"
            checked={agree}
            onChange={(e) => setAgree(e.target.checked)}
            className="mt-1 w-4 h-4 accent-emerald-500"
          />
          <div className="text-slate-700 leading-relaxed">
            <span className="font-semibold">[필수] 셰르파 활동 약관 동의</span>
            <br />
            <span className="text-xs text-slate-500">
              · 정확한 정보 제공, 여행자 안전 보장, 한국 의료법·관광진흥법 준수
              <br />
              · 자격증이 필요한 유료 관광안내(관광진흥법 §38)는 본인 자격 책임
              <br />· 신원 검증 후 게시되며, 운영팀이 부적절한 활동 시 제재 가능
            </span>
          </div>
        </label>
      </div>

      {error && (
        <div className="flex items-start gap-2 p-3 rounded-xl bg-rose-50 text-rose-700 text-sm">
          <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
          {error}
        </div>
      )}

      <button
        type="submit"
        disabled={!canSubmit}
        className="w-full py-4 rounded-2xl bg-gradient-to-r from-emerald-500 to-teal-600 text-white font-bold flex items-center justify-center gap-2 hover:shadow-xl hover:shadow-emerald-500/25 hover:-translate-y-0.5 transition-all disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:translate-y-0"
      >
        {submitting ? (
          <Loader2 className="w-5 h-5 animate-spin" />
        ) : (
          <Mountain className="w-5 h-5" />
        )}
        셰르파 신청
        <Send className="w-4 h-4" />
      </button>
    </form>
  );
}

function SectionTitle({ num, title }: { num: string; title: string }) {
  return (
    <div className="flex items-center gap-3">
      <div className="w-7 h-7 rounded-lg bg-emerald-100 text-emerald-700 flex items-center justify-center text-xs font-bold">
        {num}
      </div>
      <h3 className="text-sm font-bold text-slate-900">{title}</h3>
    </div>
  );
}

function Label({
  children,
  required,
}: {
  children: React.ReactNode;
  required?: boolean;
}) {
  return (
    <label className="block text-xs font-semibold text-slate-700 mb-1.5">
      {children}
      {required && <span className="text-rose-500 ml-0.5">*</span>}
    </label>
  );
}

function RateInput({
  label,
  value,
  onChange,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
}) {
  return (
    <div>
      <Label>{label}</Label>
      <div className="relative">
        <input
          type="number"
          inputMode="numeric"
          min={0}
          step={1}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder="-"
          className="w-full px-3 py-2.5 pr-12 rounded-xl border border-slate-200 focus:border-emerald-400 focus:ring-2 focus:ring-emerald-100 outline-none text-slate-900 text-sm"
        />
        <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-slate-400">
          만원
        </span>
      </div>
    </div>
  );
}
