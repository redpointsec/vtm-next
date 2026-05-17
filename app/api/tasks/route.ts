import { NextRequest, NextResponse } from "next/server";
import { getCurrentTrainingUser } from "@/lib/auth";
import { listTasks, saveTask } from "@/lib/crud";
import { canManageProject, canManageTask, canManageProjects } from "@/lib/permissions";

function parseIds(formData: FormData, field: string) {
  return formData
    .getAll(field)
    .flatMap((value) => String(value).split(","))
    .map((id) => Number(id.trim()))
    .filter((id) => Number.isFinite(id) && id > 0);
}

export async function POST(request: NextRequest) {
  const currentUser = await getCurrentTrainingUser();
  if (!currentUser || !canManageProjects(currentUser)) {
    return NextResponse.redirect(new URL("/login?next=/tasks", request.url));
  }

  const formData = await request.formData();
  const id = Number(formData.get("id") || 0);
  const projectId = Number(formData.get("projectId") || 0);

  if ((id > 0 && !canManageTask(currentUser, id)) || !canManageProject(currentUser, projectId)) {
    return NextResponse.redirect(new URL("/tasks?error=forbidden", request.url));
  }

  const taskId = saveTask({
    id,
    projectId,
    title: String(formData.get("title") || ""),
    text: String(formData.get("text") || ""),
    status: String(formData.get("status") || "open"),
    completed: Number(formData.get("completed") || 0),
    priority: Number(formData.get("priority") || 1),
    dueDate: String(formData.get("dueDate") || ""),
    createdBy: currentUser.id,
    userIds: parseIds(formData, "userIds"),
  });

  return NextResponse.redirect(new URL(`/tasks?edit=${taskId}&saved=1`, request.url));
}

export async function GET() {
  const currentUser = await getCurrentTrainingUser();
  if (!currentUser) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  return NextResponse.json({
    results: listTasks(currentUser),
  });
}
