type ForgotPasswordPageProps = {
  searchParams?: Promise<{
    error?: string;
  }>;
};

export default async function ForgotPasswordPage({ searchParams }: ForgotPasswordPageProps) {
  const params = await searchParams;

  return (
    <section className="card auth-card">
      <div className="card-header">Forgot Password</div>
      <div className="card-body">
        <form className="form-grid" action="/api/auth/forgot-password" method="post">
          <div className="field">
            <label htmlFor="email">Email</label>
            <input id="email" name="email" defaultValue="chris@tm.com" />
          </div>
          {params?.error ? <p className="form-error">No reset token was found.</p> : null}
          <button className="button" type="submit">
            Look up reset token
          </button>
        </form>
      </div>
    </section>
  );
}
