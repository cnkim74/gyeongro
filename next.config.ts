import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // 동적 페이지는 화면 이동(클라이언트 네비게이션) 시 항상 새로 불러오기.
  // 프로필 수정 후 헤더가 옛 정보로 남는 문제(클라이언트 라우터 캐시) 방지.
  experimental: {
    staleTimes: {
      dynamic: 0,
      static: 0,
    },
  },
  // 웹 푸시용 서비스워커 — 항상 최신 파일을 쓰도록
  async headers() {
    return [
      {
        source: "/sw.js",
        headers: [
          { key: "Content-Type", value: "application/javascript; charset=utf-8" },
          { key: "Cache-Control", value: "no-cache, no-store, must-revalidate" },
          { key: "Content-Security-Policy", value: "default-src 'self'; script-src 'self'" },
        ],
      },
    ];
  },
};

export default nextConfig;
