import { NextResponse } from "next/server";
import { getApiDocs } from "@/lib/api-data";

export function GET() {
  return NextResponse.json(getApiDocs());
}
