import { execSync } from "node:child_process";
import { getDb, initializeSchema } from "./db.ts";

export type SearchResult = {
  source: string;
  id: number;
  title: string | null;
  body: string | null;
  extra: string | null;
};

export function unsafeGlobalSearch(query: string) {
  initializeSchema();

  if (!query) {
    return [] as SearchResult[];
  }

  const database = getDb();
  const like = `%${query}%`;

  // Intentional vulnerability: raw SQL interpolation keeps the search SQLi lab reachable.
  const sql = `
    select 'user' as source, u.id, u.username as title, u.email as body,
      'staff=' || u.is_staff || '; superuser=' || u.is_superuser as extra
    from users u
    where u.username like '${like}' or u.email like '${like}'

    union all

    select 'profile' as source, p.user_id as id,
      coalesce(p.first_name, '') || ' ' || coalesce(p.last_name, '') as title,
      'dob=' || coalesce(p.dob, '') || '; ssn=' || coalesce(p.ssn, '') as body,
      'reset=' || coalesce(p.reset_token, '') as extra
    from profiles p
    where p.first_name like '${like}'
      or p.last_name like '${like}'
      or p.email like '${like}'
      or p.ssn like '${like}'
      or p.reset_token like '${like}'

    union all

    select 'project' as source, p.id, p.title, p.text, p.due_date as extra
    from projects p
    where p.title like '${like}' or p.text like '${like}'

    union all

    select 'task' as source, t.id, t.title, t.text, t.status as extra
    from tasks t
    where t.title like '${like}' or t.text like '${like}' or t.status like '${like}'

    union all

    select 'note' as source, n.id, n.title, n.text, n.image as extra
    from notes n
    where n.title like '${like}' or n.text like '${like}' or n.image like '${like}'

    union all

    select 'file' as source, f.id, f.name as title, f.path as body, f.source_url as extra
    from files f
    where f.name like '${like}'
      or f.path like '${like}'
      or f.source_url like '${like}'
      or f.content_type like '${like}'

    union all

    select 'chat' as source, cm.id, cm.role as title, cm.content as body, cm.tool_name as extra
    from chat_messages cm
    where cm.content like '${like}' or cm.tool_name like '${like}'

    order by source, id
  `;

  return database.prepare(sql).all() as SearchResult[];
}

export function runPingUnsafe(host: string) {
  if (!host) {
    return "";
  }

  const blocked = [";", "&&", "||", "`"];
  const candidate = blocked.reduce((value, token) => value.replaceAll(token, ""), host);

  try {
    // Intentional vulnerability: blacklist filtering still leaves shell-command injection surfaces.
    return execSync(`ping -c 1 ${candidate}`, {
      encoding: "utf8",
      timeout: 4000,
      stdio: ["ignore", "pipe", "pipe"],
    });
  } catch (error) {
    if (error && typeof error === "object" && "stdout" in error) {
      const output = (error as { stdout?: Buffer | string; stderr?: Buffer | string }).stdout;
      const stderr = (error as { stdout?: Buffer | string; stderr?: Buffer | string }).stderr;
      return `${String(output || "")}${String(stderr || "")}`.trim();
    }

    return String(error);
  }
}
