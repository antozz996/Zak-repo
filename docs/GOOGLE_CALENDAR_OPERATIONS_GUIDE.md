# Guida Operativa - Google Calendar Integration

Questa guida descrive come configurare e gestire l'integrazione tra l'agenda di ZAK e Google Calendar per monitorare le disponibilita' e sincronizzare gli appuntamenti della venue.

---

## 1. Configurazione Iniziale e Connessione (OAuth 2.0)

Per attivare la sincronizzazione dei tuoi impegni e delle date della venue con Google Calendar:
1.  Accedi alla pagina **Impostazioni Google Calendar** (o `/google-calendar-settings-mock` nella versione di test).
2.  Clicca su **"Connetti Account"**.
3.  Verrai reindirizzato alla pagina di autorizzazione sicura di Google. Seleziona l'account Gmail/Google Workspace della venue.
4.  Fornisci i permessi richiesti per la gestione dei calendari. *Nota: ZAK richiede l'accesso di lettura e scrittura per poter inserire ed eliminare gli appuntamenti.*
5.  Una volta tornato su ZAK, seleziona dal menu a tendina il **Calendario Principale** su cui operare (es. *"Calendario Eventi Zak"*).

---

## 2. Come Funziona la Sincronizzazione

L'integrazione opera in modalita' **bidirezionale** per l'agenda personale e **unidirezionale** per i preventivi:

### A. Sincronizzazione Preventivi (ZAK &rarr; Google)
Quando un preventivo viene impostato come **Opzionato** o **Confermato** su ZAK:
*   Viene creato automaticamente un evento su Google Calendar.
*   ZAK e' l'unica fonte di verita'. Se modifichi l'evento direttamente su Google Calendar, ZAK **non** verra' aggiornato. Eventuali variazioni di data o note devono sempre essere effettuate dal pannello preventivi di ZAK.

### B. Sincronizzazione Agenda Personale (ZAK &harr; Google)
Gli operatori possono inserire impegni di lavoro (sopralluoghi, riunioni) che si sincronizzano in tempo reale su entrambi i sistemi.
*   Se crei un impegno su Google Calendar, ZAK riceve una notifica push e lo importa in agenda.
*   Se elimini l'impegno da Google, questo scompare anche dall'agenda di ZAK.

---

## 3. Gestione dei Conflitti e Date Occupate

Il sistema esegue un controllo automatico di sovrapposizione delle date in tempo reale:

### Scenario 1: Data Libera
*   Il cliente richiede una visita o un evento per il giorno 15 Settembre.
*   ZAK interroga l'agenda interna e Google Calendar. Nessun evento e' registrato.
*   Il sistema permette il salvataggio immediato e l'opzione della data.

### Scenario 2: Data Occupata (Conflitto)
*   Il cliente richiede un sopralluogo per il giorno 15 Settembre alle ore 15:00.
*   Google Calendar segnala che in quella fascia oraria e' gia' presente un evento (es. *"Ferie Staff"* o *"Manutenzione Villa"*).
*   ZAK blocca l'inserimento automatico in agenda e mostra un avviso di **Conflitto Rilevato**.
*   **Azione consigliata:** Lo staff deve proporre uno slot alternativo (es. due ore prima, o il giorno successivo) o forzare la scrittura cliccando su *"Mantieni ZAK"* (che sovrascrive l'impegno esterno).

---

## 4. Risoluzione dei Problemi (Cosa fare se la sync fallisce)

In caso di mancata sincronizzazione:
1.  **Verifica lo stato di connessione:** Vai sul pannello impostazioni e controlla se compare il badge verde *"Connesso"*. Se e' rosso, effettua nuovamente il login OAuth.
2.  **Quota API Superata:** Google impone limiti giornalieri di chiamate. Se compare l'avviso di quota superata, ZAK mettera' le richieste in coda riprovando automaticamente ogni 15 minuti.
3.  **Webhook di Notifica disattivi:** Se i cambi fatti su Google non si riflettono su ZAK, il token del webhook potrebbe essere scaduto (scade ogni 7 giorni). Clicca su **"Aggiorna Connessione"** per rinnovare la sottoscrizione.

---

## 5. Note sulla Privacy e Governance dei Dati

*   ZAK accede solo ai calendari che selezioni esplicitamente nelle impostazioni. Non legge le email o altri dati del tuo account Google.
*   Tutti i token di accesso e di refresh sono crittografati a database mediante chiavi AES-256 e non sono mai accessibili al personale esterno o visibili nei log di sistema.
