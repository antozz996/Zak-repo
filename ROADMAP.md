# Roadmap Zak Ecosystem AI

Roadmap operativa con checkbox, difficolta stimata e avanzamento generale. Ogni voce completata deve essere spuntata nello stesso commit della modifica o nel commit di verifica immediatamente successivo.

Ultimo aggiornamento: 2026-05-29

Completamento generale: 45% (54/120 task completati)

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
- [ ] Filtri temporali dashboard - Difficolta: 2/5
- [ ] Export report base - Difficolta: 3/5
- [ ] Metriche conversione lead/preventivo/confermato - Difficolta: 3/5

## Inbox Omnicanale

- [x] Inbox unificata per conversazioni - Difficolta: 3/5
- [x] Lettura messaggi per contatto e canale - Difficolta: 2/5
- [x] Invio messaggi outbound da UI - Difficolta: 3/5
- [x] Assegnazione conversazione a operatore - Difficolta: 3/5
- [x] Rilascio conversazione per riattivare Zak AI - Difficolta: 2/5
- [x] Scheda lead contestuale in inbox - Difficolta: 2/5
- [ ] Realtime multi-operatore con WebSocket o SSE - Difficolta: 4/5
- [ ] Stato lettura/scrittura operatore - Difficolta: 3/5
- [ ] Presenza operatori online/offline - Difficolta: 4/5
- [ ] Marcatura messaggi come letti - Difficolta: 2/5
- [ ] Filtri inbox per canale, stato lead e operatore - Difficolta: 2/5

## Booking Assistant AI

- [x] Attivazione su webhook WhatsApp inbound - Difficolta: 3/5
- [x] Blocco automatico quando la chat e assegnata a operatore umano - Difficolta: 2/5
- [x] Estrazione rule-based di nome, tipo evento, data e invitati - Difficolta: 3/5
- [x] Creazione/aggiornamento contatto CRM - Difficolta: 3/5
- [x] Creazione/aggiornamento preventivo aperto - Difficolta: 3/5
- [x] Controllo disponibilita interno - Difficolta: 3/5
- [x] Proposta date alternative - Difficolta: 2/5
- [x] Salvataggio risposte Zak AI in inbox - Difficolta: 2/5
- [ ] Qualificazione LLM con output JSON strutturato - Difficolta: 4/5
- [ ] Stato conversazionale persistente per step mancanti - Difficolta: 4/5
- [ ] Handoff esplicito AI -> operatore - Difficolta: 3/5
- [ ] Template risposta configurabili da pannello - Difficolta: 3/5
- [ ] Test automatici su parsing e casi conversazionali - Difficolta: 3/5

## WhatsApp / Meta Cloud API

- [x] Ricezione webhook WhatsApp inbound - Difficolta: 3/5
- [x] Invio outbound testuale tramite Meta Cloud API - Difficolta: 4/5
- [x] Fallback se credenziali Meta non configurate - Difficolta: 2/5
- [ ] Verifica firma webhook Meta - Difficolta: 4/5
- [ ] Gestione challenge webhook Meta - Difficolta: 3/5
- [ ] Tracciamento errori invio su DB - Difficolta: 3/5
- [ ] Stato consegna messaggi - Difficolta: 4/5
- [ ] Supporto media inbound - Difficolta: 4/5
- [ ] Supporto template WhatsApp approvati - Difficolta: 4/5
- [ ] Gestione finestra conversazionale 24 ore - Difficolta: 4/5

## CRM Contatti

- [x] CRUD contatti - Difficolta: 2/5
- [x] Filtri per stato, tipo evento, origine lead e ricerca - Difficolta: 2/5
- [x] Operatore assegnato al contatto - Difficolta: 2/5
- [x] Messaggi associati al contatto - Difficolta: 2/5
- [ ] Timeline completa contatto - Difficolta: 3/5
- [ ] Storico cambi stato lead - Difficolta: 3/5
- [ ] Note interne staff - Difficolta: 2/5
- [ ] Deduplicazione avanzata telefono/social - Difficolta: 3/5
- [ ] Import CSV contatti - Difficolta: 3/5

## Preventivi Eventi

