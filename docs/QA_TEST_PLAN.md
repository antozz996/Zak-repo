# QA Test Plan — Zak Ecosystem AI

Piano di test end-to-end per la verifica manuale di tutte le funzionalità del sistema.
Ogni scenario va eseguito almeno una volta prima di un rilascio in produzione.

---

## Convenzioni

- **Prerequisito**: condizioni necessarie prima di iniziare lo scenario
- **Steps**: azioni da eseguire in ordine
- **Risultato atteso**: ciò che deve accadere se tutto funziona correttamente
- **Stato**: `⬜ Da testare` / `✅ Passato` / `❌ Fallito`
- **Note**: osservazioni, bug rilevati, condizioni particolari

---

## 1. Dashboard

### 1.1 Caricamento KPI

- **Prerequisito**: almeno 1 contatto e 1 preventivo esistenti
- **Steps**:
  1. Aprire `/dashboard`
  2. Verificare che tutte le card KPI mostrino valori numerici (non errori o NaN)
- **Risultato atteso**: card visibili con contatori coerenti con i dati in archivio
- **Stato**: ⬜ Da testare

### 1.2 Filtri temporali

- **Prerequisito**: dati distribuiti su più date
- **Steps**:
  1. Impostare "Data da" a una data nel passato
  2. Impostare "Data a" a oggi
  3. Verificare che i KPI si aggiornino
  4. Restringere il range a un periodo senza dati
- **Risultato atteso**: i KPI si azzerano nel range vuoto, si popolano nel range con dati
- **Stato**: ⬜ Da testare

### 1.3 Grafici pipeline e eventi mese

- **Prerequisito**: lead con diversi stati e almeno 1 evento confermato
- **Steps**:
  1. Verificare che il grafico pipeline mostri la distribuzione per stato
  2. Verificare che il grafico eventi mese mostri le barre per i mesi con eventi
- **Risultato atteso**: grafici correttamente renderizzati e coerenti con i dati
- **Stato**: ⬜ Da testare

### 1.4 Metriche di conversione

- **Prerequisito**: lead con preventivo e almeno 1 lead confermato
- **Steps**:
  1. Verificare le card "Lead → Preventivo", "Preventivo → Confermato", "Lead → Confermato"
  2. Confrontare i valori con un calcolo manuale
- **Risultato atteso**: percentuali corrette e coerenti
- **Stato**: ⬜ Da testare

### 1.5 Export CSV

- **Steps**:
  1. Impostare un filtro temporale
  2. Cliccare "Esporta CSV"
  3. Aprire il file scaricato
- **Risultato atteso**: il CSV contiene tutti i KPI incluse le metriche di conversione, filtrati per il periodo selezionato
- **Stato**: ⬜ Da testare

### 1.6 Attività recente

- **Steps**:
  1. Creare un contatto o un preventivo
  2. Tornare alla dashboard
  3. Verificare che l'azione appaia nel feed attività recente
- **Risultato atteso**: l'ultima azione è visibile in cima al feed
- **Stato**: ⬜ Da testare

---

## 2. Lead WhatsApp — Flusso completo

### 2.1 Ricezione messaggio inbound

- **Prerequisito**: webhook WhatsApp configurato e raggiungibile
- **Steps**:
  1. Inviare un messaggio WhatsApp al numero Business (oppure simulare con `POST /api/webhook/whatsapp`)
  2. Verificare nel backend/log che il webhook sia stato ricevuto
- **Risultato atteso**: il messaggio appare nell'inbox; se il contatto non esiste, viene creato automaticamente
- **Stato**: ⬜ Da testare

### 2.2 Creazione automatica contatto

- **Steps**:
  1. Inviare un messaggio da un numero mai visto
  2. Aprire la sezione Contatti
- **Risultato atteso**: il contatto è presente con telefono e stato lead "nuovo"
- **Stato**: ⬜ Da testare

### 2.3 Media inbound WhatsApp

- **Prerequisito**: webhook configurato
- **Steps**:
  1. Inviare un'immagine, un video o un documento WhatsApp
  2. Aprire la conversazione nella inbox
- **Risultato atteso**: il messaggio mostra il tipo media, MIME type e filename (se disponibile). I metadati sono salvati anche se il file binario non viene scaricato
- **Stato**: ⬜ Da testare

