# CODE_STYLE.md

How code in this repository is written. It exists so that every file looks as if one person wrote it, whether a human or an AI agent did. Read it before generating code, and copy the patterns in section 6 instead of inventing new ones.

**Rule of precedence:** a lint or compiler error beats this document (fix the document), this document beats habit, and `CLAUDE.md` / `DESIGN_SPEC.md` / the PRD decide behavior and appearance. Section 12 lists what is enforced automatically and what is not.

---

## 1. Quick reference

| Topic        | Decision                                                                                                                                                     |
| ------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| Formatting   | Prettier: no semicolons, single quotes, trailing commas, width 100, 2 spaces. Tailwind classes are sorted by the Prettier plugin. Never format by hand       |
| File names   | `kebab-case` for everything in `components/`, `features/`, `lib/`, `hooks/`, `layouts/` (routes follow TanStack Router names)                                |
| Exports      | **Named exports only** (`export function Foo`). Default exports only in config files. No `index.ts` barrels                                                  |
| Imports      | `@/` alias across folders, `./` inside a folder, never `../` and never `#/`. Fixed order (section 3)                                                         |
| Types        | `type` aliases, not `interface` (except declaration merging). No `enum`: use string-literal unions. No `any`. No `!` non-null assertions                     |
| Components   | `export function Name(props: NameProps)`, props type declared above, destructured in the signature. No `React.FC`, no `forwardRef` unless a library needs it |
| Server data  | TanStack Query only, from `features/*/queries.ts`. Components never import axios                                                                             |
| Forms        | react-hook-form + zod, schemas in `features/*/schemas.ts`                                                                                                    |
| Styling      | Tailwind classes that use **design tokens**. No palette colors, no `dark:`, no shadows, no arbitrary colors. `cn()` for merging, `cva()` for variants        |
| Copy         | Indonesian, in the component or in `lib/copy.ts` when shared. Code and comments in English                                                                   |
| Time / money | Only through `lib/format.ts`. Timezone is always `Asia/Jakarta`                                                                                              |
| Tests        | Vitest + Testing Library + MSW, file next to the code as `name.test.ts(x)`. Query by role/label. No snapshots                                                |
| Commits      | Conventional Commits with scope, English, no `Co-Authored-By` line (see `CLAUDE.md`)                                                                         |

## 2. Files, folders and names

- One component per file, named after it: `booking-card.tsx` exports `BookingCard`. Small private helpers may sit in the same file; if they are reused, move them.
- Suffix files by role so the layer is obvious from the name: `api.ts`, `queries.ts`, `schemas.ts` (per feature), `*.test.ts(x)`. Hooks are `use-something.ts` exporting `useSomething`.
- Folders are `kebab-case`: `features/booking/components/slot-picker.tsx`.
- Identifiers: `camelCase` for variables and functions, `PascalCase` for components and types, `UPPER_SNAKE_CASE` for module-level constants that never change.
- Booleans read as questions: `isLoading`, `hasConflict`, `canCancel`. Event handlers: `handleSubmit` inside a component, `onSubmit` as a prop. Query hooks: `useBookingsQuery`, mutation hooks: `useCancelBookingMutation`.
- Do not abbreviate (`booking`, not `bk`; `index` only in loops). Common short names are fine: `id`, `url`, `ref`, `props`, `i`.
- API field names are `snake_case` because the contract is. Keep them as they are inside `api.ts` and the typed data; do not rename keys on the way into components.

## 3. Imports

Order, with one blank line between groups (ESLint `import/order` enforces and `--fix` repairs it), alphabetical inside each group:

1. Node built-ins (rare in `src/`)
2. External packages (`react`, `@tanstack/*`, `lucide-react`, ...)
3. Internal, `@/...`
4. Parent (forbidden: use `@/`)
5. Sibling, `./...`
6. `import type { ... }` statements (always their own last group)

```tsx
import { useQuery } from '@tanstack/react-query'
import { Clock } from 'lucide-react'

import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'

import { bookingKeys } from './queries'

import type { Booking } from '@/lib/api/types'
```

