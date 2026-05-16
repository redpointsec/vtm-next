import OpenAI from "openai";
import type {
  ChatCompletionMessageParam,
  ChatCompletionTool,
} from "openai/resources/chat/completions";
import type { TrainingUser } from "./auth.ts";
import {
  getAssistantToolDefinitions,
  getChatMessages,
  getDatabaseOverview,
  runAssistantTool,
} from "./chatbot-tools.ts";

const SYSTEM_PROMPT =
  "You are a helpful assistant for the VTAM (Vulnerable Task Asset Manager). " +
  "You can search database records and help users create or update projects, tasks, and notes. " +
  "Use the available tools to query live data when needed. " +
  "The local context snapshot is authoritative for the current user, but may be incomplete. " +
  "Be concise and helpful in your responses.";

let client: OpenAI | null = null;

function getOpenAIClient() {
  if (!client) {
    client = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY || "",
      baseURL: process.env.OPENAI_BASE_URL || "https://openrouter.ai/api/v1",
      defaultHeaders: {
        "HTTP-Referer": process.env.OPENROUTER_SITE_URL || "http://localhost:3000",
        "X-Title": process.env.OPENROUTER_APP_NAME || "vtm-next",
      },
    });
  }

  return client;
}

function getModel() {
  return process.env.OPENAI_MODEL || "openai/gpt-oss-120b:free";
}

function buildHistory(sessionId: number): ChatCompletionMessageParam[] {
  return getChatMessages(sessionId)
    .filter((message) => message.role === "user" || message.role === "assistant")
    .slice(-20)
    .map((message) =>
      message.role === "user"
        ? { role: "user", content: message.content }
        : { role: "assistant", content: message.content },
    );
}

function parseToolArguments(value: string | null | undefined) {
  try {
    return JSON.parse(value || "{}") as Record<string, unknown>;
  } catch {
    return {};
  }
}

export async function runLlmAssistant(input: {
  user: TrainingUser;
  sessionId: number;
  message: string;
}) {
  if (!process.env.OPENAI_API_KEY) {
    return {
      content:
        "OPENAI_API_KEY is not configured. Set OPENAI_API_KEY, OPENAI_MODEL, and OPENAI_BASE_URL to enable the OpenRouter-backed assistant.",
      toolName: "configuration_error",
    };
  }

  const openai = getOpenAIClient();
  const messages: ChatCompletionMessageParam[] = [
    { role: "system", content: SYSTEM_PROMPT },
    {
      role: "system",
      content:
        `Current VTM Next user: ${input.user.username} (${input.user.role}).\n` +
        `Current VTM Next data snapshot:\n${JSON.stringify(getDatabaseOverview(), null, 2)}`,
    },
    ...buildHistory(input.sessionId),
  ];

  if (messages.at(-1)?.role !== "user" || messages.at(-1)?.content !== input.message) {
    messages.push({ role: "user", content: input.message });
  }

  const tools = getAssistantToolDefinitions() as unknown as ChatCompletionTool[];
  let finalText = "";
  let lastToolName = "";

  for (let iteration = 0; iteration < 10; iteration += 1) {
    const response = await openai.chat.completions.create({
      model: getModel(),
      messages,
      tools,
      tool_choice: "auto",
    });
    const choice = response.choices[0];
    const assistantMessage = choice.message;

    if (assistantMessage.content) {
      finalText += assistantMessage.content;
    }

    if (choice.finish_reason !== "tool_calls" || !assistantMessage.tool_calls?.length) {
      break;
    }

    messages.push({
      role: "assistant",
      content: assistantMessage.content || null,
      tool_calls: assistantMessage.tool_calls,
    });

    for (const toolCall of assistantMessage.tool_calls) {
      if (toolCall.type !== "function") {
        continue;
      }

      const toolName = toolCall.function.name;
      const args = parseToolArguments(toolCall.function.arguments);
      const result = runAssistantTool(toolName, args);
      lastToolName = result.toolName;

      messages.push({
        role: "tool",
        tool_call_id: toolCall.id,
        content: result.content,
      });
    }
  }

  return {
    content: finalText.trim() || "I could not generate a response. Please try again.",
    toolName: lastToolName || "llm",
  };
}
