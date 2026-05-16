import { NextRequest, NextResponse } from "next/server";
import { getCurrentTrainingUser } from "@/lib/auth";
import { deleteProject } from "@/lib/crud";
import { isAdmin } from "@/lib/permissions";

export async function POST(request: NextRequest) {
  const currentUser = await getCurrentTrainingUser();
  if (!isAdmin(currentUser)) {
    return NextResponse.redirect(new URL("/projects?error=forbidden", request.url));
  }

  const formData = await request.formData();
  const id = Number(formData.get("id") || 0);

  deleteProject(id);

  return NextResponse.redirect(new URL("/projects?deleted=1", request.url));
}
