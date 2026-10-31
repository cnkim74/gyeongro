"use client";

// AI 일정 생성 로딩 화면 — 비행기가 항로를 따라 날아가고, 여행 캐릭터들이 뛰고,
// 재미있는 문구가 바뀌며 기다림을 덜 지루하게.
// 뼈대(개요)가 완성되면 결과 화면으로 넘어가고, 나머지 Day 는 결과 화면에서 채워짐.

import { useEffect, useState } from "react";
import { AVATAR_PRESETS } from "@/lib/avatars";

const FUN_LINES = [
  "✈️ {dest}행 비행기 탑승 수속 중",
  "🗺️ 동선이 꼬이지 않게 지도 펼치는 중",
  "🍜 현지인 단골 맛집 메뉴판 정독 중",
  "📸 인생샷 명소 줄 서는 시간 계산 중",
  "🧳 캐리어 무게 23kg 맞추는 중",
  "☀️ 날씨 좋은 시간대에 맞춰 코스 짜는 중",
  "🚇 지하철·버스 노선도 외우는 중",
  "🏨 창밖 뷰 좋은 숙소 찾아보는 중",
  "🎫 입장권 할인 정보 뒤져보는 중",
  "🥐 빵집 오픈런 시간 체크 중",
  "🌙 야경 명소 해 지는 시간 확인 중",
  "🛍️ 기념품 가게 영업시간 확인 중",
];

// 화면에 등장할 캐릭터 (사람 1 + 동물 4)
const CREW = ["wanderer", "fox", "panda", "rabbit", "penguin"]
  .map((id) => AVATAR_PRESETS.find((a) => a.id === id))
  .filter((a): a is (typeof AVATAR_PRESETS)[number] => !!a);

export default function PlannerLoading({
  destination,
  totalDays,
  progress,
}: {
  destination: string;
  totalDays: number;
  progress: string | null;
}) {
  const [lineIdx, setLineIdx] = useState(0);
  const [elapsed, setElapsed] = useState(0);

  useEffect(() => {
    const t1 = setInterval(() => setLineIdx((i) => (i + 1) % FUN_LINES.length), 2600);
    const t2 = setInterval(() => setElapsed((s) => s + 1), 1000);
    return () => {
      clearInterval(t1);
      clearInterval(t2);
    };
  }, []);

  // 대략적인 진행률 — 개요는 보통 30~60초. 90% 에서 멈추고 개요가 오면 화면 전환
  const pct = Math.min(90, Math.round(90 * (1 - Math.exp(-elapsed / 25))));
  const line = FUN_LINES[lineIdx].replace("{dest}", destination || "여행지");

  return (
    <div className="fixed inset-0 z-[60] overflow-hidden bg-gradient-to-b from-sky-400 via-sky-300 to-blue-50">
      {/* 구름 */}
      <div className="pothos-cloud absolute top-[12%] text-6xl opacity-80" style={{ animationDuration: "26s" }}>☁️</div>
      <div className="pothos-cloud absolute top-[28%] text-4xl opacity-70" style={{ animationDuration: "18s", animationDelay: "-7s" }}>☁️</div>
      <div className="pothos-cloud absolute top-[6%] text-5xl opacity-60" style={{ animationDuration: "32s", animationDelay: "-15s" }}>☁️</div>

      <div className="relative h-full flex flex-col items-center justify-center px-6 text-center">
        {/* 항로 + 비행기 */}
        <svg viewBox="0 0 320 140" className="w-full max-w-md h-auto mb-2" aria-hidden>
          <path
            id="pothos-route"
            d="M 20 120 C 90 10, 230 10, 290 95"
            fill="none"
            stroke="white"
            strokeWidth="3"
            strokeDasharray="2 9"
            strokeLinecap="round"
            opacity="0.9"
          />
          {/* 출발점 */}
          <circle cx="20" cy="120" r="6" fill="white" />
          {/* 목적지 핀 */}
          <g className="pothos-pin">
            <path d="M290 72 c-9 0 -15 7 -15 15 c0 11 15 25 15 25 s15 -14 15 -25 c0 -8 -6 -15 -15 -15z" fill="#e11d48" />
            <circle cx="290" cy="87" r="5" fill="white" />
          </g>
          {/* 비행기 — 기수가 +x 방향(오른쪽)을 향하도록 직접 그림 → rotate="auto" 로 점선 방향과 정확히 일치
              (✈️ 이모지는 원래 45° 기울어진 그림이라 옆으로 나는 것처럼 보였음) */}
          <g>
            <g transform="scale(1.25)">
              <path
                d="M15 0 C15 -1.4 13.6 -2 12 -2 L4 -2 L-3 -12 L-6.5 -12 L-2 -2 L-9 -2 L-12 -6 L-14.5 -6 L-12.5 0 L-14.5 6 L-12 6 L-9 2 L-2 2 L-6.5 12 L-3 12 L4 2 L12 2 C13.6 2 15 1.4 15 0 Z"
                fill="#ffffff"
                stroke="#1d4ed8"
                strokeWidth="1.2"
                strokeLinejoin="round"
              />
            </g>
            <animateMotion dur="5s" repeatCount="indefinite" rotate="auto">
              <mpath href="#pothos-route" />
            </animateMotion>
          </g>
        </svg>

        <h2 className="text-[26px] sm:text-3xl font-extrabold text-slate-900 leading-tight">
          {destination || "여행지"} {totalDays}일 여행,
          <br />
          AI가 설계하고 있어요
        </h2>

        {/* 바뀌는 재미 문구 */}
        <p key={lineIdx} className="pothos-fade mt-4 text-lg sm:text-xl font-semibold text-blue-800 min-h-[1.75rem]">
          {line}
        </p>

        {/* 캐릭터들 */}
        <div className="mt-8 flex items-end justify-center gap-3">
          {CREW.map((a, i) => (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              key={a.id}
              src={a.url}
              alt={a.label}
              className="pothos-hop w-12 h-12 sm:w-14 sm:h-14 rounded-full bg-white shadow-md border-2 border-white"
              style={{ animationDelay: `${i * 0.18}s` }}
            />
          ))}
        </div>

        {/* 진행 막대 */}
        <div className="mt-8 w-full max-w-sm">
          <div className="h-3 rounded-full bg-white/60 overflow-hidden">
            <div
              className="h-full rounded-full bg-gradient-to-r from-blue-500 to-indigo-600 transition-all duration-1000"
              style={{ width: `${pct}%` }}
            />
          </div>
          <p className="mt-3 text-base font-medium text-slate-700">{progress ?? "여행 조건을 분석하고 있어요"}</p>
          <p className="mt-1 text-sm text-slate-500">
            {elapsed}초 경과 · 전체 동선이 나오면 바로 보여드릴게요
          </p>
        </div>
      </div>
    </div>
  );
}
