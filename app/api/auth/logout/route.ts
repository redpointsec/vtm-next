import { NextRequest, NextResponse } from "next/server";
import { AUTH_COOKIE_NAME, weakRedirectUrl } from "@/lib/auth";

function logout(request: NextRequest) {
  const target =
    request.nextUrl.searchParams.get("redirect") ||
    request.nextUrl.searchParams.get("next") ||
    "/login";

  const location = weakRedirectUrl(target, "/login");
  const response = location.startsWith("/")
    ? new NextResponse(null, { status: 303, headers: { Location: location } })
    : NextResponse.redirect(location);

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
