import { NextRequest, NextResponse } from "next/server";
import { AUTH_COOKIE_NAME, weakRedirectUrl } from "@/lib/auth";

function logout(request: NextRequest) {
  const target =
    request.nextUrl.searchParams.get("redirect") ||
    request.nextUrl.searchParams.get("next") ||
    "/login";

  const response = NextResponse.redirect(weakRedirectUrl(target, request.url, "/login"));

  response.cookies.set(AUTH_COOKIE_NAME, "", {
    // Intentional vulnerability preserved: cookie remains readable/non-secure even when cleared.
    httpOnly: false,
    secure: false,
    sameSite: "lax",
    path: "/",
    maxAge: 0,
  });

  return response;
}

export function GET(request: NextRequest) {
  return logout(request);
}

export function POST(request: NextRequest) {
  return logout(request);
}
