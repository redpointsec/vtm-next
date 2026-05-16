import { redirect } from "next/navigation";
import { getUsersApiData } from "@/lib/api-data";
import { getCurrentTrainingUser } from "@/lib/auth";
import { isAdmin } from "@/lib/permissions";

export const dynamic = "force-dynamic";

type UserRow = {
  id: number;
  username: string;
  email: string | null;
  is_staff: number;
  is_superuser: number;
  first_name: string | null;
  last_name: string | null;
  dob: string | null;
  ssn: string | null;
  reset_token: string | null;
  groups: string | null;
};

export default async function UsersPage() {
  const currentUser = await getCurrentTrainingUser();

  if (!isAdmin(currentUser)) {
    redirect("/dashboard");
  }

  const users = getUsersApiData() as UserRow[];

  return (
    <>
      <div className="page-header">
        <div>
          <h1>Users</h1>
          <p>Admin view of users, groups, profiles, and training-sensitive fields.</p>
        </div>
      </div>

      <section className="card">
        <div className="card-header">All Users</div>
        <div className="card-body table-wrap">
          <table className="table">
            <thead>
              <tr>
                <th>ID</th>
                <th>Username</th>
                <th>Name</th>
                <th>Email</th>
                <th>Groups</th>
                <th>Flags</th>
                <th>DOB</th>
                <th>SSN</th>
                <th>Reset Token</th>
                <th>Profile</th>
              </tr>
            </thead>
            <tbody>
              {users.map((user) => (
                <tr key={user.id}>
                  <td>{user.id}</td>
                  <td>{user.username}</td>
                  <td>
                    {[user.first_name, user.last_name].filter(Boolean).join(" ") || "none"}
                  </td>
                  <td>{user.email || "none"}</td>
                  <td>{user.groups || "none"}</td>
                  <td>
                    staff={user.is_staff}; superuser={user.is_superuser}
                  </td>
                  <td>{user.dob || "none"}</td>
                  <td>{user.ssn || "none"}</td>
                  <td>{user.reset_token || "none"}</td>
                  <td>
                    <a className="button secondary compact" href={`/profile/${user.id}`}>
                      Edit
                    </a>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </>
  );
}
