# The Nail Palace: frontend

One web app for a single nail art studio in Jambi, Indonesia. Customers browse services, book a slot and look up or cancel a booking, with no account. The owner and staff sign in at `/admin` to manage reservations, the catalog, the schedule, the dashboard and notifications. It talks to the REST API in `backend-nail-art-app`.

Built with TanStack Start (React 19, file-based TanStack Router, SPA mode), Vite 8, TypeScript (strict), Tailwind CSS 4, shadcn/ui on Base UI, TanStack Query, react-hook-form + zod, axios and Bun. The interface is in Indonesian; code, comments and commit messages are in English.

> [!IMPORTANT]
> Contributor guide: read [GIT_WORKFLOW.md](./GIT_WORKFLOW.md) for the branching strategy, commit conventions and pull request process. Working on this codebase with an AI agent? Start with [CLAUDE.md](./CLAUDE.md) and [CODE_STYLE.md](./CODE_STYLE.md).

## Quick start

You need the backend running first (see [Backend](#backend)). Then pick one:

**In a container (Docker or Podman, no Bun on the host)**

```bash
docker compose -f compose.dev.yaml up --build -d   # Docker
podman compose -f compose.dev.yaml up --build -d   # Podman (needs podman-compose or docker-compose)
```

**On the host**

```bash
bun install
bun --bun run dev
```

Open <http://localhost:5173>. The port is fixed (`strictPort`): the backend allows exactly that origin.

| Task                             | Command                                                                                              |
| -------------------------------- | ---------------------------------------------------------------------------------------------------- |
| Logs                             | `docker compose -f compose.dev.yaml logs -f web`                                                     |
| Stop                             | `docker compose -f compose.dev.yaml down`                                                            |
| Run a command inside             | `docker compose -f compose.dev.yaml exec web bun --bun run verify`                                   |
| After changing `package.json`    | `docker compose -f compose.dev.yaml up --build -d` (the container also runs `bun install` on start)  |
| Reset dependencies               | `docker compose -f compose.dev.yaml down -v` (drops the `node_modules` volume), then `up --build -d` |
| Another API address (e.g. a LAN) | `VITE_API_BASE_URL=http://192.168.1.10:3000/api/v1 docker compose -f compose.dev.yaml up -d`         |

Container notes:

- The **browser** calls the API, so `VITE_API_BASE_URL` is an address reachable from your machine, not from inside the container.
- `node_modules` lives in a named volume on purpose: a host `node_modules` holds binaries built for your OS that do not run on Alpine.
- Rootless Podman keeps files in the project owned by you. With rootful Docker, files the container generates (`src/routeTree.gen.ts`, `.tanstack/`) are owned by root; run `sudo chown -R "$USER" .` if that gets in the way.

## Configuration

Copy `.env.example` to `.env` (the container needs no `.env`; compose supplies the defaults).

| Variable                | Example                        | Meaning                                                                                                     |
| ----------------------- | ------------------------------ | ----------------------------------------------------------------------------------------------------------- |
| `VITE_API_BASE_URL`     | `http://localhost:3000/api/v1` | Backend base URL, including `/api/v1`                                                                       |
| `VITE_MAX_ADVANCE_DAYS` | `60`                           | How far ahead a customer may book; must equal the backend's `MAX_ADVANCE_DAYS` (the API does not expose it) |

Only `VITE_*` variables reach the browser. Both are validated at startup in `src/lib/env.ts`.

## Backend

The API lives in the sibling repository `backend-nail-art-app` (Express 5, PostgreSQL). Its contract is copied into this repo as [`docs/openapi.yaml`](./docs/openapi.yaml) and explained in [`docs/API_GUIDE.md`](./docs/API_GUIDE.md); refresh it with `bun --bun run api:sync` and regenerate the types with `bun --bun run api:types`.

The backend must be configured for this app:

- `CORS_ORIGINS` has to include the frontend origin (`http://localhost:5173` in development). Without it admin login answers `403 Origin tidak diizinkan` and the app shows a configuration message.
- A fresh database has no services and every weekday closed, so no slot is bookable. Add services and opening hours from the admin pages (`/admin/layanan`, `/admin/jadwal`), or follow the bootstrap steps in `docs/API_GUIDE.md` section 9.
- Web Push needs `VAPID_*` keys on the backend. Without them the "Notifikasi di perangkat ini" section stays hidden.

## Pages

| Path                              | What it is                                                                    |
| --------------------------------- | ----------------------------------------------------------------------------- |
| `/`, `/layanan`                   | Landing page and service catalog                                              |
| `/pesan`, `/pesan/berhasil`       | Booking wizard (service, date and time, details, review) and result           |
| `/cek-booking`                    | Look up a booking by code and phone number, or cancel it                      |
| `/admin/login`                    | Sign in                                                                       |
| `/admin`                          | Dashboard (ranges, key figures, status breakdown)                             |
| `/admin/reservasi`                | Reservations as a list or a week/month calendar, detail panel, manual booking |
| `/admin/layanan`, `/admin/artist` | Manage services and artists                                                   |
| `/admin/jadwal`                   | Business hours and blocked time                                               |
| `/admin/notifikasi`               | Notification inbox                                                            |
| `/admin/ekspor`                   | CSV export (owner only)                                                       |
| `/admin/pengaturan`               | Push notifications on this device, sign out of all devices                    |

Customer site and admin are one app with separate layouts; the public site does not link to `/admin`. The route guard only spares people an empty screen: the backend enforces access.

## How it works

- **Layers.** `routes` (thin) → `features/*` → `components` and `lib`. A feature never imports another feature; shared code goes to `components/common` or `lib`. ESLint enforces this, along with "axios only in the API layer".
- **Server state** lives in TanStack Query. Filters, pages and the selected item live in the URL (validated search params), so views can be linked.
- **Admin sign-in.** The refresh token is an `HttpOnly` cookie set by the backend; the access token (15 minutes) lives in memory only. A page load or new tab resumes the session with one `POST /auth/refresh`. Refresh is single-flight across requests and tabs (Web Locks + `BroadcastChannel`) because the backend revokes every session if a rotated token is reused. Nothing secret is ever written to web storage; the only auth item in `localStorage` is the non-secret hint `np.session=1`. Details: `docs/API_GUIDE.md` section 4.
- **Time and money.** Everything is shown in `Asia/Jakarta` and Rupiah through `src/lib/format.ts`; booking slots are sent back exactly as the availability API returned them.
- **Design.** Black and white, light theme only, tokens only in `src/styles.css`; status is carried by icon, text and shape, never by color alone ([DESIGN_SPEC.md](./DESIGN_SPEC.md)). Presentation and data are separate so a designer can restyle the UI without touching data code.
- **Failure paths.** Every list and form has loading, empty, error (with "Coba lagi") and normal states; `409`, `422`, `429` (with a `Retry-After` countdown), `403` and network errors each have a defined message ([PRD](./PRD_Frontend_The_Nail_Palace.md) section 8).

## Commands

```bash
bun --bun run dev              # dev server on http://localhost:5173
bun --bun run build            # production build into .output/
bun --bun run verify           # format check + lint + typecheck + tests + build
bun --bun run test             # Vitest (unit and component tests)
bun --bun run test:watch       # Vitest in watch mode
bun --bun run test:e2e         # Playwright smoke tests (see below)
bun --bun run lint             # ESLint (type-aware)
bun --bun run format           # Prettier + ESLint --fix
bun --bun run typecheck        # tsc --noEmit
bun --bun run api:sync         # copy the contract from ../backend-nail-art-app
bun --bun run api:types        # generate src/lib/api/schema.gen.ts from docs/openapi.yaml
bun --bun run generate-routes  # regenerate src/routeTree.gen.ts
```

After adding a shadcn component (`bunx --bun shadcn@latest add <name>`) run `bun --bun run format`.

## Testing

**Unit and component tests** (`bun --bun run test`, part of `verify`). Vitest + Testing Library + MSW, with the API mocked from the contract and the browser's push APIs faked. Tests sit next to the code as `*.test.ts(x)` and query by role and label.

**End-to-end smoke tests** (`bun --bun run test:e2e`, optional). Playwright drives a real browser against a stack you start yourself: the backend and the frontend. They cover public pages (single `h1`, page language, landmarks, no sideways scrolling at phone width, skip link), a wrong lookup, the sign-in guard and, with credentials, the admin flow.

```bash
bun --bun run e2e:install                        # once: downloads Chromium
bun --bun run test:e2e                           # public specs
E2E_ADMIN_EMAIL=... E2E_ADMIN_PASSWORD=... bun --bun run test:e2e   # plus the admin specs
```

Notes: the booking spec **creates a real booking and cancels it again** (a cancelled booking named "Uji Otomatis" stays in the database it runs against); the backend rate-limits bookings and lookups per IP, so the specs run one at a time. On Linux the browser needs system libraries; `bunx playwright install-deps chromium` installs them (needs `sudo`). `E2E_BASE_URL` and `E2E_API_URL` override the default addresses.

## Production build

```bash
bun --bun run build
PORT=8080 bun .output/server/index.mjs
```

The build is a self-contained Nitro server (`bun` preset) that serves the SPA and `public/` (including the push service worker `sw.js`). For production, serve the frontend and the API from the same site (ideally one origin behind a reverse proxy): the refresh cookie and CORS are simplest that way, and the cookie rules in `docs/API_GUIDE.md` section 4.4 apply. Web Push works only on HTTPS or `localhost`.

## Project structure

```
src/
  routes/            # file-based routes; thin, they only compose features
  features/          # one folder per area, each with api.ts, queries.ts, schemas.ts, components/
    auth/ booking/ booking-lookup/ catalog/ home/
    reservations/ admin-services/ admin-artists/ schedule/
    dashboard/ export/ notifications/ push/
  components/
    ui/              # shadcn components (restyled through tokens)
    common/          # shared building blocks: status badge, empty and error states, form field, ...
  layouts/           # customer and admin shells
  lib/
    api/             # axios client, error handling, generated types, shared public data
    auth/            # in-memory token, cross-tab refresh, session bootstrap
    format.ts        # money, dates, times, phone numbers (Asia/Jakarta, id-ID)
    push/            # Web Push helpers
  hooks/             # small shared hooks
  styles.css         # the only place for design tokens
public/sw.js         # push service worker
e2e/                 # Playwright smoke tests
docs/                # API contract (openapi.yaml) and usage guide
```

## Known gaps in the backend contract

Recorded in [PRD](./PRD_Frontend_The_Nail_Palace.md) section 14.1 and worth passing on to the backend owner: no public endpoint for opening hours, availability counts the booking being rescheduled as busy, `MAX_ADVANCE_DAYS` is not exposed, there is no booking status history endpoint, and `Content-Disposition` is not in the CORS exposed headers (the CSV export therefore uses a fallback file name).

## Documents

| File                                                                 | What it covers                                                   |
| -------------------------------------------------------------------- | ---------------------------------------------------------------- |
| [PRD_Frontend_The_Nail_Palace.md](./PRD_Frontend_The_Nail_Palace.md) | What to build: requirements FE-01 to FE-18, routes, error table  |
| [DESIGN_SPEC.md](./DESIGN_SPEC.md)                                   | How it looks: tokens, components, wireframes, copy rules         |
| [CODE_STYLE.md](./CODE_STYLE.md)                                     | How code is written, with patterns and what the tooling enforces |
| [docs/API_GUIDE.md](./docs/API_GUIDE.md)                             | Conventions, auth, errors, endpoints and business rules          |
| [GIT_WORKFLOW.md](./GIT_WORKFLOW.md)                                 | Branches, commits and pull requests                              |
