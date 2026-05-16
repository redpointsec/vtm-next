import { NextResponse } from "next/server";
import { getUsersApiData } from "@/lib/api-data";
import { getCurrentTrainingUser } from "@/lib/auth";
import { isAdmin } from "@/lib/permissions";

export async function GET() {
  const currentUser = await getCurrentTrainingUser();

  if (!isAdmin(currentUser)) {
    return NextResponse.json({ error: "forbidden" }, { status: 403 });
  }

  return NextResponse.json({
    results: getUsersApiData(),
  });
}
