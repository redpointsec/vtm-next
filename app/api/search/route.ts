import { NextRequest, NextResponse } from "next/server";
import { unsafeGlobalSearch } from "@/lib/training-tools";

export async function GET(request: NextRequest) {
  const query = request.nextUrl.searchParams.get("q") || "";

  return NextResponse.json({
    query,
    results: unsafeGlobalSearch(query),
  });
}
