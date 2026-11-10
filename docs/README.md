# docs/

Reference material for building the frontend. Start with `API_GUIDE.md` in any new session that touches the backend.

| File                             | What it is                                                                                                                                                                  |
| -------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| [`API_GUIDE.md`](./API_GUIDE.md) | How to talk to the backend: conventions, auth and token refresh, errors, rate limits, every endpoint, flows with examples, business rules, test-data bootstrap, known gaps. |
| [`openapi.yaml`](./openapi.yaml) | The API contract (OpenAPI 3.0.3), copied **verbatim** from the backend. Source of truth for field names, types and limits. Do not edit it here.                             |

Related documents in the repository root:

| File                                                                       | What it is                                                                         |
| -------------------------------------------------------------------------- | ---------------------------------------------------------------------------------- |
| [`../CLAUDE.md`](../CLAUDE.md)                                             | Working rules for AI agents (this branch, stack, architecture, conventions, plan). |
| [`../CODE_STYLE.md`](../CODE_STYLE.md)                                     | Coding style, canonical patterns and how each rule is enforced.                    |
| [`../PRD_Frontend_The_Nail_Palace.md`](../PRD_Frontend_The_Nail_Palace.md) | What to build (requirements FE-01..FE-18, error table, test scenarios).            |
| [`../DESIGN_SPEC.md`](../DESIGN_SPEC.md)                                   | How it looks (monochrome light theme, tokens, components, wireframes).             |

## Keeping the contract in sync

`openapi.yaml` is a snapshot. The backend lives in a sibling repository (`../backend-nail-art-app`, file `documents/openapi.yaml`, branch `develop`).

```bash
bun --bun run api:sync          # copy the contract from ../backend-nail-art-app (or BACKEND_DIR=/path)
git diff docs/openapi.yaml      # review what changed
```

After a sync: update the "Synced from" line in `API_GUIDE.md` (commit and date, printed by the command), regenerate types once the type generator exists (`bun --bun run api:types`), and note any breaking change to the user. The script refuses to copy if the backend checkout has uncommitted changes to the contract, so a half-edited file is never snapshotted.

When the contract and a running backend disagree, trust the running backend and its `documents/openapi.yaml`, re-sync, and report the difference.
