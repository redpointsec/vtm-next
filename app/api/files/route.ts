import { NextResponse } from "next/server";
import { getFilesApiData } from "@/lib/api-data";

export function GET() {
  return NextResponse.json({
    results: getFilesApiData(),
  });
}
