import { NextRequest, NextResponse } from "next/server";
import { deleteNote } from "@/lib/crud";

export async function POST(request: NextRequest) {
  const formData = await request.formData();

  deleteNote(Number(formData.get("id") || 0));

  return NextResponse.redirect(new URL("/tasks?deleted=1", request.url));
}
