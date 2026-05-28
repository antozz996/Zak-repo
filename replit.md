# Zak Ecosystem AI

CRM omnicanale con inbox unificata (WhatsApp, Instagram, Facebook), AI booking assistant, gestione lead/eventi e agenda personale per un locale eventi italiano.

## Run & Operate

- `pnpm --filter @workspace/api-server run dev` — run the API server (port 8080)
- `pnpm --filter @workspace/zak-app run dev` — run the frontend (port 24571)
- `pnpm run typecheck` — full typecheck across all packages
- `pnpm run build` — typecheck + build all packages
- `pnpm --filter @workspace/api-spec run codegen` — regenerate API hooks and Zod schemas from the OpenAPI spec
- `pnpm --filter @workspace/db run push` — push DB schema changes (dev only)
- Required env: `DATABASE_URL` — Postgres connection string

## Stack

- pnpm workspaces, Node.js 24, TypeScript 5.9
- API: Express 5
- DB: PostgreSQL + Drizzle ORM
- Validation: Zod (`zod/v4`), `drizzle-zod`
- API codegen: Orval (from OpenAPI spec)
- Build: esbuild (CJS bundle)
- Frontend: React + Vite, TailwindCSS, shadcn/ui, Recharts, date-fns, react-icons

## Where things live

- `lib/api-spec/openapi.yaml` — OpenAPI spec (source of truth for all API contracts)
- `lib/db/src/schema/` — Drizzle table definitions (utenti, contatti_crm, preventivi_eventi, agenda_personale, messaggi)
- `artifacts/api-server/src/routes/` — Express route handlers
- `artifacts/zak-app/src/` — React frontend
- `lib/api-client-react/src/generated/` — Generated React Query hooks (do not edit)
- `lib/api-zod/src/generated/` — Generated Zod validation schemas (do not edit)

## Architecture decisions

- OpenAPI-first: spec gates codegen, which gates the frontend. Always re-run codegen after spec changes.
- `db.execute(sql\`...\`)` returns `{ rows: [] }`, not a directly iterable array — use `.rows[0]` to access results.
- `api/dashboard/stats` uses a mix of Drizzle selects and raw SQL for SUM aggregates.
- Webhook endpoints (`/api/webhook/whatsapp`, `/api/webhook/voice-assistant`) receive Meta/Vapi payloads and write to DB.
- Inbox uses a lateral join to get the last message per contact efficiently.

## Product

- **Dashboard** — KPI cards (contatti, preventivi, eventi, budget), pipeline lead bar chart, eventi per mese chart, attività recente
- **Inbox** — Unified chat inbox con messaggi da WhatsApp/Instagram/Facebook, assegnazione operatore
- **Contatti CRM** — Lista lead con filtri (stato, tipo evento, canale), ricerca, dettaglio con preventivi associati
- **Preventivi** — Gestione preventivi eventi con budget, invitati, date
- **Agenda** — Calendario personale di Salvatore (lavoro/personale)
- **Impostazioni** — Gestione staff

## User preferences

- App language: Italian — all UI labels and text must be in Italian
- No emojis in the UI

## Gotchas

- `db.execute()` returns `QueryResult` with `.rows[]`, not a bare array — don't destructure with `const [row] = db.execute(...)`.
- After schema changes: always run `pnpm --filter @workspace/db run push`, then restart the API server workflow.
- After OpenAPI spec changes: always run `pnpm --filter @workspace/api-spec run codegen` before using new types.
- Import react-icons from `react-icons/fa`, `react-icons/md`, etc. — never from `react-icons/js`.

## Pointers

- See the `pnpm-workspace` skill for workspace structure, TypeScript setup, and package details
