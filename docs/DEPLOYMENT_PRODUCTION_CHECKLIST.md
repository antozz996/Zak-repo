# Deploy Produzione — Checklist

Checklist operativa per il deploy in produzione di **Zak Ecosystem AI**.
Ogni step va completato nell'ordine indicato; spuntare `[x]` mano a mano che si procede.

---

## 1. Pre-deploy: variabili ambiente

Verificare che tutte le variabili siano configurate nell'host di produzione (es. Replit Secrets, Railway, Render, VPS `.env`).

### Obbligatorie

- [ ] `DATABASE_URL` — stringa di connessione PostgreSQL di produzione (con SSL se richiesto dall'hosting)
- [ ] `PORT` — porta su cui il backend Express resta in ascolto

### Integrazione Meta WhatsApp

- [ ] `META_WHATSAPP_ACCESS_TOKEN` — token Cloud API permanente (non di test)
- [ ] `META_WHATSAPP_PHONE_NUMBER_ID` — ID del numero WhatsApp Business verificato
- [ ] `META_WEBHOOK_VERIFY_TOKEN` — token segreto per la challenge di verifica webhook Meta
- [ ] `META_APP_SECRET` — secret dell'app Meta per la verifica firma `X-Hub-Signature-256`
- [ ] `META_GRAPH_API_VERSION` — versione Graph API (default `v20.0`, valutare aggiornamento)
- [ ] `META_WHATSAPP_TEMPLATE_LANGUAGE` — lingua template (default `it`)
- [ ] `META_WHATSAPP_REENGAGEMENT_TEMPLATE_NAME` — nome template approvato per re-engagement
- [ ] `META_WHATSAPP_RICORRENZA_TEMPLATE_NAME` — nome template approvato per ricorrenze

### LLM Booking Assistant

- [ ] `ZAK_LLM_BOOKING_ENABLED` — `true` per abilitare estrazione LLM reale
- [ ] `OPENAI_API_KEY` — chiave OpenAI per Structured Outputs
- [ ] `ZAK_LLM_BOOKING_MODEL` — modello runtime, default `gpt-5.4-nano`
- [ ] `ZAK_LLM_BOOKING_TIMEOUT_MS` — timeout opzionale

### Google Calendar

- [ ] `ZAK_GOOGLE_CALENDAR_ENABLED` — `true` per abilitare disponibilita/sync Google
- [ ] `GOOGLE_CLIENT_ID`
- [ ] `GOOGLE_CLIENT_SECRET`
- [ ] `GOOGLE_REFRESH_TOKEN`
- [ ] `GOOGLE_CALENDAR_ID` — default `primary`
- [ ] `GOOGLE_CALENDAR_TIMEZONE` — default `Europe/Rome`
- [ ] `GOOGLE_CHANNEL_TOKEN` — se si usa webhook push Google
- [ ] `ZAK_GOOGLE_DELETE_CANCELLED` — opzionale, abilita delete automatico agenda da cancellazioni Google

### Voice Assistant provider

- [ ] `VOICE_WEBHOOK_SECRET`
- [ ] `VAPI_WEBHOOK_SECRET`
- [ ] `BLAND_WEBHOOK_SECRET`

### Frontend (opzionale)

- [ ] `BASE_PATH` — se il frontend è servito sotto un sub-path (default `/`)

> **Nota**: non committare mai il file `.env` nel repository. Usare sempre i secret manager del provider hosting.

---

## 2. Database

### Applicare lo schema

```bash
# Push dello schema Drizzle sul database di produzione
corepack pnpm --filter @workspace/db run push
```

- [ ] Verificare che il comando completi senza errori
- [ ] Controllare che tutte le tabelle siano state create:
  - `utenti`
  - `contatti_crm`
  - `preventivi_eventi`
  - `agenda_personale`
  - `messaggi`
  - `automazioni_log`
  - `automazioni_config`
  - `whatsapp_outbound_log`
  - `stato_lead_storico`
  - `audit_log`
  - `task_personali`
  - `google_calendar_sync_state`

- [ ] Verificare nuove colonne Google su `agenda_personale` e `preventivi_eventi`

### Seed dati base (se primo deploy)

- [ ] Creare almeno un utente staff iniziale via `POST /api/utenti`
- [ ] Verificare che le configurazioni automazioni base siano presenti in `automazioni_config`

### Backup

- [ ] Verificare che il provider PostgreSQL abbia backup automatici attivi
- [ ] Annotare il metodo di restore (snapshot, `pg_dump`, backup panel)

---

## 3. Meta Webhook — Configurazione

### Registrazione webhook su Meta Developer Console

- [ ] Aprire la Meta Developer Console → App → Prodotti → WhatsApp → Configurazione
- [ ] Inserire l'URL callback: `https://<dominio-produzione>/api/webhook/whatsapp`
- [ ] Inserire il `META_WEBHOOK_VERIFY_TOKEN` identico a quello configurato nel backend
- [ ] Sottoscrivere gli eventi: `messages`, `message_deliveries`, `message_reads`
- [ ] Verificare che la challenge di verifica (`GET /api/webhook/whatsapp`) restituisca `200`

### Verifica invio

- [ ] Inviare un messaggio WhatsApp di test al numero Business
- [ ] Verificare che il webhook inbound arrivi al backend (controllare log server)
- [ ] Verificare che il contatto venga creato/aggiornato nel CRM
- [ ] Verificare che il Booking Assistant risponda (se la chat non è assegnata)

---

## 4. Build e deploy

### Codegen e typecheck

```bash
# Rigenerare client da OpenAPI (se necessario)
corepack pnpm --filter @workspace/api-spec run codegen

# Typecheck completo
corepack pnpm run typecheck
```

- [ ] Codegen completato senza errori
- [ ] Typecheck completato senza errori

### Build produzione

```bash
# Build completa del workspace
corepack pnpm run build
```

- [ ] Build completata senza errori

### Deploy

- [ ] Effettuare il deploy sull'host di produzione (git push, deploy manuale, CI pipeline)
- [ ] Verificare che il server si avvii correttamente nei log dell'host
- [ ] Verificare che i cron delle automazioni partano all'avvio (`09:00` re-engagement, `10:00` ricorrenze)

---

## 5. Verifica post-deploy

### Healthcheck

- [ ] `GET /api/healthz` restituisce `200`

### Funzionalità core

- [ ] Dashboard accessibile e mostra i KPI (anche se a zero sul primo deploy)
- [ ] Creazione di un contatto di test via UI
- [ ] Creazione di un preventivo di test via UI
- [ ] Invio messaggio dalla inbox (canale WhatsApp)
- [ ] Visualizzazione agenda
- [ ] Pagina task personali accessibile e caricamento lista completato
- [ ] Pagina automazioni accessibile
- [ ] Pagina audit log accessibile e registra le azioni appena eseguite
- [ ] Import CSV di un file di test dalla pagina contatti
- [ ] `GET /api/task-personali` restituisce `200` e un array JSON

### Rate limiting

- [ ] Verificare che richieste eccessive vengano bloccate con `429`
- [ ] Verificare che `/api/healthz` sia escluso dal rate limiting

### Webhook voice assistant

- [ ] Inviare un payload generico di test a `POST /api/webhook/voice-assistant`
- [ ] Inviare un payload Vapi `end-of-call-report`
- [ ] Inviare un payload Bland con transcript/variables
- [ ] Verificare che l'evento venga creato in agenda
- [ ] Inviare una trascrizione con intento "ricordami/task/da fare" e verificare che venga creato un task personale

### Google Calendar

- [ ] `GET /api/calendar/google/status` restituisce configurazione attesa
- [ ] `POST /api/calendar/google/sync` con `direction=bidirectional` completa senza errori
- [ ] `GET /api/calendar/check-availability?data=<YYYY-MM-DD>` considera eventi Google
- [ ] Se configurato, `POST /api/webhook/google-calendar` accetta notifiche con `GOOGLE_CHANNEL_TOKEN`

### Readiness produzione

- [ ] Da utente admin, `GET /api/production/readiness` non contiene check `missing`

---

## 6. Procedura di rollback

In caso di problemi critici dopo il deploy:

### Rollback applicativo

1. **Revertire il deploy** all'ultimo commit funzionante:
   ```bash
   git revert HEAD
   # oppure deploy dell'ultimo tag stabile
   ```
2. Riavviare il server

### Rollback database (se necessario)

1. **Se il push Drizzle ha modificato tabelle in modo distruttivo:**
   - Ripristinare da backup PostgreSQL (snapshot o `pg_restore`)
2. **Se sono state aggiunte solo nuove colonne/tabelle:**
   - Non serve rollback DB; le nuove colonne/tabelle vengono semplicemente ignorate dal codice precedente

### Comunicazione

- [ ] Annotare il motivo del rollback
- [ ] Comunicare al team lo stato del rollback e i prossimi passi

---

## 7. Monitoraggio post-lancio (prime 48 ore)

- [ ] Controllare i log del server per errori `500` o eccezioni non gestite
- [ ] Verificare che le automazioni cron girino regolarmente (controllare `automazioni_log`)
- [ ] Monitorare la tabella `whatsapp_outbound_log` per errori di invio Meta
- [ ] Controllare l'audit log per eventuali anomalie
- [ ] Verificare il consumo di risorse (CPU, memoria, connessioni DB) nell'host

---

## Note operative

- Il progetto usa `corepack pnpm` come package manager; se `pnpm` non è disponibile come binario globale, usare sempre il prefisso `corepack`.
- Lo script `preinstall` del workspace è cross-platform (Windows e Linux).
- Il backend salva i messaggi outbound in inbox anche quando Meta non è configurato — questo permette di usare il CRM in modalità "offline" durante i test.
- Le nuove tabelle/colonne (`stato_lead_storico`, `whatsapp_outbound_log`, `audit_log`, `task_personali`, `google_calendar_sync_state`, campi Google su agenda/preventivi, campo `handoff_richiesto`, campo `contatto_id` in agenda) richiedono il `drizzle-kit push` per essere applicate al DB.
- Vedi anche `docs/SUBROADMAP_INTERVENTO_DIRETTO.md` per credenziali e decisioni operative non completabili da codice.
