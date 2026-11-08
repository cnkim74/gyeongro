import type { MetadataRoute } from "next";

// 홈 화면에 추가했을 때의 앱 정보 — 아이폰은 홈 화면에 추가해야 웹 푸시 알림을 받을 수 있어요
export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Pothos — AI 여행 플래너",
    short_name: "Pothos",
    description: "AI 여행 일정, 현지 셰르파, 여행 인사이트",
    start_url: "/",
    display: "standalone",
    background_color: "#ffffff",
    theme_color: "#2563eb",
    lang: "ko",
    icons: [
      { src: "/push-icon-192.png", sizes: "192x192", type: "image/png" },
      { src: "/push-icon-512.png", sizes: "512x512", type: "image/png" },
    ],
  };
}
