"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  Loader2,
  CheckCircle,
  AlertCircle,
  Building2,
  Send,
} from "lucide-react";

interface Procedure {
  slug: string;
  name_ko: string;
  emoji: string | null;
}

interface Props {
  procedures: Procedure[];
  isLoggedIn: boolean;
  prefilledEmail: string | null;
}

const COUNTRY_OPTIONS: Array<{ code: string; label: string; emoji: string }> = [
  { code: "KR", label: "대한민국", emoji: "🇰🇷" },
  { code: "JP", label: "일본", emoji: "🇯🇵" },
  { code: "TR", label: "터키", emoji: "🇹🇷" },
  { code: "TH", label: "태국", emoji: "🇹🇭" },
  { code: "HU", label: "헝가리", emoji: "🇭🇺" },
  { code: "CZ", label: "체코", emoji: "🇨🇿" },
  { code: "MY", label: "말레이시아", emoji: "🇲🇾" },
  { code: "VN", label: "베트남", emoji: "🇻🇳" },
];

export default function ClinicApplyForm({
  procedures,
  isLoggedIn,
  prefilledEmail,
}: Props) {
  const router = useRouter();

  const [name, setName] = useState("");
  const [nameEn, setNameEn] = useState("");
  const [direction, setDirection] = useState<"inbound" | "outbound">("inbound");
  const [country, setCountry] = useState("KR");
  const [city, setCity] = useState("");
  const [proceduresSelected, setProceduresSelected] = useState<string[]>([]);
  const [specialties, setSpecialties] = useState("");
  const [description, setDescription] = useState("");
  const [highlights, setHighlights] = useState("");
  const [priceMin, setPriceMin] = useState("");
  const [priceMax, setPriceMax] = useState("");
  const [contactPhone, setContactPhone] = useState("");
  const [contactEmail, setContactEmail] = useState(prefilledEmail ?? "");
  const [website, setWebsite] = useState("");
  const [agree, setAgree] = useState(false);

  const [submitting, setSubmitting] = useState(false);
  const [done, setDone] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const toggleProcedure = (id: string) =>
    setProceduresSelected((s) =>
      s.includes(id) ? s.filter((x) => x !== id) : [...s, id]
    );

  const canSubmit =
    name.trim().length >= 2 &&
    city.trim().length >= 1 &&
    proceduresSelected.length > 0 &&
    description.trim().length >= 30 &&
    /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(contactEmail) &&
    agree &&
    !submitting;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!canSubmit) return;
    setSubmitting(true);
    setError(null);
    try {
      const res = await fetch("/api/medical/clinics/apply", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: name.trim(),
          nameEn: nameEn.trim() || null,
          direction,
          country,
          city: city.trim(),
          procedures: proceduresSelected,
          specialties: specialties
            .split(",")
            .map((s) => s.trim())
            .filter(Boolean),
          description: description.trim(),
          highlights: highlights
            .split("\n")
            .map((s) => s.trim())
            .filter(Boolean),
          priceRangeMin: priceMin ? Number(priceMin) * 10000 : null,
          priceRangeMax: priceMax ? Number(priceMax) * 10000 : null,
          contactPhone: contactPhone.trim() || null,
          contactEmail: contactEmail.trim().toLowerCase(),
          websiteUrl: website.trim() || null,
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
          클리닉 등록은 로그인한 사용자만 가능합니다.
        </p>
        <button
          onClick={() => router.push("/login?callbackUrl=/medical/register")}
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
          등록 신청이 접수됐어요!
        </h3>
        <p className="text-slate-600 leading-relaxed mb-6">
          운영팀이 의료법·외국인환자 유치 관련 법령에 따라 검토한 후
          <br />
          승인 여부를 알려드립니다. 평균 2~3 영업일 소요됩니다.
        </p>
        <button
          onClick={() => router.push("/medical")}
          className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full bg-rose-500 text-white font-semibold hover:bg-rose-600 transition-colors"
        >
          의료관광 둘러보기
        </button>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <Section num="1" title="기본 정보">
        <div className="space-y-3">
          <Field label="클리닉/병원명" required>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="예: 강남 미모 성형외과"
              maxLength={80}
              className={inputCls}
              required
            />
          </Field>
          <Field label="영문명 (선택)">
            <input
              type="text"
              value={nameEn}
              onChange={(e) => setNameEn(e.target.value)}
              placeholder="Gangnam Mimo Plastic Surgery"
              maxLength={120}
              className={inputCls}
            />
          </Field>

          <Field label="방향" required>
            <div className="grid grid-cols-2 gap-2">
              {[
                { id: "inbound" as const, label: "Inbound (외국인 → 한국)" },
                { id: "outbound" as const, label: "Outbound (한국인 → 해외)" },
              ].map((d) => (
                <button
                  key={d.id}
                  type="button"
                  onClick={() => setDirection(d.id)}
                  className={pillCls(direction === d.id)}
                >
                  {d.label}
                </button>
              ))}
            </div>
          </Field>

          <div className="grid grid-cols-2 gap-3">
            <Field label="국가" required>
              <select
                value={country}
                onChange={(e) => setCountry(e.target.value)}
                className={inputCls}
              >
                {COUNTRY_OPTIONS.map((c) => (
                  <option key={c.code} value={c.code}>
                    {c.emoji} {c.label}
                  </option>
                ))}
              </select>
            </Field>
            <Field label="도시" required>
              <input
                type="text"
                value={city}
                onChange={(e) => setCity(e.target.value)}
                placeholder="예: 서울 강남구"
                className={inputCls}
                required
              />
            </Field>
          </div>
        </div>
      </Section>

      <Section num="2" title="시술 분야">
        <div className="grid grid-cols-3 gap-2">
          {procedures.map((p) => (
            <button
              key={p.slug}
              type="button"
              onClick={() => toggleProcedure(p.slug)}
              className={`p-3 rounded-xl border-2 text-center transition-all ${
                proceduresSelected.includes(p.slug)
                  ? "border-rose-500 bg-rose-50"
                  : "border-slate-200 hover:border-slate-300"
              }`}
            >
              <div className="text-2xl mb-1">{p.emoji}</div>
              <div className="text-xs font-semibold text-slate-900">{p.name_ko}</div>
            </button>
          ))}
        </div>
        <Field label="세부 시술 (쉼표 구분, 선택)">
          <input
            type="text"
            value={specialties}
            onChange={(e) => setSpecialties(e.target.value)}
            placeholder="FUE 모발이식, 코 성형, 임플란트"
            className={inputCls}
          />
        </Field>
      </Section>

      <Section num="3" title="소개 및 강점">
        <Field label="클리닉 소개 (최소 30자)" required>
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="외국인환자 진료 경력, 보유 장비, 통역 가능 언어, 외국인환자 유치 의료기관 등록 여부 등을 자세히 적어주세요."
            rows={5}
            className={`${inputCls} resize-none`}
            required
          />
          <p className="text-xs text-slate-400 mt-1">
            {description.length}자 / 최소 30자
          </p>
        </Field>
        <Field label="강점 (한 줄에 하나씩, 선택)">
          <textarea
            value={highlights}
            onChange={(e) => setHighlights(e.target.value)}
            placeholder={"외국인환자 유치 등록 의료기관\n4개 언어 통역 상주\n공항 픽업 무료\n회복 모니터링 1주"}
            rows={4}
            className={`${inputCls} resize-none`}
          />
        </Field>
      </Section>

      <Section num="4" title="가격대 (만원, 선택)">
        <div className="grid grid-cols-2 gap-3">
          <Field label="최소">
            <div className="relative">
              <input
                type="number"
                inputMode="numeric"
                min={0}
                value={priceMin}
                onChange={(e) => setPriceMin(e.target.value)}
                placeholder="500"
                className={`${inputCls} pr-12`}
              />
              <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-slate-400">
                만원
              </span>
            </div>
          </Field>
          <Field label="최대">
            <div className="relative">
              <input
                type="number"
                inputMode="numeric"
                min={0}
                value={priceMax}
                onChange={(e) => setPriceMax(e.target.value)}
                placeholder="2500"
                className={`${inputCls} pr-12`}
              />
              <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-slate-400">
                만원
              </span>
            </div>
          </Field>
        </div>
      </Section>

      <Section num="5" title="연락처">
        <div className="grid grid-cols-2 gap-3">
          <Field label="이메일" required>
            <input
              type="email"
              value={contactEmail}
              onChange={(e) => setContactEmail(e.target.value)}
              placeholder="hello@clinic.com"
              className={inputCls}
              required
            />
          </Field>
          <Field label="전화 (선택)">
            <input
              type="tel"
              value={contactPhone}
              onChange={(e) => setContactPhone(e.target.value)}
              placeholder="02-1234-5678"
              className={inputCls}
            />
          </Field>
        </div>
        <Field label="공식 웹사이트 (선택)">
          <input
            type="url"
            value={website}
            onChange={(e) => setWebsite(e.target.value)}
            placeholder="https://clinic.com"
            className={inputCls}
          />
        </Field>
      </Section>

      <div className="bg-slate-50 rounded-2xl p-4 text-sm">
        <label className="flex items-start gap-3 cursor-pointer">
          <input
            type="checkbox"
            checked={agree}
            onChange={(e) => setAgree(e.target.checked)}
            className="mt-1 w-4 h-4 accent-rose-500"
          />
          <div className="text-slate-700 leading-relaxed">
            <span className="font-semibold">[필수] 등록 검수 정책 동의</span>
            <br />
            <span className="text-xs text-slate-500">
              · 의료법 §27 (영리 알선·유인 금지) 및 §38 외국인환자 유치업 등록 등 관련 법령 준수
              <br />
              · 정확한 정보 제공, 허위·과대 광고 금지
              <br />· 운영팀이 부적절하다고 판단 시 게시 거부 또는 후속 차단 가능
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
        className="w-full py-4 rounded-2xl bg-gradient-to-r from-rose-500 to-pink-600 text-white font-bold flex items-center justify-center gap-2 hover:shadow-xl hover:shadow-rose-500/25 hover:-translate-y-0.5 transition-all disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:translate-y-0"
      >
        {submitting ? (
          <Loader2 className="w-5 h-5 animate-spin" />
        ) : (
          <Building2 className="w-5 h-5" />
        )}
        등록 신청
        <Send className="w-4 h-4" />
      </button>
    </form>
  );
}

