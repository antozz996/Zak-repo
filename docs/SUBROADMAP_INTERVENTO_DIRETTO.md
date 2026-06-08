# Subroadmap Intervento Diretto

Questa subroadmap contiene solo cio che non puo essere completato da Codex senza credenziali reali, accessi esterni o decisioni operative.

## 1. Verifiche tecniche automatiche

- [x] Eseguire `corepack pnpm --filter @workspace/api-spec run codegen`.
- [x] Eseguire `corepack pnpm --filter @workspace/api-server run test:backend`.
- [x] Eseguire `corepack pnpm run test:frontend-critical`.
- [x] Eseguire `corepack pnpm run typecheck`.
- [x] Eseguire `corepack pnpm run build`.

Nota: completate da Codex il 2026-06-08 dopo il pin di `packageManager` a `pnpm@10.22.0`. Restano fuori da questa sezione solo gli smoke test manuali con servizi reali.

## 2. Database reale

- [x] Configurare `DATABASE_URL` verso PostgreSQL reale Neon.
- [x] Eseguire `corepack pnpm --filter @workspace/db run push`.
- [x] Verificare nuove colonne:
  - `agenda_personale.google_calendar_id`
  - `agenda_personale.google_event_id`
  - `agenda_personale.google_sync_status`
  - `agenda_personale.google_sync_direction`
  - `agenda_personale.google_last_synced_at`
  - `agenda_personale.google_updated_at`
  - `preventivi_eventi.google_calendar_id`
  - `preventivi_eventi.google_event_id`
  - `preventivi_eventi.google_sync_status`
  - `preventivi_eventi.google_last_synced_at`
- [x] Verificare nuova tabella `google_calendar_sync_state`.

## 3. LLM Booking Assistant

- [ ] Configurare `OPENAI_API_KEY`.
- [ ] Impostare `ZAK_LLM_BOOKING_ENABLED=true`.
- [ ] Confermare modello runtime:
  - default consigliato: `gpt-5.4-nano` per estrazione JSON ad alto volume;
  - upgrade valutabile: `gpt-5.5` per conversazioni piu complesse o casi premium.
- [ ] Testare 10 conversazioni WhatsApp reali o sandbox:
  - lead lineare completo;
  - lead con data relativa;
  - lead con richieste vaghe;
  - richiesta operatore;
  - richiesta sconto/negoziazione;
  - data occupata da calendario interno;
  - data occupata da Google Calendar;
  - messaggio media senza testo;
  - cliente gia presente;
  - LLM disabilitato/fallback.

## 4. Google Calendar

- [ ] Creare o selezionare progetto Google Cloud.
- [ ] Abilitare Google Calendar API.
- [ ] Creare OAuth Client e ottenere `GOOGLE_CLIENT_ID` / `GOOGLE_CLIENT_SECRET`.
- [ ] Generare `GOOGLE_REFRESH_TOKEN` per l'account calendario venue o staff.
- [ ] Scegliere `GOOGLE_CALENDAR_ID`.
- [ ] Impostare `ZAK_GOOGLE_CALENDAR_ENABLED=true`.
- [ ] Se si usano push notifications Google, configurare `GOOGLE_CHANNEL_TOKEN` e registrare webhook:
  - `https://<dominio-produzione>/api/webhook/google-calendar`
- [ ] Decidere policy cancellazioni Google:
  - default consigliato: non distruttivo, marca conflitto;
  - alternativa: `ZAK_GOOGLE_DELETE_CANCELLED=true` per eliminazione automatica agenda ZAK.

## 5. Voice Assistant Vapi/Bland

- [ ] Configurare endpoint provider:
  - `https://<dominio-produzione>/api/webhook/voice-assistant`
- [ ] Impostare almeno un secret:
  - `VOICE_WEBHOOK_SECRET`
  - `VAPI_WEBHOOK_SECRET`
  - `BLAND_WEBHOOK_SECRET`
- [ ] Inviare payload test Vapi `end-of-call-report`.
- [ ] Inviare payload test Bland con transcript/variables.
- [ ] Verificare:
  - creazione contatto se numero nuovo;
  - collegamento a contatto esistente;
  - creazione agenda o task;
  - salvataggio timeline messaggi voice;
  - creazione/aggiornamento preventivo opzionato quando arrivano data/invitati.

## 6. Go-live

- [x] Configurare `ZAK_AUTH_SECRET` e `ZAK_BOOTSTRAP_ADMIN_TOKEN`.
- [x] Creare primo admin con `POST /api/auth/bootstrap-admin`.
- [x] Verificare `GET /api/production/readiness` da admin.
- [x] Predisporre deploy Render one-service con `render.yaml` e frontend servito dal backend in produzione.
- [ ] Creare servizio Render collegato al repository.
- [ ] Configurare su Render le variabili produzione: `DATABASE_URL`, `ZAK_AUTH_SECRET`, `ZAK_BOOTSTRAP_ADMIN_TOKEN` e provider opzionali.
- [ ] Configurare Meta WhatsApp produzione.
- [ ] Eseguire smoke test manuali su auth admin, WhatsApp, LLM, Google Calendar e voice assistant.
- [ ] Verificare backup automatici PostgreSQL.
- [ ] Validare privacy, data retention e logging provider.
- [ ] Monitorare prime 48 ore: log server, audit log, `whatsapp_outbound_log`, automazioni e sync Google.
