# vtm-next

`vtm-next` is a Next.js rebuild of VTM, the intentionally vulnerable task manager used for security training.

The goal is functional parity with the Django VTM training app while using a current Next.js app-router architecture, a different visual design, and an explicit vulnerability map so training surfaces are deliberate rather than accidental.

## Target Stack

- Next.js `16.2.6`
- React `19.2.6`
- TypeScript
- SQLite via `better-sqlite3`
- Next.js App Router with server components, route handlers, and server actions
- OpenAI-compatible chatbot tooling
- Plain CSS modules/global CSS for a distinct dark-sidebar, high-contrast operational UI

## Training Intent

This app is intentionally vulnerable. Do not harden the vulnerabilities listed in `docs/vulnerability-map.md` unless a task explicitly asks for a mitigation exercise.

## Initial Commands

```sh
npm install
npm run lint
npm test
npm run build
npm run dev
```

## Useful Routes

- `/dashboard`
- `/projects`
- `/tasks`
- `/chat`
- `/search`
- `/ping`
- `/debug`
- `/docs`
- `/api`
- `/api/docs`

## Repository Status

Phases 1-6 from `docs/implementation-plan.md` are implemented: core layout/seed data, weak auth flows, CRUD workflows, training utilities, chatbot tools, and API/docs routes.
