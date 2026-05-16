import { NextResponse } from "next/server";
import { getApiOverview } from "@/lib/api-data";

export function GET() {
  return NextResponse.json(getApiOverview());
}
