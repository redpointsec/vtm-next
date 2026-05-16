import { NextRequest, NextResponse } from "next/server";
import { updateWeakPassword } from "@/lib/auth";

export async function POST(request: NextRequest) {
  const formData = await request.formData();
  const userId = Number(formData.get("userId") || 0);
  const password = String(formData.get("password") || "");

  // Intentional vulnerability: trusts the supplied userId and does not require current password.
  updateWeakPassword(userId, password);

  return NextResponse.redirect(new URL(`/profile/${userId}?password=1`, request.url));
}