- Type-only imports use a **separate** `import type` statement, not an inline `type` specifier. Do not mix values and types in one import.
- No barrel files (`index.ts` that re-exports). Import from the file that defines the thing.
- `src/routeTree.gen.ts` and `src/lib/api/schema.gen.ts` are generated: never edit or lint them.

### Layers

```
routes  ->  features  ->  components  ->  lib
```

An arrow means "may import from". Nothing imports upward. `lib/` knows nothing about React components or features. `components/` (shadcn, `common/`) knows nothing about features. Routes only compose. Features do not import other features' files; if two features need the same thing, move it to `components/common/` or `lib/`. `axios` may be imported only in `src/lib/api/**` and `src/features/*/api.ts`. ESLint enforces all of this.

## 4. TypeScript

- `strict` plus `noUncheckedIndexedAccess`: indexing an array or record gives `T | undefined`. Handle it; do not cast it away.
- Prefer inference for locals. Annotate exported functions outside components (`lib/`, `api.ts`) with an explicit return type. Components rely on inference.
- `type` over `interface`. Props: `type FooProps = { ... }` declared above the component.
- Use string-literal unions or `as const` objects instead of `enum`: `type BookingStatus = Booking['status']`.
- Take types from the generated contract (`@/lib/api/types`), do not hand-copy API shapes. Derive form types from the zod schema with `z.infer`.
- `unknown` plus narrowing instead of `any`. No `// @ts-ignore`; `// @ts-expect-error` needs a reason on the same line.
- Switch over a union must be exhaustive (ESLint checks it): end with a `default` that assigns to `never` only if you need a runtime guard.
- `null` means "the API said null / no value"; `undefined` means "not provided". Do not convert one into the other without a reason.
- Dates stay ISO strings in the data layer. Never do date arithmetic in components; use helpers in `lib/format.ts`.
- Promises are awaited or handled; `void somePromise()` marks an intentional fire-and-forget. Async functions passed to JSX handlers are fine.

## 5. React

- Function components only. Declare with `export function`, destructure props in the signature, give `className` support to any component that renders a root element and merge it with `cn()`.
- Keep a component's body in this order: hooks, derived values, handlers, early returns (loading / error / empty), main JSX.
- **Never define a component inside another component.** Extract it.
- Derive instead of syncing: if a value can be computed from props or state, compute it in render. `useEffect` is for synchronizing with the outside world (DOM events, subscriptions, `localStorage`), not for fetching data (use Query) and not for copying props into state. The `react-hooks` rules (including `set-state-in-effect`) are errors.
- Keys are stable ids from the data, never the array index for data that can change.
- No `React.memo`, `useMemo` or `useCallback` by default. Add one only after measuring, with a comment saying why.
- Render API text as text. `dangerouslySetInnerHTML` is forbidden.
- Every async view has four states designed: loading (skeleton), empty, error (with retry), normal. Use the shared `EmptyState` / `ErrorState` components.
- Interactive elements are real elements: `<button>`, `<a>` / router `Link`, `<input>`. A clickable `<div>` fails lint.
- Icon-only buttons have `aria-label`; decorative icons have `aria-hidden`.

## 6. Canonical patterns

Copy these shapes. Names in angle brackets are placeholders.

### 6.1 Presentational component

```tsx
import { Clock } from 'lucide-react'

import { cn } from '@/lib/utils'

type StatusLabelProps = {
  label: string
  className?: string
}

export function StatusLabel({ label, className }: StatusLabelProps) {
  return (
    <span className={cn('inline-flex items-center gap-1 text-sm text-muted-foreground', className)}>
      <Clock className="size-4" aria-hidden />
      {label}
    </span>
  )
}
```

### 6.2 API function (`features/<feature>/api.ts`)

The only file type that knows URLs and the `{ data }` envelope. Returns plain typed data.

```ts
import { api } from '@/lib/api/client'

import type { Booking, Paginated } from '@/lib/api/types'

export type ListBookingsParams = {
  date_from?: string
  date_to?: string
  status?: Booking['status']
  page?: number
  per_page?: number
}

export async function listBookings(params: ListBookingsParams): Promise<Paginated<Booking>> {
  const res = await api.get<Paginated<Booking>>('/admin/bookings', { params })
  return res.data
}

export async function getBooking(id: string): Promise<Booking> {
  const res = await api.get<{ data: Booking }>(`/admin/bookings/${id}`)
  return res.data.data
}
```

