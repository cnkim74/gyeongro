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
};

export default nextConfig;
