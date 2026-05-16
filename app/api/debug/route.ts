import { NextResponse } from "next/server";
import { headers } from "next/headers";
import { plannedVulnerabilities } from "@/lib/vulnerabilities";

export async function GET() {
  const headerStore = await headers();

  return NextResponse.json({
    debug: true,
    headers: Object.fromEntries(headerStore.entries()),
    environment: process.env,
    plannedVulnerabilities,
  });
}
