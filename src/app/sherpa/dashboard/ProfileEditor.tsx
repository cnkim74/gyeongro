"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  Loader2,
  CheckCircle,
  AlertCircle,
  Save,
  Pause,
  Play,
} from "lucide-react";
import { SHERPA_SPECIALTIES, LANGUAGES } from "@/lib/sherpa";

interface Props {
  sherpa: {
    id: string;
    status: string;
    tagline: string | null;
    bio: string;
    cities: string[];
    languages: string[];
    specialties: string[];
    hourly_rate_krw: number | null;
    half_day_rate_krw: number | null;
    full_day_rate_krw: number | null;
  };
}

export default function ProfileEditor({ sherpa }: Props) {
  const router = useRouter();
  const [tagline, setTagline] = useState(sherpa.tagline ?? "");
  const [bio, setBio] = useState(sherpa.bio);
  const [cities, setCities] = useState(sherpa.cities.join(", "));
  const [languages, setLanguages] = useState<string[]>(sherpa.languages);
  const [specialties, setSpecialties] = useState<string[]>(sherpa.specialties);
  const [hourly, setHourly] = useState(
    sherpa.hourly_rate_krw ? String(sherpa.hourly_rate_krw / 10000) : ""
  );
  const [halfDay, setHalfDay] = useState(
    sherpa.half_day_rate_krw ? String(sherpa.half_day_rate_krw / 10000) : ""
  );
  const [fullDay, setFullDay] = useState(
    sherpa.full_day_rate_krw ? String(sherpa.full_day_rate_krw / 10000) : ""
  );
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<{ type: "ok" | "err"; text: string } | null>(null);

  const toggle = <T,>(arr: T[], v: T): T[] =>
    arr.includes(v) ? arr.filter((x) => x !== v) : [...arr, v];

  const handleSave = async () => {
    setSaving(true);
    setMessage(null);
    try {
      const res = await fetch("/api/sherpa/profile", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          tagline: tagline.trim() || null,
          bio: bio.trim(),
          cities: cities.split(",").map((c) => c.trim()).filter(Boolean),
          languages,
          specialties,
          hourlyRate: hourly ? Number(hourly) * 10000 : null,
          halfDayRate: halfDay ? Number(halfDay) * 10000 : null,
          fullDayRate: fullDay ? Number(fullDay) * 10000 : null,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "저장 실패");
      setMessage({ type: "ok", text: "저장됐어요." });
      router.refresh();
    } catch (err) {
      setMessage({
        type: "err",
        text: err instanceof Error ? err.message : "오류",
      });
    } finally {
      setSaving(false);
    }
  };

  const handlePauseToggle = async () => {
    const isPaused = sherpa.status === "paused";
    if (!confirm(isPaused ? "활동을 재개하시겠어요?" : "활동을 일시 중지할까요?")) return;
    setSaving(true);
    try {
      const res = await fetch("/api/sherpa/profile", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ pause: !isPaused }),
      });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error ?? "실패");
      }
      router.refresh();
    } catch (err) {
      setMessage({
        type: "err",
        text: err instanceof Error ? err.message : "오류",
      });
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-2 pb-4 border-b border-slate-100">
        <div>
          <h3 className="font-bold text-slate-900">활동 상태</h3>
          <p className="text-xs text-slate-500">
            {sherpa.status === "published"
              ? "활동중 — 여행자에게 노출됩니다"
              : sherpa.status === "paused"
              ? "일시 중지 — 신규 매칭 받지 않음"
              : sherpa.status}
          </p>
        </div>
        {(sherpa.status === "published" || sherpa.status === "paused") && (
          <button
            onClick={handlePauseToggle}
            disabled={saving}
            className={`px-4 py-2 rounded-full text-sm font-semibold inline-flex items-center gap-1.5 transition-colors ${
              sherpa.status === "paused"
                ? "bg-emerald-500 text-white hover:bg-emerald-600"
                : "bg-amber-500 text-white hover:bg-amber-600"
            } disabled:opacity-50`}
          >
            {sherpa.status === "paused" ? (
              <>
                <Play className="w-3.5 h-3.5" />
                재개
              </>
            ) : (
              <>
                <Pause className="w-3.5 h-3.5" />
                일시 중지
              </>
            )}
          </button>
        )}
      </div>

      <div>
        <Label>한 줄 소개</Label>
        <input
          type="text"
          value={tagline}
          onChange={(e) => setTagline(e.target.value)}
          maxLength={80}
          className={inputCls}
        />
      </div>

      <div>
        <Label required>자기소개 (최소 30자)</Label>
        <textarea
          value={bio}
          onChange={(e) => setBio(e.target.value)}
          rows={5}
          className={`${inputCls} resize-none`}
        />
        <p className="text-xs text-slate-400 mt-1">{bio.length}자</p>
      </div>

      <div>
        <Label>활동 도시 (쉼표 구분)</Label>
        <input
          type="text"
          value={cities}
          onChange={(e) => setCities(e.target.value)}
          className={inputCls}
        />
      </div>

      <div>
        <Label>구사 언어</Label>
        <div className="grid grid-cols-3 sm:grid-cols-4 gap-1.5">
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
              <div className="text-base">{l.emoji}</div>
              <div className="text-[10px] font-semibold text-slate-700 mt-0.5">
                {l.label}
              </div>
            </button>
          ))}
        </div>
      </div>

      <div>
        <Label>전문 분야</Label>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-1.5">
          {SHERPA_SPECIALTIES.map((s) => (
            <button
              key={s.id}
              type="button"
              onClick={() => setSpecialties(toggle(specialties, s.id))}
              className={`p-2.5 rounded-xl border-2 text-center transition-all ${
                specialties.includes(s.id)
                  ? "border-emerald-500 bg-emerald-50"
                  : "border-slate-200 hover:border-slate-300"
              }`}
            >
              <div className="text-xl">{s.emoji}</div>
              <div className="text-xs font-semibold text-slate-700 mt-0.5">
                {s.label}
              </div>
            </button>
          ))}
        </div>
      </div>

      <div>
        <Label>참고 가격 (만원)</Label>
        <div className="grid grid-cols-3 gap-3">
          <RateInput label="시간당" value={hourly} onChange={setHourly} />
          <RateInput label="반나절" value={halfDay} onChange={setHalfDay} />
          <RateInput label="종일" value={fullDay} onChange={setFullDay} />
        </div>
      </div>

      {message && (
        <div
          className={`flex items-start gap-2 p-3 rounded-xl text-sm ${
            message.type === "ok"
              ? "bg-emerald-50 text-emerald-700"
              : "bg-rose-50 text-rose-700"
          }`}
        >
          {message.type === "ok" ? (
            <CheckCircle className="w-4 h-4 shrink-0 mt-0.5" />
          ) : (
            <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
          )}
          {message.text}
        </div>
      )}

      <button
        onClick={handleSave}
        disabled={saving}
        className="w-full py-3 rounded-2xl bg-gradient-to-r from-emerald-500 to-teal-600 text-white font-bold flex items-center justify-center gap-2 hover:shadow-xl hover:shadow-emerald-500/25 transition-all disabled:opacity-40"
      >
        {saving ? (
          <Loader2 className="w-4 h-4 animate-spin" />
        ) : (
          <Save className="w-4 h-4" />
        )}
        저장
      </button>
    </div>
  );
}

const inputCls =
  "w-full px-3 py-2.5 rounded-xl border border-slate-200 focus:border-emerald-400 focus:ring-2 focus:ring-emerald-100 outline-none text-slate-900 text-sm bg-white";

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
      <p className="text-[11px] text-slate-500 mb-1">{label}</p>
      <div className="relative">
        <input
          type="number"
          inputMode="numeric"
          min={0}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder="-"
          className={`${inputCls} pr-12`}
        />
        <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-slate-400">
          만원
        </span>
      </div>
    </div>
  );
}
