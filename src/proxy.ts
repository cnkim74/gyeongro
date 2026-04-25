import { auth } from "@/lib/auth";
import { NextResponse } from "next/server";

const SKIP_PATHS = [
  "/api/",
  "/login",
  "/signup",
  "/onboarding",
  "/_next/",
  "/favicon",
];

export default auth(async (req) => {
  try {
    const session = req.auth;
    const path = req.nextUrl.pathname;

    if (SKIP_PATHS.some((p) => path.startsWith(p))) return NextResponse.next();
    if (!session?.user?.id) return NextResponse.next();

    const phone = (session.user as { phone?: string | null | undefined }).phone;

    // 명시적으로 null인 경우(전화번호 미입력)에만 onboarding으로 리다이렉트
    // undefined(세션에 정보 누락)거나 값이 있으면 통과
    if (phone === null) {
      const url = req.nextUrl.clone();
      url.pathname = "/onboarding";
      url.searchParams.set("callbackUrl", path + req.nextUrl.search);
      return NextResponse.redirect(url);
    }

    return NextResponse.next();
  } catch {
    return NextResponse.next();
  }
});

export const config = {
  matcher: ["/((?!api|_next/static|_next/image|favicon|.*\\.(?:svg|png|jpg|jpeg|gif|webp)).*)"],
};
