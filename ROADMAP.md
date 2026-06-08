# Roadmap Zak Ecosystem AI

Roadmap operativa con checkbox, difficolta stimata e avanzamento generale. Ogni voce completata deve essere spuntata nello stesso commit della modifica o nel commit di verifica immediatamente successivo.

Ultimo aggiornamento: 2026-06-08

Completamento generale: 100% codice core (178/178 task implementati)

Legenda difficolta:

- 1/5: modifica semplice o gia consolidata
- 2/5: feature piccola con basso rischio
- 3/5: feature media con piu moduli coinvolti
- 4/5: integrazione complessa o flusso critico
- 5/5: area strategica ad alto rischio tecnico/prodotto

## Stato Attuale

- [x] Monorepo TypeScript con pnpm workspace - Difficolta: 2/5
- [x] Backend Express con routing modulare - Difficolta: 2/5
- [x] Database PostgreSQL modellato con Drizzle ORM - Difficolta: 3/5
- [x] Contratti API OpenAPI-first - Difficolta: 3/5
- [x] Codegen Orval per React Query client e Zod schemas - Difficolta: 3/5
- [x] Frontend React/Vite con layout CRM - Difficolta: 3/5
- [x] Documento operativo e changelog unificato - Difficolta: 1/5
- [x] Workflow `corepack pnpm` verificato con typecheck/build - Difficolta: 3/5

## Dashboard

- [x] KPI principali CRM - Difficolta: 2/5
- [x] Pipeline lead - Difficolta: 2/5
- [x] Eventi confermati per mese - Difficolta: 2/5
- [x] Feed attivita recente - Difficolta: 2/5
- [x] Filtri temporali dashboard - Difficolta: 2/5
- [x] Export report base - Difficolta: 3/5
- [x] Metriche conversione lead/preventivo/confermato - Difficolta: 3/5

## Inbox Omnicanale

- [x] Inbox unificata per conversazioni - Difficolta: 3/5
- [x] Lettura messaggi per contatto e canale - Difficolta: 2/5
- [x] Invio messaggi outbound da UI - Difficolta: 3/5
- [x] Assegnazione conversazione a operatore - Difficolta: 3/5
- [x] Rilascio conversazione per riattivare Zak AI - Difficolta: 2/5
- [x] Scheda lead contestuale in inbox - Difficolta: 2/5
- [x] Realtime multi-operatore con WebSocket o SSE - Difficolta: 4/5
- [x] Stato lettura/scrittura operatore - Difficolta: 3/5
- [x] Presenza operatori online/offline - Difficolta: 4/5
- [x] Marcatura messaggi come letti - Difficolta: 2/5
- [x] Filtri inbox per canale, stato lead e operatore - Difficolta: 2/5

## Booking Assistant AI

- [x] Attivazione su webhook WhatsApp inbound - Difficolta: 3/5
- [x] Blocco automatico quando la chat e assegnata a operatore umano - Difficolta: 2/5
- [x] Estrazione rule-based di nome, tipo evento, data e invitati - Difficolta: 3/5
- [x] Creazione/aggiornamento contatto CRM - Difficolta: 3/5
- [x] Creazione/aggiornamento preventivo aperto - Difficolta: 3/5
- [x] Controllo disponibilita interno - Difficolta: 3/5
- [x] Proposta date alternative - Difficolta: 2/5
- [x] Salvataggio risposte Zak AI in inbox - Difficolta: 2/5
- [x] Qualificazione LLM con output JSON strutturato - Difficolta: 4/5
- [x] Stato conversazionale persistente per step mancanti - Difficolta: 4/5
- [x] Handoff esplicito AI -> operatore - Difficolta: 3/5
- [x] Template risposta configurabili da pannello - Difficolta: 3/5
- [x] Test automatici su parsing e casi conversazionali - Difficolta: 3/5

## WhatsApp / Meta Cloud API

