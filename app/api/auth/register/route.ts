import { NextRequest, NextResponse } from "next/server";
import {
  AUTH_COOKIE_NAME,
  WEAK_TOKEN_MAX_AGE_SECONDS,
  createWeakSessionToken,
  createWeakUser,
  weakRedirectUrl,
} from "@/lib/auth";

export async function POST(request: NextRequest) {
  const formData = await request.formData();
  const username = String(formData.get("username") || "");
  const password = String(formData.get("password") || "");
  const email = String(formData.get("email") || "");
  const next = String(formData.get("next") || "");

  try {
    const user = createWeakUser({
      username,
      password,
      email,
      firstName: String(formData.get("firstName") || ""),
      lastName: String(formData.get("lastName") || ""),
      avatar: String(formData.get("avatar") || ""),
      dob: String(formData.get("dob") || ""),
      ssn: String(formData.get("ssn") || ""),
    });

    if (!user) {
      return NextResponse.redirect(new URL("/register?error=1", request.url));
    }

    const location = weakRedirectUrl(next, `/profile/${user.id}`);
    const response = location.startsWith("/")
      ? new NextResponse(null, { status: 303, headers: { Location: location } })
      : NextResponse.redirect(location);
    const token = await createWeakSessionToken(user);

    response.cookies.set(AUTH_COOKIE_NAME, token, {
      // Intentional vulnerability: registration creates the same readable weak session cookie.
      httpOnly: false,
      secure: false,
      sameSite: "lax",
      path: "/",
      maxAge: WEAK_TOKEN_MAX_AGE_SECONDS,
    });

    return response;
  } catch (error) {
    console.warn(`VTM weak registration failed username=${username} password=${password}`, error);
    return NextResponse.redirect(new URL("/register?error=1", request.url));
  }
}
