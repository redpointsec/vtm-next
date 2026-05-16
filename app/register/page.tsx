type RegisterPageProps = {
  searchParams?: Promise<{
    error?: string;
  }>;
};

export default async function RegisterPage({ searchParams }: RegisterPageProps) {
  const params = await searchParams;

  return (
    <section className="card auth-card">
      <div className="card-header">Create Training Account</div>
      <div className="card-body">
        <form className="form-grid" action="/api/auth/register" method="post">
          <div className="grid two">
            <div className="field">
              <label htmlFor="firstName">First name</label>
              <input id="firstName" name="firstName" placeholder="First name" />
            </div>
            <div className="field">
              <label htmlFor="lastName">Last name</label>
              <input id="lastName" name="lastName" placeholder="Last name" />
            </div>
          </div>
          <div className="grid two">
            <div className="field">
              <label htmlFor="username">Username</label>
              <input id="username" name="username" placeholder="username" />
            </div>
            <div className="field">
              <label htmlFor="email">Email</label>
              <input id="email" name="email" placeholder="user@example.com" />
            </div>
          </div>
          <div className="field">
            <label htmlFor="password">Password</label>
            <input id="password" name="password" type="password" placeholder="Password" />
          </div>
          <div className="grid two">
            <div className="field">
              <label htmlFor="dob">Date of birth</label>
              <input id="dob" name="dob" placeholder="YYYY-MM-DD" />
            </div>
            <div className="field">
              <label htmlFor="ssn">SSN</label>
              <input id="ssn" name="ssn" placeholder="000-00-0000" />
            </div>
          </div>
          <div className="field">
            <label htmlFor="avatar">Avatar URL</label>
            <input id="avatar" name="avatar" placeholder="https://example.com/avatar.png" />
          </div>
          {params?.error ? <p className="form-error">Registration failed.</p> : null}
          <button className="button" type="submit">
            Register
          </button>
        </form>
      </div>
    </section>
  );
}