---

## 3. Booking Assistant AI

### 3.1 Estrazione dati lead

- **Prerequisito**: conversazione non assegnata a operatore; webhook WhatsApp attivo
- **Steps**:
  1. Inviare un messaggio WhatsApp contenente: nome, tipo evento, data, numero invitati (es. "Ciao, sono Marco, vorrei organizzare un compleanno il 20 luglio per 50 persone")
  2. Verificare la risposta automatica di Zak AI nella inbox
  3. Controllare il contatto CRM aggiornato
  4. Controllare il preventivo creato/aggiornato
- **Risultato atteso**: il contatto ha i dati estratti; il preventivo è creato con data, invitati e tipo evento
- **Stato**: ⬜ Da testare

### 3.2 Controllo disponibilità data

- **Prerequisito**: un evento confermato nella data richiesta
- **Steps**:
  1. Inviare un messaggio chiedendo la data già occupata
- **Risultato atteso**: Zak AI risponde che la data non è disponibile e propone alternative
- **Stato**: ⬜ Da testare

### 3.3 Handoff AI → Operatore

- **Steps**:
  1. Inviare un messaggio contenente una richiesta esplicita tipo "vorrei parlare con una persona"
  2. Verificare la risposta di conferma di Zak AI
  3. Verificare che nella inbox appaia il badge "Richiede staff"
  4. Verificare che Zak AI non risponda più ai messaggi successivi
- **Risultato atteso**: il flag `handoff_richiesto` è attivo; Zak AI si ferma
- **Stato**: ⬜ Da testare

### 3.4 Presa in carico operatore

- **Steps**:
  1. Dopo handoff, assegnare la conversazione a un operatore
  2. Inviare un altro messaggio inbound
- **Risultato atteso**: Zak AI non risponde; il flag handoff viene azzerato; l'operatore gestisce la chat
- **Stato**: ⬜ Da testare

### 3.5 Rilascio e riattivazione Zak AI

- **Steps**:
  1. Rilasciare la conversazione dall'operatore
  2. Inviare un nuovo messaggio inbound
- **Risultato atteso**: Zak AI riprende a rispondere automaticamente
- **Stato**: ⬜ Da testare

---

## 4. Inbox

### 4.1 Filtri conversazioni

- **Steps**:
  1. Filtrare per canale WhatsApp → verificare che appaiano solo conversazioni WhatsApp
  2. Filtrare per stato lead "qualificato" → verificare coerenza
  3. Filtrare per operatore → verificare che appaiano solo le conversazioni assegnate
- **Risultato atteso**: i filtri funzionano correttamente e sono combinabili
- **Stato**: ⬜ Da testare

### 4.2 Marcatura messaggi come letti

- **Steps**:
  1. Verificare un contatto con messaggi non letti (badge KPI dashboard)
  2. Aprire la conversazione nella inbox
  3. Tornare alla dashboard
- **Risultato atteso**: il contatore "messaggi non letti" si è decrementato
- **Stato**: ⬜ Da testare

### 4.3 Invio messaggio outbound

- **Steps**:
  1. Aprire una conversazione
  2. Scrivere un messaggio e inviare
  3. Verificare che il messaggio appaia nella conversazione
- **Risultato atteso**: il messaggio è visibile con direzione "outbound"; se Meta è configurato, verificare l'invio reale
- **Stato**: ⬜ Da testare

### 4.4 Finestra conversazionale WhatsApp 24 ore

- **Prerequisito**: un contatto il cui ultimo messaggio inbound è più vecchio di 24 ore
- **Steps**:
  1. Provare a inviare un messaggio testuale libero su canale WhatsApp
- **Risultato atteso**: il sistema restituisce errore `409` e il messaggio non viene inviato via Meta
- **Stato**: ⬜ Da testare

---

## 5. Contatti CRM

### 5.1 Creazione contatto

- **Steps**:
  1. Andare su `/contatti/nuovo`
  2. Compilare tutti i campi e salvare
- **Risultato atteso**: il contatto appare nella lista; l'audit log registra la creazione
- **Stato**: ⬜ Da testare

### 5.2 Deduplicazione su creazione

- **Steps**:
  1. Creare un contatto con telefono "+39 333 1234567"
  2. Provare a creare un altro contatto con telefono "00393331234567"
