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

    const loginUrl = new URL("/login", request.url);
    if (next) {
      loginUrl.searchParams.set("next", next);
    }
    loginUrl.searchParams.set("error", user ? "invalid_password" : "username_not_found");
    return NextResponse.redirect(loginUrl);
  }

  const response = NextResponse.redirect(weakRedirectUrl(next, request.url, "/dashboard"));
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
