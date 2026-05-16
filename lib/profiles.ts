import { getDb, initializeSchema } from "./db.ts";
import { weakHashPassword } from "./auth.ts";

export type ProfileRecord = {
  user_id: number;
  username: string;
  user_email: string | null;
  is_staff: number;
  is_superuser: number;
  first_name: string | null;
  last_name: string | null;
  profile_email: string | null;
  avatar: string | null;
  dob: string | null;
  ssn: string | null;
  reset_token: string | null;
  reset_token_expires: string | null;
  groups: string | null;
};

export function getProfileByUserId(userId: number) {
  initializeSchema();
  const database = getDb();

  return database
    .prepare(
      `
        select
          u.id as user_id,
          u.username,
          u.email as user_email,
          u.is_staff,
          u.is_superuser,
          p.first_name,
          p.last_name,
          p.email as profile_email,
          p.avatar,
          p.dob,
          p.ssn,
          p.reset_token,
          p.reset_token_expires,
          group_concat(g.name) as groups
        from users u
        left join profiles p on p.user_id = u.id
        left join user_groups ug on ug.user_id = u.id
        left join groups g on g.id = ug.group_id
        where u.id = ?
        group by u.id, p.id
        limit 1
      `,
    )
    .get(userId) as ProfileRecord | undefined;
}

export function updateProfileByUserId(input: {
  userId: number;
  firstName: string;
  lastName: string;
  email: string;
  avatar: string;
  dob: string;
  ssn: string;
}) {
  initializeSchema();
  const database = getDb();

  // Intentional vulnerability: profile updates trust the supplied numeric userId.
  database.transaction(() => {
    database.prepare("update users set email = ? where id = ?").run(input.email, input.userId);
    database
      .prepare(
        `insert into profiles (
          id, user_id, first_name, last_name, email, avatar, dob, ssn
        ) values (?, ?, ?, ?, ?, ?, ?, ?)
        on conflict(user_id) do update set
          first_name = excluded.first_name,
          last_name = excluded.last_name,
          email = excluded.email,
          avatar = excluded.avatar,
          dob = excluded.dob,
          ssn = excluded.ssn`,
      )
      .run(
        input.userId,
        input.userId,
        input.firstName,
        input.lastName,
        input.email,
        input.avatar,
        input.dob,
        input.ssn,
      );
  })();
}

export function lookupResetTokenByEmailUnsafe(email: string) {
  initializeSchema();
  const database = getDb();

  // Intentional vulnerability: raw SQL interpolation mirrors the Django reset lookup lab.
  const sql = `
    select u.username, u.email, p.reset_token
    from users u
    left join profiles p on p.user_id = u.id
    where u.email = '${email}' or p.email = '${email}'
    limit 1
  `;

  return database.prepare(sql).get() as
    | {
        username: string;
        email: string | null;
        reset_token: string | null;
      }
    | undefined;
}

export function resetPasswordByTokenUnsafe(token: string, password: string) {
  initializeSchema();
  const database = getDb();
  const passwordHash = `md5$${password}$${weakHashPassword(password)}`;

  // Intentional vulnerability: raw token interpolation and no expiration check.
  database.exec(`
    update users
    set password_hash = '${passwordHash}'
    where id in (
      select user_id from profiles where reset_token = '${token}'
    )
  `);

  return database.prepare("select changes() as count").get() as { count: number };
}
