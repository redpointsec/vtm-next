import { NextRequest, NextResponse } from "next/server";
import { getCurrentTrainingUser } from "@/lib/auth";
import { listProjects, saveProject } from "@/lib/crud";
import { canManageProject, canManageProjects, isAdmin } from "@/lib/permissions";

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
    return NextResponse.redirect(new URL("/login?next=/projects", request.url));
  }

  const formData = await request.formData();
  const id = Number(formData.get("id") || 0);
  if (id > 0 && !canManageProject(currentUser, id)) {
    return NextResponse.redirect(new URL("/projects?error=forbidden", request.url));
  }

  const projectId = saveProject({
    id,
    title: String(formData.get("title") || ""),
    text: String(formData.get("text") || ""),
    priority: Number(formData.get("priority") || 1),
    dueDate: String(formData.get("dueDate") || ""),
    createdBy: isAdmin(currentUser) ? Number(formData.get("createdBy") || currentUser.id) : currentUser.id,
    userIds: parseIds(formData, "userIds"),
  });

  return NextResponse.redirect(new URL(`/projects?edit=${projectId}&saved=1`, request.url));
}

export async function GET() {
  const currentUser = await getCurrentTrainingUser();
  if (!currentUser) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  return NextResponse.json({
    results: listProjects(currentUser),
  });
}
