import {
  createChatSession,
  getChatMessages,
  listChatSessions,
} from "@/lib/chatbot-tools";

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

        <section className="card">
          <div className="card-header">Conversation</div>
          <div className="card-body chat-panel">
            <div className="message-list">
              {messages.length === 0 ? (
                <p className="empty-chat">Ask for an overview, users, search database, or add a project/task/note.</p>
              ) : (
                messages.map((message) => (
                  <article className={`chat-message ${message.role}`} key={message.id}>
                    <div className="message-meta">
                      <strong>{message.role}</strong>
                      {message.tool_name ? <span>{message.tool_name}</span> : null}
                    </div>
                    <pre>{message.content}</pre>
                  </article>
                ))
              )}
            </div>

            <form className="form-grid chat-form" action="/api/chat" method="post">
              <input name="sessionId" type="hidden" value={selectedSessionId} />
              <div className="field">
                <label htmlFor="message">Message</label>
                <textarea
                  id="message"
                  name="message"
                  defaultValue='{"tool":"search_database","args":{"query":"reset-token"}}'
                />
              </div>
              {params?.sent ? <p className="form-success">Assistant tool executed.</p> : null}
              <button className="button" type="submit">
                Send
              </button>
            </form>
          </div>
        </section>
      </div>

      <section className="card page-section">
        <div className="card-header">Tool Examples</div>
        <div className="card-body">
          <div className="tool-examples">
            <code>{'{"tool":"get_users","args":{}}'}</code>
            <code>{'{"tool":"add_project","args":{"title":"Assistant Launch","userIds":[2,3]}}'}</code>
            <code>{'{"tool":"update_task","args":{"id":101,"title":"Updated by assistant","projectId":7}}'}</code>
            <code>{'{"tool":"add_note","args":{"taskId":101,"title":"Assistant note","text":"Stored note"}}'}</code>
          </div>
        </div>
      </section>
    </>
  );
}
