# API guide: how the frontend talks to the backend

This is the first thing to read in a new session before writing any code that calls the API. It explains the conventions, the auth flow, the error model, every endpoint and the business rules that shape the UI. For exact field names, types and limits, the source of truth is **[`openapi.yaml`](./openapi.yaml)** in this folder.

|                   |                                                                                      |
| ----------------- | ------------------------------------------------------------------------------------ |
| Backend           | `backend-nail-art-app` (Express 5, PostgreSQL), repo `ariefdrm/backend-nail-art-app` |
| Contract version  | `1.0.0` (31 paths, 40 operations)                                                    |
| Synced from       | backend `develop` @ `00afea9` (2026-11-09, merge of PR #28), copied on 2026-11-10    |
| Base URL (dev)    | `http://localhost:3000/api/v1`                                                       |
| Interactive docs  | `http://localhost:3000/docs` (backend running outside production)                    |
| Refresh this copy | `bun --bun run api:sync` (see [`README.md`](./README.md))                            |

If this copy and a running backend disagree, the running backend and its `documents/openapi.yaml` win: re-sync, then tell the user what changed.

---

## 1. Running the backend

```bash
cd ../backend-nail-art-app
cp .env.example .env            # first time; fill JWT secrets (>= 32 chars) and DB settings
bun install && bun run prisma:generate
bun --bun run prisma migrate deploy
bun run db:seed                 # one artist "Owner", seven CLOSED days, and an owner admin (ADMIN_SEED_EMAIL / ADMIN_SEED_PASSWORD)
bun run dev                     # http://localhost:3000
```

- **CORS:** the backend answers browsers only for origins listed in its `CORS_ORIGINS` (default `http://localhost:5173`). A request from another origin simply gets no CORS headers and the browser blocks it. Add the frontend origin there if you serve it from another port or host.
- Health: `GET /health/live` and `GET /health/ready` (outside `/api/v1`; not needed by the UI).
- **A fresh database is empty on purpose:** no services, and every weekday closed. `GET /availability` returns no slots until an admin creates a service and opens business hours. See section 9 for a bootstrap checklist.
- Without a backend, mock the contract: `bunx @stoplight/prism-cli mock docs/openapi.yaml -p 4010` and point `VITE_API_BASE_URL` at `http://localhost:4010`.

## 2. Conventions

| Topic             | Rule                                                                                                                                                                               |
| ----------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Format            | JSON, `Content-Type: application/json`, body limit 100 kB. Keys are **snake_case**                                                                                                 |
| Success envelope  | `{ "data": ... }`; lists with pagination add `"meta": { "page", "per_page", "total", "total_pages" }`. `204` has no body                                                           |
| Error envelope    | `{ "error": { "code", "message", "details?", "conflicts?" } }` (section 3)                                                                                                         |
| Time              | ISO 8601 **with `+07:00`** (WIB), e.g. `2026-11-10T10:00:00+07:00`. Dates are `YYYY-MM-DD` in WIB. Send `start_at` back exactly as the availability endpoint returned it           |
| Money             | Integer Rupiah (`150000`), never floats                                                                                                                                            |
| Phone             | Send `08...`, `62...` or `+62...` (spaces, dashes, dots allowed). The API stores and returns **E.164** (`+6281234567890`). Only Indonesian mobile numbers (`+628...`) are accepted |
| IDs               | UUID v4, except `booking_code` (`NP-YYYYMMDD-XXXX`, letters without `0 O 1 I L`)                                                                                                   |
| Pagination        | `page` (>= 1, default 1) and `per_page` (1..100, default 20) on paginated lists                                                                                                    |
| Booleans in query | Spell them out: `unread=true` or `unread=false`                                                                                                                                    |
| Unknown fields    | Ignored on input; do not rely on them. The response contains only documented fields                                                                                                |

## 3. Errors

Every failure has the shape `{ "error": { "code": "...", "message": "..." } }`. Messages are Indonesian and user-safe, but the UI should map `code` (and HTTP status) to its own copy (see the PRD, section 8). Never show raw JSON or a stack trace.

| HTTP | `code`                      | When                                                                                | What the UI does                                                                 |
| ---- | --------------------------- | ----------------------------------------------------------------------------------- | -------------------------------------------------------------------------------- |
| 401  | `UNAUTHORIZED`              | Missing, expired or invalid access token; wrong login                               | On `/admin/*`: refresh once, then retry; on login: "email atau kata sandi salah" |
| 403  | `FORBIDDEN`                 | Signed in but the role is not allowed (CSV export is owner-only)                    | "Anda tidak memiliki akses"                                                      |
| 404  | `NOT_FOUND`                 | Unknown id/code, inactive service or artist, or (public booking lookup) wrong phone | Context-specific; public lookup uses one generic message                         |
| 409  | `SLOT_UNAVAILABLE`          | Slot taken, blocked, or not a valid slot (book/reschedule)                          | Refetch availability, ask for another time, keep the user's input                |
| 409  | `INVALID_STATUS_TRANSITION` | Status change not allowed, cancel too late, double cancel                           | Show the message and reload the data                                             |
| 409  | `BLOCK_HAS_BOOKINGS`        | Creating a blocked slot over active bookings without `acknowledge_conflicts`        | Show the `conflicts` list (section 7.5)                                          |
| 413  | `VALIDATION_ERROR`          | Body larger than 100 kB                                                             | Generic "data too large"                                                         |
| 422  | `VALIDATION_ERROR`          | Invalid input                                                                       | Show `details` on the matching fields                                            |
| 429  | `RATE_LIMITED`              | Too many requests from this IP                                                      | Wait `Retry-After` seconds (section 5)                                           |
| 500  | `INTERNAL_ERROR`            | Unexpected server error                                                             | Generic message + retry                                                          |

`details` is `[{ "field": "customer_phone", "message": "..." }]`. `field` is the body field name for body errors, prefixed `query.` for query-string errors (`query.date_from`) and `params.` for path errors. `conflicts` appears only on `BLOCK_HAS_BOOKINGS`.

## 4. Authentication

**Customers have no accounts.** All public endpoints work without a token. A customer proves ownership of a booking with its `booking_code` **plus the phone number**; a mismatch is `404` (never `403`), so the UI must show one generic "not found" message.

**Admins** (`owner` or `staff`) sign in with email and password.

```
POST /auth/login    { email, password }          -> 200 { data: { access_token, refresh_token, token_type: "Bearer", expires_in: 900 } }
POST /auth/refresh  { refresh_token }            -> 200 { data: { ...new TokenPair } }
POST /auth/logout   { refresh_token }            -> 204   (no access token needed; idempotent)
POST /auth/logout-all   (Bearer)                 -> 204   (ends every session of this admin)
GET  /auth/me           (Bearer)                 -> 200 { data: { id, name, email, role } }
```

Send `Authorization: Bearer <access_token>` on every `/admin/*` request and on `/auth/me`, `/auth/logout-all`.

- The **access token lives 15 minutes** (`expires_in` is in seconds) and is stateless: logging out does not invalidate one that was already issued.
- The **refresh token lives 7 days and is rotated on every use**: each successful `/auth/refresh` returns a new refresh token and the old one stops working.
- **Reuse detection:** presenting a refresh token that was already used makes the backend **revoke every session of that admin**. So refreshing must be strictly one-at-a-time, across requests _and_ across browser tabs, and the new refresh token must be saved _before_ the failed request is retried.
- Login failures are rate limited (section 5); the same `401` is returned for an unknown email and a wrong password.

A correct refresh routine, as a sketch (the real one belongs in `src/lib/auth/`):

```ts
let inFlight: Promise<string> | null = null // shared by all callers in this tab

export function refreshAccessToken(): Promise<string> {
  inFlight ??= navigator.locks // serialize across tabs
    .request('np-refresh', async () => {
      const stored = localStorage.getItem('np.refresh')
      if (!stored) throw new SessionExpiredError()
      // Another tab may have refreshed while we waited for the lock: use its token.
      if (memoryAccessTokenIsFresh()) return getAccessToken()
      const { data } = await rawAxios.post('/auth/refresh', { refresh_token: stored })
      localStorage.setItem('np.refresh', data.data.refresh_token) // save BEFORE anything is retried
      setAccessToken(data.data.access_token)
      return data.data.access_token
    })
    .finally(() => {
      inFlight = null
    })
  return inFlight
}
```

On `401` from an admin request: call `refreshAccessToken()` once, retry the request once with the new token, and if the refresh itself fails clear the session and go to the login page. Never loop.

## 5. Rate limits

Per client IP, in memory. Every `/api/v1` response carries `RateLimit` and `RateLimit-Policy` headers; a blocked request is `429 RATE_LIMITED` with `Retry-After` (seconds).

| Applies to                                              | Default limit | Window | Counts               |
| ------------------------------------------------------- | ------------- | ------ | -------------------- |
| `POST /auth/login`, `POST /auth/refresh`                | 10            | 15 min | failed attempts only |
| `POST /bookings`                                        | 10            | 1 hour | every request        |
| `GET /bookings/{code}`, `PATCH /bookings/{code}/cancel` | 30            | 15 min | every request        |
| Everything under `/api/v1`                              | 300           | 1 min  | every request        |

The defaults can be changed by the backend's `RATE_LIMIT_*_MAX` variables. A CORS preflight is never counted.

## 6. Endpoint map

Generated from `openapi.yaml` (`auth`: `public` needs no token, `admin` needs a Bearer token, `owner` needs a Bearer token of an `owner`). "Errors" lists the non-2xx statuses the contract documents.

| Method   | Path                                | Auth   | Summary (from the contract)                                                  | Success  | Errors             |
| -------- | ----------------------------------- | ------ | ---------------------------------------------------------------------------- | -------- | ------------------ |
| `GET`    | `/services`                         | public | Daftar layanan aktif                                                         | 200      | 422                |
| `GET`    | `/services/{id}`                    | public | Detail layanan                                                               | 200      | 404, 422           |
| `GET`    | `/artists`                          | public | Daftar nail artist aktif                                                     | 200      |                    |
| `GET`    | `/availability`                     | public | Slot waktu yang tersedia pada satu tanggal                                   | 200      | 404, 422           |
| `POST`   | `/bookings`                         | public | Buat reservasi                                                               | 201      | 404, 409, 422, 429 |
| `GET`    | `/bookings/{booking_code}`          | public | Cek status reservasi (kode booking + nomor telepon)                          | 200      | 404, 422, 429      |
| `PATCH`  | `/bookings/{booking_code}/cancel`   | public | Batalkan reservasi oleh customer                                             | 200      | 404, 409, 422, 429 |
| `POST`   | `/auth/login`                       | public | Login admin                                                                  | 200      | 401, 422, 429      |
| `POST`   | `/auth/refresh`                     | public | Perbarui access token                                                        | 200      | 401, 422, 429      |
| `POST`   | `/auth/logout`                      | public | Logout (cabut refresh token)                                                 | 204      | 422                |
| `POST`   | `/auth/logout-all`                  | admin  | Logout dari semua perangkat                                                  | 204      | 401                |
| `GET`    | `/auth/me`                          | admin  | Profil admin yang sedang login                                               | 200      | 401                |
| `GET`    | `/admin/bookings`                   | admin  | Daftar reservasi (untuk dashboard jadwal)                                    | 200      | 401, 422           |
| `POST`   | `/admin/bookings`                   | admin  | Buat reservasi manual (walk-in / dari chat)                                  | 201      | 401, 404, 409, 422 |
| `GET`    | `/admin/bookings/{id}`              | admin  | Detail reservasi                                                             | 200      | 401, 404, 422      |
| `PATCH`  | `/admin/bookings/{id}`              | admin  | Jadwal ulang / ubah data reservasi                                           | 200      | 401, 404, 409, 422 |
| `PATCH`  | `/admin/bookings/{id}/status`       | admin  | Ubah status reservasi                                                        | 200      | 401, 404, 409, 422 |
| `GET`    | `/admin/services`                   | admin  | Daftar semua layanan (termasuk nonaktif)                                     | 200      | 401                |
| `POST`   | `/admin/services`                   | admin  | Tambah layanan                                                               | 201      | 401, 422           |
| `PUT`    | `/admin/services/{id}`              | admin  | Ubah layanan                                                                 | 200      | 401, 404, 422      |
| `DELETE` | `/admin/services/{id}`              | admin  | Hapus layanan (soft delete / nonaktifkan jika sudah punya reservasi)         | 204      | 401, 404, 422      |
| `GET`    | `/admin/artists`                    | admin  | Daftar semua nail artist                                                     | 200      | 401                |
| `POST`   | `/admin/artists`                    | admin  | Tambah nail artist                                                           | 201      | 401, 422           |
| `PUT`    | `/admin/artists/{id}`               | admin  | Ubah nail artist                                                             | 200      | 401, 404, 422      |
| `DELETE` | `/admin/artists/{id}`               | admin  | Nonaktifkan nail artist                                                      | 204      | 401, 404, 422      |
| `GET`    | `/admin/business-hours`             | admin  | Jam operasional mingguan                                                     | 200      | 401                |
| `PUT`    | `/admin/business-hours`             | admin  | Ganti seluruh jam operasional mingguan                                       | 200      | 401, 422           |
| `GET`    | `/admin/blocked-slots`              | admin  | Daftar waktu yang diblokir (libur, istirahat, cuti artist)                   | 200      | 401, 422           |
| `POST`   | `/admin/blocked-slots`              | admin  | Blokir rentang waktu                                                         | 201      | 401, 409, 422      |
| `POST`   | `/admin/blocked-slots/check`        | admin  | Periksa reservasi yang terdampak sebelum memblokir                           | 200      | 401, 422           |
| `DELETE` | `/admin/blocked-slots/{id}`         | admin  | Hapus blokir                                                                 | 204      | 401, 404, 422      |
| `GET`    | `/admin/dashboard/summary`          | admin  | Ringkasan dashboard (indikator keberhasilan)                                 | 200      | 401, 422           |
| `GET`    | `/admin/export/bookings.csv`        | owner  | Ekspor reservasi ke CSV (untuk tim data science)                             | 200      | 401, 403, 422, 429 |
| `GET`    | `/admin/notifications`              | admin  | Kotak masuk notifikasi admin                                                 | 200      | 401, 422           |
| `GET`    | `/admin/notifications/unread-count` | admin  | Jumlah notifikasi yang belum dibaca admin yang sedang login                  | 200      | 401                |
| `POST`   | `/admin/notifications/read-all`     | admin  | Tandai semua notifikasi sebagai sudah dibaca (untuk admin yang sedang login) | 200      | 401                |
| `PATCH`  | `/admin/notifications/{id}/read`    | admin  | Tandai satu notifikasi sebagai sudah dibaca (idempoten)                      | 200      | 401, 404, 422      |
| `GET`    | `/admin/push/public-key`            | admin  | Kunci publik VAPID untuk berlangganan Web Push                               | 200      | 401, 404           |
| `POST`   | `/admin/push-subscriptions`         | admin  | Daftarkan perangkat/browser untuk menerima notifikasi Web Push               | 200, 201 | 401, 404, 422      |
| `DELETE` | `/admin/push-subscriptions`         | admin  | Berhenti berlangganan Web Push untuk perangkat ini                           | 204      | 401, 422           |

Notes: paths are relative to the base URL; `{id}` is a UUID; `/admin/export/bookings.csv` returns `text/csv`, everything else JSON.

## 7. Flows and examples

All examples use `BASE=http://localhost:3000/api/v1`.

### 7.1 Customer books

```text
GET  /services                       -> pick a service (id, name, duration_minutes, price)
GET  /availability?service_id=&date=YYYY-MM-DD[&artist_id=]   -> slots
POST /bookings                       -> 201 booking (status "pending") with booking_code
GET  /bookings/{code}?phone=...      -> status
PATCH /bookings/{code}/cancel        -> cancel
```

```bash
curl "$BASE/availability?service_id=$SERVICE&date=2026-11-12"
```

```json
{
  "data": {
    "date": "2026-11-12",
    "service_id": "…",
    "slots": [
      {
        "start_at": "2026-11-12T09:00:00+07:00",
        "end_at": "2026-11-12T10:30:00+07:00",
        "available_artist_ids": ["…"]
      }
    ]
  }
}
```

```bash
curl -X POST "$BASE/bookings" -H 'content-type: application/json' -d '{
  "service_id": "…",
  "start_at": "2026-11-12T09:00:00+07:00",
  "customer_name": "Siti Rahayu",
  "customer_phone": "0812-3456-7890",
  "customer_note": "Warna pink"
}'
```

`artist_id` is optional (omit it: the system assigns a free artist). `reference_image_url` and `customer_note` are optional. The response `data` is a **Booking** (`booking_code`, `status: "pending"`, `service`, `artist`, `start_at`, `end_at`, `total_price`, `source: "online"`, `schedule_conflict: false`, ...); it does **not** contain `reminder_url`.

- A slot is only valid if it came from `GET /availability`. Off-grid or already taken times are `409 SLOT_UNAVAILABLE`; past dates or dates beyond `MAX_ADVANCE_DAYS` are `422`.
- Cancel: `PATCH /bookings/{code}/cancel` with `{ "phone": "...", "reason": "optional, max 255" }`. Allowed only for `pending`/`confirmed` and before `start_at` (the backend may also enforce `CANCEL_MIN_HOURS_BEFORE`); otherwise `409 INVALID_STATUS_TRANSITION`.
- `schedule_conflict: true` on a looked-up booking means the owner blocked time over it and will contact the customer.

### 7.2 Admin sign-in and bookings

```bash
TOKEN=$(curl -s -X POST "$BASE/auth/login" -H 'content-type: application/json' \
  -d '{"email":"owner@example.com","password":"…"}' | jq -r .data.access_token)

curl "$BASE/admin/bookings?date_from=2026-11-10&date_to=2026-11-16&status=pending&q=siti&page=1&per_page=20" \
  -H "authorization: Bearer $TOKEN"
```

- Filters on `GET /admin/bookings`: `date_from`, `date_to` (inclusive WIB days, by `start_at`; `date_from` must not be after `date_to`), `status`, `artist_id`, `q` (matches name, booking code, or phone as `08...`/`+62...`), `page`, `per_page`. Results are ordered by `start_at` ascending.
- `GET /admin/bookings/{id}` and the list items include `reminder_url` (a `wa.me` link with a ready message; `null` unless the booking is `pending`/`confirmed`) and `schedule_conflict`.
- **Change status:** `PATCH /admin/bookings/{id}/status` with `{ "status": "confirmed" }` or `{ "status": "cancelled", "reason": "..." }`.

  | From                                | Allowed to                          |
  | ----------------------------------- | ----------------------------------- |
  | `pending`                           | `confirmed`, `cancelled`            |
  | `confirmed`                         | `completed`, `cancelled`, `no_show` |
  | `completed`, `cancelled`, `no_show` | nothing (final)                     |

  `cancelled` requires `reason` (`422` without it). `completed` and `no_show` are refused (`409`) before the booking's `start_at`. Confirming stamps the confirmation time.

- **Reschedule / edit:** `PATCH /admin/bookings/{id}` with at least one of `start_at`, `artist_id`, `service_id`, `customer_note`, `admin_note` (an empty note string clears it). Moving the schedule works only on `pending`/`confirmed` bookings, follows the same slot rules as a new booking (`409 SLOT_UNAVAILABLE` otherwise), keeps the artist unless `artist_id` is sent, and re-copies the price only when `service_id` changes.
- **Manual booking:** `POST /admin/bookings` takes the same body as `POST /bookings` and creates it already `confirmed` with `source: "admin"`.

### 7.3 Catalog (admin)

`GET/POST /admin/services`, `PUT/DELETE /admin/services/{id}` and `GET/POST /admin/artists`, `PUT/DELETE /admin/artists/{id}`. Lists include inactive items. Limits: service `name` <= 120, `category` <= 50, `description` <= 1000, `price` 0..100,000,000, `duration_minutes` 15..480 in steps of 15; artist `name` <= 80; image URLs must be `http`/`https`. `DELETE` removes an unused item and **deactivates** one that already has bookings (still `204`; reload the list to see which happened).

### 7.4 Business hours (admin)

`GET /admin/business-hours` returns 7 rows (`day_of_week` 0 = Sunday .. 6 = Saturday). `PUT` replaces the whole week atomically and must contain exactly 7 distinct days:

```json
{
  "hours": [
    { "day_of_week": 0, "is_open": false },
    {
      "day_of_week": 1,
      "is_open": true,
      "open_time": "09:00",
      "close_time": "17:00",
      "break_start": "12:00",
      "break_end": "13:00"
    }
  ]
}
```

Times are `HH:mm` in WIB. An open day needs `open_time < close_time`; the break is optional, must be given as a pair, and must lie inside opening hours; a closed day has no times. Changes affect future slots only; existing bookings are never touched. The public API has **no** endpoint for business hours.

### 7.5 Blocked slots and conflicts (admin)

Always preview first:

```text
POST /admin/blocked-slots/check   { start_at, end_at, artist_id? }
  -> 200 { data: { can_block: false, conflicts: [AffectedBooking...] } }

POST /admin/blocked-slots         { start_at, end_at, artist_id?, reason?, acknowledge_conflicts? }
  -> 201 { data: BlockedSlot & { affected_bookings: [...] } }
  -> 409 BLOCK_HAS_BOOKINGS { error: { ..., conflicts: [...] } }   (when bookings overlap and acknowledge_conflicts is not true)
```

`artist_id` omitted or `null` blocks the whole studio; `end_at` must be after `start_at`, at most 366 days later. Nothing is cancelled automatically. Each conflicting booking has a `contact_url` (`wa.me` with a ready message that never contains the owner's reason); the owner then reschedules or cancels it from the bookings screen. `GET /admin/blocked-slots` accepts `date_from`/`date_to`; `DELETE /admin/blocked-slots/{id}` removes one.

### 7.6 Dashboard and CSV (admin)

`GET /admin/dashboard/summary?date_from=&date_to=` (both required, inclusive WIB days, at most 366 days). Returns `total_bookings`, `by_status` (all five keys), `no_show_rate` and `online_booking_ratio` (0..1, **`null` when there is nothing to divide by**), `revenue_completed` (Rupiah) and `avg_confirmation_minutes` (`null` when none).

`GET /admin/export/bookings.csv` (owner only) streams a CSV and needs the Bearer token, so download it with the authenticated client as a blob; a plain link cannot send the token. Optional `date_from`, `date_to`, `status`. The file name is in `Content-Disposition`. It contains no names, phone numbers, booking codes or free text; customers are linked by `customer_ref`.

### 7.7 Notifications and Web Push (admin)

- `GET /admin/notifications?unread=true|false&page=&per_page=` (last 30 days, newest first), `GET /admin/notifications/unread-count` (poll this, about every 30 s), `PATCH /admin/notifications/{id}/read` (idempotent), `POST /admin/notifications/read-all`. Read state is **per admin**.
- Types: `new_booking`, `booking_cancelled`, `unconfirmed_reminder`, `upcoming_reminder`, `schedule_conflict`. `booking_id` (nullable) links to the booking. The text contains the booking code, service, time and the customer's first name only.
- Web Push: `GET /admin/push/public-key` returns the VAPID key (or `404` when the server has Web Push turned off: hide the feature). Register with `POST /admin/push-subscriptions` and the browser's `subscription.toJSON()` (`{ endpoint, keys: { p256dh, auth } }`): `201` new, `200` already registered. The endpoint must be `https` on a known browser push service (otherwise `422`). Unregister with `DELETE /admin/push-subscriptions` and `{ "endpoint": "..." }` (`204`). The push payload is `{ notification_id, booking_id, type, title, body }`. Needs a service worker and HTTPS or `localhost`.

## 8. Business rules that shape the UI

- **Statuses:** `pending` (waiting for the owner) -> `confirmed` -> `completed`; also `cancelled` and `no_show`. Confirmation is manual.
- **Slots:** from `GET /availability`, on a 30-minute grid (server setting `SLOT_STEP_MINUTES`) starting at opening time, never crossing closing time or the break, past times removed for today. The service duration decides each slot's length.
- **Buffer:** every active booking occupies its artist until `end_at + 15 min` (`BOOKING_BUFFER_MINUTES`), so a slot right after another booking may be missing.
- **Horizon:** a customer can book from now up to `MAX_ADVANCE_DAYS` (default 60) ahead. The API does not expose this value; the frontend uses `VITE_MAX_ADVANCE_DAYS` and must keep it equal to the backend's.
- **Artist:** optional. Omitted -> the system picks a free artist. Specifying one restricts availability to that artist.
- **Price:** copied from the service when the booking is made (snapshot); later price changes do not touch existing bookings.
- **Blocked time** wins over everything: blocked slots are removed from availability immediately, and bookings under a block get `schedule_conflict: true`.
- **Roles:** `owner` can do everything; `staff` is refused (`403`) only where the contract says so (CSV export).
- **Privacy:** phone numbers appear only in booking responses for the customer who owns it (code + phone) and in admin booking data; they are never in notifications, push payloads or the CSV.

## 9. Test data and bootstrap

After `bun run db:seed` the database has only one artist (`Owner`), seven closed days and the owner admin from `ADMIN_SEED_EMAIL` / `ADMIN_SEED_PASSWORD` (real services and hours are not seeded yet). To get a bookable day:

1. `POST /auth/login` as the owner -> `access_token`.
2. `POST /admin/services` `{ "name": "Gel Polish", "category": "gel_polish", "price": 150000, "duration_minutes": 90 }`.
3. `PUT /admin/business-hours` with 7 days (open at least one day, e.g. `09:00`-`17:00`, break `12:00`-`13:00`).
4. `GET /availability?service_id=<id>&date=<an open day within 60 days>` now returns slots.
5. `POST /bookings` as a customer, then `PATCH /admin/bookings/{id}/status` `{ "status": "confirmed" }` as the owner.

Useful to test the UI states: book the same slot twice (`409`), look up a booking with a wrong phone (`404`), fail the login more than 10 times (`429`), block time over a booking (conflict flow), move a booking, and wait or fake time for the notification types.

## 10. Known gaps in the contract

These are limits of the current backend, tracked in the PRD (section 14); do not work around them silently:

- No public endpoint for business hours (the landing page cannot show opening hours).
- `GET /availability` counts the booking being rescheduled as busy, so its own current time may look unavailable.
- `MAX_ADVANCE_DAYS` and `SLOT_STEP_MINUTES` are not exposed.
- The booking status history exists in the database but has no endpoint.
- The booking response has no "can still be cancelled" flag; the cancel rules surface as `409`.
- Risk score for no-shows (FR-16) is not built.
