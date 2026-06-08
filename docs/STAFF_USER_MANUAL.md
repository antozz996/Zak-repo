# Manuale Operativo Staff — Zak Ecosystem AI

Guida pratica per lo staff che utilizza il CRM Zak. Spiega come usare ogni sezione dell'applicazione nel lavoro quotidiano.

---

## Indice

1. [Accesso e navigazione](#1-accesso-e-navigazione)
2. [Dashboard](#2-dashboard)
3. [Inbox — Messaggi](#3-inbox--messaggi)
4. [Contatti CRM](#4-contatti-crm)
5. [Preventivi eventi](#5-preventivi-eventi)
6. [Agenda personale](#6-agenda-personale)
7. [Task personali](#7-task-personali)
8. [Automazioni CRM](#8-automazioni-crm)
9. [Audit Log](#9-audit-log)
10. [Impostazioni staff](#10-impostazioni-staff)
11. [Gestione Ruoli e Permessi](#11-gestione-ruoli-e-permessi)
12. [Domande frequenti](#12-domande-frequenti)

---

## 1. Accesso e navigazione

L'applicazione è accessibile da browser all'URL del tuo locale (comunicato dal responsabile IT).

### Barra laterale

Il menu di navigazione è sempre visibile a sinistra. Le sezioni disponibili sono:

| Icona | Sezione | Percorso |
|-------|---------|----------|
| 📊 | Dashboard | `/dashboard` |
| 💬 | Inbox | `/inbox` |
| 👥 | Contatti | `/contatti` |
| 📋 | Preventivi | `/preventivi` |
| 📅 | Agenda | `/agenda` |
| ✅ | Task | `/task` |
| ⚙️ | Impostazioni | `/impostazioni` |
| 🤖 | Automazioni | `/automazioni` |
| 📝 | Audit Log | `/audit-log` |

---

## 2. Dashboard

La dashboard è la prima schermata che vedi dopo l'accesso. Mostra una panoramica in tempo reale dello stato del CRM.

### KPI principali

Nella parte superiore trovi le card con i numeri chiave:

- **Contatti totali** — numero di lead e clienti in archivio
- **Nuovi contatti oggi** — lead entrati nelle ultime 24 ore
- **Preventivi attivi** — preventivi aperti (non ancora confermati o rifiutati)
- **Eventi confermati** — eventi con stato "confermato"
- **Budget totale confermato** — somma budget degli eventi confermati
- **Messaggi non letti** — messaggi inbound che non hai ancora aperto
- **Lead con preventivo** — lead che hanno ricevuto almeno un preventivo
- **Lead confermati** — lead che hanno confermato un evento

### Metriche di conversione

- **Lead → Preventivo** — percentuale di lead che hanno ricevuto un preventivo
- **Preventivo → Confermato** — percentuale di preventivi che sono diventati confermati
- **Lead → Confermato** — percentuale complessiva di conversione da lead a confermato

### Grafici

- **Pipeline lead** — distribuzione visuale dei lead per stato (nuovo, contattato, qualificato, confermato, perso)
- **Eventi per mese** — distribuzione degli eventi confermati nel tempo

### Attività recente

Feed cronologico delle ultime azioni nel sistema (creazione contatti, preventivi, messaggi, ecc.).

### Filtri temporali

Usa i selettori **Data da** e **Data a** per restringere i KPI e i grafici a un periodo specifico.

### Export CSV

Il pulsante **Esporta CSV** scarica un file con tutti i KPI visibili, incluse le metriche di conversione, filtrati per il periodo selezionato.

---

## 3. Inbox — Messaggi

La inbox è il centro di comunicazione con i lead e i clienti. Mostra tutte le conversazioni in un'unica interfaccia, indipendentemente dal canale (WhatsApp, voice, ecc.).

### Lista conversazioni

A sinistra trovi l'elenco delle conversazioni. Per ciascuna vedi:

- Nome del contatto
- Anteprima dell'ultimo messaggio
- Canale di provenienza
- Stato lead (badge colorato)
- Operatore assegnato (se presente)
- Badge **Richiede staff** quando il cliente ha esplicitamente chiesto di parlare con una persona

### Filtri inbox

Puoi filtrare le conversazioni per:

- **Canale** — WhatsApp, voice, tutti
- **Stato lead** — nuovo, contattato, qualificato, confermato, perso
- **Operatore** — filtra per operatore assegnato

### Leggere una conversazione

Clicca su una conversazione per aprire lo storico messaggi. I messaggi inbound vengono automaticamente marcati come **letti** all'apertura.

### Inviare un messaggio

Scrivi nel campo di testo in basso e premi **Invio** o il pulsante di invio. Se il canale è WhatsApp:

- Il messaggio viene inviato tramite Meta Cloud API (se configurato)
- Il messaggio viene comunque salvato nella inbox anche se Meta non è disponibile
- **Finestra 24 ore**: puoi inviare messaggi testuali liberi solo entro 24 ore dall'ultimo messaggio inbound del contatto. Se la finestra è chiusa, vedrai un errore

### Prendere in carico una conversazione

Se la conversazione non è assegnata a nessun operatore, l'assistente automatico **Zak AI** gestisce le risposte. Per prendere in carico:

1. Clicca sul pulsante di **assegnazione** nella conversazione
2. Seleziona il tuo nome operatore
3. Da questo momento Zak AI smette di rispondere e gestisci tu la conversazione

### Rilasciare una conversazione

Per riattivare Zak AI su una conversazione:

1. Clicca sul pulsante per **rilasciare** la conversazione
2. L'operatore viene rimosso e Zak AI riprende a rispondere

### Sidebar contatto

A destra della conversazione vedi il pannello con i dati del contatto:

- Nome, telefono, stato lead
- Tipo evento richiesto
- Data evento richiesta
- Numero invitati
- Operatore assegnato

Questi dati vengono raccolti automaticamente da Zak AI durante la conversazione.

---

## 4. Contatti CRM

La sezione contatti è l'archivio centralizzato di tutti i lead e clienti.

### Lista contatti

La tabella mostra tutti i contatti con possibilità di cercare e filtrare per:

- **Stato lead** — nuovo, contattato, qualificato, confermato, perso
- **Tipo evento** — compleanno, laurea, matrimonio, aziendale, ecc.
- **Origine lead** — WhatsApp, Instagram, telefono, sito web, ecc.
- **Ricerca libera** — cerca per nome, telefono, Instagram

### Creare un nuovo contatto

1. Clicca su **Nuovo contatto**
2. Compila i campi: nome, telefono, Instagram, origine lead, tipo evento, stato lead
3. Salva

> **Deduplicazione**: il sistema blocca automaticamente la creazione di contatti con lo stesso telefono o username Instagram già presenti.

### Dettaglio contatto

Clicca su un contatto per aprire il pannello laterale:

- **Dati anagrafici** — modifica nome, telefono, stato lead, ecc.
- **Note interne** — area di testo per note riservate allo staff (non visibili al cliente). Salva con il pulsante dedicato
- **Timeline** — storico completo del contatto:
  - Messaggi inviati e ricevuti (tutti i canali)
  - Preventivi collegati
  - Cambi di stato lead
  - Telefonate registrate dal voice assistant

### Import CSV

1. Dalla pagina contatti, clicca su **Importa CSV**
2. Seleziona un file `.csv` con le colonne supportate:
   - `nome`, `telefono`, `instagram_username`, `origine_lead`, `tipo_evento`, `stato_lead`, `note_interna`
3. Il sistema importa i nuovi contatti e salta quelli con telefono o Instagram già presenti
4. Al termine vedi un riepilogo: creati, duplicati saltati, errori

---

## 5. Preventivi eventi

La sezione preventivi gestisce le proposte economiche per gli eventi.

### Lista preventivi

La tabella mostra tutti i preventivi con:

- Contatto associato
- Data evento richiesta
- Numero invitati
- Budget stimato
- Stato evento (opzionato / confermato / rifiutato)

### Creare un preventivo

1. Clicca su **Nuovo preventivo**
2. Seleziona il contatto
3. Compila: data evento, numero invitati, budget stimato, note
4. Salva

> **Blocco date**: se la data richiesta è già occupata da un altro evento confermato, il sistema blocca la creazione o conferma con un messaggio di errore.

### Modificare un preventivo

Clicca su un preventivo per aprirlo e modificare i campi. Il cambio di stato da "opzionato" a "confermato" è soggetto al controllo disponibilità data.

### Eliminare un preventivo

Usa il pulsante di eliminazione. L'azione viene registrata nell'audit log.

---

## 6. Agenda personale

La sezione agenda gestisce gli impegni personali dello staff e gli eventi creati automaticamente.

### Visualizzazione

La pagina mostra gli eventi in formato lista/calendario con:

- Titolo
- Data e ora inizio / fine
- Categoria (riunione, evento, follow-up, ecc.)
- Contatto CRM collegato (se presente — ad esempio per telefonate registrate dal voice assistant)

### Creare un evento

1. Clicca su **Nuovo evento**
2. Compila: titolo, descrizione, data inizio, data fine, categoria
3. Salva

### Eventi automatici

Il **voice assistant** (webhook telefonico) crea automaticamente eventi in agenda dalle telefonate. Se il numero del chiamante corrisponde a un contatto CRM, l'evento viene collegato al contatto e la trascrizione della chiamata viene salvata nello storico messaggi.

### Blocco date

Le date già occupate da eventi confermati nei preventivi sono segnalate come non disponibili.

---

## 7. Task personali

La sezione Task gestisce promemoria e cose da fare non calendarizzate. È separata dall'Agenda per evitare di riempire il calendario con attività operative senza orario preciso.

### Quando usare Task

Usa **Task** per:

- richiamare un cliente
- preparare un preventivo
- verificare una disponibilità
- mandare un follow-up
- ricordare una scadenza operativa senza bloccare il calendario

Usa invece **Agenda** quando serve un impegno con data e ora reali, ad esempio riunioni, sopralluoghi, eventi confermati o appuntamenti telefonici calendarizzati.

### Creare un task

1. Apri `/task`
2. Inserisci titolo e, se utile, una nota operativa
3. Seleziona la priorità: bassa, media, alta o urgente
4. Aggiungi una scadenza se il task ha una data limite
5. Clicca **Aggiungi**

### Filtri

Puoi filtrare la lista per:

- **Stato**: aperti, completati o tutti
- **Priorità**: bassa, media, alta, urgente o tutte

### Completare o riaprire

- Clicca **Completa** quando il task è stato eseguito
- Clicca **Riapri** se un task completato deve tornare operativo
- Usa l'eliminazione solo per task creati per errore

### Task creati dal voice assistant

Quando il voice assistant riceve una trascrizione con intento di promemoria, task o "da fare", il sistema crea un task personale invece di un evento agenda. Se il telefono corrisponde a un contatto CRM, il task può essere collegato al cliente.

Per esempi pratici consulta anche [Agenda vs Task](./AGENDA_VS_TASK_GUIDE.md).

---

## 8. Automazioni CRM

Le automazioni eseguono azioni programmabili e ricorrenti sui contatti.

### Job disponibili

| Job | Orario cron | Descrizione |
|-----|-------------|-------------|
| Re-engagement | 09:00 ogni giorno | Contatta i lead persi dopo un certo numero di giorni di inattività |
| Ricorrenze | 10:00 ogni giorno | Invia un messaggio automatico per gli anniversari (es. compleanno dell'anno precedente) |

### Dashboard performance

Nella parte superiore della pagina trovi le metriche:

- Totale esecuzioni
- Tasso di successo
- Esecuzioni saltate
- Errori
- Volume ultimi 30 giorni
- Breakdown per tipo automazione

### Configurazione

Puoi modificare i parametri di ciascuna automazione:

- **Toggle attivo/disattivo** — `reengagement_attivo` e `ricorrenza_attiva` abilitano o disabilitano il job cron
- **Tipi evento inclusi** — configura quali tipi di evento vengono processati (es. solo "compleanno", oppure "tutti")
- **Giorni di inattività** (per re-engagement) — dopo quanti giorni un lead viene considerato perso

### Esecuzione manuale

I pulsanti **Esegui re-engagement** e **Esegui ricorrenze** lanciano immediatamente il job senza attendere il cron programmato.

### Log esecuzioni

La tabella log mostra lo storico delle esecuzioni con:

- Data e ora
- Tipo automazione
- Esito (eseguito, saltato, errore)
- Contatto interessato
- Dettagli del messaggio inviato

### Invio WhatsApp

Se configurati i template Meta approvati, le automazioni inviano messaggi WhatsApp reali. Altrimenti, il messaggio viene comunque salvato nella inbox CRM e nel log.

---

## 9. Audit Log

L'audit log è un registro immutabile di tutte le azioni operative eseguite dallo staff nel sistema.

### Cosa viene tracciato

- Creazione, modifica, eliminazione di: contatti, preventivi, eventi agenda, utenti
- Invio messaggi
- Marcatura messaggi come letti
- Assegnazione e rilascio conversazioni inbox
- Trigger manuali delle automazioni
- Aggiornamento configurazione automazioni
- Import CSV contatti

### Filtri disponibili

- **Azione** — filtra per tipo di azione (creazione, modifica, eliminazione, ecc.)
- **Entità** — filtra per tipo di oggetto (contatto, preventivo, agenda, ecc.)
- **Limite** — numero massimo di risultati da mostrare

### Consultazione

Ogni voce del log include:

- Data e ora dell'azione
- Tipo azione
- Entità e ID
- Dettagli JSON (campo, vecchio valore, nuovo valore)
- IP e user agent del client

> **Nota**: l'audit log è di sola lettura. Non è possibile eliminare o modificare le voci.

---

## 10. Impostazioni staff

La pagina impostazioni permette di gestire gli account dello staff.

### Gestione utenti

- **Aggiungere un utente**: nome, email, ruolo
- **Modificare un utente**: aggiorna nome, email o ruolo
- **Eliminare un utente**: rimuove l'account (l'azione viene registrata nell'audit log)

### Ruoli disponibili

Il sistema prevede i ruoli `admin`, `manager` e `staff`. Al momento l'autenticazione e i permessi granulari non sono ancora implementati; la gestione è basata sulla fiducia operativa.

---

## 11. Gestione Ruoli e Permessi

Il controllo degli accessi in ZAK e' organizzato tramite un sistema di ruoli e permessi (RBAC - Role-Based Access Control) che garantisce la sicurezza dei dati commerciali e la corretta operativita' del team della venue.

### I Ruoli di Sistema

Ogni utente dello staff e' associato a uno dei seguenti tre ruoli:

1. **Amministratore (Admin)**:
   - **Profilo**: Titolare o responsabile IT del locale.
   - **Funzioni**: Ha visibilita' e controllo completo. Puo' modificare le chiavi API delle integrazioni (es. Meta WhatsApp, Google Sync, Vapi/Bland), gestire tutti i collaboratori, abilitare/disabilitare gli account ed esaminare l'Audit Log di sicurezza.
   
2. **Venue Manager (Manager)**:
   - **Profilo**: Coordinatore commerciale o direttore del locale.
   - **Funzioni**: Gestisce l'operativita' commerciale della venue. Puo' preparare, inviare e confermare i preventivi degli eventi, visualizzare le statistiche e i grafici della Dashboard, avviare e configurare le automazioni CRM. Non puo' modificare le chiavi API o i ruoli degli altri operatori, ne' accedere all'Audit Log.

3. **Operatore Staff (Staff)**:
   - **Profilo**: Addetto alla sala, all'accoglienza o alla gestione delle comunicazioni operative.
   - **Funzioni**: Gestisce le interazioni con i clienti. Puo' leggere e rispondere alle chat in Inbox, mettere in pausa o riavviare l'assistente AI (Zak AI), spuntare i task operativi ed inserire note sui contatti. Non ha accesso alla Dashboard commerciale, alle automazioni CRM, ne' alla creazione dei preventivi.

### Account Disattivati

Un Amministratore puo' impostare lo stato di un collaboratore su **Disattivato**. In questo stato:
- La sessione attiva dell'operatore viene immediatamente bloccata.
- Qualsiasi tentativo di accesso successivo verra' rifiutato.
- I dati storici e le note associate all'utente rimangono intatti per finalita' di tracciamento.

### Gestione e Supporto

Se hai bisogno di accedere a una sezione bloccata o desideri promuovere il tuo livello di permessi, rivolgiti all'Amministratore della venue per modificare il tuo ruolo dal pannello di amministrazione utenti.

*Nota: La gestione dei ruoli reale e' attualmente in fase di sviluppo e sara' integrata a livello backend con autenticazione JWT sicura da Codex. Al momento e' possibile esplorare la matrice delle funzionalita' nella pagina di demo interattiva "Ruoli" raggiungibile dalla sidebar.*

---

## 12. Domande frequenti

### Zak AI risponde anche quando io sto scrivendo?

No. Quando prendi in carico una conversazione, Zak AI smette completamente di rispondere. Riprende solo se rilasci la conversazione.

### Posso inviare messaggi WhatsApp senza la configurazione Meta?

Sì, ma solo internamente: il messaggio viene salvato nella inbox del CRM ma non viene consegnato al cliente su WhatsApp. Per l'invio reale servono le credenziali Meta.

### Cosa succede se la finestra WhatsApp di 24 ore è chiusa?

Non puoi inviare messaggi testuali liberi. Le automazioni possono comunque usare template approvati Meta che funzionano anche fuori dalla finestra.

### Come vengono gestiti i duplicati nell'import CSV?

Il sistema confronta il telefono (normalizzato) e l'username Instagram (normalizzato). Se trova una corrispondenza, salta il record e lo segnala nel riepilogo.

### Il voice assistant crea automaticamente un contatto?

No. Il webhook voice assistant non crea nuovi contatti. Se il numero del chiamante corrisponde a un contatto CRM esistente, collega la chiamata e salva la trascrizione nello storico. In base all'intento, crea un evento in agenda oppure un task personale.

### Qual è la differenza tra Agenda e Task?

L'Agenda serve per impegni con data e ora precise. I Task servono per promemoria operativi, follow-up e cose da fare. Se devi bloccare tempo nel calendario usa Agenda; se devi ricordare un'azione usa Task.

### Come vedo le conversioni dei lead?

Nella dashboard, le card "Lead → Preventivo", "Preventivo → Confermato" e "Lead → Confermato" mostrano le percentuali di conversione filtrabili per periodo.

---

*Ultimo aggiornamento: 2026-06-02*
