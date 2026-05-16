type ResetPasswordPageProps = {
  searchParams?: Promise<{
    token?: string;
    email?: string;
    changed?: string;
    error?: string;
  }>;
};

export default async function ResetPasswordPage({ searchParams }: ResetPasswordPageProps) {
  const params = await searchParams;

  return (
    <section className="card auth-card">
      <div className="card-header">Reset Password</div>
      <div className="card-body">
        <form className="form-grid" action="/api/auth/reset-password" method="post">
          <div className="field">
            <label htmlFor="email">Email</label>
            <input id="email" name="email" defaultValue={params?.email || ""} placeholder="user@example.com" />
          </div>
          <div className="field">
            <label htmlFor="token">Reset token</label>
            <input id="token" name="token" defaultValue={params?.token || ""} placeholder="Reset token" />
          </div>
          <div className="field">
            <label htmlFor="password">New password</label>
            <input id="password" name="password" type="password" placeholder="New password" />
          </div>
          {params?.changed ? <p className="form-success">Password updated.</p> : null}
          {params?.error ? <p className="form-error">Reset failed.</p> : null}
          <button className="button" type="submit">
            Reset password
          </button>
        </form>
      </div>
    </section>
  );
}