- [x] Ricezione webhook WhatsApp inbound - Difficolta: 3/5
- [x] Invio outbound testuale tramite Meta Cloud API - Difficolta: 4/5
- [x] Fallback se credenziali Meta non configurate - Difficolta: 2/5
- [x] Verifica firma webhook Meta - Difficolta: 4/5
- [x] Gestione challenge webhook Meta - Difficolta: 3/5
- [x] Tracciamento errori invio su DB - Difficolta: 3/5
- [x] Stato consegna messaggi - Difficolta: 4/5
- [x] Supporto media inbound - Difficolta: 4/5
- [x] Supporto template WhatsApp approvati - Difficolta: 4/5
- [x] Gestione finestra conversazionale 24 ore - Difficolta: 4/5

## CRM Contatti

- [x] CRUD contatti - Difficolta: 2/5
- [x] Filtri per stato, tipo evento, origine lead e ricerca - Difficolta: 2/5
- [x] Operatore assegnato al contatto - Difficolta: 2/5
- [x] Messaggi associati al contatto - Difficolta: 2/5
- [x] Timeline completa contatto - Difficolta: 3/5
- [x] Storico cambi stato lead - Difficolta: 3/5
- [x] Note interne staff - Difficolta: 2/5
- [x] Deduplicazione avanzata telefono/social - Difficolta: 3/5
- [x] Import CSV contatti - Difficolta: 3/5

## Preventivi Eventi

- [x] CRUD preventivi - Difficolta: 2/5
- [x] Budget stimato - Difficolta: 1/5
- [x] Numero invitati - Difficolta: 1/5
- [x] Stato evento opzionato/confermato/rifiutato - Difficolta: 2/5
- [x] Collegamento con contatto CRM - Difficolta: 2/5
- [x] Preview frontend PDF preventivo con dati demo - Difficolta: 2/5
- [x] Generazione PDF preventivo - Difficolta: 4/5
- [x] Invio preventivo via WhatsApp/email - Difficolta: 4/5
- [x] Versionamento preventivi - Difficolta: 3/5
- [x] Calcolo pacchetti/prezzi - Difficolta: 4/5
- [x] Firma o conferma digitale - Difficolta: 4/5

## Agenda e Calendario

- [x] CRUD agenda personale - Difficolta: 2/5
- [x] Endpoint disponibilita interno - Difficolta: 3/5
- [x] Webhook voice assistant crea item agenda - Difficolta: 3/5
- [x] Integrazione Google Calendar reale - Difficolta: 5/5
- [x] Sincronizzazione bidirezionale eventi - Difficolta: 5/5
- [x] Gestione slot e fasce orarie - Difficolta: 4/5
- [x] Blocco date non disponibili - Difficolta: 3/5
- [x] Promemoria automatici - Difficolta: 3/5
- [x] Validazione intervalli data/ora agenda - Difficolta: 2/5
- [x] Reset promemoria su rischedulazione evento - Difficolta: 2/5
- [x] Dettaglio agenda con contatto CRM collegato - Difficolta: 1/5

## Automazioni CRM

- [x] Re-engagement lead persi - Difficolta: 3/5
- [x] Ricorrenze annuali - Difficolta: 3/5
- [x] Configurazione runtime automazioni - Difficolta: 3/5
- [x] Log esecuzioni - Difficolta: 2/5
- [x] Trigger manuale da UI - Difficolta: 2/5
- [x] Invio reale automazioni via WhatsApp Meta - Difficolta: 3/5
- [x] Toggle attivo/disattivo realmente applicato dai job - Difficolta: 2/5
- [x] Segmentazione automazioni per tipo evento - Difficolta: 3/5
- [x] Dashboard performance automazioni - Difficolta: 3/5
- [x] Defaults completi configurazione automazioni - Difficolta: 1/5
- [x] Validazione sicura configurazioni automazioni - Difficolta: 2/5

## Voice Assistant

- [x] Webhook trascrizione chiamata - Difficolta: 3/5
- [x] Creazione evento agenda da chiamata - Difficolta: 2/5
- [x] Integrazione Vapi/Bland AI reale - Difficolta: 5/5
- [x] Parsing intento chiamata - Difficolta: 4/5
- [x] Creazione task separati da eventi agenda - Difficolta: 3/5
- [x] Associazione telefonata a contatto CRM esistente - Difficolta: 3/5
- [x] Registrazione trascrizione storica nel contatto - Difficolta: 3/5

