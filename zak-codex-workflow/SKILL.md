---
name: zak-codex-workflow
description: workflow and coding guardrails for working on the zak ecosystem ai repository. use when modifying this monorepo, adding crm features, changing openapi contracts, editing drizzle/postgres schema, building react/shadcn ui, implementing whatsapp booking assistant logic, crm automations, external integrations, or updating project documentation and changelog.
---

# Zak Codex Workflow

## Core rule

Treat Zak Ecosystem AI as an OpenAPI-first TypeScript monorepo for an Italian events CRM. Make small, safe, reviewable changes and keep the contract, generated clients, database schema, frontend, backend, and changelog aligned.

Load `references/project-context.md` when the task touches architecture, implemented modules, roadmap gaps, or repository conventions.

## Default workflow

1. Identify the feature area: dashboard, inbox, booking assistant, contatti, preventivi, agenda, staff, automazioni, webhooks, integrations, or UI polish.
2. Inspect existing files before editing. Preserve current naming, Italian UI copy, and generated-code boundaries.
3. For API-affecting changes, update `lib/api-spec/openapi.yaml` first.
4. Regenerate generated packages after OpenAPI changes:
   - `pnpm --filter @workspace/api-spec run codegen`
5. For database changes, update Drizzle schema in `lib/db/src/schema`, then run:
   - `pnpm --filter @workspace/db run push`
6. Implement backend in the relevant Express route/module under `artifacts/api-server`.
7. Implement frontend using generated React Query hooks from `lib/api-client-react` and schemas/types from `lib/api-zod`.
8. Validate with:
   - `pnpm run typecheck`
   - `pnpm run build`
9. Update the project operational document/changelog whenever behavior, architecture, API, database, or roadmap status changes.
10. In the final response, summarize changed files, commands run, test/build result, and any remaining risk.

## OpenAPI-first rules

Never create undocumented backend endpoints or ad-hoc frontend fetch calls when the API should be part of the product contract.

For any new or changed REST behavior:

1. edit `lib/api-spec/openapi.yaml`;
2. include request/response schemas and error cases;
3. regenerate Orval/Zod outputs;
4. wire backend implementation to match the contract;
5. consume the generated client in React.

Do not manually edit generated client or generated Zod output unless the repo explicitly documents that as acceptable.

## Full-stack CRM feature pattern

Use this order for new product modules or feature expansions:

1. Data model: Drizzle tables, fields, enums, relations, and indexes.
2. API contract: OpenAPI paths, methods, schemas, validation expectations.
3. Backend: Express route, service/query logic, error handling, consistent `/api` pathing.
4. Frontend data: generated React Query hooks; avoid duplicate local API clients.
5. UI: shadcn/ui and Tailwind, Italian labels, loading/error/empty states, responsive layout.
6. Ops: changelog entry and commands/tests.

Prefer incremental implementation over broad rewrites.

## Booking Assistant and WhatsApp rules

The current booking assistant qualifies inbound WhatsApp leads, extracts event details, updates contacts and preventivi, checks availability, proposes alternatives, and writes outbound assistant responses to the inbox.

When improving it:

- preserve the existing data flow: inbound message -> contact -> preventivo -> availability -> outbound message;
- keep a clean handoff path to a human operator;
- log enough context to debug wrong extractions;
- avoid hard-coding provider-specific assumptions outside webhook/integration modules;
- design LLM usage as replaceable or augmenting the current rule-based logic, not as a rewrite of the entire CRM flow.

## Drizzle/Postgres safety rules

Before changing schema, inspect existing table usage. Protect data in `utenti`, `contatti_crm`, `preventivi_eventi`, `agenda_personale`, `messaggi`, `automazioni_log`, and `automazioni_config`.

For schema changes:

- use explicit nullable/default decisions;
- avoid destructive changes unless requested;
- update OpenAPI and frontend types when database fields surface through APIs;
- mention migration/data-backfill implications in the final response.

## React/shadcn UI rules

The frontend uses React 19, Vite, Wouter, TanStack Query, Tailwind CSS, shadcn/ui, Radix UI, and Recharts.

For UI changes:

- keep labels and CRM language in Italian;
- use existing layout/sidebar patterns;
- include loading, empty, and error states;
- keep components reusable and avoid one-off styling sprawl;
- make inbox, agenda, preventivi, dashboard, and settings usable on smaller screens when relevant.

## Automations rules

Automations use node-cron with configuration, logs, manual triggers, and scheduled jobs. Existing jobs include re-engagement lead persi and ricorrenze annuali.

When adding automations:

- make behavior configurable through `automazioni_config` where useful;
- record executions in `automazioni_log`;
- support manual trigger endpoints for testing;
- avoid sending real external messages unless explicitly requested and safely configured.

## Integration roadmap rules

Current gaps include real Meta Cloud API messaging, Google Calendar sync, Vapi/Bland AI voice integration, LLM lead qualification, realtime multi-operator WebSocket support, B2B/competitor analysis, and push/internal notifications.

For integrations:

- isolate provider adapters;
- keep internal CRM models provider-neutral;
- add idempotency and retry/error logging for webhooks;
- never assume secrets are available; document required env vars;
- keep a fallback path when external APIs fail.

## Changelog rule

After meaningful changes, update the operational project document with:

```markdown
## YYYY-MM-DD - Titolo modifica

- cosa e stato aggiunto
- cosa e stato modificato
- eventuali impatti tecnici o funzionali
- eventuali file/moduli coinvolti
```

Also update architecture/status/gap sections when the real implementation changes.
