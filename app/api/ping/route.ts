import { NextRequest, NextResponse } from "next/server";
import { runPingUnsafe } from "@/lib/training-tools";

export async function GET(request: NextRequest) {
  const host = request.nextUrl.searchParams.get("host") || "";

  return new NextResponse(runPingUnsafe(host), {
    headers: {
      "content-type": "text/plain; charset=utf-8",
    },
  });
}

export async function POST(request: NextRequest) {
  const formData = await request.formData();
  const host = String(formData.get("host") || "");

  return NextResponse.redirect(new URL(`/ping?host=${encodeURIComponent(host)}`, request.url));
}
