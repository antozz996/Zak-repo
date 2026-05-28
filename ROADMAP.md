# Roadmap Zak Ecosystem AI

Roadmap operativa con checkbox. Ogni voce completata deve essere spuntata nello stesso commit della modifica o nel commit di verifica immediatamente successivo.

Ultimo aggiornamento: 2026-05-29

## Stato Attuale

- [x] Monorepo TypeScript con pnpm workspace
- [x] Backend Express con routing modulare
- [x] Database PostgreSQL modellato con Drizzle ORM
- [x] Contratti API OpenAPI-first
- [x] Codegen Orval per React Query client e Zod schemas
- [x] Frontend React/Vite con layout CRM
- [x] Documento operativo e changelog unificato
- [x] Workflow `corepack pnpm` verificato con typecheck/build

## Dashboard

- [x] KPI principali CRM
- [x] Pipeline lead
- [x] Eventi confermati per mese
- [x] Feed attivita recente
- [ ] Filtri temporali dashboard
- [ ] Export report base
- [ ] Metriche conversione lead/preventivo/confermato

## Inbox Omnicanale

- [x] Inbox unificata per conversazioni
- [x] Lettura messaggi per contatto e canale
- [x] Invio messaggi outbound da UI
- [x] Assegnazione conversazione a operatore
- [x] Rilascio conversazione per riattivare Zak AI
- [x] Scheda lead contestuale in inbox
- [ ] Realtime multi-operatore con WebSocket o SSE
- [ ] Stato lettura/scrittura operatore
- [ ] Presenza operatori online/offline
- [ ] Marcatura messaggi come letti
- [ ] Filtri inbox per canale, stato lead e operatore

## Booking Assistant AI

- [x] Attivazione su webhook WhatsApp inbound
- [x] Blocco automatico quando la chat e assegnata a operatore umano
- [x] Estrazione rule-based di nome, tipo evento, data e invitati
- [x] Creazione/aggiornamento contatto CRM
- [x] Creazione/aggiornamento preventivo aperto
- [x] Controllo disponibilita interno
- [x] Proposta date alternative
- [x] Salvataggio risposte Zak AI in inbox
- [ ] Qualificazione LLM con output JSON strutturato
- [ ] Stato conversazionale persistente per step mancanti
- [ ] Handoff esplicito AI -> operatore
- [ ] Template risposta configurabili da pannello
- [ ] Test automatici su parsing e casi conversazionali

## WhatsApp / Meta Cloud API

- [x] Ricezione webhook WhatsApp inbound
- [x] Invio outbound testuale tramite Meta Cloud API
- [x] Fallback se credenziali Meta non configurate
- [ ] Verifica firma webhook Meta
- [ ] Gestione challenge webhook Meta
- [ ] Tracciamento errori invio su DB
- [ ] Stato consegna messaggi
- [ ] Supporto media inbound
- [ ] Supporto template WhatsApp approvati
- [ ] Gestione finestra conversazionale 24 ore

## CRM Contatti

- [x] CRUD contatti
- [x] Filtri per stato, tipo evento, origine lead e ricerca
- [x] Operatore assegnato al contatto
- [x] Messaggi associati al contatto
- [ ] Timeline completa contatto
- [ ] Storico cambi stato lead
- [ ] Note interne staff
- [ ] Deduplicazione avanzata telefono/social
- [ ] Import CSV contatti

## Preventivi Eventi

- [x] CRUD preventivi
- [x] Budget stimato
- [x] Numero invitati
- [x] Stato evento opzionato/confermato/rifiutato
- [x] Collegamento con contatto CRM
- [ ] Generazione PDF preventivo
- [ ] Invio preventivo via WhatsApp/email
- [ ] Versionamento preventivi
- [ ] Calcolo pacchetti/prezzi
- [ ] Firma o conferma digitale

## Agenda e Calendario

- [x] CRUD agenda personale
- [x] Endpoint disponibilita interno
- [x] Webhook voice assistant crea item agenda
- [ ] Integrazione Google Calendar reale
- [ ] Sincronizzazione bidirezionale eventi
- [ ] Gestione slot e fasce orarie
- [ ] Blocco date non disponibili
- [ ] Promemoria automatici

## Automazioni CRM

- [x] Re-engagement lead persi
- [x] Ricorrenze annuali
- [x] Configurazione runtime automazioni
- [x] Log esecuzioni
- [x] Trigger manuale da UI
- [ ] Invio reale automazioni via WhatsApp Meta
- [ ] Toggle attivo/disattivo realmente applicato dai job
- [ ] Segmentazione automazioni per tipo evento
- [ ] Dashboard performance automazioni

## Voice Assistant

- [x] Webhook trascrizione chiamata
- [x] Creazione evento agenda da chiamata
- [ ] Integrazione Vapi/Bland AI reale
- [ ] Parsing intento chiamata
- [ ] Creazione task separati da eventi agenda
- [ ] Associazione telefonata a contatto CRM esistente
- [ ] Registrazione trascrizione storica nel contatto

## B2B e Competitor

- [ ] Sezione B2B dedicata
- [ ] Archivio competitor
- [ ] Upload materiali competitor
- [ ] Prompt AI per analisi competitor
- [ ] Template co-branding scuole/aziende
- [ ] Generazione PDF/presentazioni

## Sicurezza e Produzione

- [x] Configurazione dipendenze con minimum release age
- [x] Redazione log sensibili base
- [ ] Autenticazione utenti
- [ ] Ruoli e permessi reali admin/manager/staff
- [ ] Rate limiting webhook/API
- [ ] Validazione firme webhook esterni
- [ ] Audit log azioni staff
- [ ] Gestione segreti documentata

## Qualita e Dev Workflow

- [x] Typecheck completo passato
- [x] Build completa passata
- [x] Codegen OpenAPI verificato
- [x] Script preinstall cross-platform
- [ ] Test unitari backend
- [ ] Test frontend componenti critici
- [ ] Test integrazione webhook WhatsApp
- [ ] CI automatica
- [ ] Lint/format command standardizzato

## Prossime Priorita Consigliate

- [ ] Google Calendar reale per disponibilita eventi
- [ ] Verifica firma e challenge webhook Meta
- [ ] Realtime inbox multi-operatore
- [ ] LLM booking assistant con stato conversazionale persistente
- [ ] Autenticazione e ruoli staff
