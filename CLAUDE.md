# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project

Frontend for **The Nail Palace**, a single-owner nail art studio in Jambi, Indonesia. Two audiences in one app: customers (browse services, book a slot, look up or cancel a booking, no account) and the owner/staff (admin: bookings, catalog, schedule, dashboard, notifications). It talks to the REST API in `backend-nail-art-app` (Express 5, PostgreSQL), which is finished and has a stable contract.

Stack: **TanStack Start (React 19, file-based TanStack Router, SPA mode)**, Vite 8, TypeScript (strict), Tailwind CSS 4, **shadcn/ui (style `base-nova`, built on Base UI, not Radix)**, axios, lucide-react, Bun.

UI language is **Indonesian**. Code, identifiers, comments and commit messages are English.

## Start here (every new session)

1. Read this file, then **`CODE_STYLE.md`** before writing any code: it has the style decisions, the canonical patterns to copy, and what ESLint/Prettier enforce.
2. If the work touches the backend, read **`docs/API_GUIDE.md`** (conventions, auth and token refresh, errors, rate limits, every endpoint, flows with examples, business rules). Field-level detail is in `docs/openapi.yaml`.
3. Open the module's requirements in `PRD_Frontend_The_Nail_Palace.md` and the relevant parts of `DESIGN_SPEC.md`.
4. Check the module table below to see what is already done, and `git status` / `git log` to see the current state.
5. When finished, run `bun --bun run verify` (format check, lint, typecheck, build) and, once they exist, the tests.

## This branch (read first)

You are on **`test/ai-prototype`**, a long-lived branch cut from `main`. It exists so the owner can test the backend end to end with a working UI **while a UI/UX teammate designs the real one in parallel**. Therefore:

- **Never touch `main` or `develop`.** No merges into them, no pushes to them, no PRs against them unless the user asks. Work and commit on this branch only.
- **No rebase or force-push** of this branch; the user may share it.
- **One commit per module** (see the development plan), Conventional Commits with a scope, e.g. `feat(booking): add booking wizard`. Types: feat, fix, docs, style, refactor, perf, test, build, ci, chore, revert. The user does not want a `Co-Authored-By` line (or other attribution) in commit messages.
- Only commit when the user asks. Never commit `.env` (only `.env.example`) or secrets. Keep each commit focused on one module.
- **Keep the visual layer replaceable.** The designer's work will replace or restyle the UI, so: all colors, radii, spacing and type come from the tokens in `src/styles.css` (never hard-code them in components); pages and feature components are split into data (hooks) and presentation (components) so presentation can be swapped without touching data code.
- Do not rename or move files outside the module you are working on; the designer and the owner will be merging by hand.

`GIT_WORKFLOW.md` describes the team's normal flow (branch from `develop`, PRs). It still applies to anything that leaves this branch.

## Source-of-truth documents

