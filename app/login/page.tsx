export default function LoginPage() {
  return (
    <section className="card" style={{ maxWidth: 460 }}>
      <div className="card-header">Login</div>
      <div className="card-body">
        <form className="form-grid" action="/api/auth/login" method="post">
          <div className="field">
            <label htmlFor="username">Username</label>
            <input id="username" name="username" defaultValue="chris" />
          </div>
          <div className="field">
            <label htmlFor="password">Password</label>
            <input id="password" name="password" type="password" defaultValue="test123" />
          </div>
          <input name="next" type="hidden" defaultValue="/dashboard" />
          <button className="button" type="submit">
            Sign in
          </button>
        </form>
      </div>
    </section>
  );
}
