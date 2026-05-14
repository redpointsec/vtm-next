# vtm-next Implementation Plan

## Objective

Build a new Next.js version of VTM with similar task-manager functionality and similar intentional vulnerabilities, while avoiding a visual clone of the Django app.

## Functional Scope

### Auth and Users

- Login, logout, registration, profile view/edit, change password, forgot/reset password.
- Roles/groups similar to VTM:
  - admin
  - project manager
  - team member
- User profile fields:
  - first name
  - last name
  - email
  - avatar URL/path
  - date of birth
  - SSN
  - reset token
  - reset token expiration

### Projects, Tasks, Notes, Files

- Dashboard with assigned projects and tasks.
- Project CRUD.
- Task CRUD and completion toggle.
- Notes attached to tasks.
- File uploads by local file and by remote URL.
- Project/team assignment management.

### Search and Debug Tools

- Global search for projects/tasks/notes/users/files.
- Debug settings/request metadata page.
- Ping utility.
- API routes for app data and documentation.

### Chatbot

- Chat sessions and message history.
- Tool-enabled assistant with:
  - overview
  - broad database search
  - user listing
  - add/update projects
  - add/update tasks
  - add/update notes

## Architecture

```text
app/
  login/
  dashboard/
  projects/
  tasks/
  chat/
  api/
lib/
  auth.ts
  db.ts
  seed-data.ts
  chatbot-tools.ts
  vulnerabilities.ts
docs/
  implementation-plan.md
  vulnerability-map.md
```

## Data Layer

Use SQLite for local training portability. Initial implementation should create a small database bootstrap utility in `lib/db.ts` and seed data from `lib/seed-data.ts`.

Suggested tables:

- users
- groups
- user_groups
- profiles
- projects
- project_users
- tasks
- task_users
- notes
- files
- chat_sessions
- chat_messages

## Styling Direction

Use a different visual design from Django VTM:

- dark left rail
- light content canvas
- compact tables
- square-ish 8px cards
- system font stack
- blue/green accent palette
- no marketing-style landing page

## Build Phases

1. Core layout and seed data.
2. Auth flows with intentional weak token/session behavior.
3. Projects/tasks/notes/files CRUD.
4. Search/debug/ping training utilities.
5. Chatbot UI and tools.
6. API routes and docs.
7. Preservation tests for each intentional vulnerability.

## Guardrails

- Preserve training vulnerabilities from `docs/vulnerability-map.md`.
- Prefer explicit comments around intentionally vulnerable code paths.
- Add tests that assert vulnerabilities remain reachable.
- Do not silently convert vulnerable SQL, command execution, SSRF, cookie, reset-token, or IDOR flows into safe equivalents.