- **Risultato atteso**: errore `409` — il sistema riconosce il duplicato nonostante il formato diverso
- **Stato**: ⬜ Da testare

### 5.3 Deduplicazione su Instagram

- **Steps**:
  1. Creare un contatto con Instagram username "@marco_rossi"
  2. Provare a creare un altro con "marco_rossi" (senza @)
- **Risultato atteso**: errore `409` — duplicato riconosciuto
- **Stato**: ⬜ Da testare

### 5.4 Modifica contatto e note interne

- **Steps**:
  1. Aprire un contatto dal pannello laterale
  2. Modificare lo stato lead
  3. Scrivere una nota interna e salvare
  4. Chiudere e riaprire il pannello
- **Risultato atteso**: le modifiche sono persistenti; lo storico cambi stato lead è visibile nella timeline
- **Stato**: ⬜ Da testare

### 5.5 Timeline contatto

- **Prerequisito**: contatto con messaggi, preventivi e cambi stato
- **Steps**:
  1. Aprire il pannello laterale del contatto
  2. Scorrere la timeline
- **Risultato atteso**: messaggi, preventivi e cambi stato sono mostrati in ordine cronologico; le telefonate voice appaiono come "Telefonata registrata"
- **Stato**: ⬜ Da testare

### 5.6 Eliminazione contatto

- **Steps**:
  1. Eliminare un contatto dalla lista
  2. Verificare che non sia più visibile
  3. Verificare l'audit log
- **Risultato atteso**: contatto rimosso; azione registrata nell'audit log
- **Stato**: ⬜ Da testare

### 5.7 Import CSV

- **Steps**:
  1. Preparare un file CSV con colonne: `nome,telefono,instagram_username,origine_lead,tipo_evento,stato_lead,note_interna`
  2. Inserire 5+ righe di cui almeno 2 con telefono/Instagram già esistente
  3. Importare dalla pagina contatti
- **Risultato atteso**: riepilogo mostra contatti creati, duplicati saltati, eventuali errori; lo storico stato lead è registrato per i nuovi contatti
- **Stato**: ⬜ Da testare

---

## 6. Preventivi

### 6.1 Creazione preventivo

- **Steps**:
  1. Creare un preventivo con contatto, data, invitati e budget
  2. Verificare nella lista preventivi
- **Risultato atteso**: preventivo creato con stato "opzionato"; audit log aggiornato
- **Stato**: ⬜ Da testare

### 6.2 Blocco date duplicate

- **Prerequisito**: un preventivo confermato nella data X
- **Steps**:
  1. Creare un nuovo preventivo con la stessa data X
  2. Oppure: provare a confermare un preventivo esistente sulla data X
- **Risultato atteso**: errore `409` — la data non è disponibile
- **Stato**: ⬜ Da testare

### 6.3 Modifica stato preventivo

- **Steps**:
  1. Passare un preventivo da "opzionato" a "confermato" (su data libera)
  2. Verificare nella dashboard che il budget totale confermato si aggiorni
- **Risultato atteso**: stato aggiornato; KPI dashboard coerente
- **Stato**: ⬜ Da testare

### 6.4 Eliminazione preventivo

- **Steps**:
  1. Eliminare un preventivo
  2. Verificare l'audit log
- **Risultato atteso**: preventivo rimosso; azione registrata
- **Stato**: ⬜ Da testare

---

## 7. Agenda

### 7.1 CRUD eventi agenda

- **Steps**:
  1. Creare un evento con titolo, date, categoria
  2. Modificare l'evento
  3. Eliminare l'evento
- **Risultato atteso**: tutte le operazioni CRUD funzionano; audit log aggiornato
- **Stato**: ⬜ Da testare

### 7.2 Evento da voice assistant

- **Steps**:
  1. Inviare un payload a `POST /api/webhook/voice-assistant` con trascrizione e telefono
  2. Verificare che un evento appaia in agenda
  3. Se il telefono corrisponde a un contatto CRM, verificare il collegamento
- **Risultato atteso**: evento creato; contatto CRM collegato se trovato; trascrizione salvata nello storico messaggi del contatto con canale "voice"
- **Stato**: ⬜ Da testare

### 7.3 Contatto CRM collegato ad evento