- `PRD_Frontend_The_Nail_Palace.md` (Indonesian): what to build. Requirements are numbered **FE-01..FE-18**; each has the backend endpoints it uses and acceptance criteria. Also holds the route map, error-handling table, test scenarios and the module plan.
- `DESIGN_SPEC.md` (Indonesian): how it looks. Modern minimalism, **black and white only, light theme only**. Tokens, type scale, component rules, status badges, page wireframes, copy rules.
- `CODE_STYLE.md` (English): how code is written here (naming, imports, layers, TypeScript, React, Tailwind, copy, tests), with copy-paste patterns and an enforcement table. If you are about to write something that does not look like those patterns, stop and follow the pattern.
- API contract, in this repo: **`docs/openapi.yaml`** (a verbatim snapshot of the backend's `documents/openapi.yaml`) and **`docs/API_GUIDE.md`** (how to use it). The snapshot's provenance (backend commit and date) is in the guide's header. It wins over any assumption here. If the contract and the PRD disagree, trust the contract and tell the user. If it disagrees with a running backend, the running backend wins: refresh with `bun --bun run api:sync` and report the difference. Interactive docs: `http://localhost:3000/docs` when the backend runs outside production.
- If the PRD and the design spec disagree about behavior vs appearance: PRD decides behavior, design spec decides appearance.

## Commands

```bash
bun install
bun --bun run dev          # vite dev (http://localhost:5173)
bun --bun run build        # vite build (Nitro server output in .output/)
bun --bun run lint         # eslint (type-aware; layers, imports, tokens, a11y, hooks)
bun --bun run lint:fix     # eslint --fix (import order, type imports, ...)
bun --bun run check        # prettier --check .
bun --bun run format       # prettier --write . && eslint --fix
bun --bun run typecheck    # tsc --noEmit (strict + noUncheckedIndexedAccess)
bun --bun run verify       # check + lint + typecheck + build
bun --bun run api:sync     # copy the contract from ../backend-nail-art-app into docs/openapi.yaml
bun --bun run generate-routes   # tsr generate -> src/routeTree.gen.ts
docker compose -f compose.dev.yml up --build -d   # dev container, host port 5173 (Docker; `podman compose` works too)
```

Planned (added in module FE-0, then keep them working): `api:types` (generate `src/lib/api/schema.gen.ts` from `docs/openapi.yaml`), `test` (Vitest, then add it to `verify`), `test:e2e` (Playwright, optional). Run `verify` and the tests before declaring a module done. Run `format` after adding a shadcn component.

Optional git hooks (format and lint staged files on commit, typecheck on push) are configured in `package.json` but **not installed**; the user decides whether to run `bunx simple-git-hooks`. Do not install them yourself.

Running against the backend: start it from `backend-nail-art-app` (`bun run dev`, Postgres up, migrations applied; `docs/API_GUIDE.md` section 1 and 9 list the steps and the data bootstrap). Its `CORS_ORIGINS` must include the frontend origin (the backend's `.env.example` already allows `http://localhost:5173`). With no backend, use a Prism mock (`bunx @stoplight/prism-cli mock docs/openapi.yaml -p 4010`) and point `VITE_API_BASE_URL` at it.

## Environment

Browser code can only read `import.meta.env.VITE_*`. They are typed in `src/env.d.ts` and validated once in `src/lib/env.ts` (`ENV`); the axios instance in `src/lib/api/client.ts` uses `ENV.VITE_API_BASE_URL`. Copy `.env.example` to `.env`:

| Variable                | Example                        | Meaning                                                                                                     |
| ----------------------- | ------------------------------ | ----------------------------------------------------------------------------------------------------------- |
| `VITE_API_BASE_URL`     | `http://localhost:3000/api/v1` | Backend base URL, including `/api/v1`                                                                       |
| `VITE_MAX_ADVANCE_DAYS` | `60`                           | How far ahead a customer may book; must equal the backend's `MAX_ADVANCE_DAYS` (the API does not expose it) |

`.env` is gitignored; keep `.env.example` in sync.

## Stack facts and gotchas

- **SPA mode.** `src/start.ts` sets `defaultSsr: false`. Treat everything as client-rendered: `beforeLoad` and loaders run in the browser, and there are no server functions unless the user asks for them. Authentication relies on this: the browser talks to the API directly and holds the refresh token as an `HttpOnly` cookie.
- **shadcn is `base-nova` = Base UI.** Add components with `bunx --bun shadcn@latest add <name>`. Primitives come from `@base-ui/react`; its API differs from Radix (for example the `render` prop instead of `asChild`). Do not paste Radix-based snippets from the internet. After generating a component, run `bun --bun run format` (generated files use double quotes; this repo uses single quotes, no semicolons).
- `components.json` points at a `tailwind.config.js` that does not exist (Tailwind 4 is CSS-first, config lives in `src/styles.css`). If the shadcn CLI complains, set that field to an empty string rather than creating a config file.
- `cn` comes from the `cn` package (a `clsx` + `tailwind-merge` replacement), re-exported as `@/lib/utils`. Import `cn` from `@/lib/utils`.
- Path alias is **`@/*` -> `src/*`**. `package.json` also defines `#/*`; do not use it.
- `src/routeTree.gen.ts` is generated by the router plugin. Never edit it by hand; it is regenerated when you add or rename route files.
- **Tooling keeps style consistent; do not fight it.** Prettier (no semicolons, single quotes, trailing commas, width 100, Tailwind classes sorted by `prettier-plugin-tailwindcss`) and ESLint (TanStack preset plus react-hooks, jsx-a11y, TanStack Query, import order and cycles, folder-layer limits, kebab-case file names, named exports only, token-only colors) are configured in `prettier.config.js` and `eslint.config.js`. `.editorconfig` mirrors the basics. Fix lint errors by changing the code; do not add `eslint-disable`, `@ts-ignore` or `any`. If a rule seems wrong, tell the user. `prettier --write` and `eslint --fix` can undo each other's output on a generated file: run `bun --bun run format`, which applies both.
- `tsconfig.json` is stricter than the scaffold: `noUncheckedIndexedAccess`, `noImplicitOverride` and `forceConsistentCasingInFileNames` are on.
- `.dark` theme variables exist in `src/styles.css` from the scaffold. The design is **light only**: FE-0 removes them. Never add `dark:` variants.

## Architecture

Target layout (create folders as modules need them; do not add empty scaffolding):

```
src/
  routes/                 # file-based routes (thin: compose features, no business logic)
    __root.tsx
    index.tsx             # public landing
    layanan.tsx, pesan.tsx, pesan.berhasil.tsx, cek-booking.tsx
    admin/login.tsx
    admin/_app.tsx        # pathless layout route: auth guard + shell
    admin/_app/index.tsx, reservasi.tsx, layanan.tsx, artist.tsx, jadwal.tsx, notifikasi.tsx, ekspor.tsx, pengaturan.tsx
  features/<feature>/     # one folder per area: booking, catalog, schedule, dashboard, notifications, push, auth
    api.ts                # axios calls, typed with generated types (only place that calls the API)
    queries.ts            # TanStack Query keys, queryOptions, mutations (invalidation lives here)
    schemas.ts            # zod schemas for forms
    components/           # presentational components for this feature
  components/ui/          # shadcn components (generated; change tokens, not structure)
  components/common/      # shared building blocks: page header, status badge, empty state, error state, money/date text
  lib/api/                # client.ts (axios instance; interceptors in FE-0), errors.ts, schema.gen.ts, types.ts
  lib/auth/               # in-memory access token, cross-tab single-flight refresh (Web Locks + BroadcastChannel), session bootstrap
  lib/format.ts           # money, date, time, phone formatting (Asia/Jakarta, id-ID)
  styles.css              # the ONLY place for design tokens
```

Layer rules (a feature may import `lib/` and `components/`, never another feature's internals):

- Components never call axios. They use hooks from `features/*/queries.ts`.
- `features/*/api.ts` is the only code that knows URLs and the `{ data, meta }` response envelope; it returns plain typed data.
- Server state lives in **TanStack Query** (add `@tanstack/react-query`); there is no global store for it. Keep UI state local; use the URL (search params, validated by the route) for filters, page and selected item so views are linkable.
- Forms: **react-hook-form + zod**. Map API `422` `details[].field` onto form fields (see the error table in the PRD).

## Conventions

The full style guide is **`CODE_STYLE.md`** (with patterns to copy). The rules below are the ones that most affect behavior and consistency; where this section and `CODE_STYLE.md` differ, `CODE_STYLE.md` wins for style and this file wins for behavior.

- Files: kebab-case. Components PascalCase, hooks `use-*.ts`, one exported component per file where practical. Types PascalCase, constants UPPER_SNAKE.
- TypeScript strict; no `any`, no non-null assertions to silence the compiler. Request and response types come from `schema.gen.ts`; do not hand-copy contract shapes.
- API JSON is snake_case. Convert at the `api.ts` boundary only if you must; do not mix casing inside components.
- **Time:** the API returns ISO 8601 with `+07:00`. Show everything in `Asia/Jakarta` via `Intl.DateTimeFormat('id-ID', { timeZone: 'Asia/Jakarta' })` (see `lib/format.ts`), regardless of the browser's zone. Send `start_at` back exactly as the availability API returned it. Calendar days are WIB days.
- **Money** is an integer in Rupiah: format with `Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 })`.
- **Phone:** the backend accepts `08...`, `62...` and `+62...` and stores E.164. Let the user type any of them; show the normalized `+62...` form back.
- UI copy is Indonesian, polite and short; use the vocabulary in the design spec (for example `Menunggu konfirmasi`, not "Pending"). Error messages come from the error-code table in the PRD, not from raw API strings, except where the API message is already user-facing.
- Styling: Tailwind utility classes using token-backed names (`bg-background`, `text-muted-foreground`, `border-border`). **No hex or oklch values in components, no arbitrary color classes, no `dark:`.** Spacing and radius from the design spec scale.
- Icons: `lucide-react` only. Icon-only buttons need `aria-label`.
- Accessibility is part of done: every interactive element reachable and operable by keyboard, visible focus, labels on inputs, `aria-live` for async feedback, no information carried by color alone (the palette is monochrome, so status is carried by icon + text + shape).
- Do not log tokens, phone numbers or booking codes to the console. Do not put tokens in URLs.

## Backend contract notes the UI must respect

Full detail is in `docs/API_GUIDE.md`, `docs/openapi.yaml` and the PRD; these are the ones that cause bugs:

- Responses are `{ data }` or `{ data, meta }` (pagination `{ page, per_page, total, total_pages }`). Errors are `{ error: { code, message, details? } }`; `details` is `[{ field, message }]` and `field` is the body field name (query errors are prefixed `query.`).
- **Admin auth uses an `HttpOnly` cookie, not browser storage.** The backend sets the refresh token as the cookie `refresh_token` (`Path=/api/v1/auth`) on login and refresh; JavaScript cannot read it. The access token (15 min) is kept **in memory only** and sent as `Authorization: Bearer`. Rules: (1) call `/auth/login`, `/auth/refresh`, `/auth/logout`, `/auth/logout-all` with `withCredentials: true` and no other call; (2) call refresh and logout **with no body** (a `refresh_token` in the body would win over the cookie); (3) **ignore the `refresh_token` field the API still returns in the body**, never store it anywhere; (4) there is no readable token to check on load, so a page load or new tab signs in by calling `POST /auth/refresh` once (`200` = signed in, `401` = go to login); (5) refresh tokens are **rotated on every use** and reusing an old one makes the backend revoke **all** of that admin's sessions, and all tabs share one cookie, so refresh must be **single-flight across requests and tabs** (Web Locks to serialize, `BroadcastChannel` to share the new access token so a waiting tab does not refresh again with the rotated cookie). Never refresh in parallel. (6) `403` on refresh/logout means the frontend origin is not in the backend `CORS_ORIGINS` (a configuration error): show a clear message, do not loop and do not treat it as an expired session. Details, a code sketch and the cookie/site rules: `docs/API_GUIDE.md` section 4.
- Customers have no accounts. Booking lookup and cancel use booking code + phone; any mismatch is `404` (never `403`), so show one generic "not found" message.
- Slots come only from `GET /availability`; submitting a slot can still fail with `409 SLOT_UNAVAILABLE` (someone else took it or the owner blocked it): go back to slot selection and refetch. `artist_id` is optional and hidden by default; when omitted the system assigns an artist.
- `429 RATE_LIMITED` carries `Retry-After` (seconds): show it and disable the action until it passes. Limits: login failures, booking creation, booking lookup/cancel, and a general ceiling.
- Booking statuses: `pending`, `confirmed`, `completed`, `cancelled`, `no_show`. Allowed admin transitions: `pending` -> `confirmed`/`cancelled`; `confirmed` -> `completed`/`cancelled`/`no_show`; others are final. `cancelled` requires a reason. `completed`/`no_show` are refused before `start_at`. Offer only the transitions that are valid for the current status.
- Admin reschedule (`PATCH /admin/bookings/{id}`) is allowed only for `pending`/`confirmed` and follows the same slot rules; the availability endpoint counts the booking itself as busy, so its own current time can appear unavailable (known limitation, see PRD open questions).
- Blocking time that already has bookings: always call `POST /admin/blocked-slots/check` first, show the affected bookings (each has a `contact_url` WhatsApp link), and only then send `acknowledge_conflicts: true`. A plain create answers `409 BLOCK_HAS_BOOKINGS` with the conflicts.
- `reminder_url` (booking detail) and `contact_url` (affected bookings) are `wa.me` links: open in a new tab with `rel="noopener noreferrer"`. The backend never sends WhatsApp messages.
- Dashboard `no_show_rate` and `online_booking_ratio` can be `null` (no data): show an empty marker, not 0%.
- CSV export is a bearer-protected download: fetch it with the axios instance as a blob and save it; a plain `<a href>` would not send the token. Owner only (`403` for staff): hide the entry for `staff`.
- Notifications: poll `GET /admin/notifications/unread-count` (about every 30 s while the tab is visible). Web Push needs a service worker, HTTPS or `localhost`, and `404` from `/admin/push/public-key` means the backend has Web Push turned off: hide the opt-in, do not show an error.

## Development plan (modules)

Built in order on `test/ai-prototype`, **one module = one commit**. The user decides when to start each. Update the Status column in the same commit as the module.

| #     | Scope                                                                                                            | Requirements | Status |
| ----- | ---------------------------------------------------------------------------------------------------------------- | ------------ | ------ |
| FE-0  | Foundation: dependencies, design tokens, API client and types, auth core, app shells, test setup, `.env.example` | FE-17        | done   |
| FE-1  | Public landing and service catalog                                                                               | FE-01, FE-02 | done   |
| FE-2  | Booking wizard                                                                                                   | FE-03        | done   |
| FE-3  | Booking status lookup and customer cancel                                                                        | FE-04        | done   |
| FE-4  | Admin login, session, guard, shell                                                                               | FE-05        | done   |
| FE-5  | Admin bookings: list, filters, detail, status, reschedule, notes, reminder link                                  | FE-06, FE-07 | done   |
| FE-6  | Admin manual booking                                                                                             | FE-08        | done   |
| FE-7  | Admin catalog: services and artists                                                                              | FE-09, FE-10 | done   |
| FE-8  | Admin schedule: business hours and blocked slots                                                                 | FE-11, FE-12 | done   |
| FE-9  | Dashboard and CSV export                                                                                         | FE-13, FE-14 | done   |
| FE-10 | Notifications inbox and Web Push opt-in                                                                          | FE-15, FE-16 | todo   |
| FE-11 | Polish: empty/loading/error pass, accessibility pass, end-to-end smoke test, README                              | FE-18        | todo   |

## Definition of done (per module)

1. Requirements in the PRD for the module are met, including the listed failure paths (validation, 401, 404, 409, 429).
2. `lint`, `check`, `typecheck`, `test` and `build` pass.
3. Verified by hand against the real backend (not only a mock) for the module's golden path; note in the commit body what you ran.
4. Follows the design spec: tokens only, monochrome, light, status never by color alone, keyboard and screen-reader basics.
5. Tests: unit tests for logic in `lib/` and `features/*/api|queries|schemas`; component tests (Testing Library + MSW) for non-trivial UI; no snapshot tests of markup.
6. Docs touched: the module's row above, `.env.example` if env changed, PRD only if behavior changed.

## Do not

- Do not add server-side rendering, server functions or a BFF without asking; the auth design assumes the browser talks to the API directly and the backend owns the refresh cookie.
- **Never persist a token in JavaScript-readable storage.** The access token lives in memory only. The refresh token is the backend's `HttpOnly` cookie and must never be copied from the response body into `localStorage`, `sessionStorage`, IndexedDB, state or logs; doing so throws away the XSS protection the cookie provides. The only thing allowed in `localStorage` for auth is a non-secret hint such as `np.session=1` (see `docs/API_GUIDE.md` section 4.2).
- Do not add a UI library besides shadcn/Base UI and lucide, and no charting library for the dashboard unless the PRD asks.
- Do not change the backend from this repo. If the contract has a gap, record it in the PRD open questions and tell the user.
- Do not "fix" the monochrome palette by adding a color accent. If a state seems to need color, raise it as a design question.
