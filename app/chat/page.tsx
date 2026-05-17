import {
  createChatSession,
  getChatMessages,
  listChatSessions,
} from "@/lib/chatbot-tools";
import { ChatPanel } from "./chat-panel";

export const dynamic = "force-dynamic";

type ChatPageProps = {
  searchParams?: Promise<{
    session?: string;
    sent?: string;
    new?: string;
  }>;
};

export default async function ChatPage({ searchParams }: ChatPageProps) {
  const params = await searchParams;
  const sessions = listChatSessions();
  const selectedSessionId =
    params && "new" in params
      ? createChatSession(2, "New assistant session")
      : Number(params?.session || 0) || sessions.at(0)?.id || createChatSession(2, "New assistant session");
  const messages = getChatMessages(selectedSessionId);

  return (
    <>
      <div className="page-header">
        <div>
          <h1>AI Assistant</h1>
          <p>Tool-enabled assistant for broad search and project/task/note mutation.</p>
        </div>
        <a className="button secondary" href="/chat?new=1">
          New session
        </a>
      </div>

      <div className="grid chat-grid">
        <section className="card">
          <div className="card-header">Sessions</div>
          <div className="card-body">
            <nav className="session-list" aria-label="Chat sessions">
              {sessions.map((session) => (
                <a
                  className={session.id === selectedSessionId ? "session-link active" : "session-link"}
                  href={`/chat?session=${session.id}`}
                  key={session.id}
                >
                  <strong>{session.title || `Session ${session.id}`}</strong>
                  <span>#{session.id}</span>
                </a>
              ))}
            </nav>
          </div>
        </section>

        <ChatPanel sessionId={selectedSessionId} initialMessages={messages} />
      </div>
    </>
  );
}