- **Prerequisito**: evento creato dal voice assistant con contatto collegato
- **Steps**:
  1. Aprire la pagina agenda
  2. Trovare l'evento
- **Risultato atteso**: il nome del cliente CRM è visibile nell'evento
- **Stato**: ⬜ Da testare

---

## 8. Task personali

### 8.1 Creazione task manuale

- **Prerequisito**: applicazione avviata e backend raggiungibile
- **Steps**:
  1. Aprire `/task`
  2. Inserire titolo, descrizione, priorità e scadenza
  3. Cliccare "Aggiungi"
- **Risultato atteso**: il task appare nella lista con stato "aperto", priorità corretta e scadenza formattata
- **Stato**: ⬜ Da testare

### 8.2 Filtro per stato

- **Prerequisito**: almeno 1 task aperto e 1 task completato
- **Steps**:
  1. Selezionare filtro stato "Aperti"
  2. Selezionare filtro stato "Completati"
  3. Selezionare filtro stato "Tutti gli stati"
- **Risultato atteso**: la lista mostra solo i task coerenti con il filtro selezionato
- **Stato**: ⬜ Da testare

### 8.3 Filtro per priorità

- **Prerequisito**: task con priorità bassa, media, alta e urgente
- **Steps**:
  1. Applicare ogni filtro priorità
  2. Verificare le card mostrate
- **Risultato atteso**: ogni filtro mostra solo i task con la priorità richiesta; "Tutte le priorità" mostra l'elenco completo
- **Stato**: ⬜ Da testare

### 8.4 Completamento e riapertura task

- **Prerequisito**: almeno 1 task aperto
- **Steps**:
  1. Cliccare "Completa" su un task aperto
  2. Filtrare per completati
  3. Cliccare "Riapri"
- **Risultato atteso**: il task passa a "completato" con timestamp di completamento e torna "aperto" dopo la riapertura
- **Stato**: ⬜ Da testare

### 8.5 Eliminazione task

- **Prerequisito**: almeno 1 task di test creato appositamente
- **Steps**:
  1. Cliccare il pulsante di eliminazione
  2. Confermare il prompt
  3. Aggiornare la lista
- **Risultato atteso**: il task non è più presente; l'azione viene registrata nell'audit log
- **Stato**: ⬜ Da testare

### 8.6 Voice webhook crea task invece di evento agenda

- **Prerequisito**: backend avviato; opzionale contatto CRM con telefono corrispondente
- **Steps**:
  1. Inviare `POST /api/webhook/voice-assistant` con trascrizione tipo "Ricordami di richiamare Marco domani"
  2. Aprire `/task`
  3. Aprire `/agenda`
- **Risultato atteso**: viene creato un task personale; non viene creato un evento agenda per lo stesso promemoria
- **Stato**: ⬜ Da testare

---

## 9. Automazioni

### 8.1 Re-engagement manuale

- **Prerequisito**: almeno 1 lead con stato "perso" e inattivo da più giorni del parametro configurato; `reengagement_attivo` abilitato
- **Steps**:
  1. Aprire `/automazioni`
  2. Cliccare "Esegui re-engagement"
  3. Verificare il log esecuzioni
- **Risultato atteso**: il lead perso viene contattato; log mostra "eseguito" o "saltato" (con motivo)
- **Stato**: ⬜ Da testare

### 8.2 Ricorrenze manuale

- **Prerequisito**: almeno 1 evento confermato con data ricorrente; `ricorrenza_attiva` abilitata
- **Steps**:
  1. Cliccare "Esegui ricorrenze"
  2. Verificare il log
- **Risultato atteso**: messaggio inviato; log con esito
- **Stato**: ⬜ Da testare

### 8.3 Toggle attivo/disattivo

- **Steps**:
  1. Disattivare `reengagement_attivo`
  2. Eseguire manualmente re-engagement
- **Risultato atteso**: il job non processa nessun contatto; il log non mostra nuove esecuzioni
- **Stato**: ⬜ Da testare

### 8.4 Segmentazione per tipo evento

- **Steps**:
  1. Configurare `reengagement_tipi_evento` su un solo tipo (es. "compleanno")
  2. Eseguire manualmente
  3. Verificare che vengano processati solo i lead con quel tipo evento
- **Risultato atteso**: contatti con altri tipi evento non vengono contattati
- **Stato**: ⬜ Da testare

