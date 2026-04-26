/**
 * Pothos brand mark
 * 그리스어 Πόθος = "먼 곳을 향한 동경"
 *
 * 의미: 출발점(작은 점) → 궤적(곡선) → 목적지(화살표)
 * 여행자의 갈망이 향하는 길을 시각화
 */

interface LogoProps {
  className?: string;
  size?: number;
}

export function LogoMark({ className = "", size = 24 }: LogoProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 32 32"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      aria-label="Pothos"
    >
      {/* 출발점 */}
      <circle cx="5" cy="27" r="2" fill="currentColor" />

      {/* 곡선 궤적 (그리움/여정) */}
      <path
        d="M 6 26 C 8 16, 14 8, 26 6"
        stroke="currentColor"
        strokeWidth="2.5"
        strokeLinecap="round"
        fill="none"
      />

      {/* 화살표 (도달점) */}
      <path
        d="M 19 6 L 26 6 L 26 13"
        stroke="currentColor"
        strokeWidth="2.5"
        strokeLinecap="round"
        strokeLinejoin="round"
        fill="none"
      />
    </svg>
  );
}

/**
 * 로고 + 워드마크 (라이트 모드용)
 */
export function LogoWordmark({
  className = "",
  textClassName = "",
}: {
  className?: string;
  textClassName?: string;
}) {
  return (
    <span className={`inline-flex items-center gap-2 ${className}`}>
      <span className="inline-flex items-center justify-center w-8 h-8 rounded-xl bg-gradient-to-br from-blue-600 to-indigo-600 text-white shadow-md">
        <LogoMark size={18} />
      </span>
      <span
        className={`text-xl font-bold tracking-tight ${textClassName}`}
        style={{ letterSpacing: "-0.02em" }}
      >
        Pothos
      </span>
    </span>
  );
}
