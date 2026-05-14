export default function ChatPage() {
  return (
    <>
      <div className="page-header">
        <div>
          <h1>AI Assistant</h1>
          <p>Tool-enabled assistant for broad search and project/task/note mutation.</p>
        </div>
      </div>

      <section className="card">
        <div className="card-header">Chat Tool Plan</div>
        <div className="card-body">
          <p>
            The chatbot will expose tools for overview, user listing, broad database search,
            project/task/note creation, and project/task/note updates.
          </p>
          <p>
            These tools intentionally mirror VTM&apos;s training risks around broad AI data
            access and state-changing assistant actions.
          </p>
        </div>
      </section>
    </>
  );
}
