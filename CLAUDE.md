# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Training Intent — Read First

`vtm-next` is an **intentionally vulnerable** Next.js rebuild of the Django VTM training app. Every flaw enumerated in `docs/vulnerability-map.md` is deliberate. Do **not** "fix" weak hashing, the hardcoded JWT secret, SQL injection in search/reset routes, the SSRF in URL-import, command injection in `/ping`, IDOR in profile edit, open-redirect in login/logout `next` params, the avatar redirect, unsafe file uploads, the chatbot's broad DB read/write tools, or the sensitive-data leaks in `/api/*` — unless the task explicitly asks for a mitigation exercise. `tests/preservation.test.ts` is designed to fail if these surfaces are accidentally hardened.

When adding code that touches an existing training surface, add an inline comment marking it intentional (existing examples: `lib/auth.ts:27`, `lib/auth.ts:48`, `lib/auth.ts:189`).

## Commands

```sh
npm install
npm run dev      # next dev
npm run build    # next build
npm run lint     # eslint (uses eslint-config-next/core-web-vitals)
npm test         # node --test tests/*.test.ts
npm run seed     # node scripts/seed.ts — initializes/refreshes data/vtm-next.sqlite
```

Run a single test file: `node --test tests/preservation.test.ts`. Tests use Node's built-in runner (no Jest/Vitest) and write to a temp SQLite db.

## Architecture

**Stack:** Next.js 16 App Router + React 19, TypeScript with `allowImportingTsExtensions` (imports use explicit `.ts` extensions — `import { getDb } from "./db.ts"`), `better-sqlite3` for storage, `jose` for JWTs, `openai` SDK pointed at OpenRouter for the chatbot, `zod` for input parsing. No CSS framework — plain CSS modules and `app/globals.css`.

**Middleware is named `proxy.ts`, not `middleware.ts`.** `proxy.ts` at the repo root gates non-public routes by checking for the `vtm_session` cookie and redirects to `/login?next=...`. The list of public/auth routes lives in `lib/route-policy.ts` — update it there, not in the middleware.

**Database (`lib/db.ts`):** Singleton SQLite connection at `data/vtm-next.sqlite` (override with `VTM_NEXT_DB_PATH`). Schema is created on first call to `initializeSchema()`; many `lib/*` functions call it lazily so importing them is enough to bootstrap the db. **Foreign keys are intentionally not enforced** to keep authorization/IDOR flaws reachable. `seedDatabase()` is idempotent (uses `on conflict do update`) and pulls from `lib/seed-data.ts`.

**Auth (`lib/auth.ts`):**
- Passwords use MD5 stored as `md5$<plaintext>$<md5hex>` — both `weakHashPassword()` and `checkWeakPassword()` accept several legacy shapes (plaintext, bare md5, prefixed). Preserve this when touching auth.
- Session is a year-long JWT in cookie `vtm_session` (`AUTH_COOKIE_NAME`), signed with `getWeakAuthSecret()` which falls back to a hardcoded string.
- `weakRedirectUrl()` intentionally accepts absolute external URLs for open-redirect training.
- Roles are derived from `user_groups`/`groups` via `roleExpression()` and reduced to `"admin" | "project_manager" | "team_member"`.

**Authorization (`lib/permissions.ts`):** Source of truth for role checks. `canManageProject`/`canManageTask`/`canViewProject`/`canViewTask` are the per-object gates; `projectScopeWhere()` and `taskScopeWhere()` produce SQL fragments (using bind param `@actorId`) for list queries scoped by role. Some routes intentionally skip these checks for IDOR training — check the vuln map before "fixing" missing checks.

**Chatbot (`lib/chatbot-tools.ts`, `lib/llm-chat.ts`):** OpenAI-compatible client targets `https://openrouter.ai/api/v1` by default. Configured via `OPENAI_API_KEY`, `OPENAI_MODEL` (default `openai/gpt-oss-120b:free`), `OPENAI_BASE_URL`. Tool surface (`assistantToolNames`) intentionally exposes broad read (`get_users`, `search_database`) and write (`add_project`, `update_project`, `add_task`, `update_task`, `add_note`, `update_note`) operations across the whole DB — this is part of the training.

**Layer map:**
- `app/` — App Router pages and route handlers; `app/api/` holds JSON endpoints (`auth`, `chat`, `debug`, `docs`, `files`, `health`, `notes`, `ping`, `profile`, `projects`, `search`, `tasks`, `users`).
- `lib/api-data.ts`, `lib/queries.ts` — read-model aggregators for the dashboard and `/api/*` JSON.
- `lib/crud.ts` — write paths for projects/tasks/notes (called by both server actions and chatbot tools).
- `lib/training-tools.ts` — implementations of the deliberately unsafe primitives (SQLi search, shell-string ping, etc.).
- `docs/implementation-plan.md` / `docs/vulnerability-map.md` — design + training-surface reference.

## Conventions

- **Always use `.ts` extensions in relative imports** — the project is ESM (`"type": "module"`) with `allowImportingTsExtensions`.
- When adding a route that should bypass auth, add it to `PUBLIC_ROUTE_PREFIXES` or `PUBLIC_EXACT_ROUTES` in `lib/route-policy.ts`.
- Adding a new intentional vulnerability: document it in `docs/vulnerability-map.md` and add a preservation assertion in `tests/preservation.test.ts`.