### 8.5 Dashboard performance

- **Steps**:
  1. Dopo aver eseguito alcune automazioni, verificare le card performance
  2. Verificare il breakdown per tipo
- **Risultato atteso**: metriche coerenti con il log esecuzioni
- **Stato**: ⬜ Da testare

### 8.6 Invio WhatsApp reale (se Meta configurato)

- **Prerequisito**: credenziali Meta configurate; template approvato
- **Steps**:
  1. Eseguire un'automazione su un contatto con telefono WhatsApp reale
  2. Verificare la ricezione del messaggio su WhatsApp
  3. Verificare `whatsapp_outbound_log` nel DB
- **Risultato atteso**: messaggio ricevuto; log outbound con stato "sent" e `provider_message_id` presente
- **Stato**: ⬜ Da testare

---

## 10. Webhook WhatsApp

### 9.1 Challenge di verifica Meta

- **Steps**:
  1. Inviare `GET /api/webhook/whatsapp?hub.mode=subscribe&hub.verify_token=<TOKEN>&hub.challenge=testchallenge`
- **Risultato atteso**: risposta `200` con body `testchallenge`
- **Stato**: ⬜ Da testare

### 9.2 Verifica firma X-Hub-Signature-256

- **Prerequisito**: `META_APP_SECRET` configurata
- **Steps**:
  1. Inviare un `POST /api/webhook/whatsapp` con firma HMAC corretta → deve essere accettato
  2. Inviare un `POST` con firma errata → deve essere rifiutato
- **Risultato atteso**: richiesta con firma valida accettata; richiesta con firma invalida rifiutata
- **Stato**: ⬜ Da testare

### 9.3 Stato consegna messaggi

- **Prerequisito**: invio outbound WhatsApp eseguito con provider_message_id
- **Steps**:
  1. Simulare un evento `statuses` da Meta con lo stesso `provider_message_id`
  2. Verificare `whatsapp_outbound_log`
- **Risultato atteso**: il record log viene aggiornato con `delivery_status` e `delivery_updated_at`
- **Stato**: ⬜ Da testare

---

## 11. Voice Webhook

### 10.1 Creazione evento da trascrizione

- **Steps**:
  1. Inviare `POST /api/webhook/voice-assistant` con payload `{ "transcript": "...", "phone": "+39..." }`
  2. Verificare la pagina agenda
- **Risultato atteso**: evento creato in agenda
- **Stato**: ⬜ Da testare

### 10.2 Collegamento a contatto CRM

- **Prerequisito**: contatto CRM con telefono corrispondente
- **Steps**:
  1. Inviare il webhook con il telefono del contatto
  2. Verificare l'evento in agenda — deve mostrare il nome del contatto
  3. Verificare lo storico messaggi del contatto — deve contenere la trascrizione con canale "voice"
  4. Verificare che `ultimo_contatto` sia stato aggiornato
- **Risultato atteso**: evento collegato; trascrizione nello storico; filtro "Telefonate" nella inbox mostra la voce
- **Stato**: ⬜ Da testare

---

## 12. Audit Log

### 11.1 Registrazione azioni

- **Steps**:
  1. Eseguire una serie di azioni: creare contatto, creare preventivo, inviare messaggio, assegnare chat, trigger automazione, import CSV
  2. Aprire `/audit-log`
- **Risultato atteso**: tutte le azioni sono registrate con timestamp, tipo, entità e dettagli
- **Stato**: ⬜ Da testare

### 11.2 Filtri audit log

- **Steps**:
  1. Filtrare per azione "creazione"
  2. Filtrare per entità "contatto"
  3. Combinare i filtri
- **Risultato atteso**: la lista si aggiorna correttamente mostrando solo le voci corrispondenti
- **Stato**: ⬜ Da testare

---

## 13. Rate Limiting

### 12.1 Limite API generali

- **Steps**:
  1. Inviare molte richieste rapide a un endpoint API qualsiasi
- **Risultato atteso**: dopo il superamento della soglia, le richieste vengono bloccate con `429 Too Many Requests`
- **Stato**: ⬜ Da testare

### 12.2 Limite webhook più stretto

- **Steps**:
  1. Inviare molte richieste rapide a `/api/webhook/whatsapp`
