export default function ProjectsPage() {
  return (
    <>
      <div className="page-header">
        <div>
          <h1>Projects</h1>
          <p>Create, edit, assign, and inspect project records.</p>
        </div>
      </div>

      <section className="card">
        <div className="card-header">Project Form Skeleton</div>
        <div className="card-body">
          <form className="form-grid" action="/api/projects" method="post">
            <div className="field">
              <label htmlFor="title">Title</label>
              <input id="title" name="title" defaultValue="New Campaign" />
            </div>
            <div className="field">
              <label htmlFor="text">Description</label>
              <textarea id="text" name="text" defaultValue="Draft project details" />
            </div>
            <div className="grid two">
              <div className="field">
                <label htmlFor="due_date">Due date</label>
                <input id="due_date" name="due_date" type="date" />
              </div>
              <div className="field">
                <label htmlFor="priority">Priority</label>
                <input id="priority" name="priority" type="number" defaultValue="2" />
              </div>
            </div>
            <button className="button" type="submit">
              Save project
            </button>
          </form>
        </div>
      </section>
    </>
  );
}