### 6.3 Query hooks (`features/<feature>/queries.ts`)

Keys come from a factory; mutations invalidate in `onSuccess`; components receive hooks, never raw clients.

```ts
import {
  keepPreviousData,
  queryOptions,
  useMutation,
  useQuery,
  useQueryClient,
} from '@tanstack/react-query'

import { changeStatus, getBooking, listBookings } from './api'

import type { ListBookingsParams } from './api'

export const bookingKeys = {
  all: ['bookings'] as const,
  list: (params: ListBookingsParams) => [...bookingKeys.all, 'list', params] as const,
  detail: (id: string) => [...bookingKeys.all, 'detail', id] as const,
}

export const bookingListOptions = (params: ListBookingsParams) =>
  queryOptions({
    queryKey: bookingKeys.list(params),
    queryFn: () => listBookings(params),
    placeholderData: keepPreviousData,
    staleTime: 15_000,
  })

export const bookingDetailOptions = (id: string) =>
  queryOptions({ queryKey: bookingKeys.detail(id), queryFn: () => getBooking(id) })

export function useBookingsQuery(params: ListBookingsParams) {
  return useQuery(bookingListOptions(params))
}

export function useChangeStatusMutation(id: string) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (input: { status: string; reason?: string }) => changeStatus(id, input),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: bookingKeys.all }),
  })
}
```

### 6.4 Form schema and form (`schemas.ts`, component)

```ts
import { z } from 'zod'

export const guestSchema = z.object({
  customer_name: z.string().trim().min(1, 'Nama wajib diisi').max(100),
  customer_phone: z.string().trim().min(1, 'Nomor HP wajib diisi'),
  customer_note: z.string().trim().max(500).optional(),
})

export type GuestValues = z.infer<typeof guestSchema>
```

```tsx
import { zodResolver } from '@hookform/resolvers/zod'
import { useForm } from 'react-hook-form'

import { Button } from '@/components/ui/button'
import { applyApiErrors } from '@/lib/api/errors'

import { guestSchema } from '../schemas'

import type { GuestValues } from '../schemas'

type GuestFormProps = { onSubmit: (values: GuestValues) => Promise<void> }

export function GuestForm({ onSubmit }: GuestFormProps) {
  const form = useForm<GuestValues>({ resolver: zodResolver(guestSchema) })

  async function handleSubmit(values: GuestValues) {
    try {
      await onSubmit(values)
    } catch (error) {
      applyApiErrors(form.setError, error) // maps 422 details[].field onto the fields
    }
  }

  return (
    <form onSubmit={form.handleSubmit(handleSubmit)} noValidate>
      {/* fields: label + input + error message wired with aria-describedby */}
      <Button type="submit" disabled={form.formState.isSubmitting}>
        {form.formState.isSubmitting ? 'Mengirim...' : 'Kirim pemesanan'}
      </Button>
    </form>
  )
}
```

### 6.5 Route (`routes/...`)

Routes are thin: validate the URL, pick the feature components, nothing else. Filters and paging live in validated search params.

```tsx
import { createFileRoute } from '@tanstack/react-router'
import { z } from 'zod'

import { BookingList } from '@/features/bookings/components/booking-list'

const searchSchema = z.object({
  status: z.enum(['pending', 'confirmed', 'completed', 'cancelled', 'no_show']).optional(),
  page: z.number().int().min(1).catch(1),
  id: z.string().uuid().optional(),
})

export const Route = createFileRoute('/admin/_app/reservasi')({
  validateSearch: searchSchema,
  component: ReservationsPage,
})

function ReservationsPage() {
  const search = Route.useSearch()
  const navigate = Route.useNavigate()
  return <BookingList search={search} onSearchChange={(next) => navigate({ search: next })} />
}
```

### 6.6 Test