- **Risultato atteso**: il limite viene raggiunto prima rispetto agli endpoint normali
- **Stato**: ⬜ Da testare

### 12.3 Esclusione healthcheck

- **Steps**:
  1. Inviare molte richieste a `/api/healthz`
- **Risultato atteso**: nessun `429`, le richieste passano sempre
- **Stato**: ⬜ Da testare

---

## 14. Impostazioni staff

### 13.1 CRUD utenti

- **Steps**:
  1. Creare un nuovo utente staff
  2. Modificare il suo ruolo
  3. Eliminare l'utente
- **Risultato atteso**: tutte le operazioni funzionano; audit log aggiornato
- **Stato**: ⬜ Da testare

---

## 15. Controllo Accessi e Ruoli (RBAC)

### 15.1 Accesso completo dell'Amministratore (Admin)

- **Prerequisito**: utente configurato con ruolo `admin`
- **Steps**:
  1. Effettuare l'accesso con le credenziali dell'Admin
  2. Verificare l'accesso a Dashboard, Inbox, Contatti, Preventivi, Agenda, Task, Automazioni, Impostazioni e Audit Log
- **Risultato atteso**: l'Admin ha visibilità e controllo totale su tutte le sezioni dell'applicazione
- **Stato**: ⬜ Da testare (futuro/da implementare)

### 15.2 Accesso del Venue Manager (Manager)

- **Prerequisito**: utente configurato con ruolo `manager`
- **Steps**:
  1. Effettuare l'accesso con le credenziali del Manager
  2. Verificare l'accesso a Dashboard, Inbox, Contatti, Preventivi, Agenda, Task, Automazioni
  3. Provare ad accedere direttamente alle Impostazioni globali o all'Audit Log
- **Risultato atteso**: il Manager vede le sezioni operative ma riceve un errore di accesso o non vede i link per Impostazioni globali ed Audit Log
- **Stato**: ⬜ Da testare (futuro/da implementare)

### 15.3 Accesso limitato dell'Operatore Staff (Staff)

- **Prerequisito**: utente configurato con ruolo `staff`
- **Steps**:
  1. Effettuare l'accesso con le credenziali dello Staff
  2. Verificare l'accesso alle sezioni consentite (Inbox, Contatti, Agenda, Task)
  3. Provare ad accedere a Dashboard executive o alle Automazioni CRM
- **Risultato atteso**: lo Staff ha accesso solo alle sezioni operative di base; i percorsi non autorizzati mostrano una schermata di Access Denied
- **Stato**: ⬜ Da testare (futuro/da implementare)

### 15.4 Gestione dei permessi negati (Access Denied)

- **Prerequisito**: utente loggato con ruolo `staff` o `manager`
- **Steps**:
  1. Navigare direttamente ad un URL protetto (es. `/audit-log` per un Manager, o `/dashboard` per lo Staff)
- **Risultato atteso**: il sistema intercetta la richiesta a livello di router, blocca il caricamento della pagina e ridirige l'utente a una pagina di Access Denied mostrando il motivo del blocco
- **Stato**: ⬜ Da testare (futuro/da implementare)

### 15.5 Aggiornamento dinamico del ruolo

- **Prerequisito**: due utenti attivi, uno dei quali con ruolo `admin`
- **Steps**:
  1. L'Admin modifica il ruolo del secondo utente (es. da `staff` a `manager`) nella pagina di gestione utenti
  2. Il secondo utente aggiorna la propria pagina
  3. Verificare che il secondo utente abbia ora accesso alle funzioni da `manager` (es. visualizzazione Dashboard)
- **Risultato atteso**: i permessi disponibili si aggiornano dinamicamente in base al nuovo ruolo salvato
- **Stato**: ⬜ Da testare (futuro/da implementare)

### 15.6 Tentativo di accesso di un utente disattivato

- **Prerequisito**: utente staff precedentemente impostato con stato `disattivato`
- **Steps**:
  1. Provare a effettuare il login con le credenziali dell'utente disattivato
- **Risultato atteso**: il tentativo di login viene rifiutato con un messaggio generico: "Credenziali non valide o account disattivato". Se la sessione era gia' attiva al momento della disattivazione, questa viene invalidata entro 60 secondi
- **Stato**: ⬜ Da testare (futuro/da implementare)

### 15.7 Tracciamento modifiche ruoli nell'Audit Log

