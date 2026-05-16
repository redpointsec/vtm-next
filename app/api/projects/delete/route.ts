import { NextRequest, NextResponse } from "next/server";
import { deleteProject } from "@/lib/crud";

export async function POST(request: NextRequest) {
  const formData = await request.formData();
  const id = Number(formData.get("id") || 0);

  deleteProject(id);

  return NextResponse.redirect(new URL("/projects?deleted=1", request.url));
}
