import { createMiddlewareClient } from "@supabase/auth-helpers-nextjs";
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

export async function middleware(req: NextRequest) {
  const res = NextResponse.next();
  const supabase = createMiddlewareClient({ req, res });

  // 세션 새로고침
  const {
    data: { session },
  } = await supabase.auth.getSession();

  // 보호된 경로 체크
  const { pathname } = req.nextUrl;

  // 에디터 페이지는 로그인이 필요
  if (pathname.startsWith("/editor") && !session) {
    const redirectUrl = new URL("/login", req.url);
    redirectUrl.searchParams.set("redirectTo", pathname);
    return NextResponse.redirect(redirectUrl);
  }

  return res;
}

export const config = {
  matcher: [
    /*
     * 아래 경로에 미들웨어 적용:
     * - /editor로 시작하는 모든 경로 (인증 필요 페이지)
     * - /auth로 시작하는 모든 경로 (인증 콜백)
     */
    "/editor/:path*",
    "/auth/:path*",
  ],
};
