type LoginPageProps = {
  searchParams?: Promise<{
    next?: string;
    error?: string;
  }>;
};

export default async function LoginPage({ searchParams }: LoginPageProps) {
  const params = await searchParams;
  const next = params?.next || "/dashboard";

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
          {params?.error ? <p className="form-error">Invalid username or password.</p> : null}
          <input name="next" type="hidden" defaultValue={next} />
          <button className="button" type="submit">
            Sign in
          </button>
          <div className="form-links">
            <a href="/register">Register</a>
            <a href="/forgot-password">Forgot password</a>
          </div>
        </form>
      </div>
    </section>
  );
}
