import { NextRequest, NextResponse } from "next/server";
import { updateProfileByUserId } from "@/lib/profiles";

export async function POST(request: NextRequest) {
  const formData = await request.formData();
  const userId = Number(formData.get("userId") || 0);

  updateProfileByUserId({
    userId,
    firstName: String(formData.get("firstName") || ""),
    lastName: String(formData.get("lastName") || ""),
    email: String(formData.get("email") || ""),
    avatar: String(formData.get("avatar") || ""),
    dob: String(formData.get("dob") || ""),
    ssn: String(formData.get("ssn") || ""),
  });

  return NextResponse.redirect(new URL(`/profile/${userId}?saved=1`, request.url));
}