const inputCls =
  "w-full px-3 py-2.5 rounded-xl border border-slate-200 focus:border-rose-400 focus:ring-2 focus:ring-rose-100 outline-none text-slate-900 text-sm bg-white";

const pillCls = (active: boolean) =>
  `px-3 py-2 rounded-xl border-2 text-xs font-semibold transition-all ${
    active
      ? "border-rose-500 bg-rose-50 text-rose-700"
      : "border-slate-200 hover:border-slate-300 text-slate-600"
  }`;

function Section({
  num,
  title,
  children,
}: {
  num: string;
  title: string;
  children: React.ReactNode;
}) {
  return (
    <div className="space-y-3">
      <div className="flex items-center gap-3">
        <div className="w-7 h-7 rounded-lg bg-rose-100 text-rose-700 flex items-center justify-center text-xs font-bold">
          {num}
        </div>
        <h3 className="text-sm font-bold text-slate-900">{title}</h3>
      </div>
      <div className="pl-10 space-y-3">{children}</div>
    </div>
  );
}

function Field({
  label,
  required,
  children,
}: {
  label: string;
  required?: boolean;
  children: React.ReactNode;
}) {
  return (
    <div>
      <label className="block text-xs font-semibold text-slate-700 mb-1.5">
        {label}
        {required && <span className="text-rose-500 ml-0.5">*</span>}
      </label>
      {children}
    </div>
  );
}
