import { NextRequest, NextResponse } from "next/server";
import { toggleTask } from "@/lib/crud";

export async function POST(request: NextRequest) {
  const formData = await request.formData();

  toggleTask(Number(formData.get("id") || 0));

  return NextResponse.redirect(new URL("/tasks?saved=1", request.url));
}
