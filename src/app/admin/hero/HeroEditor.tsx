"use client";

// 메인 히어로 편집 — 배경(오로라·영상·사진), 문구, 버튼을 바꾸고 실시간 미리보기 후 저장

import { useState } from "react";
import { Loader2, Upload, RotateCcw, Save, ExternalLink } from "lucide-react";
import HeroSection from "@/components/HeroSection";
import { AURORA_PRESETS, DEFAULT_HERO, type HeroConfig, type AuroraPreset, type HeroBackground } from "@/lib/hero";

const BG_OPTIONS: { id: HeroBackground; label: string; desc: string }[] = [
  { id: "aurora", label: "🌌 오로라 애니메이션", desc: "움직이는 오로라 + 반짝이는 별 (기본)" },
  { id: "video", label: "🎬 영상", desc: "MP4·WebM, 50MB 이하 (자동 재생·소리 없음)" },
  { id: "image", label: "🖼️ 사진", desc: "JPG·PNG·WebP" },
];

export default function HeroEditor({ initial }: { initial: HeroConfig }) {
  const [c, setC] = useState<HeroConfig>(initial);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState<"media" | "poster" | null>(null);
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null);

  const set = <K extends keyof HeroConfig>(k: K, v: HeroConfig[K]) => setC((p) => ({ ...p, [k]: v }));

  const upload = async (file: File, target: "media" | "poster") => {
    setUploading(target);
    setMsg(null);
    try {
      const r = await fetch("/api/admin/hero/upload-url", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ contentType: file.type, size: file.size }),
      });
      const j = await r.json();
      if (!r.ok) throw new Error(j.error ?? "업로드를 준비하지 못했어요.");
      // 서버를 거치지 않고 저장소로 바로 업로드 (영상 용량 대응)
      const fd = new FormData();
      fd.append("cacheControl", "31536000");
      fd.append("", file);
      const up = await fetch(j.signedUrl, {
        method: "PUT",
        headers: j.apikey ? { apikey: j.apikey, "x-upsert": "false" } : { "x-upsert": "false" },
        body: fd,
      });
      if (!up.ok) throw new Error(`업로드 실패 (${up.status})`);
      if (target === "media") set("mediaUrl", j.publicUrl);
      else set("posterUrl", j.publicUrl);
      setMsg({ ok: true, text: "업로드 완료! 아래 '저장하기'를 눌러야 메인에 반영돼요." });
    } catch (e) {
      setMsg({ ok: false, text: e instanceof Error ? e.message : "업로드 실패" });
    } finally {
      setUploading(null);
    }
  };

  const save = async () => {
    setSaving(true);
    setMsg(null);
    try {
      const r = await fetch("/api/admin/hero", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(c),
      });
      const j = await r.json();
      if (!r.ok) throw new Error(j.error ?? "저장 실패");
      setC(j.config);
      setMsg({ ok: true, text: "저장했어요. 메인 화면에 바로 반영돼요." });
    } catch (e) {
      setMsg({ ok: false, text: e instanceof Error ? e.message : "저장 실패" });
    } finally {
      setSaving(false);
    }
  };

  const input = "w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-blue-400 focus:ring-2 focus:ring-blue-100 outline-none text-base text-gray-900";
  const label = "block text-[15px] font-bold text-gray-800 mb-2";

  return (
    <div className="p-5 sm:p-8 max-w-7xl">
      <div className="flex flex-wrap items-center justify-between gap-3 mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">메인 히어로 관리</h1>
          <p className="text-[15px] text-gray-500 mt-1">메인 화면 첫 화면의 배경과 문구를 바꿀 수 있어요.</p>
        </div>
        <a href="/" target="_blank" className="inline-flex items-center gap-1.5 text-[15px] font-semibold text-blue-600">
          메인 화면 열기 <ExternalLink className="w-4 h-4" />
        </a>
      </div>

      <div className="grid lg:grid-cols-[420px_1fr] gap-6 items-start">
        {/* ── 편집 ─────────────────────────── */}
        <div className="bg-white rounded-3xl border border-gray-100 shadow-sm p-5 space-y-6">
          <div>
            <span className={label}>배경</span>
            <div className="space-y-2">
              {BG_OPTIONS.map((o) => (
                <label
                  key={o.id}
                  className={`flex items-start gap-3 p-3 rounded-2xl border-2 cursor-pointer ${
                    c.background === o.id ? "border-blue-500 bg-blue-50" : "border-gray-100"
                  }`}
                >
                  <input type="radio" className="mt-1" checked={c.background === o.id} onChange={() => set("background", o.id)} />
                  <span>
                    <span className="block text-[15px] font-bold text-gray-900">{o.label}</span>
                    <span className="block text-sm text-gray-500">{o.desc}</span>
                  </span>
                </label>
              ))}
            </div>
          </div>

          {c.background === "aurora" && (
            <div>
              <span className={label}>오로라 색</span>
              <div className="grid grid-cols-3 gap-2">
                {(Object.keys(AURORA_PRESETS) as AuroraPreset[]).map((k) => {
                  const p = AURORA_PRESETS[k];
                  return (
                    <button
                      key={k}
                      onClick={() => set("auroraPreset", k)}
                      className={`rounded-2xl p-1 border-2 ${c.auroraPreset === k ? "border-blue-500" : "border-transparent"}`}
                    >
                      <span
                        className="block h-14 rounded-xl"
                        style={{ background: `linear-gradient(120deg, ${p.colors[0]}, ${p.colors[1]}, ${p.colors[2]})` }}
                      />
                      <span className="block text-xs text-gray-600 mt-1 leading-tight">{p.label}</span>
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {c.background !== "aurora" && (
            <div className="space-y-3">
              <span className={label}>{c.background === "video" ? "영상" : "사진"}</span>
              <label className="flex items-center justify-center gap-2 px-4 py-3 rounded-xl border-2 border-dashed border-gray-300 text-[15px] font-semibold text-gray-700 cursor-pointer hover:bg-gray-50">
                {uploading === "media" ? <Loader2 className="w-5 h-5 animate-spin" /> : <Upload className="w-5 h-5" />}
                {uploading === "media" ? "올리는 중…" : "파일 올리기"}
                <input
                  type="file"
                  className="hidden"
                  accept={c.background === "video" ? "video/mp4,video/webm" : "image/jpeg,image/png,image/webp"}
                  onChange={(e) => e.target.files?.[0] && upload(e.target.files[0], "media")}
                />
              </label>
              <input
                className={input}
                placeholder="또는 주소 붙여넣기 (https://...)"
                value={c.mediaUrl}
                onChange={(e) => set("mediaUrl", e.target.value)}
              />
              {c.background === "video" && (
                <>
                  <label className="flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl border border-gray-200 text-sm font-semibold text-gray-600 cursor-pointer hover:bg-gray-50">
                    {uploading === "poster" ? <Loader2 className="w-4 h-4 animate-spin" /> : <Upload className="w-4 h-4" />}
                    영상 로딩 전 사진 (선택)
                    <input
                      type="file"
                      className="hidden"
                      accept="image/jpeg,image/png,image/webp"
                      onChange={(e) => e.target.files?.[0] && upload(e.target.files[0], "poster")}
                    />
                  </label>
                  {c.posterUrl && <p className="text-xs text-gray-500 break-all">{c.posterUrl}</p>}
                </>
              )}
              <div>
                <span className="block text-sm font-semibold text-gray-700 mb-1">어둡게 덮기 {c.overlay}% (글자가 잘 보이게)</span>
                <input type="range" min={0} max={80} value={c.overlay} onChange={(e) => set("overlay", Number(e.target.value))} className="w-full" />
              </div>
            </div>
          )}

          <label className="flex items-center gap-2 text-[15px] font-semibold text-gray-800">
            <input type="checkbox" checked={c.stars} onChange={(e) => set("stars", e.target.checked)} />
            반짝이는 별 표시
          </label>

          <div className="space-y-4">
            <div>
              <span className={label}>상단 작은 문구</span>
              <input className={input} value={c.badge} maxLength={40} onChange={(e) => set("badge", e.target.value)} />
            </div>
            <div>
              <span className={label}>제목 첫 줄</span>
              <input className={input} value={c.titleLine1} maxLength={30} onChange={(e) => set("titleLine1", e.target.value)} />
            </div>
            <div>
              <span className={label}>제목 강조 줄 (그라데이션)</span>
              <input className={input} value={c.titleHighlight} maxLength={30} onChange={(e) => set("titleHighlight", e.target.value)} />
            </div>
            <div>
              <span className={label}>설명</span>
              <textarea className={`${input} min-h-[84px]`} value={c.subtitle} maxLength={120} onChange={(e) => set("subtitle", e.target.value)} />
            </div>
            <div className="grid grid-cols-2 gap-2">
              <div>
                <span className={label}>주 버튼</span>
                <input className={input} value={c.primaryLabel} maxLength={24} onChange={(e) => set("primaryLabel", e.target.value)} />
              </div>
              <div>
                <span className={label}>연결 주소</span>
                <input className={input} value={c.primaryHref} onChange={(e) => set("primaryHref", e.target.value)} />
              </div>
              <div>
                <span className={label}>보조 버튼</span>
                <input className={input} value={c.secondaryLabel} maxLength={24} placeholder="비우면 숨김" onChange={(e) => set("secondaryLabel", e.target.value)} />
              </div>
              <div>
                <span className={label}>연결 주소</span>
                <input className={input} value={c.secondaryHref} onChange={(e) => set("secondaryHref", e.target.value)} />
              </div>
            </div>
            <div>
              <span className={label}>하단 체크 문구 (최대 4개)</span>
              <div className="grid grid-cols-2 gap-2">
                {[0, 1, 2, 3].map((i) => (
                  <input
                    key={i}
                    className={input}
                    maxLength={20}
                    value={c.checks[i] ?? ""}
                    placeholder={`문구 ${i + 1}`}
                    onChange={(e) => {
                      // 항상 4칸 유지 (빈 칸은 저장 시 제거)
                      const next = [0, 1, 2, 3].map((j) => (j === i ? e.target.value : c.checks[j] ?? ""));
                      set("checks", next);
                    }}
                  />
                ))}
              </div>
            </div>
          </div>

          {msg && (
            <p className={`text-[15px] font-semibold ${msg.ok ? "text-emerald-600" : "text-rose-600"}`}>{msg.text}</p>
          )}

          <div className="flex gap-2">
            <button
              onClick={save}
              disabled={saving || !!uploading}
              className="flex-1 inline-flex items-center justify-center gap-2 py-4 rounded-2xl bg-blue-600 text-white text-lg font-bold disabled:opacity-50"
            >
              {saving ? <Loader2 className="w-5 h-5 animate-spin" /> : <Save className="w-5 h-5" />}
              저장하기
            </button>
            <button
              onClick={() => setC(DEFAULT_HERO)}
              className="inline-flex items-center justify-center gap-1.5 px-4 rounded-2xl border border-gray-200 text-[15px] font-semibold text-gray-600"
              title="기본값으로 (저장해야 반영)"
            >
              <RotateCcw className="w-4 h-4" /> 기본값
            </button>
          </div>
        </div>

        {/* ── 실시간 미리보기 ─────────────────── */}
        <div className="lg:sticky lg:top-20">
          <p className="text-[15px] font-bold text-gray-700 mb-2">미리보기</p>
          <div className="rounded-3xl overflow-hidden border border-gray-200 shadow-lg pointer-events-none">
            <HeroSection
              config={{ ...c, checks: c.checks.filter((x) => typeof x === "string" && x.trim()) }}
              preview
            />
          </div>
        </div>
      </div>
    </div>
  );
}