```tsx
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it } from 'vitest'

import { StatusLabel } from './status-label'

describe('StatusLabel', () => {
  it('shows the label', () => {
    render(<StatusLabel label="Menunggu konfirmasi" />)
    expect(screen.getByText('Menunggu konfirmasi')).toBeInTheDocument()
  })
})
```

Name tests as behavior ("shows ... when ...", "rejects ..."). Arrange, act, assert in that order. Find elements by role, label or text, never by class or test id unless there is no alternative. Mock the network with MSW handlers derived from `docs/openapi.yaml`, not by mocking `axios`. Cover the failure paths listed in the PRD (422, 409, 429, 401), not only the happy path.

## 7. Styling

- Use the token classes from `DESIGN_SPEC.md`: `bg-background`, `text-foreground`, `text-muted-foreground`, `bg-muted`, `border-border`, `border-input`, `bg-primary`, `text-primary-foreground`, `ring-ring`.
- Forbidden (ESLint errors in `className`, `cn()`, `cva()`, `clsx()`): palette colors (`bg-red-500`, `text-white`), arbitrary colors (`bg-[#fff]`), `dark:` variants, and `shadow-*`. The one exemption is the generated `components/ui`, which is restyled through tokens.
- Mobile first: base classes are the phone layout; add `sm:`, `md:`, `lg:` for larger screens. Do not write `max-*:` breakpoints.
- Spacing and sizes come from the Tailwind scale (the 4 px grid in the design spec). Prefer `gap-*` and `space-y-*` on the parent over margins on children. Use `size-4` instead of `h-4 w-4`.
- Avoid arbitrary values (`w-[137px]`). If a value repeats, it is a missing token or utility; ask or add it in `styles.css`.
- Variants of a component live in one `cva()` next to the component. Conditional classes use `cn('base', condition && 'extra')`, not string concatenation.
- Class order is decided by the Prettier plugin: do not sort by hand and do not fight it.
- Never style by element id or write new global CSS; `src/styles.css` holds tokens and base rules only.

## 8. Language and copy

- UI text is Indonesian, polite and short, using "Anda". Use the vocabulary and sentence patterns in `DESIGN_SPEC.md` section 11.
- One-off labels stay inline. Text used in more than one place (status names, error-code messages, empty-state sentences) lives in `lib/copy.ts` so it is changed once.
- Never build a sentence by concatenating translated fragments; write the whole sentence with a template literal.
- Dates, times, money and phone numbers go through `lib/format.ts` (`formatDate`, `formatTime`, `formatRupiah`, `formatPhone`). No ad hoc `toLocaleString`.
- Code, identifiers, comments, logs and commit messages are English.

## 9. Errors and logging

- API errors are normalized once in `lib/api/errors.ts` into an `ApiError` (`code`, `status`, `message`, `details`, `retryAfter`). Components and hooks use that type, not raw axios errors.
- Show a message from the error-code table in the PRD, never raw server text or JSON.
- Do not swallow errors silently. Either handle them visibly or let TanStack Query / the route error boundary show them.
- `console.log` is an error. `console.warn` and `console.error` are allowed for genuinely unexpected conditions. Never log tokens, phone numbers or booking codes.
- **Auth tokens are never persisted by the app.** The access token lives in memory; the refresh token is the backend's `HttpOnly` cookie. The login and refresh responses also carry `refresh_token` in the JSON body: parse it away, do not store, log or pass it on. Only the four `/auth/*` calls use `withCredentials: true`, and refresh/logout are sent with no body (`docs/API_GUIDE.md` section 4).
- A `403` from `/auth/refresh` or `/auth/logout` is a configuration error (the page's origin is not in the backend's `CORS_ORIGINS`), not an expired session: show a clear message, never retry in a loop, never silently sign the user out.

## 10. Comments and documentation

- Write comments for **why**, not what. If a comment restates the code, delete it.
- Public helpers in `lib/` get a short JSDoc sentence. Non-obvious rules from the backend contract get a comment pointing to where it is documented (`docs/API_GUIDE.md` section).
- Work left undone is marked `TODO(FE-n): what and why`, with the module number. No unlabeled TODOs, no commented-out code.

## 11. Dependencies and generated files

