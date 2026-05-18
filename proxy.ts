import { NextRequest, NextResponse } from "next/server";
import { isPublicRoute } from "./lib/route-policy.ts";

const AUTH_COOKIE_NAME = "vtm_session";

export function proxy(request: NextRequest) {
  const requestHeaders = new Headers(request.headers);
  requestHeaders.set("x-vtm-pathname", request.nextUrl.pathname);

  if (isPublicRoute(request.nextUrl.pathname) || request.cookies.has(AUTH_COOKIE_NAME)) {
    return NextResponse.next({
      request: {
        headers: requestHeaders,
      },
    });
  }

  const host = request.headers.get("host") ?? request.nextUrl.host;
  const proto =
    request.headers.get("x-forwarded-proto") ?? request.nextUrl.protocol.replace(":", "") ?? "http";
  const loginUrl = new URL(`${proto}://${host}/login`);
  loginUrl.searchParams.set("next", `${request.nextUrl.pathname}${request.nextUrl.search}`);
  return NextResponse.redirect(loginUrl);
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|.*\\..*).*)"],
};
