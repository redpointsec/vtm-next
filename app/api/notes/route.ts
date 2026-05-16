import { NextRequest, NextResponse } from "next/server";
import { getCurrentTrainingUser } from "@/lib/auth";
import { listNotes, saveNote } from "@/lib/crud";
import { canViewTask } from "@/lib/permissions";

export async function POST(request: NextRequest) {
  const currentUser = await getCurrentTrainingUser();
  const formData = await request.formData();
  const id = Number(formData.get("id") || 0);
  const taskId = Number(formData.get("taskId") || 0);

  if (!currentUser || !canViewTask(currentUser, taskId)) {
    return NextResponse.redirect(new URL("/tasks?error=forbidden", request.url));
  }

  const noteId = saveNote({
    id,
    taskId,
    userId: Number(formData.get("userId") || currentUser.id),
    title: String(formData.get("title") || ""),
    text: String(formData.get("text") || ""),
    image: String(formData.get("image") || ""),
  });

  return NextResponse.redirect(new URL(`/tasks?note=${noteId}&saved=1`, request.url));
}

export async function GET(request: NextRequest) {
  const currentUser = await getCurrentTrainingUser();
  if (!currentUser) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  return NextResponse.json({
    results: listNotes(Number(request.nextUrl.searchParams.get("taskId") || 0) || undefined, currentUser),
  });
}
