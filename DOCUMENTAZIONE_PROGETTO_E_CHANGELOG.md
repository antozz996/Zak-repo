# Zak Ecosystem AI

Documento operativo unico per:

- spiegare l'intero progetto;
- descrivere lo stato reale del codice;
- tracciare i changelog delle modifiche gia` presenti nel repository;
- registrare tutte le prossime modifiche e aggiunte.

Ultimo aggiornamento: 2026-05-28

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
- grafico pipeline lead
- grafico eventi per mese
- attivita` recente

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
- salvataggio della risposta dell'assistente direttamente nella inbox come messaggio outbound

Nota tecnica:

- in questa fase l'assistente e` implementato con parsing e logica conversazionale backend;
- la futura integrazione con un vero LLM potra` sostituire o estendere questa logica mantenendo invariato il flusso dati.

### 5.3 CRM contatti

Disponibile nel backend:

- lista contatti con filtri
- creazione contatto
- dettaglio contatto
- modifica contatto
- eliminazione contatto
- lettura messaggi del contatto

Disponibile nel frontend:

- pagina lista contatti
- pagina creazione nuovo contatto

Endpoint:

- `GET /api/contatti`
- `POST /api/contatti`
- `GET /api/contatti/:id`
- `PATCH /api/contatti/:id`
- `DELETE /api/contatti/:id`
- `GET /api/contatti/:id/messaggi`

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

Disponibile nel frontend:

- pagina agenda

Endpoint:

- `GET /api/agenda`
- `POST /api/agenda`
- `GET /api/agenda/:id`
- `PATCH /api/agenda/:id`
- `DELETE /api/agenda/:id`

### 5.6 Gestione staff

Disponibile nel backend:

- CRUD utenti/staff

Disponibile nel frontend:

- pagina impostazioni staff

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

Disponibile nel frontend:

- pagina automazioni
- esecuzione manuale re-engagement
- esecuzione manuale ricorrenze
- modifica parametri configurazione
- visualizzazione log

Endpoint:

- `GET /api/automazioni/log`
- `GET /api/automazioni/config`
- `PATCH /api/automazioni/config/:chiave`
- `POST /api/automazioni/trigger`

Job schedulati:

- `09:00`: re-engagement lead persi
- `10:00`: ricorrenze annuali

## 6. Webhook e integrazioni esterne

### Implementato

- `POST /api/webhook/whatsapp`
  - riceve payload
  - crea il contatto se non esiste
  - salva il messaggio inbound
  - aggiorna `ultimo_contatto`
  - attiva il booking assistant se la chat non e` assegnata

- invio WhatsApp outbound via Meta Cloud API
  - usato dai messaggi manuali dello staff su canale WhatsApp
  - usato dalle risposte automatiche di Zak AI
  - salva sempre il messaggio in inbox anche se Meta non e` configurato o fallisce

- `POST /api/webhook/voice-assistant`
  - riceve trascrizione chiamata
  - crea un item in agenda

### Non ancora completato o non evidenziato nel codice

- gestione avanzata errori/consegne Meta Cloud API
- integrazione reale con Google Calendar
- integrazione reale con Vapi/Bland AI
- logica LLM per qualificazione lead automatica
- multi-operatore realtime tramite WebSocket

## 7. Database attuale

Tabelle attualmente presenti in `lib/db/src/schema/`:

### `utenti`

- `id`
- `nome`
- `ruolo`
- `email`
- `data_creazione`

### `contatti_crm`

- `id`
- `nome`
- `telefono`
- `instagram_username`
- `origine_lead`
- `tipo_evento`
- `stato_lead`
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

### `agenda_personale`

- `id`
- `titolo`
- `descrizione`
- `data_ora_inizio`
- `data_ora_fine`
- `categoria`
- `promemoria_inviato`

### `messaggi`

- `id`
- `contatto_id`
- `canale`
- `direzione`
- `testo`
- `timestamp`
- `letto`
- `mittente_nome`

### `automazioni_log`

- storico esecuzioni automazioni

### `automazioni_config`

- parametri runtime delle automazioni

## 8. Frontend attuale

Rotte principali in `artifacts/zak-app/src/App.tsx`:

- `/dashboard`
- `/inbox`
- `/contatti`
- `/contatti/nuovo`
- `/preventivi`
- `/agenda`
- `/impostazioni`
- `/automazioni`

Pattern frontend usati:

- fetch dati via hook React Query generati
- layout laterale comune
- componenti UI condivisi in `src/components/ui`
- testo UI in italiano

## 9. Backend attuale

Router registrati:

- `health`
- `utenti`
- `contatti`
- `preventivi`
- `agenda`
- `messaggi`
- `dashboard`
- `webhooks`
- `automazioni`

Note tecniche:

- il server richiede `PORT`
- il DB richiede `DATABASE_URL`
- i cron partono all'avvio del server
- il path base delle API e` `/api`

## 10. Allineamento tra PRD e codice reale

### Gia` implementato o ben avviato

- dashboard CRM
- inbox centralizzata lato UI/backend
- CRUD contatti
- CRUD preventivi
- CRUD agenda personale
- gestione staff
- disponibilita` data evento con endpoint dedicato
- webhook base WhatsApp
- webhook base voice assistant
- booking assistant backend per qualifica lead via WhatsApp
- automazioni di re-engagement e ricorrenza

### Parzialmente implementato

- omnicanalita` reale live
- assegnazione chat operatore
- AI conversazionale implementata in forma rule-based, senza orchestrazione LLM completa
- controllo disponibilita` calendario interno, non Google Calendar

### Ancora da sviluppare

- WebSocket / realtime multi-postazione
- agent AI conversazionale H24 completo
- estrazione strutturata lead da LLM
- sincronizzazione Google Calendar
- invio reale messaggi WhatsApp/Instagram/Facebook
- integrazione VoIP/voice bot completa
- modulo B2B e competitor analysis
- notifiche push o messaggistica interna per promemoria

## 11. Comandi utili

- `corepack pnpm run typecheck`
- `corepack pnpm run build`
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

Se queste variabili non sono presenti, l'app continua a salvare i messaggi outbound in inbox ma salta l'invio reale verso Meta.

## 12. Regole per mantenere questo file aggiornato

Da questo momento, ogni modifica dovrebbe aggiungere o aggiornare:

1. la sezione tecnica interessata, se cambia il comportamento del progetto;
2. la sezione changelog qui sotto;
3. eventuali gap tra PRD e implementazione reale.

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