## B2B e Competitor

- [x] Sezione B2B dedicata - Difficolta: 3/5
- [x] Archivio competitor - Difficolta: 3/5
- [x] Upload materiali competitor - Difficolta: 4/5
- [x] Prompt AI per analisi competitor - Difficolta: 4/5
- [x] Template co-branding scuole/aziende - Difficolta: 4/5
- [x] Generazione PDF/presentazioni - Difficolta: 4/5

## Sicurezza e Produzione

- [x] Configurazione dipendenze con minimum release age - Difficolta: 2/5
- [x] Redazione log sensibili base - Difficolta: 2/5
- [x] Autenticazione utenti - Difficolta: 4/5
- [x] Ruoli e permessi reali admin/manager/staff - Difficolta: 4/5
- [x] Stato account staff attivo/disattivato reale - Difficolta: 2/5
- [x] Validazione enum ruoli/stato staff - Difficolta: 2/5
- [x] Mock frontend ruoli e permessi - Difficolta: 2/5
- [x] Stati demo e ricerca pagina ruoli - Difficolta: 2/5
- [x] Rate limiting webhook/API - Difficolta: 3/5
- [x] Validazione firme webhook esterni - Difficolta: 4/5
- [x] Audit log azioni staff - Difficolta: 3/5
- [x] Gestione segreti documentata - Difficolta: 2/5

## Qualita e Dev Workflow

- [x] Typecheck completo passato - Difficolta: 1/5
- [x] Build completa passata - Difficolta: 2/5
- [x] Codegen OpenAPI verificato - Difficolta: 2/5
- [x] Script preinstall cross-platform - Difficolta: 2/5
- [x] Test unitari backend - Difficolta: 3/5
- [x] Test frontend componenti critici - Difficolta: 3/5
- [x] Test integrazione webhook WhatsApp - Difficolta: 4/5
- [x] CI automatica - Difficolta: 3/5
- [x] Lint/format command standardizzato - Difficolta: 2/5
- [x] Guardia anti-overlap job cron - Difficolta: 2/5
- [x] QA test plan RBAC - Difficolta: 1/5
- [x] Manuale staff ruoli e permessi - Difficolta: 1/5
- [x] Dataset demo utenti staff - Difficolta: 1/5
- [x] Overview commerciale sicurezza e governance - Difficolta: 1/5

## Mock, Documentazione e Specifiche Non-Core

- [x] Login mock staff - Difficolta: 2/5
- [x] Access denied mock - Difficolta: 1/5
- [x] Security audit mock - Difficolta: 2/5
- [x] Dashboard mobile polish sandbox - Difficolta: 2/5
- [x] Inbox operator presence sandbox - Difficolta: 2/5
- [x] Guida UX RBAC completa - Difficolta: 1/5
- [x] Security QA expansion - Difficolta: 1/5
- [x] Playbook go-live staff - Difficolta: 1/5
- [x] Incident response guide - Difficolta: 1/5
- [x] Data retention policy draft - Difficolta: 1/5
- [x] Demo dataset audit log - Difficolta: 1/5
- [x] Demo dataset automazioni log - Difficolta: 1/5
- [x] Pitch commerciale venue - Difficolta: 1/5
- [x] One-pager partner scuole/aziende - Difficolta: 1/5
- [x] Checklist review UI mock - Difficolta: 1/5
- [x] Archivio competitor frontend demo avanzato - Difficolta: 2/5
- [x] Upload materiali competitor mock - Difficolta: 2/5
- [x] Prompt library competitor AI - Difficolta: 1/5
- [x] Template co-branding documentati - Difficolta: 1/5
- [x] Specifica export B2B PDF/presentazioni - Difficolta: 1/5
- [x] Piano test unitari backend - Difficolta: 1/5
- [x] Piano test componenti frontend - Difficolta: 1/5
- [x] Piano test integrazione webhook WhatsApp - Difficolta: 1/5
- [x] Payload demo webhook WhatsApp - Difficolta: 1/5
- [x] Specifica UX realtime inbox - Difficolta: 1/5
- [x] Specifica UX LLM booking assistant - Difficolta: 1/5
- [x] Specifica preventivo PDF reale - Difficolta: 1/5
- [x] Specifiche Google Calendar e Voice Assistant provider - Difficolta: 1/5
- [x] Realtime inbox UI mock - Difficolta: 2/5
- [x] LLM booking assistant review mock - Difficolta: 2/5
- [x] Preventivo pricing builder mock - Difficolta: 2/5
- [x] Preventivo signature mock - Difficolta: 2/5
- [x] Google Calendar settings mock - Difficolta: 2/5
- [x] Fixture test booking assistant - Difficolta: 1/5
- [x] Fixture test voice assistant - Difficolta: 1/5
- [x] Fixture test automazioni - Difficolta: 1/5
- [x] Frontend manual test matrix - Difficolta: 1/5
- [x] Pre-merge regression checklist - Difficolta: 1/5
- [x] Empty state uniformi frontend - Difficolta: 2/5
- [x] Loading state uniformi frontend - Difficolta: 2/5
- [x] Error state uniformi frontend - Difficolta: 2/5
- [x] Sidebar responsive review - Difficolta: 2/5
- [x] Copy UX ASCII cleanup - Difficolta: 1/5

