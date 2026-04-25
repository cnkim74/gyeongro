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
  const session = req.auth;
  const path = req.nextUrl.pathname;

  if (SKIP_PATHS.some((p) => path.startsWith(p))) return NextResponse.next();
  if (!session?.user?.id) return NextResponse.next();

  // Phone 체크는 /api/profile/check-phone 호출로 위임 (DB 조회는 Edge에서 어려움)
  // 대신 세션 콜백에서 phone을 세션에 포함
  const hasPhone = (session.user as { phone?: string | null }).phone;
  if (hasPhone) return NextResponse.next();

  const url = req.nextUrl.clone();
  url.pathname = "/onboarding";
  url.searchParams.set("callbackUrl", path + req.nextUrl.search);
  return NextResponse.redirect(url);
});

export const config = {
  matcher: ["/((?!api|_next/static|_next/image|favicon|.*\\.(?:svg|png|jpg|jpeg|gif|webp)).*)"],
};
