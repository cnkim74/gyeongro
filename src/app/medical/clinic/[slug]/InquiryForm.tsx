"use client";

import { useState } from "react";
import { Loader2, CheckCircle, AlertCircle, Send } from "lucide-react";

interface InquiryLabels {
  intro: string;
  name: string;
  email: string;
  phone: string;
  contactMethod: string;
  contactEmail: string;
  contactPhone: string;
  contactKakao: string;
  contactWhatsapp: string;
  preferredDate: string;
  budget: string;
  notes: string;
  notesPlaceholder: string;
  submit: string;
  successTitle: string;
  successBody: string;
  disclaimer: string;
}

interface Props {
  clinicId: string;
  clinicName: string;
  procedureSlug: string;
  locale?: "ko" | "en" | "ja" | "zh";
  labels?: InquiryLabels;
}

const FALLBACK_LABELS: InquiryLabels = {
  intro: "{name}에 대한 상담 요청입니다.",
  name: "이름",
  email: "이메일",
  phone: "연락처 (선택)",
  contactMethod: "선호하는 연락 방법",
  contactEmail: "이메일",
  contactPhone: "전화",
  contactKakao: "카톡",
  contactWhatsapp: "WhatsApp",
  preferredDate: "희망 시기 (선택)",
  budget: "예산 (만원, 선택)",
  notes: "상담 내용",
  notesPlaceholder: "시술 부위, 현재 상태, 이전 시술 이력, 궁금한 점 등을 적어주세요.",
  submit: "상담 신청",
  successTitle: "상담 신청이 접수됐어요",
  successBody: "입력하신 연락처로 운영팀이 24~48시간 내 연락드립니다.",
  disclaimer: "제출하시면 Pothos의 개인정보처리방침에 따라 입력 정보가 수집·활용됩니다.",
};

export default function InquiryForm({
  clinicId,
  clinicName,
  procedureSlug,
  labels = FALLBACK_LABELS,
}: Props) {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [preferredDate, setPreferredDate] = useState("");
  const [budget, setBudget] = useState("");
  const [notes, setNotes] = useState("");
  const [preferredContact, setPreferredContact] = useState<
    "email" | "phone" | "kakao" | "whatsapp"
  >("email");
  const [submitting, setSubmitting] = useState(false);
  const [done, setDone] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const canSubmit =
    name.trim().length > 0 &&
    /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) &&
    notes.trim().length > 5 &&
    !submitting;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!canSubmit) return;
    setSubmitting(true);
    setError(null);
    try {
      const res = await fetch("/api/medical/inquiry", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          clinicId,
          procedureSlug,
          contactName: name.trim(),
          contactEmail: email.trim().toLowerCase(),
          contactPhone: phone.trim() || null,
          preferredContact,
          preferredDate: preferredDate || null,
          budgetKrw: budget ? Number(budget) * 10000 : null,
          notes: notes.trim(),
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "전송 실패");
      setDone(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : "오류가 발생했어요.");
    } finally {
      setSubmitting(false);
    }
  };

  if (done) {
    return (
      <div className="text-center py-8">
        <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-emerald-50 text-emerald-500 mb-4">
          <CheckCircle className="w-8 h-8" />
        </div>
        <h3 className="text-lg font-bold text-slate-900 mb-2">
          {labels.successTitle}
        </h3>
        <p className="text-sm text-slate-600 leading-relaxed">
          {labels.successBody}
        </p>
      </div>
    );
  }

  const introText = labels.intro.replace("{name}", clinicName);

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <p className="text-xs text-slate-500 leading-relaxed bg-slate-50 rounded-xl p-3">
        {introText}
      </p>

      <div>
        <label className="block text-sm font-semibold text-slate-700 mb-1.5">
          {labels.name} <span className="text-rose-500">*</span>
        </label>
        <input
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          className="w-full px-3 py-2.5 rounded-xl border border-slate-200 focus:border-rose-400 focus:ring-2 focus:ring-rose-100 outline-none text-slate-900"
          required
        />
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <div>
          <label className="block text-sm font-semibold text-slate-700 mb-1.5">
            {labels.email} <span className="text-rose-500">*</span>
          </label>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="example@email.com"
            className="w-full px-3 py-2.5 rounded-xl border border-slate-200 focus:border-rose-400 focus:ring-2 focus:ring-rose-100 outline-none text-slate-900"
            required
          />
        </div>
        <div>
          <label className="block text-sm font-semibold text-slate-700 mb-1.5">
            {labels.phone}
          </label>
          <input
            type="tel"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            placeholder="010-1234-5678"
            className="w-full px-3 py-2.5 rounded-xl border border-slate-200 focus:border-rose-400 focus:ring-2 focus:ring-rose-100 outline-none text-slate-900"
          />
        </div>
      </div>

      <div>
        <label className="block text-sm font-semibold text-slate-700 mb-1.5">
          {labels.contactMethod}
        </label>
        <div className="grid grid-cols-4 gap-2">
          {[
            { id: "email", label: labels.contactEmail },
            { id: "phone", label: labels.contactPhone },
            { id: "kakao", label: labels.contactKakao },
            { id: "whatsapp", label: labels.contactWhatsapp },
          ].map((c) => (
            <button
              key={c.id}
              type="button"
              onClick={() => setPreferredContact(c.id as typeof preferredContact)}
              className={`px-3 py-2 rounded-xl text-xs font-medium transition-colors ${
                preferredContact === c.id
                  ? "bg-rose-500 text-white"
                  : "bg-slate-100 text-slate-600 hover:bg-slate-200"
              }`}
            >
              {c.label}
            </button>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <div>
          <label className="block text-sm font-semibold text-slate-700 mb-1.5">
            {labels.preferredDate}
          </label>
          <input
            type="date"
            value={preferredDate}
            min={new Date().toISOString().slice(0, 10)}
            onChange={(e) => setPreferredDate(e.target.value)}
            className="w-full px-3 py-2.5 rounded-xl border border-slate-200 focus:border-rose-400 focus:ring-2 focus:ring-rose-100 outline-none text-slate-900"
          />
        </div>
        <div>
          <label className="block text-sm font-semibold text-slate-700 mb-1.5">
            {labels.budget}
          </label>
          <input
            type="number"
            inputMode="numeric"
            value={budget}
            onChange={(e) => setBudget(e.target.value)}
            placeholder="500"
            className="w-full px-3 py-2.5 rounded-xl border border-slate-200 focus:border-rose-400 focus:ring-2 focus:ring-rose-100 outline-none text-slate-900"
          />
        </div>
      </div>

      <div>
        <label className="block text-sm font-semibold text-slate-700 mb-1.5">
          {labels.notes} <span className="text-rose-500">*</span>
        </label>
        <textarea
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          placeholder={labels.notesPlaceholder}
          rows={5}
          className="w-full px-3 py-2.5 rounded-xl border border-slate-200 focus:border-rose-400 focus:ring-2 focus:ring-rose-100 outline-none text-slate-900 resize-none"
          required
          minLength={6}
        />
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
        className="w-full py-3 rounded-2xl bg-gradient-to-r from-rose-500 to-pink-600 text-white font-bold flex items-center justify-center gap-2 hover:shadow-xl hover:shadow-rose-500/25 hover:-translate-y-0.5 transition-all disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:translate-y-0 disabled:shadow-none"
      >
        {submitting ? (
          <Loader2 className="w-4 h-4 animate-spin" />
        ) : (
          <Send className="w-4 h-4" />
        )}
        {labels.submit}
      </button>

      <p className="text-[11px] text-slate-400 leading-relaxed text-center">
        {labels.disclaimer}
      </p>
    </form>
  );
}
