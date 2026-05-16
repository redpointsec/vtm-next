import fs from "node:fs";
import path from "node:path";
import { NextRequest, NextResponse } from "next/server";
import { saveFileRecord } from "@/lib/crud";

export async function POST(request: NextRequest) {
  const formData = await request.formData();
  const sourceUrl = String(formData.get("sourceUrl") || "");
  const uploadDir = path.join(process.cwd(), "public", "uploads");
  fs.mkdirSync(uploadDir, { recursive: true });

  // Intentional vulnerability: fetches arbitrary URLs server-side for SSRF training.
  const response = await fetch(sourceUrl);
  const bytes = Buffer.from(await response.arrayBuffer());
  const parsed = new URL(sourceUrl);
  const name = path.basename(parsed.pathname) || "remote-import";
  const target = path.join(uploadDir, name);
  fs.writeFileSync(target, bytes);

  saveFileRecord({
    uploadedBy: Number(formData.get("uploadedBy") || 2),
    projectId: Number(formData.get("projectId") || 0),
    taskId: Number(formData.get("taskId") || 0),
    name,
    path: `/uploads/${name}`,
    sourceUrl,
    contentType: response.headers.get("content-type") || "application/octet-stream",
    size: bytes.length,
  });

  return NextResponse.redirect(new URL("/tasks?uploaded=1", request.url));
}
