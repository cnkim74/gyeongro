"use client";

// 히어로 배경 영상 — 화면 크기에 맞는 영상 하나만 내려받아 재생
// (PC 1920×1080 / 휴대폰 세로 720×1280). 로딩 전에는 포스터 이미지를 보여주고,
// 재생이 시작되면 영상으로 부드럽게 전환. 움직임 줄이기 설정이면 영상 대신 포스터만.

import { useEffect, useRef, useState } from "react";

export default function HeroVideo({
  desktopSrc,
  mobileSrc,
  desktopPoster,
  mobilePoster,
}: {
  desktopSrc: string;
  mobileSrc: string;
  desktopPoster?: string;
  mobilePoster?: string;
}) {
  const ref = useRef<HTMLVideoElement>(null);
  const [playing, setPlaying] = useState(false);

  useEffect(() => {
    const v = ref.current;
    if (!v) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const mobile = window.matchMedia("(max-width: 767px)").matches;
    v.src = mobile ? mobileSrc : desktopSrc;
    v.play().catch(() => {
      // 자동 재생이 막힌 환경(저전력 모드 등)은 포스터 유지
    });
  }, [desktopSrc, mobileSrc]);

  return (
    <>
      {(desktopPoster || mobilePoster) && (
        <picture>
          {mobilePoster && <source media="(max-width: 767px)" srcSet={mobilePoster} />}
          <img
            src={desktopPoster || mobilePoster}
            alt=""
            className="absolute inset-0 w-full h-full object-cover"
            fetchPriority="high"
          />
        </picture>
      )}
      <video
        ref={ref}
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