- [x] CRUD preventivi - Difficolta: 2/5
- [x] Budget stimato - Difficolta: 1/5
- [x] Numero invitati - Difficolta: 1/5
- [x] Stato evento opzionato/confermato/rifiutato - Difficolta: 2/5
- [x] Collegamento con contatto CRM - Difficolta: 2/5
- [ ] Generazione PDF preventivo - Difficolta: 4/5
- [ ] Invio preventivo via WhatsApp/email - Difficolta: 4/5
- [ ] Versionamento preventivi - Difficolta: 3/5
- [ ] Calcolo pacchetti/prezzi - Difficolta: 4/5
- [ ] Firma o conferma digitale - Difficolta: 4/5

## Agenda e Calendario

- [x] CRUD agenda personale - Difficolta: 2/5
- [x] Endpoint disponibilita interno - Difficolta: 3/5
- [x] Webhook voice assistant crea item agenda - Difficolta: 3/5
- [ ] Integrazione Google Calendar reale - Difficolta: 5/5
- [ ] Sincronizzazione bidirezionale eventi - Difficolta: 5/5
- [ ] Gestione slot e fasce orarie - Difficolta: 4/5
- [ ] Blocco date non disponibili - Difficolta: 3/5
- [ ] Promemoria automatici - Difficolta: 3/5

## Automazioni CRM

- [x] Re-engagement lead persi - Difficolta: 3/5
- [x] Ricorrenze annuali - Difficolta: 3/5
- [x] Configurazione runtime automazioni - Difficolta: 3/5
- [x] Log esecuzioni - Difficolta: 2/5
- [x] Trigger manuale da UI - Difficolta: 2/5
- [ ] Invio reale automazioni via WhatsApp Meta - Difficolta: 3/5
- [ ] Toggle attivo/disattivo realmente applicato dai job - Difficolta: 2/5
- [ ] Segmentazione automazioni per tipo evento - Difficolta: 3/5
- [ ] Dashboard performance automazioni - Difficolta: 3/5

## Voice Assistant

- [x] Webhook trascrizione chiamata - Difficolta: 3/5
- [x] Creazione evento agenda da chiamata - Difficolta: 2/5
- [ ] Integrazione Vapi/Bland AI reale - Difficolta: 5/5
- [ ] Parsing intento chiamata - Difficolta: 4/5
- [ ] Creazione task separati da eventi agenda - Difficolta: 3/5
- [ ] Associazione telefonata a contatto CRM esistente - Difficolta: 3/5
- [ ] Registrazione trascrizione storica nel contatto - Difficolta: 3/5

## B2B e Competitor

- [ ] Sezione B2B dedicata - Difficolta: 3/5
- [ ] Archivio competitor - Difficolta: 3/5
- [ ] Upload materiali competitor - Difficolta: 4/5
- [ ] Prompt AI per analisi competitor - Difficolta: 4/5
- [ ] Template co-branding scuole/aziende - Difficolta: 4/5
- [ ] Generazione PDF/presentazioni - Difficolta: 4/5

## Sicurezza e Produzione

- [x] Configurazione dipendenze con minimum release age - Difficolta: 2/5
- [x] Redazione log sensibili base - Difficolta: 2/5
- [ ] Autenticazione utenti - Difficolta: 4/5
- [ ] Ruoli e permessi reali admin/manager/staff - Difficolta: 4/5
- [ ] Rate limiting webhook/API - Difficolta: 3/5
- [ ] Validazione firme webhook esterni - Difficolta: 4/5
- [ ] Audit log azioni staff - Difficolta: 3/5
- [ ] Gestione segreti documentata - Difficolta: 2/5

## Qualita e Dev Workflow

- [x] Typecheck completo passato - Difficolta: 1/5
- [x] Build completa passata - Difficolta: 2/5
- [x] Codegen OpenAPI verificato - Difficolta: 2/5
- [x] Script preinstall cross-platform - Difficolta: 2/5
- [ ] Test unitari backend - Difficolta: 3/5
- [ ] Test frontend componenti critici - Difficolta: 3/5
- [ ] Test integrazione webhook WhatsApp - Difficolta: 4/5
- [ ] CI automatica - Difficolta: 3/5
- [ ] Lint/format command standardizzato - Difficolta: 2/5

## Prossime Priorita Consigliate

- [ ] Google Calendar reale per disponibilita eventi - Difficolta: 5/5
- [ ] Verifica firma e challenge webhook Meta - Difficolta: 4/5
- [ ] Realtime inbox multi-operatore - Difficolta: 4/5
- [ ] LLM booking assistant con stato conversazionale persistente - Difficolta: 5/5
- [ ] Autenticazione e ruoli staff - Difficolta: 4/5
