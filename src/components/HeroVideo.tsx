"use client";

// 히어로 배경 영상 — 화면 크기(PC/휴대폰)와 시간대(낮/밤)에 맞는 영상 하나만 내려받아 재생
//   낮(06~18시, 방문자 기기 시간): 이륙하는 비행기 · 밤: 오로라
// 서버는 한국 시간 기준 포스터를 먼저 그리고, 방문자 시간대가 다르면 화면에서 바꿈.
// 로딩 전 포스터 → 재생 시 페이드 전환, 움직임 줄이기 설정이면 포스터만.

import { useEffect, useRef, useState } from "react";
import { dayPartOf, type DayPart } from "@/lib/hero";

export interface HeroVideoSources {
  desktop: string;
  mobile: string;
  poster?: string;
  mobilePoster?: string;
}


export default function HeroVideo({
  day,
  night,
  initial,
}: {
  day: HeroVideoSources;
  night: HeroVideoSources;
  /** 서버(한국 시간)가 고른 시간대 — 첫 화면 포스터용 */
  initial: DayPart;
}) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const imgRef = useRef<HTMLImageElement>(null);
  const sourceRef = useRef<HTMLSourceElement>(null);
  const [playing, setPlaying] = useState(false);
  const first = initial === "day" ? day : night;

  useEffect(() => {
    const v = videoRef.current;
    if (!v) return;
    const part = dayPartOf(new Date().getHours());
    const src = part === "day" ? day : night;
    const mobile = window.matchMedia("(max-width: 767px)").matches;

    // 방문자 시간대가 서버와 다르면 포스터도 교체
    if (part !== initial) {
      if (imgRef.current && src.poster) imgRef.current.src = src.poster;
      if (sourceRef.current && src.mobilePoster) sourceRef.current.srcset = src.mobilePoster;
    }
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    v.src = mobile ? src.mobile : src.desktop;
    v.play().catch(() => {
      // 자동 재생이 막힌 환경(저전력 모드 등)은 포스터 유지
    });
  }, [day, night, initial]);

  return (
    <>
      {(first.poster || first.mobilePoster) && (
        <picture>
          {first.mobilePoster && <source ref={sourceRef} media="(max-width: 767px)" srcSet={first.mobilePoster} />}
          <img
            ref={imgRef}
            src={first.poster || first.mobilePoster}
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