## Prossime Priorita Consigliate

- [x] Google Calendar reale per disponibilita eventi - Difficolta: 5/5
- [x] Verifica firma e challenge webhook Meta - Difficolta: 4/5
- [x] Realtime inbox multi-operatore - Difficolta: 4/5
- [x] LLM booking assistant con stato conversazionale persistente - Difficolta: 5/5
- [x] Autenticazione e ruoli staff - Difficolta: 4/5

## Subroadmap Intervento Diretto / Dati Esterni

Queste voci non sono blocchi di codice core: richiedono credenziali reali, scelte operative o comandi da eseguire in un ambiente con accesso ai servizi.

- [x] Eseguire `corepack pnpm --filter @workspace/api-spec run codegen` e riallineare client/schemi generati - Completato da Codex il 2026-06-08
- [x] Eseguire `corepack pnpm --filter @workspace/db run push` con `DATABASE_URL` reale Neon e verificare schema PostgreSQL - Completato da Codex il 2026-06-08
- [x] Configurare segreti auth locali e creare primo admin con `POST /api/auth/bootstrap-admin` - Completato da Codex il 2026-06-08
- [x] Predisporre deploy Render one-service con backend Express che serve anche frontend statico - Completato da Codex il 2026-06-08
- [ ] Configurare `OPENAI_API_KEY`, `ZAK_LLM_BOOKING_ENABLED=true` e confermare modello runtime LLM (`gpt-5.4-nano` default, eventuale upgrade a `gpt-5.5`) - Responsabile: owner prodotto/tecnico
- [ ] Creare OAuth client Google Cloud, ottenere `GOOGLE_REFRESH_TOKEN`, scegliere `GOOGLE_CALENDAR_ID` e registrare eventuale watch webhook su `/api/webhook/google-calendar` - Responsabile: owner Google Workspace
- [ ] Decidere policy cancellazioni Google: mantenere default non distruttivo oppure impostare `ZAK_GOOGLE_DELETE_CANCELLED=true` - Responsabile: owner operativo
- [ ] Configurare Vapi e/o Bland con endpoint `/api/webhook/voice-assistant` e secret provider (`VAPI_WEBHOOK_SECRET` / `BLAND_WEBHOOK_SECRET`) - Responsabile: owner telefonia/AI voice
- [x] Eseguire verifica tecnica automatica: `test:backend`, `test:frontend-critical`, `typecheck`, `build` - Completato da Codex il 2026-06-08
- [ ] Eseguire smoke test manuali su WhatsApp, Google, voice e auth admin in ambiente reale - Responsabile: owner tecnico/operativo
- [ ] Creare servizio Render e configurare variabili ambiente produzione - Responsabile: owner hosting guidato da Codex
- [ ] Validare dominio produzione, secret manager, backup PostgreSQL, privacy/data retention e monitoraggio prime 48 ore - Responsabile: owner go-live
