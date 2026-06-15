# Zak Ecosystem AI

Documento operativo unico per:

- spiegare l'intero progetto;
- descrivere lo stato reale del codice;
- tracciare i changelog delle modifiche gia` presenti nel repository;
- registrare tutte le prossime modifiche e aggiunte.

Ultimo aggiornamento: 2026-06-06

## 1. Obiettivo del progetto

Zak Ecosystem AI e` un CRM omnicanale per un locale eventi italiano. Il sistema e` progettato per centralizzare:

- gestione lead e contatti;
- gestione preventivi eventi;
- inbox unificata per messaggi multi-canale;
- agenda personale;
- automazioni CRM;
- predisposizione a integrazioni AI e webhook esterni.

L'idea di prodotto nasce dal PRD allegato, ma il codice oggi rappresenta una prima implementazione funzionante soprattutto lato CRM, dashboard, inbox, preventivi, agenda e automazioni base.

## 2. Stato attuale del progetto

Il repository e` un monorepo `pnpm` basato su TypeScript.

Stack attuale:

- Frontend: React 19 + Vite + Wouter + TanStack Query
- UI: Tailwind CSS + shadcn/ui + Radix UI + Recharts
- Backend: Node.js + Express 5
- Database: PostgreSQL + Drizzle ORM
- Contratti API: OpenAPI-first con codegen Orval + Zod
- Automazioni: `node-cron`

## 3. Struttura del repository

### Root

- `package.json`: comandi globali di workspace
- `pnpm-workspace.yaml`: configurazione monorepo e catalog dipendenze
- `replit.md`: appunti tecnici e linee guida operative
- `ROADMAP.md`: roadmap operativa con checkbox di avanzamento
- `ENVIRONMENT.md`: riferimento rapido per variabili ambiente e segreti
- `attached_assets/`: materiale allegato, incluso il PRD iniziale

### Librerie condivise

- `lib/api-spec/`
  - contiene `openapi.yaml`
  - e` la source of truth dei contratti API
- `lib/api-client-react/`
  - client React Query generato
  - usato dal frontend
- `lib/api-zod/`
  - schemi e tipi Zod generati
- `lib/db/`
  - schema database Drizzle
  - connessione e tipizzazioni condivise

### Artifact applicativi

- `artifacts/api-server/`
  - backend Express
- `artifacts/zak-app/`
  - frontend principale CRM
- `artifacts/mockup-sandbox/`
  - ambiente separato per mockup/sperimentazione UI

### Utility

- `scripts/`
  - script di supporto workspace

## 4. Architettura applicativa

### 4.1 Flusso generale

1. Il backend espone API REST sotto `/api`.
2. Le API sono descritte in `lib/api-spec/openapi.yaml`.
3. Da OpenAPI vengono generati:
   - hook React Query in `lib/api-client-react`
   - schemi/tipi Zod in `lib/api-zod`
4. Il frontend consuma il client generato.
5. Il database PostgreSQL viene modellato in `lib/db/src/schema`.

### 4.2 Principio architetturale chiave

Il progetto e` costruito con approccio OpenAPI-first:

- prima si aggiorna lo spec;
- poi si rigenerano client e schemi;
- infine si usano i nuovi tipi nel frontend e nel backend.

## 5. Moduli implementati

### 5.1 Dashboard

Disponibile nel frontend:

- KPI contatti
- nuovi contatti del giorno
- preventivi attivi
- eventi confermati
- budget totale confermato
- messaggi inbound non letti
- lead con preventivo
- lead confermati
- conversione lead -> preventivo
- conversione preventivo -> confermato
- conversione lead -> confermato
- grafico pipeline lead
- grafico eventi per mese
- attivita` recente
- filtri temporali `data_da` / `data_a`

Endpoint backend collegati:

- `GET /api/dashboard/stats`
- `GET /api/dashboard/lead-pipeline`
- `GET /api/dashboard/eventi-mese`
- `GET /api/dashboard/attivita-recente`

### 5.2 Inbox omnicanale

Disponibile nel frontend:

- lista conversazioni inbox
- visualizzazione messaggi per contatto/canale
- invio messaggi outbound
- filtri inbox per canale, stato lead e operatore
- marcatura automatica dei messaggi inbound come letti all'apertura conversazione
- dettaglio contatto nella sidebar
- stato lead visibile
- operatore assegnato visibile
- assegnazione conversazione a operatore direttamente dalla inbox
- visualizzazione stato assistente automatico quando la chat non e` assegnata

Endpoint backend collegati:

- `GET /api/chat/inbox`
- `GET /api/messaggi`
- `POST /api/messaggi`
- `POST /api/chat/assign`

Nota:

- il concetto di inbox unificata e` implementato a livello dati/UI;
- le integrazioni reali con Meta API non risultano ancora complete, sono presenti webhook e logica base.

### 5.2.1 Booking Assistant AI

Implementazione attuale:

- attivazione automatica sui messaggi WhatsApp inbound;
- attivazione solo quando la conversazione non e` assegnata a un operatore umano;
- estrazione automatica di:
  - nome
  - tipo evento
  - data evento
  - numero invitati
- aggiornamento automatico di `contatti_crm`
- creazione o aggiornamento automatico di `preventivi_eventi`
- controllo disponibilita` data richiesta
- proposta di date alternative se la data risulta occupata
- handoff esplicito AI -> operatore quando il cliente chiede una persona/staff
- salvataggio della risposta dell'assistente direttamente nella inbox come messaggio outbound
- template di risposta configurabili dal pannello Automazioni tramite chiavi `booking_assistant_template_*`

Nota tecnica:

- l'assistente usa parsing rule-based sempre disponibile e, quando `ZAK_LLM_BOOKING_ENABLED=true` con `OPENAI_API_KEY`, chiama un provider OpenAI tramite Responses API e Structured Outputs JSON;
- l'output LLM viene normalizzato e validato in backend prima di aggiornare contatto/preventivo/stato conversazionale;
- se LLM non e` configurato, fallisce, va in timeout o produce dati non validi, il fallback rule-based mantiene invariato il flusso dati.
- i template supportano placeholder testuali come `{{nome}}`, `{{tipo_evento}}`, `{{data_evento}}`, `{{numero_invitati}}` e `{{alternative}}`

### 5.3 CRM contatti

Disponibile nel backend:

- lista contatti con filtri
- creazione contatto
- import CSV contatti con deduplicazione avanzata per telefono normalizzato e username Instagram
- dettaglio contatto
- modifica contatto
- eliminazione contatto
- lettura messaggi del contatto
- blocco duplicati su creazione e modifica contatto
- supporto note interne staff sul record contatto
- storico persistente dei cambi stato lead

Disponibile nel frontend:

- pagina lista contatti
- pagina creazione nuovo contatto
- import CSV direttamente dalla pagina contatti
- pannello laterale dettaglio contatto con note staff modificabili
- timeline contatto composta da messaggi e preventivi
- timeline contatto estesa con lo storico cambi stato lead

Endpoint:

- `GET /api/contatti`
- `POST /api/contatti`
- `GET /api/contatti/:id`
- `PATCH /api/contatti/:id`
- `DELETE /api/contatti/:id`
- `GET /api/contatti/:id/messaggi`
- `GET /api/contatti/:id/storico-stato`
- `POST /api/contatti/import-csv`

### 5.4 Preventivi eventi

Disponibile nel backend:

- lista preventivi
- creazione preventivo
- dettaglio preventivo
- modifica preventivo
- eliminazione preventivo

Disponibile nel frontend:

- pagina gestione preventivi

Endpoint:

- `GET /api/preventivi`
- `POST /api/preventivi`
- `GET /api/preventivi/:id`
- `PATCH /api/preventivi/:id`
- `DELETE /api/preventivi/:id`

### 5.5 Agenda personale

Disponibile nel backend:

- lista appuntamenti
- creazione evento
- dettaglio evento
- aggiornamento evento
- eliminazione evento
- validazione intervalli: la fine deve essere successiva all'inizio
- reset automatico di `promemoria_inviato` quando un evento futuro viene rischedulato

Disponibile nel frontend:

- pagina agenda

Endpoint:

- `GET /api/agenda`
- `POST /api/agenda`
- `GET /api/agenda/:id`
- `PATCH /api/agenda/:id`
- `DELETE /api/agenda/:id`

### 5.5.1 Task personali

Disponibile nel backend:

- CRUD task personali separati dagli eventi agenda
- filtro lista per stato, priorita` e contatto CRM collegato
- completamento task con timestamp `completato_il`
- audit log per creazione, modifica ed eliminazione task

Disponibile nel frontend:

- pagina `/task`
- creazione rapida task manuale
- filtri per stato e priorita`
- completamento, riapertura ed eliminazione task

Endpoint:

- `GET /api/task-personali`
- `POST /api/task-personali`
- `GET /api/task-personali/:id`
- `PATCH /api/task-personali/:id`
- `DELETE /api/task-personali/:id`

### 5.6 Gestione staff

Disponibile nel backend:

- CRUD utenti/staff
- stato account `attivo`/`disattivato`
- validazione ruoli `admin`/`manager`/`staff` e stato account

Disponibile nel frontend:

- pagina impostazioni staff
- badge stato account e azione rapida attiva/disattiva

Endpoint:

- `GET /api/utenti`
- `POST /api/utenti`
- `GET /api/utenti/:id`
- `PATCH /api/utenti/:id`
- `DELETE /api/utenti/:id`

### 5.7 Automazioni CRM

Disponibile nel backend:

- configurazioni automazioni
- log automazioni
- trigger manuale job
- cron giornalieri
- guardia anti-overlap per evitare doppie esecuzioni contemporanee dello stesso job
- rispetto reale dei toggle `reengagement_attivo` e `ricorrenza_attiva`
- segmentazione dei job per tipo evento tramite configurazione runtime
- invio WhatsApp reale per i job automazione, con fallback locale compatibile
- validazione sicura dei valori configurazione: toggle booleani, finestre temporali numeriche e segmenti tipo evento normalizzati

