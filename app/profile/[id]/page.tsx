import { notFound } from "next/navigation";
import { getProfileByUserId } from "@/lib/profiles";

type ProfilePageProps = {
  params: Promise<{
    id: string;
  }>;
  searchParams?: Promise<{
    saved?: string;
    password?: string;
  }>;
};

export default async function ProfilePage({ params, searchParams }: ProfilePageProps) {
  const { id } = await params;
  const notices = await searchParams;
  const profile = getProfileByUserId(Number(id));

  if (!profile) {
    notFound();
  }

  return (
    <div className="grid two profile-grid">
      <section className="card">
        <div className="card-header">Profile #{profile.user_id}</div>
        <div className="card-body">
          <form className="form-grid" action="/api/profile/update" method="post">
            <input name="userId" type="hidden" defaultValue={profile.user_id} />
            <div className="grid two">
              <div className="field">
                <label htmlFor="firstName">First name</label>
                <input id="firstName" name="firstName" defaultValue={profile.first_name || ""} />
              </div>
              <div className="field">
                <label htmlFor="lastName">Last name</label>
                <input id="lastName" name="lastName" defaultValue={profile.last_name || ""} />
              </div>
            </div>
            <div className="field">
              <label htmlFor="email">Email</label>
              <input id="email" name="email" defaultValue={profile.profile_email || ""} />
            </div>
            <div className="field">
              <label htmlFor="avatar">Avatar URL/path</label>
              <input id="avatar" name="avatar" defaultValue={profile.avatar || ""} />
            </div>
            <div className="grid two">
              <div className="field">
                <label htmlFor="dob">Date of birth</label>
                <input id="dob" name="dob" defaultValue={profile.dob || ""} />
              </div>
              <div className="field">
                <label htmlFor="ssn">SSN</label>
                <input id="ssn" name="ssn" defaultValue={profile.ssn || ""} />
              </div>
            </div>
            {notices?.saved ? <p className="form-success">Profile updated.</p> : null}
            <button className="button" type="submit">
              Save profile
            </button>
          </form>
        </div>
      </section>

      <section className="card">
        <div className="card-header">Account Controls</div>
        <div className="card-body">
          <dl className="detail-list">
            <dt>Username</dt>
            <dd>{profile.username}</dd>
            <dt>Groups</dt>
            <dd>{profile.groups || "none"}</dd>
            <dt>Reset token</dt>
            <dd>{profile.reset_token || "none"}</dd>
            <dt>Reset expires</dt>
            <dd>{profile.reset_token_expires || "none"}</dd>
          </dl>

          <form className="form-grid stacked-form" action="/api/auth/change-password" method="post">
            <input name="userId" type="hidden" defaultValue={profile.user_id} />
            <div className="field">
              <label htmlFor="password">New password</label>
              <input id="password" name="password" type="password" defaultValue="test123" />
            </div>
            {notices?.password ? <p className="form-success">Password changed.</p> : null}
            <button className="button secondary" type="submit">
              Change password
            </button>
          </form>
        </div>
      </section>
    </div>
  );
}
