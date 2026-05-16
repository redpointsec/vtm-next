import { NextRequest, NextResponse } from "next/server";
import { getNotesApiData } from "@/lib/api-data";
import { saveNote } from "@/lib/crud";

export async function POST(request: NextRequest) {
  const formData = await request.formData();
  const id = Number(formData.get("id") || 0);

  const noteId = saveNote({
    id,
    taskId: Number(formData.get("taskId") || 0),
    userId: Number(formData.get("userId") || 2),
    title: String(formData.get("title") || ""),
    text: String(formData.get("text") || ""),
    image: String(formData.get("image") || ""),
  });

  return NextResponse.redirect(new URL(`/tasks?note=${noteId}&saved=1`, request.url));
}

export function GET(request: NextRequest) {
  return NextResponse.json({
    results: getNotesApiData(request.nextUrl.searchParams.get("taskId")),
  });
}
