import { NextResponse } from "next/server";
import { getUsersApiData } from "@/lib/api-data";

export function GET() {
  return NextResponse.json({
    results: getUsersApiData(),
  });
}
