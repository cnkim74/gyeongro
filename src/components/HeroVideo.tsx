"use client";

// 히어로 배경 영상 — 서버가 이번 방문용으로 랜덤으로 고른 영상 한 편을 재생
// 화면 크기에 맞는 파일(PC/휴대폰)만 내려받고, 로딩 전 포스터 → 재생 시 페이드 전환.
// 움직임 줄이기 설정이면 영상 대신 포스터만.

import { useEffect, useRef, useState } from "react";
import type { HeroVideoSources } from "@/lib/hero";

export default function HeroVideo({ source }: { source: HeroVideoSources }) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [playing, setPlaying] = useState(false);

  useEffect(() => {
    const v = videoRef.current;
    if (!v) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const mobile = window.matchMedia("(max-width: 767px)").matches;
    v.src = mobile ? source.mobile : source.desktop;
    v.play().catch(() => {
      // 자동 재생이 막힌 환경(저전력 모드 등)은 포스터 유지
    });
  }, [source.desktop, source.mobile]);

  return (
    <>
      {(source.poster || source.mobilePoster) && (
        <picture>
          {source.mobilePoster && <source media="(max-width: 767px)" srcSet={source.mobilePoster} />}
          <img
            src={source.poster || source.mobilePoster}
            alt=""
            className="absolute inset-0 w-full h-full object-cover"
            fetchPriority="high"
          />
        </picture>
      )}
      <video
        ref={videoRef}
        className={`absolute inset-0 w-full h-full object-cover transition-opacity duration-1000 ${
          playing ? "opacity-100" : "opacity-0"
        }`}
        muted
        loop
        playsInline
        preload="auto"
        onPlaying={() => setPlaying(true)}
        aria-hidden
      />
    </>
  );
}
