import { NextRequest, NextResponse } from "next/server";
import { lookupResetTokenByEmailUnsafe } from "@/lib/profiles";

export async function POST(request: NextRequest) {
  const formData = await request.formData();
  const email = String(formData.get("email") || "");
  const reset = lookupResetTokenByEmailUnsafe(email);

  if (!reset?.reset_token) {
    return NextResponse.redirect(new URL("/forgot-password?error=1", request.url));
  }

  const resetUrl = new URL("/reset-password", request.url);
  resetUrl.searchParams.set("email", reset.email || email);
  resetUrl.searchParams.set("token", reset.reset_token);

  return NextResponse.redirect(resetUrl);
}
