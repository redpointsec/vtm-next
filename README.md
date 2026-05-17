# vtm-next

`vtm-next` is a Next.js rebuild of VTM, the intentionally vulnerable task manager used for security training. It mirrors the workflow of the original Django VTM app on a current Next.js App Router stack with a different visual design, so training scenarios stay deliberate rather than accidental.

## What's in the app

A small multi-user task manager with the usual building blocks:

- **Auth** — login, registration, profile view/edit, change password, forgot/reset password. Sessions are a JWT in the `vtm_session` cookie.
- **Roles** — `admin`, `project manager`, and `team member`. Scope is enforced through `lib/permissions.ts` and reflected in the dashboard and list views.
- **Projects, tasks, notes** — full CRUD with project/team assignment, task completion toggles, and notes attached to tasks.
- **File uploads** — both local file upload and import-by-URL.
- **Search, ping, debug** — global search across users/projects/tasks/notes/files, a ping utility, and a debug page that surfaces request/runtime metadata.
- **AI assistant** — a tool-enabled chatbot (`/chat`) backed by an OpenAI-compatible endpoint. Tools cover database overview, user listing, broad search, and add/update of projects, tasks, and notes.
- **JSON API** — `/api/*` route handlers expose the same domain data (users, projects, tasks, notes, files, chat, debug) for tooling and exercises, with `/api/docs` describing the surface.

## Stack

- Next.js `16.2.6` (App Router, server components, route handlers, server actions)
- React `19.2.6`, TypeScript
- SQLite via `better-sqlite3` (file at `data/vtm-next.sqlite`)
- `jose` for JWT session tokens
- `openai` SDK pointed at an OpenAI-compatible provider (OpenRouter by default) for the chatbot
- Plain CSS modules and `app/globals.css` — dark sidebar, light canvas, blue/green accents

## Training intent

This app is intentionally vulnerable. The catalog of deliberate training surfaces lives in `docs/vulnerability-map.md`; do not harden anything listed there unless a task explicitly asks for a mitigation exercise.

## Getting started

```sh
npm install
npm run seed       # initialize data/vtm-next.sqlite with seed users, projects, tasks
npm run dev        # http://localhost:3000
```

Other scripts:

```sh
npm run lint       # eslint (eslint-config-next/core-web-vitals)
npm test           # node --test tests/*.test.ts
npm run build      # next build
npm start          # serve the built app
```

### Seed accounts

All accounts use the password shown below and are created by `npm run seed`.

| Username | Role            | Password   |
| -------- | --------------- | ---------- |
| `admin`  | admin           | `test123`  |
| `pm`     | project manager | `test123`  |
| `chris`  | team member     | `test123`  |
| `alex`   | team member     | `password` |

### Chatbot configuration

The assistant uses the same OpenAI-compatible OpenRouter settings as Django VTM:

```sh
OPENAI_API_KEY=...
OPENAI_MODEL=openai/gpt-oss-120b:free
OPENAI_BASE_URL=https://openrouter.ai/api/v1
```

Any OpenAI-compatible endpoint works — set `OPENAI_BASE_URL` accordingly.

## Useful routes

- `/dashboard` — role-scoped projects and tasks
- `/projects`, `/tasks` — list and detail CRUD
- `/profile`, `/users` — profile view/edit and user listing
- `/chat` — AI assistant with tool calls
- `/search`, `/ping`, `/debug` — training utilities
- `/docs`, `/api`, `/api/docs` — API surface and documentation
