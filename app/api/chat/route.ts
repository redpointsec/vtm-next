import { NextRequest, NextResponse } from "next/server";
import {
  appendChatMessage,
  createChatSession,
  respondToAssistantMessage,
} from "@/lib/chatbot-tools";

export async function POST(request: NextRequest) {
  const formData = await request.formData();
  const message = String(formData.get("message") || "");
  const existingSessionId = Number(formData.get("sessionId") || 0);
  const sessionId =
    existingSessionId > 0
      ? existingSessionId
      : createChatSession(2, message.slice(0, 48) || "Assistant session");

  appendChatMessage({
    sessionId,
    role: "user",
    content: message,
  });

  // Intentional vulnerability: assistant tools run state-changing actions without per-tool auth checks.
  const assistantResponse = respondToAssistantMessage(message);

  appendChatMessage({
    sessionId,
    role: "assistant",
    content: assistantResponse.content,
    toolName: assistantResponse.toolName,
  });

  return NextResponse.redirect(new URL(`/chat?session=${sessionId}&sent=1`, request.url));
}

export async function GET() {
  return NextResponse.json({
    tools: [
      "overview",
      "get_users",
      "search_database",
      "add_project",
      "update_project",
      "add_task",
      "update_task",
      "add_note",
      "update_note",
    ],
  });
}
