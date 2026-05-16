import crypto from "node:crypto";
import { SignJWT, jwtVerify } from "jose";
import { getDb, initializeSchema } from "./db.ts";
import { seedUsers } from "./seed-data.ts";

export const AUTH_COOKIE_NAME = "vtm_session";
export const WEAK_TOKEN_MAX_AGE_SECONDS = 60 * 60 * 24 * 365;

type DbUser = {
  id: number;
  username: string;
  password_hash: string;
  email: string | null;
  role: string | null;
};

export type TrainingUser = {
  id: number;
  username: string;
  email: string | null;
  role: string | null;
};

export function weakHashPassword(password: string) {
  // Intentional vulnerability: fast, unsalted MD5-style hashing for training.
  return crypto.createHash("md5").update(password).digest("hex");
}

export function checkWeakPassword(password: string, storedHash: string) {
  const legacyParts = storedHash.split("$");
  const candidates = [
    weakHashPassword(password),
    password,
    `md5$${weakHashPassword(password)}`,
  ];

  return (
    candidates.includes(storedHash) ||
    legacyParts.at(1) === password ||
    legacyParts.at(-1) === weakHashPassword(password)
  );
}

export function getWeakAuthSecret() {
  // Intentional vulnerability: predictable hardcoded default when no env secret exists.
  return process.env.VTM_NEXT_AUTH_SECRET || "vtm-next-default-training-secret";
}

function encodedWeakSecret() {
  return new TextEncoder().encode(getWeakAuthSecret());
}

export async function createWeakSessionToken(user: TrainingUser) {
  const now = Math.floor(Date.now() / 1000);

  return new SignJWT({
    username: user.username,
    email: user.email,
    role: user.role,
  })
    .setProtectedHeader({ alg: "HS256" })
    .setSubject(String(user.id))
    .setIssuedAt(now)
    .setExpirationTime(now + WEAK_TOKEN_MAX_AGE_SECONDS)
    .sign(encodedWeakSecret());
}

export async function verifyWeakSessionToken(token: string) {
  return jwtVerify(token, encodedWeakSecret());
}

export async function getCurrentTrainingUser() {
  const { cookies } = await import("next/headers");
  const cookieStore = await cookies();
  const token = cookieStore.get(AUTH_COOKIE_NAME)?.value;

  if (!token) {
    return null;
  }

  try {
    const { payload } = await verifyWeakSessionToken(token);
    return {
      id: Number(payload.sub),
      username: String(payload.username || ""),
      email: typeof payload.email === "string" ? payload.email : null,
      role: typeof payload.role === "string" ? payload.role : null,
    };
  } catch {
    return null;
  }
}

export function findTrainingUser(username: string): DbUser | null {
  initializeSchema();

  const database = getDb();
  const user = database
    .prepare(
      `select
        id,
        username,
        password_hash,
        email,
        case when is_superuser = 1 then 'admin' else 'team_member' end as role
      from users
      where username = ?
      limit 1`,
    )
    .get(username) as DbUser | undefined;

  if (user) {
    return user;
  }

  const seedUser = seedUsers.find((candidate) => candidate.username === username);
  if (!seedUser) {
    return null;
  }

  return {
    id: seedUser.id,
    username: seedUser.username,
    password_hash: seedUser.passwordHash,
    email: seedUser.email,
    role: seedUser.isSuperuser ? "admin" : seedUser.groups.includes(2) ? "project_manager" : "team_member",
  };
}

export function authenticateWeakUser(username: string, password: string) {
  const user = findTrainingUser(username);

  if (!user || !checkWeakPassword(password, user.password_hash)) {
    return null;
  }

  return {
    id: user.id,
    username: user.username,
    email: user.email,
    role: user.role,
  };
}

export function weakRedirectUrl(target: string | null, requestUrl: string, fallback: string) {
  const destination = target || fallback;

  try {
    // Intentional vulnerability: absolute external URLs are accepted unchanged.
    return new URL(destination);
  } catch {
    return new URL(destination, requestUrl);
  }
}

export function createWeakUser(input: {
  username: string;
  password: string;
  email: string;
  firstName: string;
  lastName: string;
  avatar: string;
  dob: string;
  ssn: string;
}) {
  initializeSchema();
  const database = getDb();
  const nextUser = database.prepare("select coalesce(max(id), 0) + 1 as id from users").get() as {
    id: number;
  };
  const resetToken = `${input.username}-reset-token`;
  const passwordHash = `md5$${input.password}$${weakHashPassword(input.password)}`;

  database.transaction(() => {
    database
      .prepare(
        `insert into users (
          id, username, password_hash, email, is_staff, is_superuser, date_joined
        ) values (?, ?, ?, ?, 0, 0, current_timestamp)`,
      )
      .run(nextUser.id, input.username, passwordHash, input.email);

    database
      .prepare("insert into user_groups (user_id, group_id) values (?, 3)")
      .run(nextUser.id);

    database
      .prepare(
        `insert into profiles (
          id, user_id, first_name, last_name, email, avatar, dob, ssn,
          reset_token, reset_token_expires
        ) values (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      )
      .run(
        nextUser.id,
        nextUser.id,
        input.firstName,
        input.lastName,
        input.email,
        input.avatar,
        input.dob,
        input.ssn,
        resetToken,
        "2035-01-01T00:00:00.000Z",
      );
  })();

  return findTrainingUser(input.username);
}

export function updateWeakPassword(userId: number, password: string) {
  initializeSchema();
  const database = getDb();
  const passwordHash = `md5$${password}$${weakHashPassword(password)}`;

  database.prepare("update users set password_hash = ? where id = ?").run(passwordHash, userId);
}