Disponibile nel frontend:

- pagina automazioni
- esecuzione manuale re-engagement
- esecuzione manuale ricorrenze
- modifica parametri configurazione
- configurazione tipi evento inclusi per re-engagement e ricorrenze
- modifica dei template di risposta Zak AI per qualificazione lead WhatsApp
- dashboard performance automazioni con totali, tasso successo, saltate, errori e breakdown per tipo
- visualizzazione log

Endpoint:

- `GET /api/automazioni/log`
- `GET /api/automazioni/performance`
- `GET /api/automazioni/config`
- `PATCH /api/automazioni/config/:chiave`
- `POST /api/automazioni/trigger`

Job schedulati:

- `09:00`: re-engagement lead persi
- `10:00`: ricorrenze annuali
- ogni 15 minuti: promemoria agenda imminenti

## 6. Webhook e integrazioni esterne

### Implementato

- `POST /api/webhook/whatsapp`
  - riceve payload
  - crea il contatto se non esiste
  - salva il messaggio inbound
  - salva i metadati dei media inbound WhatsApp supportati
  - aggiorna `ultimo_contatto`
  - attiva il booking assistant se la chat non e` assegnata

- `GET /api/webhook/whatsapp`
  - supporta la challenge di verifica richiesta da Meta
  - risponde con `hub.challenge` quando `META_WEBHOOK_VERIFY_TOKEN` combacia
  - verifica opzionalmente la firma `X-Hub-Signature-256` quando `META_APP_SECRET` e` configurata

- invio WhatsApp outbound via Meta Cloud API
  - usato dai messaggi manuali dello staff su canale WhatsApp
  - usato dalle risposte automatiche di Zak AI
  - salva sempre il messaggio in inbox anche se Meta non e` configurato o fallisce
  - registra nel DB anche gli aggiornamenti di consegna ricevuti dal webhook Meta
  - applica la finestra conversazionale WhatsApp di 24 ore per i messaggi testuali liberi

- `POST /api/webhook/voice-assistant`
  - riceve trascrizione chiamata generica oppure payload provider reali Vapi/Bland
  - verifica secret voice se configurato
  - crea il contatto CRM quando il numero non esiste e il provider invia telefono
  - crea un item in agenda quando la chiamata riguarda un appuntamento o evento calendarizzato
  - crea un task personale separato quando riconosce un intento di promemoria/task/da fare
  - collega la chiamata al contatto CRM esistente quando il telefono combacia dopo normalizzazione
  - registra la trascrizione anche nello storico messaggi del contatto con canale `voice`
  - crea o aggiorna un preventivo opzionato quando il provider invia data evento o invitati

- Google Calendar reale provider-ready
  - disponibilita` calendario via Google FreeBusy quando `ZAK_GOOGLE_CALENDAR_ENABLED=true`
  - sync agenda ZAK -> Google su creazione/modifica/eliminazione agenda
  - sync preventivi confermati ZAK -> Google
  - sync Google -> ZAK via endpoint manager `POST /api/calendar/google/sync`
  - webhook `POST /api/webhook/google-calendar` per notifiche push Google e sync incrementale
  - stato integrazione via `GET /api/calendar/google/status`

- Hardening go-live
  - endpoint admin `GET /api/production/readiness` con check runtime su segreti e integrazioni principali

### Non ancora completato o non evidenziato nel codice

- attivazione reale delle integrazioni esterne richiede credenziali e configurazione ambienti indicati in `ENVIRONMENT.md` e `docs/SUBROADMAP_INTERVENTO_DIRETTO.md`
- gli smoke test manuali end-to-end vanno eseguiti in ambiente reale dopo configurazione DB, auth admin e provider esterni

## 7. Database attuale

Tabelle attualmente presenti in `lib/db/src/schema/`:

### `utenti`

- `id`
- `nome`
- `ruolo`
- `email`
- `stato`
- `data_creazione`

### `contatti_crm`

- `id`
- `nome`
- `telefono`
- `instagram_username`
- `origine_lead`
- `tipo_evento`
- `stato_lead`
- `handoff_richiesto`
- `operatore_assegnato_id`
- `data_creazione`
- `ultimo_contatto`

### `preventivi_eventi`

- `id`
- `contatto_id`
- `data_evento_richiesta`
- `numero_invitati`
- `budget_stimato`
- `note`
- `stato_evento`
- `data_creazione`
- `google_calendar_id`
- `google_event_id`
- `google_sync_status`
- `google_last_synced_at`

### `agenda_personale`

- `id`
- `titolo`
- `descrizione`
- `data_ora_inizio`
- `data_ora_fine`
- `categoria`
- `contatto_id`
- `promemoria_inviato`
- `google_calendar_id`
- `google_event_id`
- `google_sync_status`
- `google_sync_direction`
- `google_last_synced_at`
- `google_updated_at`

### `google_calendar_sync_state`

- stato persistente della sincronizzazione Google Calendar
- conserva calendario, `sync_token`, dati watch channel, ultimo full/incremental sync, ultimo errore e flag `enabled`

### `task_personali`

- `id`
- `titolo`
- `descrizione`
- `stato`
- `priorita`
- `scadenza`
- `contatto_id`
- `fonte`
- `data_creazione`
- `completato_il`

### `messaggi`

- `id`
- `contatto_id`
- `canale`
- `direzione`
- `testo`
- `media_id`
- `media_tipo`
- `media_mime_type`
- `media_sha256`
- `media_filename`
- `timestamp`
- `letto`
- `mittente_nome`

### `automazioni_log`

- storico esecuzioni automazioni

### `automazioni_config`

- parametri runtime delle automazioni

### `booking_conversation_state`

- stato persistente del Booking Assistant per singolo contatto
- include step corrente, dati mancanti, ultimo JSON estratto, flag completamento e timestamp ultimo messaggio
- viene aggiornato in upsert a ogni messaggio WhatsApp gestito dal Booking Assistant

### `b2b_competitor`

- archivio reale competitor B2B
- include categoria, citta, zona, target, prezzo medio, rating, punti forza/deboli, sito, Instagram, note e timestamp aggiornamento

### `b2b_materiali`

- registro reale materiali competitor
- include competitor collegato opzionale, nome file, tipo materiale, URL/riferimento, stato, note e data creazione

### `b2b_template`

- archivio reale template co-branding B2B
- include titolo, target, messaggio commerciale, vantaggi, CTA, numero utilizzi e timestamp aggiornamento

### `whatsapp_outbound_log`

- tracciamento persistente degli invii outbound WhatsApp
- include sorgente, stato (`sent`/`skipped`/`failed`), eventuale errore e id provider
- include stato consegna Meta, timestamp aggiornamento consegna ed eventuali errori provider

### `audit_log`

- registro persistente delle azioni operative staff
- traccia azione, entita`, id entita`, utente opzionale, dettagli JSON serializzati, IP, user agent e data
- usato per contatti, preventivi, agenda, utenti, messaggi, assegnazioni chat e automazioni

## 8. Frontend attuale

Rotte principali in `artifacts/zak-app/src/App.tsx`:

- `/dashboard`
- `/inbox`
- `/contatti`
- `/contatti/nuovo`
- `/preventivi`
- `/agenda`
- `/task`
- `/impostazioni`
- `/automazioni`
- `/audit-log`
- `/b2b-competitor`
- `/go-live`

Pattern frontend usati:

- fetch dati via hook React Query generati
- layout laterale comune
- componenti UI condivisi in `src/components/ui`
- testo UI in italiano

Nota agenda:

- gli impegni creati dal voice assistant possono mostrare il cliente CRM collegato quando `contatto_id` e` presente

Nota task:

- i promemoria riconosciuti dal voice assistant vengono salvati in `task_personali`, non in `agenda_personale`
- la pagina `/task` usa hook React Query generati/allineati da OpenAPI

Nota sicurezza/RBAC:

- l'app produzione usa login reale, sessione staff backend e protezione route lato frontend/backend
- i prototipi mock non sono piu` importati dal router e i relativi sorgenti TSX sono stati rimossi da `artifacts/zak-app/src/pages`
- le API backend reali per LLM, Google Calendar, Voice provider e readiness sono implementate; la pagina `/go-live` mostra le variabili mancanti e permette il sync Google manuale quando configurato

## 9. Backend attuale

Router registrati:

- `health`
- `utenti`
- `contatti`
- `preventivi`
- `agenda`
- `task-personali`
- `messaggi`
- `dashboard`
- `webhooks`
- `automazioni`
- `audit-log`
- `calendar`
- `production`

Note tecniche:

- il server richiede `PORT`
- il DB richiede `DATABASE_URL`
- i cron partono all'avvio del server
- il path base delle API e` `/api`
- le trascrizioni voice collegate a un contatto vengono salvate anche in `messaggi`
- il voice webhook separa task/promemoria dagli eventi agenda con euristiche testuali base

## 10. Allineamento tra PRD e codice reale

### Gia` implementato o ben avviato

