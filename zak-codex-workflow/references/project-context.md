# Zak Ecosystem AI project context

Zak Ecosystem AI is an omnichannel CRM for an Italian events venue. It centralizes lead/contact management, event quotes, unified inbox, personal agenda, CRM automations, and future AI/webhook integrations.

## Stack

- Monorepo: pnpm + TypeScript
- Frontend: React 19, Vite, Wouter, TanStack Query
- UI: Tailwind CSS, shadcn/ui, Radix UI, Recharts
- Backend: Node.js, Express 5
- Database: PostgreSQL, Drizzle ORM
- Contracts: OpenAPI-first, Orval React Query client, generated Zod schemas
- Automations: node-cron

## Repository map

- `lib/api-spec/openapi.yaml`: source of truth for API contracts
- `lib/api-client-react/`: generated React Query client
- `lib/api-zod/`: generated Zod schemas/types
- `lib/db/`: Drizzle schema, database connection, shared types
- `artifacts/api-server/`: Express backend
- `artifacts/zak-app/`: main CRM frontend
- `artifacts/mockup-sandbox/`: separate UI mockup/sandbox environment
- `scripts/`: workspace utilities
- `attached_assets/`: source material, including initial PRD
- `replit.md`: technical notes and operational guidelines

## Implemented modules

Dashboard:
- CRM KPIs, daily contacts, active quotes, confirmed events, confirmed budget, unread inbound messages, lead pipeline chart, monthly events chart, recent activity.
- Endpoints: `GET /api/dashboard/stats`, `/lead-pipeline`, `/eventi-mese`, `/attivita-recente`.

Inbox:
- Conversation list, messages by contact/channel, outbound messages, contact sidebar, lead status, assigned operator.
- Endpoints: `GET /api/chat/inbox`, `GET /api/messaggi`, `POST /api/messaggi`, `POST /api/chat/assign`.
- Unified inbox exists in data/UI; real Meta API integration is not complete.

Booking Assistant AI:
- Auto-activates on inbound WhatsApp messages.
- Extracts name, event type, event date, guest count.
- Updates `contatti_crm`, creates/updates `preventivi_eventi`, checks availability, proposes alternative dates, writes assistant outbound replies into inbox.
- Currently rule-based backend logic; future LLM can extend or replace extraction/conversation logic while preserving data flow.

CRM contacts:
- Backend CRUD and message reading.
- Frontend contact list and new contact page.
- Endpoints: `GET/POST /api/contatti`, `GET/PATCH/DELETE /api/contatti/:id`, `GET /api/contatti/:id/messaggi`.

Event quotes:
- Backend CRUD and frontend quote management.
- Endpoints: `GET/POST /api/preventivi`, `GET/PATCH/DELETE /api/preventivi/:id`.

Agenda:
- Backend CRUD and frontend agenda page.
- Endpoints: `GET/POST /api/agenda`, `GET/PATCH/DELETE /api/agenda/:id`.

Staff:
- Backend CRUD and frontend staff settings.
- Endpoints: `GET/POST /api/utenti`, `GET/PATCH/DELETE /api/utenti/:id`.

Automations:
- Configuration, logs, manual job trigger, daily cron jobs.
- Frontend automation page for re-engagement, annual recurrence, config editing, logs.
- Endpoints: `GET /api/automazioni/log`, `GET /api/automazioni/config`, `PATCH /api/automazioni/config/:chiave`, `POST /api/automazioni/trigger`.
- Scheduled jobs: 09:00 re-engagement lost leads, 10:00 annual recurrences.

Webhooks:
- `POST /api/webhook/whatsapp`: receives payloads, creates contact if needed, saves inbound message, updates last contact.
- `POST /api/webhook/voice-assistant`: receives call transcript, creates agenda item.

## Database tables

- `utenti`: id, nome, ruolo, email, data_creazione
- `contatti_crm`: id, nome, telefono, instagram_username, origine_lead, tipo_evento, stato_lead, operatore_assegnato_id, data_creazione, ultimo_contatto
- `preventivi_eventi`: id, contatto_id, data_evento_richiesta, numero_invitati, budget_stimato, note, stato_evento, data_creazione
- `agenda_personale`: id, titolo, descrizione, data_ora_inizio, data_ora_fine, categoria, promemoria_inviato
- `messaggi`: id, contatto_id, canale, direzione, testo, timestamp, letto, mittente_nome
- `automazioni_log`: automation execution history
- `automazioni_config`: runtime automation parameters

## Frontend routes

- `/dashboard`
- `/inbox`
- `/contatti`
- `/contatti/nuovo`
- `/preventivi`
- `/agenda`
- `/impostazioni`
- `/automazioni`

## Backend routers

- health
- utenti
- contatti
- preventivi
- agenda
- messaggi
- dashboard
- webhooks
- automazioni

## Useful commands

- `pnpm run typecheck`
- `pnpm run build`
- `pnpm --filter @workspace/api-server run dev`
- `pnpm --filter @workspace/zak-app run dev`
- `pnpm --filter @workspace/api-spec run codegen`
- `pnpm --filter @workspace/db run push`

## Known gaps and roadmap

- Real live omnichannel integrations
- Real Meta Cloud API send/reply integration
- Google Calendar sync
- Vapi/Bland AI voice integration
- LLM-based lead qualification
- Realtime multi-operator WebSocket support
- B2B and competitor analysis module
- Push notifications or internal messaging for reminders
