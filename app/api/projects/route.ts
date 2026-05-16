import { NextRequest, NextResponse } from "next/server";
import { getProjectsApiData } from "@/lib/api-data";
import { saveProject } from "@/lib/crud";

function parseIds(value: FormDataEntryValue | null) {
  return String(value || "")
    .split(",")
    .map((id) => Number(id.trim()))
    .filter((id) => Number.isFinite(id) && id > 0);
}

export async function POST(request: NextRequest) {
  const formData = await request.formData();
  const id = Number(formData.get("id") || 0);

  const projectId = saveProject({
    id,
    title: String(formData.get("title") || ""),
    text: String(formData.get("text") || ""),
    priority: Number(formData.get("priority") || 1),
    dueDate: String(formData.get("dueDate") || ""),
    createdBy: Number(formData.get("createdBy") || 2),
    userIds: parseIds(formData.get("userIds")),
  });

  return NextResponse.redirect(new URL(`/projects?edit=${projectId}&saved=1`, request.url));
}

export function GET() {
  return NextResponse.json({
    results: getProjectsApiData(),
  });
}