- dashboard CRM
- inbox centralizzata lato UI/backend
- CRUD contatti
- CRUD preventivi
- CRUD agenda personale
- CRUD task personali
- gestione staff
- disponibilita` data evento con endpoint dedicato
- webhook base WhatsApp
- webhook base voice assistant
- booking assistant backend per qualifica lead via WhatsApp
- automazioni di re-engagement e ricorrenza

### Parzialmente implementato

- omnicanalita` reale live
- assegnazione chat operatore
- AI conversazionale provider-ready con OpenAI Structured Outputs e fallback rule-based; runtime LLM da abilitare con variabili ambiente
- controllo disponibilita` calendario interno e Google Calendar provider-ready quando configurato

### Ancora da sviluppare

- completamento operativo go-live tramite subroadmap deploy hosting, credenziali provider, smoke test manuali e configurazioni provider reali

## 11. Comandi utili

- `corepack pnpm run typecheck`
- `corepack pnpm run build`
- `corepack pnpm run format`
- `corepack pnpm run format:check`
- `corepack pnpm --filter @workspace/api-server run dev`
- `corepack pnpm --filter @workspace/zak-app run dev`
- `corepack pnpm --filter @workspace/api-spec run codegen`
- `corepack pnpm --filter @workspace/db run push`

Nota ambiente Windows:

- il workspace ora usa uno script `preinstall` Node cross-platform;
- sono state aggiunte dipendenze native Windows esplicite per eseguire codegen/build anche su questa macchina;
- `corepack pnpm` e` il comando consigliato quando `pnpm` non e` disponibile come binario globale.

## 11.1 Variabili ambiente integrazioni

### Meta WhatsApp Cloud API

- `META_WHATSAPP_ACCESS_TOKEN`: token Meta Cloud API
- `META_WHATSAPP_PHONE_NUMBER_ID`: ID del numero WhatsApp Business
- `META_GRAPH_API_VERSION`: versione Graph API opzionale, default `v20.0`
- `META_WHATSAPP_TEMPLATE_LANGUAGE`: lingua default template WhatsApp, default `it`
- `META_WHATSAPP_REENGAGEMENT_TEMPLATE_NAME`: template approvato per re-engagement
- `META_WHATSAPP_RICORRENZA_TEMPLATE_NAME`: template approvato per ricorrenze

Se queste variabili non sono presenti, l'app continua a salvare i messaggi outbound in inbox ma salta l'invio reale verso Meta.

Riferimento operativo aggiuntivo:

- vedi [ENVIRONMENT.md](C:/Users/virgi/Desktop/ZAK/ENVIRONMENT.md) per la lista sintetica delle variabili e delle regole di gestione segreti

## 12. Regole per mantenere questo file aggiornato

Da questo momento, ogni modifica dovrebbe aggiungere o aggiornare:

1. la sezione tecnica interessata, se cambia il comportamento del progetto;
2. la sezione changelog qui sotto;
3. eventuali gap tra PRD e implementazione reale;
4. `ROADMAP.md`, spuntando le voci completate o aggiungendo nuove voci se il lavoro introduce una nuova area.

Formato consigliato per nuove voci:

```md
## YYYY-MM-DD - Titolo modifica

- cosa e` stato aggiunto
- cosa e` stato modificato
- eventuali impatti tecnici o funzionali
- eventuali file/moduli coinvolti
```

## 13. Changelog storico del repository

### 2026-05-28 - Initial commit

- creazione iniziale del repository
- impostazione monorepo TypeScript con workspace `pnpm`
- fondazione della base architetturale del progetto

### 2026-05-28 - Add API routes and schemas for user management and CRM features

- aggiunti endpoint backend per utenti, contatti, preventivi, agenda, messaggi, dashboard e webhook
- esteso lo schema database con tabelle CRM, agenda, messaggi e utenti
- introdotto `artifacts/zak-app` come frontend CRM
- aggiunti client e schemi generati da OpenAPI
- introdotta la base UI con layout laterale e pagine principali

### 2026-05-28 - Implement sections for quotes, contacts, settings, and calendar

- completate le pagine frontend per preventivi, nuovo contatto, impostazioni e agenda
- ampliata la copertura funzionale lato backoffice operativo

### 2026-05-28 - Add automated CRM workflows for lead re-engagement and retention

- aggiunto modulo automazioni backend con configurazione, log e trigger manuale
- introdotti job cron giornalieri
- aggiunta pagina frontend per monitorare ed eseguire le automazioni
- estesi OpenAPI, client React e tipi Zod per il nuovo modulo

## 14. Changelog delle modifiche future

### 2026-05-28 - Creazione documentazione progetto e changelog unificato

- creato questo file come riferimento centrale del progetto
- analizzata la struttura reale del repository
- documentati stack, moduli, database, endpoint, architettura e gap rispetto al PRD
- inizializzata la base per tracciare tutte le prossime modifiche e aggiunte

### 2026-05-28 - Prima implementazione booking assistant AI

- aggiunta logica backend per qualificare automaticamente i lead WhatsApp
- implementata estrazione di nome, tipo evento, data e numero invitati dai messaggi
- introdotta creazione/aggiornamento automatico dei preventivi aperti
- aggiunto controllo disponibilita` data con proposta alternative
- salvate in inbox anche le risposte automatiche dell'assistente

### 2026-05-28 - Presa in carico conversazioni da inbox

- aggiunta assegnazione operatore direttamente nella pagina inbox
- introdotta possibilita` di liberare una chat e riattivare Zak AI
- esteso il payload inbox con `operatore_assegnato_id`
- allineati backend e contratti API al nuovo flusso di presa in carico

### 2026-05-28 - Scheda lead contestuale in inbox

- aggiunta visualizzazione rapida di tipo evento, data richiesta e numero invitati nella sidebar chat
- collegata la inbox ai dati CRM e al preventivo attivo del contatto
- resi immediatamente visibili allo staff i dati raccolti dal booking assistant

### 2026-05-28 - Allineamento OpenAPI, codegen e verifiche build

- rigenerati i client da `lib/api-spec/openapi.yaml` con Orval
- sistemati i mismatch frontend emersi dopo il codegen
- corretto il pattern dei route handler Express per rispettare `noImplicitReturns`
- resi gli script workspace compatibili con Windows tramite `corepack pnpm`
- aggiunti binari nativi Windows necessari per `esbuild`, Rollup, Lightning CSS e Tailwind Oxide
- resi i Vite config di `zak-app` e `mockup-sandbox` costruibili con default locali per `PORT` e `BASE_PATH`
- verifiche completate con esito positivo:
  - `corepack pnpm --filter @workspace/api-spec run codegen`
  - `corepack pnpm run typecheck`
  - `corepack pnpm run build`

### 2026-05-29 - Invio WhatsApp outbound Meta-ready

- aggiunto client backend per inviare messaggi testuali tramite Meta WhatsApp Cloud API
- collegato l'invio reale ai messaggi manuali staff su canale WhatsApp
- collegato l'invio reale alle risposte automatiche di Zak AI
- mantenuto fallback sicuro: i messaggi restano salvati in inbox anche quando le credenziali Meta non sono configurate o l'invio fallisce

### 2026-05-29 - Roadmap operativa con checkbox

- aggiunto `ROADMAP.md` in root come registro operativo delle prossime iterazioni
- inserite checkbox per moduli completati, lavori parziali e priorita future
- collegata la roadmap alle regole di aggiornamento del documento operativo

### 2026-05-29 - Difficolta e completamento generale roadmap

- aggiunta difficolta stimata `1/5`-`5/5` accanto a ogni task della roadmap
- aggiunta percentuale di completamento generale del progetto
- completamento corrente: 45% (54 task completati su 120)

### 2026-05-29 - Chiusura task indipendenti 1/5 e 2/5

- aggiunti filtri temporali alla dashboard su KPI, pipeline, eventi mese e attivita` recente
- aggiunti filtri inbox per canale, stato lead e operatore
- introdotta marcatura dei messaggi inbound come letti all'apertura conversazione
- applicati realmente i toggle `reengagement_attivo` e `ricorrenza_attiva` nei job automazioni
- aggiunto `ENVIRONMENT.md` per documentare segreti e configurazione ambiente
- standardizzati i comandi workspace `format` e `format:check` con Prettier
- aggiornati `ROADMAP.md` e completamento generale progetto a 50% (60 task completati su 120)
- `typecheck` e `build` completati con esito positivo
- nota tecnica: `api-zod` rigenera correttamente da OpenAPI; `api-client-react` al momento ha un problema Orval su Windows nella risoluzione del mutator, quindi il delta del client React Query e` stato riallineato manualmente mantenendo il contratto aggiornato

### 2026-05-29 - Note staff e timeline contatti

- aggiunto il campo `note_interna` al modello contatto in schema Drizzle e contratto OpenAPI
- estese le route contatti per leggere e aggiornare le note interne insieme al record CRM
- aggiornata la pagina contatti con pannello laterale di dettaglio, editor note staff e salvataggio rapido
- aggiunta timeline contatto aggregando messaggi e preventivi gia` presenti nel sistema
- `typecheck` e `build` completati con esito positivo dopo l'estensione
- `drizzle-kit push` non eseguito per assenza di `DATABASE_URL` nell'ambiente locale; lo schema e` pronto ma la colonna va ancora applicata sul database reale

### 2026-05-29 - Export dashboard e challenge webhook Meta

- aggiunto export CSV base direttamente dalla dashboard, usando i dati gia` caricati con i filtri temporali correnti
- aggiunto endpoint `GET /api/webhook/whatsapp` per la challenge di verifica Meta
- il challenge usa `META_WEBHOOK_VERIFY_TOKEN` come token atteso lato backend
- roadmap aggiornata a 54% (64 task completati su 120)
- `typecheck` e `build` completati con esito positivo

### 2026-05-29 - Verifica firma webhook Meta

- aggiunta cattura del raw body JSON nel server Express per supportare validazioni HMAC dei webhook
- aggiunta verifica della firma `X-Hub-Signature-256` sul webhook WhatsApp quando `META_APP_SECRET` e` presente
- in assenza di `META_APP_SECRET` il webhook mantiene il fallback attuale e non blocca l'ambiente locale
- roadmap aggiornata a 55% (65 task completati su 120)
- `typecheck` e `build` completati con esito positivo

### 2026-05-29 - Rate limiting API e webhook

