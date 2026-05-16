import { NextRequest, NextResponse } from "next/server";
import { saveTask } from "@/lib/crud";

function parseIds(value: FormDataEntryValue | null) {
  return String(value || "")
    .split(",")
    .map((id) => Number(id.trim()))
    .filter((id) => Number.isFinite(id) && id > 0);
}

export async function POST(request: NextRequest) {
  const formData = await request.formData();
  const id = Number(formData.get("id") || 0);

  const taskId = saveTask({
    id,
    projectId: Number(formData.get("projectId") || 0),
    title: String(formData.get("title") || ""),
    text: String(formData.get("text") || ""),
    status: String(formData.get("status") || "open"),
    completed: Number(formData.get("completed") || 0),
    priority: Number(formData.get("priority") || 1),
    dueDate: String(formData.get("dueDate") || ""),
    createdBy: 2,
    userIds: parseIds(formData.get("userIds")),
  });

  return NextResponse.redirect(new URL(`/tasks?edit=${taskId}&saved=1`, request.url));
}
