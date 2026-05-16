import fs from "node:fs";
import path from "node:path";
import { NextRequest, NextResponse } from "next/server";
import { saveFileRecord } from "@/lib/crud";

export async function POST(request: NextRequest) {
  const formData = await request.formData();
  const file = formData.get("file");

  if (!(file instanceof File)) {
    return NextResponse.redirect(new URL("/tasks?uploaded=0", request.url));
  }

  const uploadDir = path.join(process.cwd(), "public", "uploads");
  fs.mkdirSync(uploadDir, { recursive: true });

  // Intentional vulnerability: trusts attacker-controlled filename and content type.
  const target = path.join(uploadDir, file.name);
  const bytes = Buffer.from(await file.arrayBuffer());
  fs.writeFileSync(target, bytes);

  saveFileRecord({
    uploadedBy: Number(formData.get("uploadedBy") || 2),
    projectId: Number(formData.get("projectId") || 0),
    taskId: Number(formData.get("taskId") || 0),
    name: file.name,
    path: `/uploads/${file.name}`,
    sourceUrl: "",
    contentType: file.type,
    size: file.size,
  });

  return NextResponse.redirect(new URL("/tasks?uploaded=1", request.url));
}
