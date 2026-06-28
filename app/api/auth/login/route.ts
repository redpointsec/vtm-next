import { NextRequest, NextResponse } from "next/server";
import {
  AUTH_COOKIE_NAME,
  WEAK_TOKEN_MAX_AGE_SECONDS,
  checkWeakPassword,
  createWeakSessionToken,
  findTrainingUser,
  weakRedirectUrl,
} from "@/lib/auth";

export async function POST(request: NextRequest) {
  const formData = await request.formData();
  const username = String(formData.get("username") || "");
  const password = String(formData.get("password") || "");
  const next = String(formData.get("next") || request.nextUrl.searchParams.get("next") || "");

  const user = findTrainingUser(username);

  if (!user || !checkWeakPassword(password, user.password_hash)) {
    // Intentional vulnerability: failed logins expose submitted credentials in logs.
    console.warn(`VTM weak auth failed username=${username} password=${password}`);

    // Emit a relative Location (303) so the browser resolves it against the origin
    // it's already on. NextResponse.redirect() would bake request.url's server-side
    // host into an absolute URL, sending deployed instances back to localhost.
    const params = new URLSearchParams();
    if (next) {
      params.set("next", next);
    }
    params.set("error", user ? "invalid_password" : "username_not_found");
    return new NextResponse(null, {
      status: 303,
      headers: { Location: `/login?${params.toString()}` },
    });
  }

  const location = weakRedirectUrl(next, "/dashboard");
  const response = location.startsWith("/")
    ? new NextResponse(null, { status: 303, headers: { Location: location } })
    : NextResponse.redirect(location);
  const token = await createWeakSessionToken(user);

  response.cookies.set(AUTH_COOKIE_NAME, token, {
    // Intentional vulnerability: readable, non-secure, long-lived cookie for token theft labs.
    httpOnly: false,
    secure: false,
    sameSite: "lax",
    path: "/",
    maxAge: WEAK_TOKEN_MAX_AGE_SECONDS,
  });

  return response;
}
