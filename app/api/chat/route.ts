import { NextRequest, NextResponse } from "next/server";
import { getChatApiData } from "@/lib/api-data";
import { getCurrentTrainingUser } from "@/lib/auth";
import {
  appendChatMessage,
  assistantToolNames,
  createChatSession,
} from "@/lib/chatbot-tools";
import { runLlmAssistant } from "@/lib/llm-chat";

export async function POST(request: NextRequest) {
  const currentUser = await getCurrentTrainingUser();
  if (!currentUser) {
    return NextResponse.redirect(new URL("/login?next=/chat", request.url));
  }

  const formData = await request.formData();
  const message = String(formData.get("message") || "");
  const existingSessionId = Number(formData.get("sessionId") || 0);
  const sessionId =
    existingSessionId > 0
      ? existingSessionId
      : createChatSession(currentUser.id, message.slice(0, 48) || "Assistant session");

  appendChatMessage({
    sessionId,
    role: "user",
    content: message,
  });

  // Intentional vulnerability: LLM tools include broad data access and state-changing actions.
  const assistantResponse = await runLlmAssistant({
    user: currentUser,
    sessionId,
    message,
  });

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
    provider: "openrouter",
    baseUrl: process.env.OPENAI_BASE_URL || "https://openrouter.ai/api/v1",
    model: process.env.OPENAI_MODEL || "openai/gpt-oss-120b:free",
    tools: assistantToolNames,
    data: getChatApiData(),
  });
}
