// 메인 히어로 — 움직이는 오로라 + 반짝이는 별 (또는 관리자가 올린 영상·사진)
// 서버·클라이언트 공용 (관리자 편집 화면의 미리보기에서도 사용)

import Link from "next/link";
import { ArrowRight, CheckCircle, Sparkles } from "lucide-react";
import { AURORA_PRESETS, BUNDLED_HERO_VIDEO, type HeroConfig } from "@/lib/hero";
import HeroVideo from "./HeroVideo";

// 서버·클라이언트에서 같은 별 배치가 나오도록 고정 시드 난수
function seeded(seed: number) {
  return () => {
    seed |= 0;
    seed = (seed + 0x6d2b79f5) | 0;
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

const STARS = (() => {
  const r = seeded(20261031);
  return Array.from({ length: 80 }, () => ({
    left: r() * 100,
    top: r() * 75,
    size: r() < 0.15 ? 3 : r() < 0.5 ? 2 : 1.2,
    dur: 2 + r() * 4,
    delay: -r() * 6,
  }));
})();

export default function HeroSection({
  config,
  preview = false,
}: {
  config: HeroConfig;
  /** 관리자 미리보기 (높이 축소) */
  preview?: boolean;
}) {
  const preset = AURORA_PRESETS[config.auroraPreset];
  const [c1, c2, c3, c4] = preset.colors;
  // 영상: 주소가 비어 있으면 내장 오로라 영상 / 사진: 주소가 있어야 표시
  const isVideo = config.background === "video";
  const hasMedia = isVideo || (config.background === "image" && !!config.mediaUrl);
  const showAurora = !hasMedia;

  return (
    <section
      className={`relative flex items-center overflow-hidden ${preview ? "min-h-[520px]" : "min-h-[88vh]"}`}
      style={{ background: preset.base }}
    >
      {/* ── 배경: 영상 / 사진 ─────────────────── */}
      {isVideo &&
        (config.mediaUrl ? (
          <HeroVideo
            desktopSrc={config.mediaUrl}
            mobileSrc={config.mediaUrl}
            desktopPoster={config.posterUrl || undefined}
          />
        ) : (
          <HeroVideo
            desktopSrc={BUNDLED_HERO_VIDEO.desktop}
            mobileSrc={BUNDLED_HERO_VIDEO.mobile}
            desktopPoster={BUNDLED_HERO_VIDEO.poster}
            mobilePoster={BUNDLED_HERO_VIDEO.mobilePoster}
          />
        ))}
      {hasMedia && config.background === "image" && (
        // eslint-disable-next-line @next/next/no-img-element
        <img className="absolute inset-0 w-full h-full object-cover" src={config.mediaUrl} alt="" />
      )}
      {hasMedia && (
        <div className="absolute inset-0" style={{ background: `rgba(2, 6, 23, ${config.overlay / 100})` }} />
      )}

      {/* ── 배경: 움직이는 오로라 ──────────────── */}
      {showAurora && (
        <div className="absolute inset-0 pointer-events-none" aria-hidden>
          <div
            className="pothos-aurora pothos-aurora-a"
            style={{ background: `linear-gradient(100deg, transparent 10%, ${c1}dd 35%, ${c2}bb 55%, transparent 80%)` }}
          />
          <div
            className="pothos-aurora pothos-aurora-b"
            style={{ background: `linear-gradient(80deg, transparent 15%, ${c3}bb 40%, ${c1}99 60%, transparent 85%)` }}
          />
          <div
            className="pothos-aurora pothos-aurora-c"
            style={{ background: `linear-gradient(110deg, transparent 20%, ${c4}99 45%, ${c2}77 65%, transparent 90%)` }}
          />
        </div>
      )}

      {/* ── 반짝이는 별 + 별똥별 ──────────────── */}
      {config.stars && (
        <div className="absolute inset-0 pointer-events-none" aria-hidden>
          {STARS.map((s, i) => (
            <span
              key={i}
              className="pothos-star"
              style={{
                left: `${s.left}%`,
                top: `${s.top}%`,
                width: s.size,
                height: s.size,
                animationDuration: `${s.dur}s`,
                animationDelay: `${s.delay}s`,
              }}
            />
          ))}
          <span className="pothos-shooting" style={{ top: "12%", left: "70%", animationDelay: "2s" }} />
          <span className="pothos-shooting" style={{ top: "28%", left: "40%", animationDelay: "9s" }} />
        </div>
      )}

      {/* 글자 뒤 은은한 어둠 — 오로라가 밝게 지나가도 글자가 잘 보이게 */}
      <div
        className="absolute inset-0 pointer-events-none"
        aria-hidden
        style={{ background: "radial-gradient(ellipse 70% 60% at 30% 50%, rgba(2,6,23,0.55), transparent 75%)" }}
      />

      {/* ── 내용 ──────────────────────────────── */}
      <div className={`relative z-10 w-full max-w-5xl mx-auto px-6 ${preview ? "py-16" : "py-28 sm:py-32"}`}>
        {config.badge && (
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/10 border border-white/15 backdrop-blur-md text-white/90 text-sm sm:text-base font-medium mb-7">
            <Sparkles className="w-4 h-4" style={{ color: c1 }} />
            {config.badge}
          </div>
        )}

        <h1
          className="text-[44px] leading-[1.15] sm:text-7xl font-bold text-white tracking-tight mb-6"
          style={{ textShadow: "0 2px 18px rgba(2,6,23,0.45)" }}
        >
          {config.titleLine1}
          {config.titleLine1 && <br />}
          <span
            className="bg-clip-text text-transparent"
            style={{
              backgroundImage: `linear-gradient(90deg, ${c1}, ${c2}, ${c3})`,
              filter: "drop-shadow(0 2px 14px rgba(2,6,23,0.55))",
            }}
          >
            {config.titleHighlight}
          </span>
        </h1>

        {config.subtitle && (
          <p
            className="text-lg sm:text-2xl text-white/90 max-w-2xl leading-relaxed mb-10"
            style={{ textShadow: "0 1px 10px rgba(2,6,23,0.6)" }}
          >
            {config.subtitle}
          </p>
        )}

        <div className="flex flex-col sm:flex-row gap-3">
          <Link
            href={config.primaryHref}
            className="group inline-flex items-center justify-center gap-2 px-8 py-5 rounded-2xl bg-white text-slate-950 font-bold text-lg shadow-[0_10px_40px_-10px_rgba(255,255,255,0.6)] hover:-translate-y-0.5 transition-all"
          >
            {config.primaryLabel}
            <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
          </Link>
          {config.secondaryLabel && (
            <Link
              href={config.secondaryHref}
              className="inline-flex items-center justify-center gap-2 px-8 py-5 rounded-2xl bg-white/10 border border-white/25 text-white font-bold text-lg backdrop-blur-md hover:bg-white/20 transition-colors"
            >
              {config.secondaryLabel}
            </Link>
          )}
        </div>

        {config.checks.length > 0 && (
          <div className="flex flex-wrap gap-2 mt-10">
            {config.checks.map((c) => (
              <span
                key={c}
                className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-full bg-white/10 border border-white/10 text-white/90 text-[15px] backdrop-blur-sm"
              >
                <CheckCircle className="w-4 h-4" style={{ color: c2 }} />
                {c}
              </span>
            ))}
          </div>
        )}
      </div>

      {!preview && (
        <div className="absolute bottom-0 left-0 right-0 h-24 bg-gradient-to-t from-white to-transparent" />
      )}
    </section>
  );
}