- **Prerequisito**: utente loggato come `admin`
- **Steps**:
  1. L'Admin modifica il ruolo di un collaboratore dello staff
  2. Aprire la sezione Audit Log
  3. Verificare la registrazione dell'evento di modifica
- **Risultato atteso**: l'audit log contiene un record dell'azione `USER_ROLE_UPDATED` con indicazione dell'autore, del collaboratore modificato e del vecchio/nuovo ruolo
- **Stato**: ⬜ Da testare (futuro/da implementare)

### 15.8 Tentativo di accesso ripetuto con password errata (Brute Force)

- **Prerequisito**: utente staff registrato
- **Steps**:
  1. Effettuare 5 tentativi di login consecutivi con password errata per la stessa email
  2. Al 6° tentativo inserire la password corretta
- **Risultato atteso**: il sistema blocca temporaneamente l'IP o l'account per 15 minuti; il 6° tentativo con password corretta viene rifiutato a causa del blocco temporaneo; viene registrato l'evento `LOGIN_FAILED_BRUTE_FORCE` in audit log
- **Stato**: ⬜ Da testare (futuro/da implementare)

### 15.9 Scadenza sessione per inattivita' di 30 minuti

- **Prerequisito**: utente loggato sul sistema
- **Steps**:
  1. Lasciare l'applicazione inattiva (nessun movimento del mouse o digitazione) per 30 minuti
  2. Tentare un'azione (es. cliccare su una conversazione)
- **Risultato atteso**: lo schermo viene bloccato e viene richiesto lo sblocco tramite password; lo stato locale dell'operatore non viene perso ma la navigazione e' bloccata
- **Stato**: ⬜ Da testare (futuro/da implementare)

### 15.10 Tracciamento esportazione dati sensibili CRM

- **Prerequisito**: utente loggato con ruolo `admin` o `manager`
- **Steps**:
  1. Andare nella sezione Dashboard o Contatti
  2. Cliccare su "Esporta CSV" per scaricare i dati
  3. Aprire l'Audit Log di sicurezza
- **Risultato atteso**: l'esportazione viene completata correttamente; viene registrata una riga in audit log con azione `DATA_EXPORT`, indicando l'utente, la risorsa esportata ed il numero di righe estratte
- **Stato**: ⬜ Da testare (futuro/da implementare)

### 15.11 Invalidazione immediata della sessione alla disattivazione account

- **Prerequisito**: utente "Staff A" loggato su un dispositivo; utente "Admin" loggato su un altro dispositivo
- **Steps**:
  1. L'Admin disattiva l'account di "Staff A" dalle impostazioni
  2. "Staff A" prova a cliccare su un contatto o inviare un messaggio
- **Risultato atteso**: entro 60 secondi dall'azione dell'Admin, al successivo tentativo di chiamata API di "Staff A", il server restituisce errore di autenticazione ed il client reindirizza immediatamente al login invalidando la sessione locale
- **Stato**: ⬜ Da testare (futuro/da implementare)

---

## Riepilogo esecuzione

Aggiornamento conteggio: con la sezione **Controllo Accessi e Ruoli (RBAC)** il piano contiene **66 scenari totali**, di cui **11 scenari RBAC** (da implementare in futuro).

| Sezione | Scenari | Passati | Falliti | Da testare |
|---------|---------|---------|---------|------------|
| Dashboard | 6 | — | — | 6 |
| Lead WhatsApp | 3 | — | — | 3 |
| Booking Assistant | 5 | — | — | 5 |
| Inbox | 4 | — | — | 4 |
| Contatti CRM | 7 | — | — | 7 |
| Preventivi | 4 | — | — | 4 |
| Agenda | 3 | — | — | 3 |
| Task personali | 6 | — | — | 6 |
| Automazioni | 6 | — | — | 6 |
| Webhook WhatsApp | 3 | — | — | 3 |
| Voice Webhook | 2 | — | — | 2 |
| Audit Log | 2 | — | — | 2 |
| Rate Limiting | 3 | — | — | 3 |
| Impostazioni | 1 | — | — | 1 |
| Controllo Accessi e Ruoli (RBAC) | 11 | — | — | 11 |
| **Totale** | **66** | **—** | **—** | **66** |

---

*Ultimo aggiornamento: 2026-06-02*