- Add a dependency only when the PRD lists it or the user approves. Prefer what is already installed (shadcn, lucide, TanStack, zod, react-hook-form).
- Add shadcn components with `bunx --bun shadcn@latest add <name>`, then run `bun --bun run format` (the generator writes double quotes and a different import layout). This project uses the **Base UI** flavor (`base-nova`); use the `render` prop, not Radix's `asChild`.
- Do not hand-edit generated files (`routeTree.gen.ts`, `schema.gen.ts`). Regenerate them (`bun --bun run generate-routes`, `bun --bun run api:types`).
- `docs/openapi.yaml` is a verbatim copy of the backend contract: do not edit it; refresh it with `bun --bun run api:sync`.

## 12. How this is enforced

| Concern                                                                 | Enforced by                                               | Command                           |
| ----------------------------------------------------------------------- | --------------------------------------------------------- | --------------------------------- |
| Formatting, quotes, semicolons, width, Tailwind class order             | Prettier + `prettier-plugin-tailwindcss`                  | `bun --bun run check` / `format`  |
| Import order, `@/` alias, no `../`, no cycles, type-only imports        | ESLint `import/*`, `no-restricted-imports`                | `bun --bun run lint` / `lint:fix` |
| Layering and "axios only in the API layer"                              | ESLint `no-restricted-imports` per folder                 | `bun --bun run lint`              |
| File and folder names                                                   | ESLint `check-file`                                       | `bun --bun run lint`              |
| Named exports only (in `src/`)                                          | ESLint `import/no-default-export`                         | `bun --bun run lint`              |
| No `any`, no `!`, promises handled, exhaustive switches                 | typescript-eslint (type-aware)                            | `bun --bun run lint`              |
| Hooks rules, no setState-in-effect, exhaustive deps                     | `eslint-plugin-react-hooks`                               | `bun --bun run lint`              |
| Accessibility basics (alt, roles, labels, keyboard handlers)            | `eslint-plugin-jsx-a11y`                                  | `bun --bun run lint`              |
| Query rules (stable keys, exhaustive query deps)                        | `@tanstack/eslint-plugin-query`                           | `bun --bun run lint`              |
| Token-only colors, no `dark:`, no shadows, no `dangerouslySetInnerHTML` | ESLint `no-restricted-syntax`                             | `bun --bun run lint`              |
| Strict types, indexed access, unused code                               | `tsc` (`strict`, `noUncheckedIndexedAccess`, `noUnused*`) | `bun --bun run typecheck`         |
| Everything above plus the build                                         | one command                                               | `bun --bun run verify`            |

Not enforced by tools, so review for it: the four UI states, copy quality and tone, accessibility of custom widgets, correct use of the contract (statuses, transitions, error handling), test quality, and that comments explain why.

**Optional git hooks:** `package.json` has `lint-staged` and `simple-git-hooks` configured (format and lint staged files on commit, typecheck on push) but they are not installed automatically. To turn them on, run `bunx simple-git-hooks` once; to turn them off, delete `.git/hooks/pre-commit` and `.git/hooks/pre-push`.

## 13. Anti-patterns (do not generate these)

- `export default` in `src/`; `React.FC`; class components; `index.ts` barrels.
- `useEffect` that fetches, or that copies props into state; derived state stored in state.
- axios or `fetch` called from a component or a route.
- Storing any token (access, or the `refresh_token` from a response body) in `localStorage`, `sessionStorage`, IndexedDB, a store or a log; sending a `refresh_token` in the body of refresh or logout.
- Hard-coded API base URL or magic strings for statuses and error codes scattered in components.
- Inline styles; `style={{ color: ... }}`; palette Tailwind colors; `dark:`; shadows.
- Ad hoc date or money formatting; reading the browser's timezone.
- Reaching into another feature's `components/` or `queries.ts`.
- Copying Radix UI snippets (`asChild`); this project uses Base UI.
- Silencing the compiler or linter (`any`, `!`, `@ts-ignore`, `eslint-disable`) to make an error go away. If a rule is wrong, tell the user.
- Writing the same literal twice when a constant or token exists.
