import { NextResponse } from "next/server";
import { getCurrentTrainingUser } from "@/lib/auth";
import { listFiles } from "@/lib/crud";

export async function GET() {
  const currentUser = await getCurrentTrainingUser();
  if (!currentUser) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  return NextResponse.json({
    results: listFiles(currentUser),
  });
}
