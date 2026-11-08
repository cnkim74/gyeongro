"use client";

// 구글 애널리틱스(GA4) 방문 기록 — Vercel 환경변수 NEXT_PUBLIC_GA_ID (G-로 시작) 가 있을 때만 켜짐
// 관리자 화면(/admin) 방문은 기록하지 않음 (운영자 클릭이 통계를 흐리지 않도록)
import Script from "next/script";
import { usePathname } from "next/navigation";
import { useEffect } from "react";

export default function GoogleAnalytics({ gaId }: { gaId: string }) {
  const pathname = usePathname();
  useEffect(() => {
    // gtag 는 보낼 때마다 이 값을 보고 기록 여부를 정함
    (window as unknown as Record<string, boolean>)[`ga-disable-${gaId}`] = pathname.startsWith("/admin");
  }, [pathname, gaId]);

  return (
    <>
      <Script src={`https://www.googletagmanager.com/gtag/js?id=${gaId}`} strategy="afterInteractive" />
      <Script id="ga-init" strategy="afterInteractive">
        {`window['ga-disable-${gaId}'] = location.pathname.indexOf('/admin') === 0;
window.dataLayer = window.dataLayer || [];
function gtag(){dataLayer.push(arguments);}
gtag('js', new Date());
gtag('config', '${gaId}');`}
      </Script>
    </>
  );
}
