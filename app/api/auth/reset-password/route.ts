import { NextRequest, NextResponse } from "next/server";
import { resetPasswordByTokenUnsafe } from "@/lib/profiles";

export async function POST(request: NextRequest) {
  const formData = await request.formData();
  const token = String(formData.get("token") || "");
  const email = String(formData.get("email") || "");
  const password = String(formData.get("password") || "");
  const result = resetPasswordByTokenUnsafe(token, password);

  const resetUrl = new URL("/reset-password", request.url);
  resetUrl.searchParams.set("email", email);
  resetUrl.searchParams.set("token", token);
  resetUrl.searchParams.set(result.count > 0 ? "changed" : "error", "1");

  return NextResponse.redirect(resetUrl);
}