- aggiunto rate limiting in-memory sul server Express
- configurato limite piu` stretto per `/api/webhook/*` e limite piu` ampio per il resto delle API
- escluso `/api/healthz` dal limite generale
- nessun impatto sul contratto REST, ma le richieste in eccesso ora ricevono `429`
- roadmap aggiornata a 56% (66 task completati su 120)
- `typecheck` e `build` completati con esito positivo

### 2026-05-29 - Blocco date non disponibili sui preventivi

- impedita la creazione o conferma di un preventivo quando esiste gia` un altro evento confermato nella stessa data
- aggiunto controllo sia in `POST /api/preventivi` sia in `PATCH /api/preventivi/{id}`
- il backend risponde con `409` in caso di conflitto data
- aggiunto feedback minimo in UI preventivi quando la data selezionata e` gia` occupata
- roadmap aggiornata a 57% (67 task completati su 120)
- `typecheck` e `build` completati con esito positivo

### 2026-06-01 - Metriche conversione dashboard

- estese le statistiche dashboard con lead che hanno ricevuto un preventivo e lead confermati
- aggiunte tre metriche di conversione: lead -> preventivo, preventivo -> confermato e lead -> confermato
- aggiornata la UI dashboard con card dedicate alle conversioni
- esteso l'export CSV dashboard includendo anche le nuove metriche
- roadmap aggiornata a 58% (68 task completati su 120)

### 2026-06-01 - Invio reale automazioni CRM via WhatsApp

- collegati i job `reengagement` e `ricorrenza` al client WhatsApp Meta gia` presente nel backend
- le automazioni ora salvano il messaggio outbound anche nella inbox CRM quando l'invio viene eseguito o saltato per assenza configurazione Meta
- aggiunti log piu` espliciti per casi `eseguito`, `saltato` ed `errore`
- mantenuto fallback locale: se le credenziali Meta non sono configurate, il sistema registra comunque il messaggio e l'esecuzione
- roadmap aggiornata a 59% (69 task completati su 120)

### 2026-06-01 - Storico cambi stato lead

- aggiunta nuova tabella `stato_lead_storico` nello schema condiviso Drizzle
- tracciati i cambi stato lead da creazione contatto CRM, webhook WhatsApp e booking assistant
- aggiunto endpoint `GET /api/contatti/{id}/storico-stato`
- aggiornata la sidebar contatto mostrando anche gli eventi di cambio stato nella timeline
- roadmap aggiornata a 60% (70 task completati su 120)
- nota operativa: la nuova tabella e` presente nel codice ma richiede `DATABASE_URL` per essere applicata al database reale con `drizzle-kit push`

### 2026-06-01 - Tracciamento errori invio WhatsApp su DB

- aggiunta tabella `whatsapp_outbound_log` per tracciare gli invii outbound e i fallimenti provider
- collegato il logging DB agli invii WhatsApp provenienti da:
- `POST /api/messaggi` (messaggi staff)
- booking assistant (`Zak AI`)
- automazioni CRM (`reengagement` e `ricorrenza`)
- il tracciamento salva stato, motivo errore/skipped, id provider e una preview del messaggio
- roadmap aggiornata a 61% (71 task completati su 120)
- nota operativa: anche questa tabella richiede `DATABASE_URL` per essere applicata al database reale con `drizzle-kit push`

### 2026-06-01 - Stato consegna messaggi WhatsApp

- esteso `whatsapp_outbound_log` con campi per `delivery_status`, `delivery_updated_at`, `provider_error_code` e `provider_error_message`
- il webhook WhatsApp ora processa anche gli eventi Meta `statuses`
- gli stati ricevuti da Meta aggiornano il log outbound tramite `provider_message_id`
- se arriva uno status senza log locale collegato, viene creato un record tecnico per non perdere l'evento provider
- roadmap aggiornata a 62% (72 task completati su 120)
- nota operativa: le nuove colonne richiedono `DATABASE_URL` per essere applicate al database reale con `drizzle-kit push`

### 2026-06-01 - Supporto template WhatsApp approvati

- aggiunto invio template WhatsApp approvati nel client Meta backend
- supportati lingua template e parametri body testuali
- collegate le automazioni `reengagement` e `ricorrenza` ai template approvati quando configurati via env
- mantenuto fallback testuale quando i template non sono configurati
- aggiornato `ENVIRONMENT.md` con le variabili template Meta
- roadmap aggiornata a 63% (73 task completati su 120)

### 2026-06-01 - Gestione finestra conversazionale WhatsApp 24 ore

- aggiunta utility backend per calcolare la finestra WhatsApp di 24 ore dall'ultimo messaggio inbound del contatto
- i messaggi staff WhatsApp liberi vengono bloccati con `409` quando la finestra e` chiusa
- il booking assistant controlla la finestra prima dell'invio testuale libero e traccia eventuali skip nel log outbound
- le automazioni usano template approvati fuori finestra; se il template non e` configurato, saltano l'invio Meta e registrano il motivo
- aggiornato `openapi.yaml` documentando il `409` su `POST /api/messaggi`
- `api-zod` rigenerato da OpenAPI; `api-client-react` riallineato manualmente per il problema Orval Windows gia` noto sul mutator
- roadmap aggiornata a 64% (74 task completati su 120)

### 2026-06-01 - Supporto media inbound WhatsApp

- estesa la tabella `messaggi` con metadati media opzionali
- il webhook WhatsApp ora riconosce media inbound di tipo `image`, `video`, `audio`, `document` e `sticker`
- i messaggi media vengono salvati con placeholder testuale e metadati Meta (`media_id`, tipo, MIME, SHA256 e filename quando presente)
- la inbox mostra una riga compatta con tipo media, nome file e MIME type quando disponibili
- `api-zod` rigenerato da OpenAPI; `api-client-react` riallineato manualmente per il problema Orval Windows gia` noto sul mutator
- roadmap aggiornata a 63% (75 task completati su 120)
- nota operativa: i file binari non vengono ancora scaricati o archiviati; questa iterazione salva solo metadati e riferimento provider

### 2026-06-01 - Import CSV contatti

- aggiunto endpoint `POST /api/contatti/import-csv`
- supportato CSV con intestazioni `nome`, `telefono`, `instagram_username`, `origine_lead`, `tipo_evento`, `stato_lead`, `note_interna`
- aggiunta deduplicazione base su telefono: i contatti gia` presenti vengono saltati
- registrato lo storico stato lead per i contatti creati via import
- aggiunto pulsante `Importa CSV` nella pagina contatti con riepilogo creati, duplicati ed errori
- aggiornato `openapi.yaml` e client React Query riallineato manualmente
- roadmap aggiornata a 63% (76 task completati su 120)

### 2026-06-01 - Deduplicazione avanzata telefono/social

- aggiunta normalizzazione telefono per confronto duplicati, indipendente da spazi, simboli e prefissi `00`
- aggiunta normalizzazione username Instagram rimuovendo `@` iniziale e uniformando il confronto in minuscolo
- bloccata la creazione e la modifica di contatti duplicati con risposta `409`
- esteso l'import CSV: ora salta duplicati gia` presenti o ripetuti nello stesso file sia per telefono sia per Instagram
- aggiornato `openapi.yaml` documentando il conflitto duplicato sui contatti
- roadmap aggiornata a 64% (77 task completati su 120)

### 2026-06-01 - Segmentazione automazioni per tipo evento

- aggiunte le configurazioni `reengagement_tipi_evento` e `ricorrenza_tipi_evento`
- supportato valore `all` per includere tutti i tipi evento oppure una lista separata da virgole
- i job re-engagement e ricorrenze filtrano ora i contatti/eventi in base al segmento configurato
- la pagina Automazioni mostra e permette di modificare i segmenti per tipo evento
- aggiornato `openapi.yaml` descrivendo che trigger e configurazione usano la segmentazione corrente
- roadmap aggiornata a 65% (78 task completati su 120)

### 2026-06-01 - Dashboard performance automazioni

- aggiunto endpoint `GET /api/automazioni/performance`
- calcolate metriche da `automazioni_log`: totale esecuzioni, eseguite, saltate, errori, tasso successo e volume ultimi 30 giorni
- aggiunto breakdown per tipo automazione, utile per confrontare re-engagement e ricorrenze
- aggiornata la pagina Automazioni con card performance e riepilogo per job
- aggiornati OpenAPI, client React Query e tipi Zod generati riallineati manualmente per il problema Orval Windows noto
- roadmap aggiornata a 66% (79 task completati su 120)

### 2026-06-01 - Audit log azioni staff

- aggiunta tabella `audit_log` nello schema Drizzle
- aggiunto endpoint `GET /api/audit-log` con filtri `azione`, `entita` e `limit`
- tracciate le azioni staff principali: creazione/modifica/eliminazione di utenti, contatti, preventivi e agenda
- tracciati invio messaggi, marcatura lettura, assegnazione/rilascio chat, trigger automazioni, aggiornamento configurazioni e import CSV contatti
- aggiunta pagina frontend `/audit-log` con filtri e lista ultime azioni
- aggiornati OpenAPI, client React Query e tipi Zod riallineati manualmente per il problema Orval Windows noto
- roadmap aggiornata a 67% (80 task completati su 120)
- nota operativa: la nuova tabella richiede `DATABASE_URL` per essere applicata al database reale con `drizzle-kit push`

### 2026-06-01 - Handoff esplicito AI verso operatore

- aggiunto campo `handoff_richiesto` al modello contatto CRM
- il Booking Assistant riconosce richieste esplicite di operatore/persona/staff e ferma le risposte automatiche successive
- Zak AI invia un ultimo messaggio di conferma handoff al cliente
- la inbox mostra badge `Richiede staff` nelle conversazioni da prendere in carico
- l'assegnazione della chat a un operatore azzera il flag handoff
- aggiornati OpenAPI, client React Query e tipi Zod riallineati manualmente per il problema Orval Windows noto
- roadmap aggiornata a 68% (81 task completati su 120)
- nota operativa: il nuovo campo richiede `DATABASE_URL` per essere applicato al database reale con `drizzle-kit push`

### 2026-06-02 - Associazione telefonata a contatto CRM

- aggiunto campo opzionale `contatto_id` alla tabella `agenda_personale`
- estesi gli endpoint agenda per restituire anche `contatto_nome`
- il webhook voice assistant cerca il contatto CRM tramite telefono normalizzato e collega la chiamata se trova una corrispondenza
- la pagina Agenda mostra il cliente CRM collegato agli impegni creati da chiamata
- aggiornati OpenAPI, client React Query e tipi Zod riallineati manualmente per il problema Orval Windows noto
- roadmap aggiornata a 68% (82 task completati su 120)
- nota operativa: il nuovo campo richiede `DATABASE_URL` per essere applicato al database reale con `drizzle-kit push`

### 2026-06-02 - Trascrizione chiamata nello storico contatto

- il webhook voice assistant salva la trascrizione anche come messaggio inbound con canale `voice` quando trova un contatto CRM collegato
- aggiornato `ultimo_contatto` del cliente dopo una telefonata collegata
- la inbox riconosce il canale `voice` con icona dedicata e filtro `Telefonate`
- la timeline contatto mostra le telefonate come `Telefonata registrata`
- roadmap aggiornata a 69% (83 task completati su 120)

### 2026-06-02 - Task separati da eventi agenda

- aggiunta tabella `task_personali` nello schema Drizzle condiviso
- aggiunto router backend `task-personali` con CRUD completo e audit log operativo
- aggiornato `openapi.yaml` con endpoint e schema `TaskPersonale`
- riallineati client React Query e tipi Zod manualmente per il problema Orval Windows noto
- aggiunta pagina frontend `/task` con creazione, filtri, completamento, riapertura ed eliminazione task
- il webhook voice assistant crea task personali per intenti di promemoria/task/da fare e mantiene l'agenda per eventi calendarizzati
- roadmap aggiornata a 70% (84 task completati su 120)
- nota operativa: la nuova tabella richiede `DATABASE_URL` per essere applicata al database reale con `drizzle-kit push`

### 2026-06-02 - CI automatica GitHub Actions

- aggiunto workflow `.github/workflows/ci.yml`
- la pipeline gira su pull request e push verso `main`/`master`
- configurato Node.js 22 con Corepack e installazione `pnpm --frozen-lockfile`
- verifiche automatiche incluse: `corepack pnpm run typecheck` e `corepack pnpm run build`
- roadmap aggiornata a 71% (85 task completati su 120)

### 2026-06-02 - Prima pagina B2B e competitor nel frontend reale

- aggiunta pagina frontend reale `/b2b-competitor` con dati demo locali
- aggiunta voce `B2B` nella sidebar dell'app principale
- registrata la route in `artifacts/zak-app/src/App.tsx`
- la pagina include archivio competitor, materiali demo, analisi AI simulata e template pitch B2B
- nessuna API, schema DB o backend reale modificato in questa iterazione
- roadmap aggiornata a 72% (86 task completati su 120)

### 2026-06-02 - Parsing intento chiamata voice assistant

- migliorato il webhook voice assistant con parsing intento `task`/`agenda`
- aggiunta estrazione base di date e orari in italiano: oggi, domani, dopodomani, formato `gg/mm`, formato `gg mese`, e orari `alle/ore HH:MM`
- i task creati da chiamata ora possono ricevere scadenza e priorita` dedotta dal testo
- gli eventi agenda creati da chiamata usano la data/ora rilevata quando presente invece dell'orario corrente
- descrizione task/agenda arricchita con intento rilevato e livello di confidenza
- roadmap aggiornata a 73% (87 task completati su 120)

### 2026-06-02 - Preview frontend PDF preventivo

- aggiunta pagina frontend reale `/preventivo-pdf-preview` con dati demo locali
- aggiunta voce `PDF Preventivo` nella sidebar subito dopo `Preventivi`
- registrata la route in `artifacts/zak-app/src/App.tsx`
- la pagina include configuratore demo, anteprima A4-like, tabella voci economiche, IVA, totale e azioni simulate
- nessuna generazione PDF reale, API, schema DB o backend modificati in questa iterazione
- roadmap aggiornata a 73% (88 task completati su 121)

### 2026-06-02 - Promemoria automatici agenda

- aggiunto job `promemoria` alle automazioni CRM
- il cron esegue il controllo ogni 15 minuti sugli eventi agenda imminenti
- aggiunte configurazioni `promemoria_attivo` e `promemoria_minuti_anticipo`
- gli eventi agenda entro la finestra configurata vengono registrati in `automazioni_log` e marcati con `promemoria_inviato = true`
- aggiunto trigger manuale dalla pagina Automazioni
- nessun invio esterno reale in questa iterazione: il promemoria e` interno/loggato
- roadmap aggiornata a 74% (89 task completati su 121)

### 2026-06-02 - Hardening agenda e automazioni

- aggiunta validazione backend sugli intervalli agenda: `data_ora_fine` deve essere successiva a `data_ora_inizio`
- corretto il dettaglio agenda per restituire il `contatto_nome` selezionato quando presente
- quando un evento agenda futuro viene rischedulato, `promemoria_inviato` viene riportato a `false` per permettere un nuovo promemoria
- completati i default runtime delle automazioni, includendo toggle e finestre temporali storiche oltre ai nuovi promemoria
- aggiunta validazione backend e frontend dei valori configurazione automazioni
- aggiunta guardia anti-overlap sui job cron per evitare esecuzioni concorrenti dello stesso job
- roadmap aggiornata a 75% (95 task completati su 127)

### 2026-06-02 - Integrazione output Antigravity RBAC e documentazione staff

- accettata la pagina frontend mock `/admin-roles` con matrice ruoli/permessi, utenti demo, ricerca, stati vuoti e log operazioni simulate
- aggiornato il QA test plan con 7 scenari futuri dedicati a controllo accessi e RBAC
- aggiornato il manuale operativo staff con sezione ruoli, permessi e account disattivati
- aggiunto dataset demo `attached_assets/demo-utenti-staff.csv` con 15 utenti fittizi
- aggiunta guida `docs/DEMO_STAFF_IMPORT.md` per il futuro import staff
- aggiornata l'overview commerciale con sezione sicurezza, governance e controllo operativo
- verifica encoding: i file risultano leggibili come UTF-8; eventuali caratteri rotti visti in PowerShell sono effetto console, non contenuto reale
- nessuna modifica a OpenAPI, schema DB, backend o generated client in questo blocco
- roadmap aggiornata a 76% (101 task completati su 133)

### 2026-06-02 - Stato reale account staff

- aggiunto campo `stato` alla tabella `utenti` con default `attivo`
- aggiornato OpenAPI: `Utente`, `UtenteInput` e `UtenteUpdate` includono `stato` e usano enum per `ruolo` e `stato`
- rafforzata la validazione backend degli utenti: email valida, ruoli ammessi e stati ammessi
- aggiornata la pagina Impostazioni con conteggio utenti attivi/disattivati, badge stato, selezione stato nel drawer e azione rapida attiva/disattiva
- riallineati manualmente client React Query e tipi/schemi Zod generati per il noto problema locale di codegen Orval su Windows
- roadmap aggiornata a 76% (103 task completati su 135)
- nota operativa: la nuova colonna `utenti.stato` richiede applicazione sul database reale tramite migrazione/`drizzle push` quando `DATABASE_URL` sara disponibile

### 2026-06-02 - Chiusura blocchi Antigravity non-core A/B/C

- accettate le pagine mock frontend `/login-mock`, `/access-denied-mock` e `/security-audit-mock`
- aggiunti mock sandbox `DashboardMobilePolish` e `OperatorPresenceInbox`
- aggiunte guide operative e di sicurezza: RBAC UX, go-live staff, incident response, data retention draft
- aggiunti dataset demo `demo-audit-log.csv` e `demo-automazioni-log.csv` con relative guide import future
- aggiunti materiali commerciali: pitch venue, one-pager partner scuole/aziende e checklist review UI mock
- nessuna modifica a OpenAPI, schema DB, backend reale o generated client in questo blocco

### 2026-06-02 - Chiusura blocchi Antigravity non-core D/E/F

- aggiornata la pagina B2B con archivio competitor demo, filtri, upload mock, prompt AI simulati, template co-branding e preview presentazione
- aggiunte specifiche B2B: prompt library competitor, template co-branding e export PDF/presentazioni
- aggiunti piani test tecnici: backend unit test plan, frontend component test plan e WhatsApp webhook integration test plan
- aggiunto asset `whatsapp-webhook-sample-payloads.json` con payload demo per test futuri
- aggiunte specifiche operative per le prossime feature core: realtime inbox, LLM booking assistant, preventivo PDF reale, Google Calendar sync e voice assistant provider
- `corepack pnpm run typecheck` e `corepack pnpm run build` verificati con esito positivo dopo la review
- roadmap aggiornata a 80% (131 task completati su 163)
- nota tecnica: questi blocchi chiudono lavoro non-core/mock/spec; le implementazioni core reali restano da sviluppare con flusso OpenAPI-first

### 2026-06-02 - Chiusura batch Antigravity core-adjacent G/H/I

- accettate le pagine mock frontend `/realtime-inbox-mock`, `/llm-booking-review-mock`, `/preventivo-pricing-builder-mock`, `/preventivo-signature-mock` e `/google-calendar-settings-mock`
- aggiunte fixture JSON per futuri test di booking assistant, voice assistant e automazioni CRM
- aggiunta documentazione fixture e checklist operative: matrice test manuale frontend, regression checklist pre-merge e report ASCII cleanup
- migliorati gli stati empty/loading/error su pagine frontend operative senza modificare API, schema DB o backend reale
- aggiornata la sidebar con revisione responsive e nuove voci mock
- verificato che le fixture JSON siano valide
- `corepack pnpm run typecheck` e `corepack pnpm run build` completati con esito positivo
- roadmap aggiornata a 82% (146 task completati su 178)
- nota tecnica: il batch e` core-adjacent; non implementa realtime, LLM, pricing, firma digitale o Google Calendar reali

### 2026-06-03 - Template configurabili Booking Assistant

- aggiunti template runtime `booking_assistant_template_*` in `automazioni_config`
- il Booking Assistant usa i template configurabili per richiesta nome, tipo evento, data evento, numero invitati, lead completo, handoff, data occupata e data disponibile
- aggiunto rendering placeholder nei template: `{{nome}}`, `{{tipo_evento}}`, `{{data_evento}}`, `{{numero_invitati}}` e `{{alternative}}`
- il pannello Automazioni mostra etichette e help per modificare i template senza cambiare codice
- nessun nuovo endpoint e nessuna nuova tabella: viene riusata la configurazione runtime esistente
- `corepack pnpm run typecheck` completato con esito positivo
- roadmap aggiornata a 83% (147 task completati su 178)

### 2026-06-03 - Test automatici parser Booking Assistant

- estratta la logica pura di parsing in `booking-assistant-parser.ts` per testarla senza DB o provider esterni
- aggiunto test automatico `test:booking-assistant` basato sulle fixture `booking-assistant-test-fixtures.json`
- coperti tipo evento CRM, data evento, numero invitati, richiesta handoff e rendering placeholder template
- corretto un bug timezone nella formattazione ISO delle date: il parser ora usa componenti locali invece di `toISOString()`
- `corepack pnpm --filter @workspace/api-server run test:booking-assistant`, `corepack pnpm run typecheck` e `corepack pnpm run build` completati con esito positivo
- roadmap aggiornata a 83% (148 task completati su 178)

### 2026-06-03 - Suite test unitari backend iniziale

- estratta la logica pura del Voice Assistant in `voice-assistant-parser.ts`
- aggiunto test automatico `test:voice-assistant` basato sulle fixture `voice-assistant-test-fixtures.json`
- aggiunto comando aggregato `test:backend` per eseguire i test Booking Assistant e Voice Assistant
- migliorato il parser voice per riconoscere visite/sopralluoghi, frasi tipo `ci vediamo`, firme/contratti, rinvii e richieste di contatto urgente
- aggiunto parsing dei giorni della settimana come `martedi prossimo`/`mercoledi`
- `corepack pnpm --filter @workspace/api-server run test:backend`, `corepack pnpm run typecheck` e `corepack pnpm run build` completati con esito positivo
- roadmap aggiornata a 84% (149 task completati su 178)

### 2026-06-03 - Test integrazione payload webhook WhatsApp

- estratta la logica provider-neutral del webhook WhatsApp in `whatsapp-webhook-parser.ts`
- aggiunti helper testabili per estrarre messaggi inbound, media inbound, status delivery/read e normalizzare telefoni
- aggiunto test automatico `test:whatsapp-webhook` basato su `whatsapp-webhook-sample-payloads.json`
- verificata anche la validazione firma Meta `x-hub-signature-256` con HMAC SHA-256
- il comando `test:backend` ora esegue Booking Assistant, Voice Assistant e WhatsApp webhook parser
- `corepack pnpm --filter @workspace/api-server run test:backend`, `corepack pnpm run typecheck` e `corepack pnpm run build` completati con esito positivo
- roadmap aggiornata a 84% (150 task completati su 178)

### 2026-06-03 - Slot e fasce orarie disponibilita calendario

- aggiornato OpenAPI per `/calendar/check-availability` con parametro opzionale `slot`
- aggiunta risposta `slot_richiesto` e `slot_disponibili` al modello `CalendarAvailability`
- rigenerati client React Query e schemi Zod da OpenAPI
- aggiornato backend disponibilita: slot ammessi `pranzo`, `pomeriggio`, `sera`, `intera_giornata`
- validazione backend del parametro `slot` con errore 400 per valori non ammessi
- nota tecnica: finche non esiste una tabella slot dedicata, un evento confermato occupa tutta la giornata; la nuova API prepara l'evoluzione a fasce reali
- `corepack pnpm --filter @workspace/api-spec run codegen`, `corepack pnpm run typecheck` e `corepack pnpm run build` completati con esito positivo
- roadmap aggiornata a 85% (151 task completati su 178)

### 2026-06-03 - Versionamento preventivi

- aggiunta tabella Drizzle `preventivi_versioni` con snapshot JSON append-only del preventivo
- aggiornato OpenAPI con `GET /preventivi/{id}/versioni` e `POST /preventivi/{id}/versioni`
- rigenerati client React Query e schemi Zod da OpenAPI
- aggiunto backend per listare versioni e creare una nuova versione progressiva del preventivo corrente
- ogni snapshot registra `numero_versione`, `snapshot`, `nota` opzionale e `data_creazione`
- aggiunto audit log alla creazione versione con entita `preventivo_versione`
- `corepack pnpm --filter @workspace/api-spec run codegen`, `corepack pnpm run typecheck` e `corepack pnpm run build` completati con esito positivo
- roadmap aggiornata a 85% (152 task completati su 178)
- nota operativa: la nuova tabella richiede applicazione sul database reale tramite `corepack pnpm --filter @workspace/db run push` quando `DATABASE_URL` sara configurato

### 2026-06-03 - Calcolo pacchetti e prezzi preventivi

- aggiunto endpoint OpenAPI `POST /preventivi/calcola-prezzo`
- aggiunti schemi `PreventivoPricingInput`, `PreventivoPricingVoce` e `PreventivoPricingResult`
- rigenerati client React Query e schemi Zod da OpenAPI
- implementato backend pricing con pacchetti `essenziale`, `standard`, `premium` ed extra `open_bar`, `dj_set`, `fotografo`, `allestimento`, `torta`, `sicurezza`
- validazione request tramite schema Zod generato da OpenAPI
- aggiornata la pagina Preventivi: nel drawer e disponibile il calcolo pacchetto/extra e il totale viene applicato a `budget_stimato`
- `corepack pnpm --filter @workspace/api-spec run codegen`, `corepack pnpm run typecheck` e `corepack pnpm run build` completati con esito positivo
- roadmap aggiornata a 86% (153 task completati su 178)

### 2026-06-03 - Invio preventivo via WhatsApp

- aggiunto endpoint OpenAPI `POST /preventivi/{id}/invia-whatsapp`
- aggiunto schema `PreventivoWhatsAppSendResult`
- rigenerati client React Query e schemi Zod da OpenAPI
- implementato backend per comporre un riepilogo testuale del preventivo con evento, data, invitati, budget e stato
- l'invio usa `sendWhatsAppTextSafely`, registra `whatsapp_outbound_log` e salva il messaggio outbound in inbox quando la finestra WhatsApp 24h e aperta
- se la finestra WhatsApp 24h e chiusa, l'endpoint restituisce `skipped` e non invia messaggi free-form
- aggiunto pulsante WhatsApp nella tabella Preventivi
- `corepack pnpm --filter @workspace/api-spec run codegen`, `corepack pnpm run typecheck` e `corepack pnpm run build` completati con esito positivo
- roadmap aggiornata a 87% (154 task completati su 178)

### 2026-06-03 - Conferma digitale preventivi

- aggiunto endpoint OpenAPI `POST /preventivi/{id}/conferma-digitale`
- aggiunti schemi `PreventivoConfermaDigitaleInput` e `PreventivoConfermaDigitaleResult`
- rigenerati client React Query e schemi Zod da OpenAPI
- implementato backend per confermare digitalmente un preventivo, portando `stato_evento` a `confermato`
- la conferma aggiorna anche il contatto collegato a `stato_lead = confermato` e registra lo storico cambio stato lead
- la traccia della conferma viene appendata nelle note del preventivo con firmatario, metodo e note opzionali
- aggiunto audit log con azione `confirm`
- aggiunto pulsante di conferma digitale nella tabella Preventivi
- `corepack pnpm --filter @workspace/api-spec run codegen`, `corepack pnpm run typecheck` e `corepack pnpm run build` completati con esito positivo
- roadmap aggiornata a 87% (155 task completati su 178)

### 2026-06-03 - Presenza operatori online/offline

- aggiunti endpoint OpenAPI `GET /chat/presence` e `POST /chat/presence/heartbeat`
- aggiunti schemi `OperatorPresence` e `OperatorPresenceHeartbeatInput`
- rigenerati client React Query e schemi Zod da OpenAPI
- implementato backend presenza operatori con heartbeat in memoria e TTL 90 secondi
- `GET /chat/presence` restituisce tutti gli utenti staff con stato `online` calcolato dall'ultimo heartbeat
- `POST /chat/presence/heartbeat` valida l'utente e aggiorna lo stato online
- nessuna nuova tabella: lo stato e intenzionalmente volatile e pronto per futura evoluzione WebSocket/SSE
- `corepack pnpm --filter @workspace/api-spec run codegen`, `corepack pnpm run typecheck` e `corepack pnpm run build` completati con esito positivo
- roadmap aggiornata a 88% (156 task completati su 178)

### 2026-06-04 - Realtime multi-operatore inbox via SSE

- aggiunto endpoint OpenAPI `GET /chat/events` per stream realtime Server-Sent Events
- rigenerati client React Query e schemi Zod da OpenAPI
- aggiunto event bus backend in-memory per eventi `message_created`, `message_read`, `chat_assigned` e `presence_updated`
- collegati gli eventi realtime a invio messaggi, lettura messaggi, assegnazione/rilascio chat, heartbeat presenza e webhook WhatsApp/voice inbound
- aggiornata la pagina Inbox: usa `EventSource` su `/api/chat/events` e invalida le query generate quando arrivano eventi realtime
- rimosso il polling fisso a 5 secondi sui messaggi selezionati, mantenendo i dati REST gestiti dal client generato
- nessuna nuova tabella: lo stream SSE e volatile e adatto a single-instance; in produzione multi-replica potra evolvere verso Redis/PubSub senza cambiare UI
- `corepack pnpm --filter @workspace/api-spec run codegen`, `corepack pnpm run typecheck` e `corepack pnpm run build` completati con esito positivo
- roadmap aggiornata a 88% (157 task completati su 178)

### 2026-06-04 - Stato scrittura operatore in inbox

- aggiunti endpoint OpenAPI `GET /chat/typing` e `POST /chat/typing`
- aggiunti schemi `ChatTypingInput` e `ChatTypingStatus`
- rigenerati client React Query e schemi Zod da OpenAPI
- esteso il bus SSE con evento `typing_updated`
- implementato backend typing status volatile in memoria con TTL 7 secondi, senza nuove tabelle DB
- la pagina Inbox invia lo stato `is_typing` quando l'operatore assegnato scrive nella conversazione
- la pagina Inbox mostra l'indicatore `sta scrivendo...` quando altri operatori risultano attivi sulla stessa chat
- `corepack pnpm --filter @workspace/api-spec run codegen`, `corepack pnpm run typecheck` e `corepack pnpm run build` completati con esito positivo
- roadmap aggiornata a 89% (158 task completati su 178)

### 2026-06-04 - Smoke test frontend componenti critici

- aggiunto test smoke `critical-pages.smoke.test.ts` per bloccare regressioni statiche su Inbox, Preventivi, Task e rotte principali
- aggiunto script app `test:critical` in `@workspace/zak-app`
- aggiunto script workspace `test:frontend-critical`
- il test verifica che le pagine critiche continuino a usare hook generati OpenAPI e funzioni realtime/pricing/task essenziali
- nessuna nuova dipendenza: il test usa `tsx` gia disponibile nel workspace scripts
- limite noto: e uno smoke statico, non sostituisce test runtime con Vitest/React Testing Library o Playwright
- `corepack pnpm run test:frontend-critical` completato con esito positivo
- `corepack pnpm run typecheck` e `corepack pnpm run build` completati con esito positivo
- roadmap aggiornata a 89% (159 task completati su 178)

### 2026-06-04 - Stato conversazionale persistente Booking Assistant

- aggiunta tabella Drizzle `booking_conversation_state`
- ogni contatto ha una sola riga di stato aggiornata in upsert dal Booking Assistant
- lo stato salva `step_corrente`, `dati_mancanti`, `dati_estratti_json`, `completato`, `ultimo_messaggio_at` e `data_aggiornamento`
- aggiunte funzioni pure `getMissingBookingSteps` e `getCurrentBookingStep` per calcolare lo step corrente senza DB
- estesi i test parser Booking Assistant per step iniziali, completamento e handoff
- il Booking Assistant persiste lo stato nei rami normale, handoff gia attivo e nuova richiesta handoff
- nessun nuovo endpoint: la feature e interna al flusso AI e prepara review/admin future
- `corepack pnpm --filter @workspace/api-server run test:backend`, `corepack pnpm run typecheck` e `corepack pnpm run build` completati con esito positivo
- roadmap aggiornata a 90% (160 task completati su 178)
- nota operativa: le tabelle B2B gia aggiunte richiedono applicazione sul database reale con `corepack pnpm --filter @workspace/db run push` quando `DATABASE_URL` sara configurato

### 2026-06-04 - Generazione PDF preventivo

- aggiunto endpoint OpenAPI `GET /preventivi/{id}/pdf`
- rigenerati client React Query e schemi Zod da OpenAPI
- implementata generazione backend di PDF testuale minimale senza nuove dipendenze
- il PDF include cliente, telefono, tipo evento, data, invitati, budget, stato, data creazione e note operative
- il download viene tracciato in audit log con azione `download` ed entita `preventivo_pdf`
- aggiunto pulsante `Scarica PDF` nella tabella Preventivi usando `getDownloadPreventivoPdfUrl`
- aggiornato lo smoke test frontend critico per verificare la presenza dell'azione PDF
- limite noto: il PDF e funzionale ma minimale; layout commerciale avanzato/grafico resta migliorabile con template dedicato
- `corepack pnpm --filter @workspace/api-spec run codegen`, `corepack pnpm run test:frontend-critical`, `corepack pnpm run typecheck` e `corepack pnpm run build` completati con esito positivo
- roadmap aggiornata a 90% (161 task completati su 178)

### 2026-06-04 - Archivio competitor B2B reale

- aggiunta tabella Drizzle `b2b_competitor`
- aggiunti endpoint OpenAPI `GET/POST /b2b/competitor` e `GET/PATCH/DELETE /b2b/competitor/{id}`
- rigenerati client React Query e schemi Zod da OpenAPI
- aggiunta route backend B2B con filtri `search` e `categoria`, validazione schema DB e audit log create/update/delete
- registrato il router B2B nel backend principale
- integrata la pagina `/b2b-competitor` con una sezione `Archivio competitor reale` collegata agli hook generati
- mantenuto il mock avanzato esistente come sandbox sotto la sezione reale, senza rimuovere il lavoro Antigravity
- aggiornato smoke test frontend critico per verificare hook B2B reali
- `corepack pnpm --filter @workspace/api-spec run codegen`, `corepack pnpm run test:frontend-critical`, `corepack pnpm run typecheck` e `corepack pnpm run build` completati con esito positivo
- roadmap aggiornata a 91% (162 task completati su 178)
- nota operativa: la nuova tabella richiede applicazione sul database reale con `corepack pnpm --filter @workspace/db run push` quando `DATABASE_URL` sara configurato

### 2026-06-04 - Registro materiali competitor B2B

- aggiunta tabella Drizzle `b2b_materiali`
- aggiunti endpoint OpenAPI `GET/POST /b2b/materiali` e `PATCH/DELETE /b2b/materiali/{id}`
- rigenerati client React Query e schemi Zod da OpenAPI
- estesa route backend B2B con registro materiali, filtri `competitor_id`/`stato`, join su nome competitor e audit log create/update/delete
- integrata la pagina `/b2b-competitor` con registrazione e lista materiali reali usando hook generati
- aggiornato smoke test frontend critico per verificare hook reali dei materiali B2B
- limite noto: la versione attuale registra metadati/URL/riferimenti file, non salva binari su storage; storage reale potra essere collegato in seguito
- `corepack pnpm --filter @workspace/api-spec run codegen`, `corepack pnpm run test:frontend-critical`, `corepack pnpm run typecheck` e `corepack pnpm run build` completati con esito positivo
- roadmap aggiornata a 92% (163 task completati su 178)
- nota operativa: la nuova tabella richiede applicazione sul database reale con `corepack pnpm --filter @workspace/db run push` quando `DATABASE_URL` sara configurato

### 2026-06-04 - Template co-branding B2B reali

- aggiunta tabella Drizzle `b2b_template`
- aggiunti endpoint OpenAPI `GET/POST /b2b/template` e `PATCH/DELETE /b2b/template/{id}`
- rigenerati client React Query e schemi Zod da OpenAPI
- estesa route backend B2B con CRUD template, filtro `target_tipo` e audit log create/update/delete
- integrata la pagina `/b2b-competitor` con creazione e lista template reali usando hook generati
- mantenuti i template demo avanzati come area prototipo per pitch e presentazioni
- aggiornato smoke test frontend critico per verificare hook reali dei template B2B
- `corepack pnpm --filter @workspace/api-spec run codegen`, `corepack pnpm run test:frontend-critical`, `corepack pnpm run typecheck` e `corepack pnpm run build` completati con esito positivo
- roadmap aggiornata a 92% (164 task completati su 178)

### 2026-06-04 - Analisi competitor B2B strutturata

- aggiunti endpoint OpenAPI `POST /b2b/analisi-competitor` e `POST /b2b/export`
- rigenerati client React Query e schemi Zod da OpenAPI
- estesa route backend B2B con analisi competitor strutturata provider-neutral, validata con Zod e tracciata in audit log
- l'analisi usa i dati reali dell'archivio competitor quando disponibili e produce sintesi, punti forza/deboli, opportunita e azioni consigliate
- integrata la pagina `/b2b-competitor` con selezione competitor reale, focus analisi e output operativo leggibile dallo staff
- limite noto: la versione attuale e deterministica e non chiama ancora un provider LLM esterno; e pensata come base sicura sostituibile con OpenAI/altro provider

### 2026-06-04 - Export B2B PDF/presentazioni outline

- aggiunto export backend per pitch B2B in formato `pdf` o `presentazione` come outline JSON/PDF-ready
- l'endpoint restituisce titolo, contenuto strutturato, filename suggerito e 5 slide operative
- integrata la pagina `/b2b-competitor` con pulsanti `Outline PDF` e `Outline slide` collegati agli hook generati
- aggiornato smoke test frontend critico per verificare `useAnalyzeB2BCompetitor` e `useExportB2BPitch`
- `corepack pnpm run test:frontend-critical`, `corepack pnpm --filter @workspace/api-server run test:backend`, `corepack pnpm run typecheck` e `corepack pnpm run build` completati con esito positivo
- limite noto: non viene ancora generato un file binario `.pdf`/`.pptx`; la risposta e un outline pronto per una futura pipeline di rendering
- roadmap aggiornata a 93% (166 task completati su 178)
- nota operativa: le tabelle B2B gia aggiunte richiedono applicazione sul database reale con `corepack pnpm --filter @workspace/db run push` quando `DATABASE_URL` sara configurato

### 2026-06-04 - Allineamento macro-priorita roadmap

- verificato che `Verifica firma e challenge webhook Meta` risulta gia implementata nel backend WhatsApp tramite challenge `hub.challenge`, token `META_WEBHOOK_VERIFY_TOKEN` e firma `x-hub-signature-256`
- verificato che `Realtime inbox multi-operatore` risulta gia implementata con stream SSE, eventi chat, typing status e invalidazione frontend via `EventSource`
- spuntate le due voci duplicate nella sezione macro-priorita senza introdurre nuove modifiche funzionali
- non spuntata la voce `LLM booking assistant con stato conversazionale persistente`: lo stato conversazionale e persistente, ma l'integrazione LLM reale resta da completare
- roadmap aggiornata a 94% (168 task completati su 178)

### 2026-06-04 - Autenticazione reale e RBAC staff

- aggiunti endpoint OpenAPI `POST /auth/login`, `POST /auth/logout`, `GET /auth/me` e `POST /auth/bootstrap-admin`
- rigenerati client React Query e schemi Zod da OpenAPI
- aggiunto campo DB `utenti.password_hash` per credenziali staff con hash `scrypt`
- implementato backend auth provider-neutral con token sessione HMAC firmato, durata standard 12 ore e opzione `remember` 7 giorni
- aggiunto endpoint bootstrap admin per creare o proteggere il primo account amministratore
- protette le route API core con `requireAuth`; automazioni e B2B richiedono almeno `manager`, audit log e gestione ruoli richiedono `admin`
- aggiornata gestione utenti: creazione/reset password, sanitizzazione output senza mai restituire `password_hash`, blocco account disattivati
- aggiunta pagina frontend reale `/login`, salvataggio sessione, route protette e controllo RBAC frontend
- aggiornata sidebar con utente corrente, filtro voci per ruolo e logout reale
- aggiornato SSE inbox per passare token in query string, necessario per `EventSource`
- aggiunto test backend `auth.test.ts` e aggiornato smoke test frontend critico su login/protected route
- aggiornato `ENVIRONMENT.md` con `ZAK_AUTH_SECRET`, `ZAK_BOOTSTRAP_ADMIN_TOKEN` e fallback `SESSION_SECRET`
- `corepack pnpm --filter @workspace/api-spec run codegen`, `corepack pnpm --filter @workspace/api-server run test:backend`, `corepack pnpm run test:frontend-critical`, `corepack pnpm run typecheck` e `corepack pnpm run build` completati con esito positivo
- nota operativa: applicare la modifica DB reale con `corepack pnpm --filter @workspace/db run push` quando `DATABASE_URL` sara configurato
- roadmap aggiornata a 96% (171 task completati su 178)

### 2026-06-08 - Riallineamento codegen e verifica build finale

- eseguito `corepack pnpm --filter @workspace/api-spec run codegen` dopo sistemazione ambiente pnpm
- rigenerati client React Query e schemi/tipi Zod da `lib/api-spec/openapi.yaml`
- eseguiti test automatici backend completi:
  - auth
  - Booking Assistant parser
  - LLM Booking extractor
  - Voice Assistant parser
  - Voice provider parser
  - WhatsApp webhook parser
- eseguito smoke test frontend critico `corepack pnpm run test:frontend-critical`
- eseguiti `corepack pnpm run typecheck` e `npm run build` con esito positivo
- aggiornata la subroadmap: restano aperti solo credenziali provider, policy operative, deploy hosting e smoke test manuali in ambiente reale

### 2026-06-08 - Database Neon reale e bootstrap admin

- configurato `DATABASE_URL` locale verso Neon PostgreSQL
- eseguito `corepack pnpm --filter @workspace/db run push` con esito positivo
- verificata creazione schema reale: 17 tabelle totali, incluse `utenti`, `contatti_crm`, `preventivi_eventi`, `agenda_personale`, `messaggi`, `automazioni_log`, `automazioni_config` e `google_calendar_sync_state`
- generati `ZAK_AUTH_SECRET` e `ZAK_BOOTSTRAP_ADMIN_TOKEN` locali nel file `.env` ignorato da git
- creato primo admin via `POST /api/auth/bootstrap-admin`
- verificati `POST /api/auth/login`, `GET /api/auth/me` e `GET /api/production/readiness` con sessione admin
- aggiunto `.env.example` e aggiornato `.gitignore` per ridurre il rischio di commit accidentale dei segreti
- aggiunta documentazione `META_APP_SECRET` tra le variabili Meta WhatsApp richieste per verifica webhook/firme in produzione

### 2026-06-08 - Predisposizione deploy Render one-service

- aggiornato backend Express per servire il frontend React buildato da `artifacts/zak-app/dist/public` quando `NODE_ENV=production`
- mantenute le route API sotto `/api`, con fallback SPA solo per richieste `GET` non API
- aggiunto `render.yaml` con piano free, build workspace completa e start command backend
- verificati `corepack pnpm run typecheck` e `npm run build` con esito positivo dopo la modifica
- nota operativa: il runtime production end-to-end va verificato direttamente su Render dopo configurazione variabili ambiente; l'avvio locale production fuori sandbox e stato bloccato dal sistema di approval per crediti

### 2026-06-06 - Completamento codice core integrazioni finali

- implementato LLM Booking Assistant reale provider-ready: adapter OpenAI Responses API, output JSON strutturato, timeout, validazione difensiva e fallback rule-based automatico
- il Booking Assistant ora puo compilare anche budget/preferenze e rilevare handoff da output LLM, mantenendo stato conversazionale persistente e template esistenti
- aggiunta integrazione Google Calendar reale provider-ready:
  - disponibilita con FreeBusy quando configurata
  - sync agenda ZAK -> Google
  - sync preventivi confermati ZAK -> Google
  - sync Google -> ZAK con `syncToken`
  - webhook Google Calendar per notifiche push
  - stato integrazione e sync manuale da API manager
- aggiunti campi Google su `agenda_personale` e `preventivi_eventi`
- aggiunta tabella `google_calendar_sync_state`
- esteso webhook voice assistant per payload reali Vapi/Bland, secret provider, creazione contatto se mancante, aggiornamento preventivo opzionato e salvataggio timeline voice
- aggiunto endpoint admin `GET /api/production/readiness` per controllare configurazione go-live
- aggiunti test unitari puri per normalizzazione LLM e payload provider voice
- aggiornati `ENVIRONMENT.md`, `ROADMAP.md` e creata `docs/SUBROADMAP_INTERVENTO_DIRETTO.md`
- note operative:
  - serve `corepack pnpm --filter @workspace/db run push` quando `DATABASE_URL` e configurato, per applicare colonne/tabelle Google
  - il blocco temporaneo su codegen/test/build e stato risolto nella sessione Codex del 2026-06-08

### 2026-06-09 - Allineamento GitHub, Supporto AI Gratuita e Seeder Dati Demo

- **Allineamento GitHub**: Committati tutti i file core/auth/B2B precedentemente non tracciati e allineato il branch `main` con il push remoto su GitHub.
- **Supporto AI Gratuita**: Estesa la logica del Booking Assistant in `llm-booking-extractor.ts` per supportare gli endpoint `/chat/completions` standard. Questo rende l'applicazione compatibile con i provider AI gratuiti (come Google Gemini via AI Studio, OpenRouter o Groq).
- **Seeder di Test Completo**: Aggiunto lo script `seed-demo.ts` in `@workspace/api-server` che popola il database Neon reale con tutti i dataset demo (`utenti-staff`, `contatti_crm`, `messaggi` per inbox, `preventivi_eventi`, `agenda_personale` e `task_personali`).
- **Comandi globali**: Aggiunto il comando `"seed:demo"` nel root `package.json` e nel package `scripts`, con esecuzione riuscita e inserimento di 15 staff, 20 contatti, 40 messaggi, 20 preventivi, 20 eventi agenda e 20 task board items.
- **Ottimizzazione performance CRM**: Aggiunti indici Drizzle per Inbox, messaggi, contatti, preventivi, agenda, audit log e log automazioni; introdotti `limit`/`offset` sulle liste principali; aggiornata Inbox con caricamento incrementale di conversazioni e messaggi; aggiunta cache breve da 30 secondi sulle metriche Dashboard.
- **Pulizia app produzione**: Rimossi dalla navigazione e dal router principale i prototipi `/login-mock`, `/access-denied-mock`, `/security-audit-mock`, `/realtime-inbox-mock`, `/llm-booking-review-mock`, `/preventivo-pricing-builder-mock`, `/preventivo-signature-mock`, `/google-calendar-settings-mock`, `/admin-roles` e la preview PDF simulata; la sidebar ora espone solo moduli operativi collegati al backend reale.
- **B2B produzione reale**: Sostituita la pagina B2B ibrida/demo con una console operativa collegata alle API reali per competitor, materiali, template, analisi strutturata ed export pitch; ripristinata la voce B2B nella sidebar produzione per i ruoli manager/admin.
- **Rimozione sorgenti mock**: Eliminati da `artifacts/zak-app/src/pages` i file TSX dei prototipi non piu` raggiungibili dal router produzione, mantenendo il mockup sandbox separato come area dedicata alle sperimentazioni.
- **Polish UX produzione**: Riallineata la pagina 404 allo stile e alla lingua italiana dell'app, con rientro diretto alla dashboard.

### 2026-06-15 - Centro Go-live e chiusura configurazioni provider-ready

- **Centro Go-live admin**: Aggiunta la pagina `/go-live`, protetta admin e raggiungibile dalla sidebar, con stato readiness backend, elenco variabili mancanti, endpoint provider e sync Google Calendar manuale.
- **Readiness arricchita**: Esteso `GET /api/production/readiness` con `required_env`, `configured_env`, `optional_env` e `action`, cosi` la UI puo indicare esattamente quali chiavi inserire senza logica duplicata.
- **Contratto OpenAPI riallineato**: Aggiornato `ProductionReadinessCheck` e rigenerati client React Query/Zod.
- **Env provider-ready**: Aggiornato `.env.example` con `OPENAI_BASE_URL` e `META_WEBHOOK_VERIFY_TOKEN`; documentata la configurazione Meta per challenge webhook.
- **Fallback SPA produzione**: Reso esplicito il fallback Express su `index.html` per tutte le route `GET` non API, cosi` pagine come `/login` e `/go-live` funzionano anche da URL diretto su Render.
- **Runbook operativo in app**: Estesa `/go-live` con sequenza guidata per sicurezza staff, LLM, Meta WhatsApp, Google Calendar, Voice assistant e smoke finale, inclusi env richiesti e test di accettazione.
- **Import Apple Numbers in Agenda**: Aggiunti endpoint e pagina `/agenda/importa-numbers` per importare il planning mensile esportato da Numbers in CSV, con preview `dry_run`, deduplica, mapping slot `P`/`C` e creazione massiva di eventi agenda.
