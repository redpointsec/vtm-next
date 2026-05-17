"use client";

import { useRef, useState } from "react";
import type { ChatMessage } from "@/lib/chatbot-tools";

type DisplayMessage = {
  id: string | number;
  role: ChatMessage["role"];
  content: string;
  tool_name: string | null;
  pending?: boolean;
};

const QUICK_QUESTIONS = [
  "List my open tasks.",
  "What projects am I assigned to?",
  "Show recent notes on my tasks.",
  "Give me a database overview.",
  "Add a task to the Marketing Campaign project.",
];

type ChatPanelProps = {
  sessionId: number;
  initialMessages: ChatMessage[];
};

export function ChatPanel({ sessionId, initialMessages }: ChatPanelProps) {
  const [messages, setMessages] = useState<DisplayMessage[]>(initialMessages);
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const localIdRef = useRef(0);

  function nextLocalId(kind: string) {
    localIdRef.current += 1;
    return `${kind}-${localIdRef.current}`;
  }

  async function send(message: string) {
    const trimmed = message.trim();
    if (!trimmed || pending) {
      return;
    }
    setError(null);

    const userMessage: DisplayMessage = {
      id: nextLocalId("user"),
      role: "user",
      content: trimmed,
      tool_name: null,
    };
    const thinkingId = nextLocalId("thinking");
    const thinkingMessage: DisplayMessage = {
      id: thinkingId,
      role: "assistant",
      content: "Thinking …",
      tool_name: null,
      pending: true,
    };

    setMessages((prev) => [...prev, userMessage, thinkingMessage]);
    setPending(true);
    if (textareaRef.current) {
      textareaRef.current.value = "";
    }

    try {
      const body = new FormData();
      body.set("sessionId", String(sessionId));
      body.set("message", trimmed);

      const response = await fetch("/api/chat", {
        method: "POST",
        body,
        headers: { Accept: "application/json" },
      });

      if (!response.ok) {
        throw new Error(`Request failed (${response.status})`);
      }

      const data = (await response.json()) as {
        content: string;
        toolName: string | null;
      };

      setMessages((prev) =>
        prev.map((m) =>
          m.id === thinkingId
            ? { ...m, content: data.content, tool_name: data.toolName, pending: false }
            : m,
        ),
      );
    } catch (err) {
      setMessages((prev) => prev.filter((m) => m.id !== thinkingId));
      setError(err instanceof Error ? err.message : "Request failed");
    } finally {
      setPending(false);
    }
  }

  function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    send(textareaRef.current?.value || "");
  }

  return (
    <section className="card">
      <div className="card-header">Conversation</div>
      <div className="card-body chat-panel">
        <div className="message-list">
          {messages.length === 0 ? (
            <p className="empty-chat">Ask me how I can help.</p>
          ) : (
            messages.map((message) => (
              <article
                className={`chat-message ${message.role}${message.pending ? " pending" : ""}`}
                key={message.id}
              >
                <div className="message-meta">
                  <strong>{message.role}</strong>
                  {message.tool_name ? <span>{message.tool_name}</span> : null}
                </div>
                <pre>{message.content}</pre>
              </article>
            ))
          )}
        </div>

        <div className="quick-questions" aria-label="Suggested questions">
          {QUICK_QUESTIONS.map((question) => (
            <button
              type="button"
              key={question}
              className="button secondary compact"
              onClick={() => send(question)}
              disabled={pending}
            >
              {question}
            </button>
          ))}
        </div>

        <form className="form-grid chat-form" onSubmit={handleSubmit}>
          <div className="field">
            <label htmlFor="message">Message</label>
            <textarea id="message" name="message" ref={textareaRef} disabled={pending} />
          </div>
          {error ? <p className="form-error">{error}</p> : null}
          <button className="button" type="submit" disabled={pending}>
            {pending ? "Sending …" : "Send"}
          </button>
        </form>
      </div>
    </section>
  );
}
