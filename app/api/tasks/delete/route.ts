import { NextRequest, NextResponse } from "next/server";
import { getCurrentTrainingUser } from "@/lib/auth";
import { deleteTask } from "@/lib/crud";
import { canManageTask } from "@/lib/permissions";

export async function POST(request: NextRequest) {
  const currentUser = await getCurrentTrainingUser();
  const formData = await request.formData();
  const id = Number(formData.get("id") || 0);

  if (!canManageTask(currentUser, id)) {
    return NextResponse.redirect(new URL("/tasks?error=forbidden", request.url));
  }

  deleteTask(id);

  return NextResponse.redirect(new URL("/tasks?deleted=1", request.url));
}
