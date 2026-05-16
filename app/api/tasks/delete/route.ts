import { NextRequest, NextResponse } from "next/server";
import { deleteTask } from "@/lib/crud";

export async function POST(request: NextRequest) {
  const formData = await request.formData();

  deleteTask(Number(formData.get("id") || 0));

  return NextResponse.redirect(new URL("/tasks?deleted=1", request.url));
}
