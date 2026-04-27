"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  Mountain,
  Loader2,
  CheckCircle2,
  XCircle,
  Star,
  Wallet,
  AlertCircle,
} from "lucide-react";
import { SHERPA_SPECIALTIES, LANGUAGES, formatRate } from "@/lib/sherpa";

export interface ProposalItem {
  id: string;
  proposed_price_krw: number;
  proposed_scope: string;
  message: string;
  status: string;
  created_at: string;
  sherpa: {
    id: string;
    slug: string;
    display_name: string;
    tagline: string | null;
    avatar_url: string | null;
    rating_avg: number | null;
    rating_count: number;
    booking_count: number;
    languages: string[];
    specialties: string[];
  };
}

interface Props {
  tripId: string;
  initialSeeking: boolean;
  initialNotes: string | null;
  initialLanguages: string[];
  initialSpecialties: string[];
  initialBudgetMax: number | null;
  proposals: ProposalItem[];
}

export default function SherpaMatchingPanel({
  tripId,
  initialSeeking,
  initialNotes,
  initialLanguages,
  initialSpecialties,
  initialBudgetMax,
  proposals,
}: Props) {
  const router = useRouter();
  const [seeking, setSeeking] = useState(initialSeeking);
  const [notes, setNotes] = useState(initialNotes ?? "");
  const [languages, setLanguages] = useState<string[]>(initialLanguages);
  const [specialties, setSpecialties] = useState<string[]>(initialSpecialties);
  const [budgetMax, setBudgetMax] = useState(
    initialBudgetMax ? String(initialBudgetMax / 10000) : ""
  );
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [actingId, setActingId] = useState<string | null>(null);

  const toggle = <T,>(arr: T[], v: T): T[] =>
    arr.includes(v) ? arr.filter((x) => x !== v) : [...arr, v];

  const handleOpen = async () => {
    setSaving(true);
    setError(null);
    try {
      const res = await fetch(`/api/trips/${tripId}/seek-sherpa`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          open: true,
          notes: notes.trim() || null,
          requiredLanguages: languages,
          requiredSpecialties: specialties,
          budgetMaxKrw: budgetMax ? Number(budgetMax) * 10000 : null,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "저장 실패");
      setSeeking(true);
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "오류");
    } finally {
      setSaving(false);
    }
  };

  const handleClose = async () => {
    if (!confirm("매칭 공개를 종료할까요? 진행 중인 제안은 그대로 남습니다.")) return;
    setSaving(true);
    try {
      await fetch(`/api/trips/${tripId}/seek-sherpa`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ open: false }),
      });
      setSeeking(false);
      router.refresh();
    } finally {
      setSaving(false);
    }
  };

  const handleProposalAction = async (
    proposalId: string,
    action: "accept" | "decline"
  ) => {
    if (action === "accept" && !confirm("이 제안을 수락하시겠어요? 다른 제안은 자동 거절됩니다.")) return;
    setActingId(proposalId);
    try {
      const res = await fetch(`/api/sherpa/proposals/${proposalId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action }),
      });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error ?? "처리 실패");
      }
      router.refresh();
    } catch (err) {
      alert(err instanceof Error ? err.message : "오류");
    } finally {
      setActingId(null);
    }
  };

  const acceptedProposal = proposals.find((p) => p.status === "accepted");
  const pendingProposals = proposals.filter((p) => p.status === "pending");
  const otherProposals = proposals.filter(
    (p) => p.status !== "pending" && p.status !== "accepted"
  );

  return (
    <div className="bg-gradient-to-br from-emerald-50 via-white to-teal-50 rounded-3xl border border-emerald-100 p-6 mb-8">
      <div className="flex items-center gap-2 mb-1">
        <Mountain className="w-5 h-5 text-emerald-600" />
        <h2 className="text-lg font-bold text-slate-900">셰르파 매칭</h2>
      </div>

      {acceptedProposal ? (
        <AcceptedView proposal={acceptedProposal} />
      ) : seeking ? (
        <>
          <p className="text-sm text-slate-600 mb-4">
            매칭 공개 중. 셰르파들이 제안을 보내올 거예요.
          </p>
          <button
            onClick={handleClose}
            disabled={saving}
            className="text-xs font-semibold text-slate-500 hover:text-slate-700"
          >
            매칭 종료하기
          </button>
        </>
      ) : (
        <>
          <p className="text-sm text-slate-600 mb-4">
            이 여행을 셰르파에게 공개하면, 현지를 잘 아는 사람들이 제안금액과
            함께 합류 신청을 보냅니다.
          </p>

          <div className="space-y-3 mb-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                요청 메모 (선택)
              </label>
              <textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="어떤 셰르파가 필요한지 (예: '맛집 잘 아는 사람', '일본어 통역 필요')"
                rows={3}
                className="w-full px-3 py-2 rounded-xl border border-slate-200 focus:border-emerald-400 focus:ring-2 focus:ring-emerald-100 outline-none text-slate-900 text-sm resize-none"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                필요한 분야 (선택)
              </label>
              <div className="flex flex-wrap gap-1">
                {SHERPA_SPECIALTIES.map((s) => (
                  <button
                    key={s.id}
                    type="button"
                    onClick={() => setSpecialties(toggle(specialties, s.id))}
                    className={`px-2.5 py-1 rounded-full text-xs font-medium transition-colors ${
                      specialties.includes(s.id)
                        ? "bg-emerald-500 text-white"
                        : "bg-white border border-slate-200 text-slate-700 hover:border-emerald-300"
                    }`}
                  >
                    {s.emoji} {s.label}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                필요한 언어 (선택)
              </label>
              <div className="flex flex-wrap gap-1">
                {LANGUAGES.slice(0, 8).map((l) => (
                  <button
                    key={l.code}
                    type="button"
                    onClick={() => setLanguages(toggle(languages, l.code))}
                    className={`px-2.5 py-1 rounded-full text-xs font-medium transition-colors ${
                      languages.includes(l.code)
                        ? "bg-blue-500 text-white"
                        : "bg-white border border-slate-200 text-slate-700 hover:border-blue-300"
                    }`}
                  >
                    {l.emoji} {l.label}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                예산 한도 (만원, 선택)
              </label>
              <input
                type="number"
                inputMode="numeric"
                min={0}
                value={budgetMax}
                onChange={(e) => setBudgetMax(e.target.value)}
                placeholder="50"
                className="w-full px-3 py-2 rounded-xl border border-slate-200 focus:border-emerald-400 focus:ring-2 focus:ring-emerald-100 outline-none text-slate-900 text-sm"
              />
            </div>
          </div>

          {error && (
            <div className="flex items-start gap-2 p-3 mb-3 rounded-xl bg-rose-50 text-rose-700 text-sm">
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
              {error}
            </div>
          )}

          <button
            onClick={handleOpen}
            disabled={saving}
            className="w-full py-3 rounded-2xl bg-gradient-to-r from-emerald-500 to-teal-600 text-white font-bold flex items-center justify-center gap-2 hover:shadow-xl hover:shadow-emerald-500/25 transition-all disabled:opacity-40"
          >
            {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Mountain className="w-4 h-4" />}
            셰르파 매칭 시작
          </button>
        </>
      )}

      {/* Pending proposals */}
      {pendingProposals.length > 0 && (
        <div className="mt-6 pt-6 border-t border-emerald-100">
          <h3 className="text-sm font-bold text-slate-900 mb-3">
            받은 제안 {pendingProposals.length}건
          </h3>
          <div className="space-y-3">
            {pendingProposals.map((p) => (
              <ProposalCard
                key={p.id}
                proposal={p}
                onAccept={() => handleProposalAction(p.id, "accept")}
                onDecline={() => handleProposalAction(p.id, "decline")}
                acting={actingId === p.id}
              />
            ))}
          </div>
        </div>
      )}

      {otherProposals.length > 0 && (
        <details className="mt-4 pt-4 border-t border-emerald-100">
          <summary className="text-xs text-slate-500 cursor-pointer hover:text-slate-700">
            처리된 제안 {otherProposals.length}건 보기
          </summary>
          <div className="mt-3 space-y-2">
            {otherProposals.map((p) => (
              <div
                key={p.id}
                className="text-xs text-slate-500 bg-slate-50 rounded-lg p-2.5"
              >
                <span className="font-semibold text-slate-700">
                  {p.sherpa.display_name}
                </span>{" "}
                · {formatRate(p.proposed_price_krw)} ·{" "}
                {p.status === "declined"
                  ? "거절됨"
                  : p.status === "withdrawn"
                  ? "철회됨"
                  : p.status}
              </div>
            ))}
          </div>
        </details>
      )}
    </div>
  );
}

function AcceptedView({ proposal }: { proposal: ProposalItem }) {
  return (
    <div className="bg-emerald-100 border border-emerald-300 rounded-2xl p-5 mt-3">
      <div className="flex items-center gap-2 text-emerald-700 font-bold mb-2">
        <CheckCircle2 className="w-5 h-5" />
        매칭 완료
      </div>
      <p className="text-sm text-emerald-900 mb-3">
        <span className="font-bold">{proposal.sherpa.display_name}</span> 셰르파와
        매칭되었어요. 결제는 셰르파와 직접 협의 후 진행하세요.
      </p>
      <div className="bg-white rounded-xl p-3 text-sm">
        <p className="font-semibold text-slate-900 mb-1">
          {formatRate(proposal.proposed_price_krw)} · {proposal.proposed_scope}
        </p>
        <p className="text-xs text-slate-600 leading-relaxed">{proposal.message}</p>
      </div>
    </div>
  );
}

function ProposalCard({
  proposal,
  onAccept,
  onDecline,
  acting,
}: {
  proposal: ProposalItem;
  onAccept: () => void;
  onDecline: () => void;
  acting: boolean;
}) {
  return (
    <div className="bg-white border border-slate-200 rounded-2xl p-4">
      <div className="flex items-start gap-3 mb-3">
        {proposal.sherpa.avatar_url ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={proposal.sherpa.avatar_url}
            alt={proposal.sherpa.display_name}
            className="w-11 h-11 rounded-2xl object-cover"
          />
        ) : (
          <div className="w-11 h-11 rounded-2xl bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center text-white font-bold">
            {proposal.sherpa.display_name.charAt(0)}
          </div>
        )}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <a
              href={`/sherpa/${proposal.sherpa.slug}`}
              target="_blank"
              rel="noopener noreferrer"
              className="font-bold text-slate-900 hover:text-emerald-600 truncate"
            >
              {proposal.sherpa.display_name}
            </a>
            {proposal.sherpa.rating_count > 0 && (
              <span className="text-xs text-amber-600 inline-flex items-center gap-0.5">
                <Star className="w-3 h-3 fill-amber-400 text-amber-400" />
                {Number(proposal.sherpa.rating_avg).toFixed(2)}
                <span className="text-slate-400 font-normal">
                  ({proposal.sherpa.rating_count})
                </span>
              </span>
            )}
          </div>
          {proposal.sherpa.tagline && (
            <p className="text-xs text-slate-500 mt-0.5 line-clamp-1">
              {proposal.sherpa.tagline}
            </p>
          )}
        </div>
        <div className="text-right shrink-0">
          <p className="text-lg font-bold text-emerald-700 inline-flex items-center gap-0.5">
            <Wallet className="w-4 h-4" />
            {formatRate(proposal.proposed_price_krw)}
          </p>
        </div>
      </div>

      <div className="bg-slate-50 rounded-xl p-3 mb-3">
        <p className="text-xs font-semibold text-slate-500 mb-1">제안 범위</p>
        <p className="text-sm text-slate-800 mb-2">{proposal.proposed_scope}</p>
        <p className="text-xs font-semibold text-slate-500 mb-1">메시지</p>
        <p className="text-sm text-slate-700 leading-relaxed whitespace-pre-line">
          {proposal.message}
        </p>
      </div>

      <div className="flex gap-2">
        <button
          onClick={onAccept}
          disabled={acting}
          className="flex-1 py-2.5 rounded-xl bg-emerald-500 text-white text-sm font-semibold hover:bg-emerald-600 disabled:opacity-50 inline-flex items-center justify-center gap-1.5"
        >
          {acting ? (
            <Loader2 className="w-3.5 h-3.5 animate-spin" />
          ) : (
            <CheckCircle2 className="w-3.5 h-3.5" />
          )}
          수락
        </button>
        <button
          onClick={onDecline}
          disabled={acting}
          className="flex-1 py-2.5 rounded-xl bg-slate-100 text-slate-700 text-sm font-semibold hover:bg-slate-200 disabled:opacity-50 inline-flex items-center justify-center gap-1.5"
        >
          <XCircle className="w-3.5 h-3.5" />
          거절
        </button>
      </div>
    </div>
  );
}
