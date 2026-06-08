# Piano di Test QA - Google Calendar Integration

Questo documento definisce i passi per validare l'integrazione e la sincronizzazione bidirezionale tra l'agenda di ZAK e Google Calendar.

---

## Scenari di Test (14 Casi)

### Caso 1: Flusso di connessione OAuth di successo
*   **Prerequisiti:** Utente loggato su ZAK. Account Google valido pronto all'uso.
*   **Step:**
    1. Andare su `/google-calendar-settings-mock`.
    2. Cliccare su "Connetti Account".
    3. Acconsentire alle richieste di permessi nella pagina di login Google.
*   **Risultato atteso:** Reindirizzamento di ritorno su ZAK con badge verde *"Account Connesso"* e indirizzo email visualizzato correttamente.

### Caso 2: Flusso OAuth negato o annullato dal client
*   **Prerequisiti:** Account Google non connesso.
*   **Step:**
    1. Cliccare su "Connetti Account".
    2. Nella schermata di consenso Google, cliccare su "Annulla" o chiudere la finestra.
*   **Risultato atteso:** Ritorno su ZAK, badge rosso *"Account non collegato"*, nessun token salvato a database e toast di errore *"Connessione annullata"*.

### Caso 3: Selezione del calendario di lavoro
*   **Prerequisiti:** Account Google connesso.
*   **Step:**
    1. Aprire il menu a tendina "Calendario Principale".
    2. Modificare la selezione da "Calendario Eventi Zak" a un calendario alternativo.
    3. Salvare la configurazione.
*   **Risultato atteso:** La selezione viene salvata a database e le successive chiamate API utilizzano il nuovo Calendar ID.

### Caso 4: Verifica disponibilita' data libera
*   **Prerequisiti:** Google Calendar connesso. Nessun evento inserito per il 20 Giugno dalle 10:00 alle 12:00.
*   **Step:**
    1. Richiedere una prenotazione per quella data/ora tramite chat o form.
*   **Risultato atteso:** Il controllo disponibilita' risponde con esito positivo (data libera).

### Caso 5: Verifica disponibilita' data occupata
*   **Prerequisiti:** Presenza di un evento denominato "Ferie" su Google Calendar per il 20 Giugno dalle 10:00 alle 12:00.
*   **Step:**
    1. Richiedere un sopralluogo per il 20 Giugno alle 11:00.
*   **Risultato atteso:** Il sistema segnala la data come occupata e impedisce la prenotazione automatica.

### Caso 6: Proposta di date alternative
*   **Prerequisiti:** Slot richiesto occupato in agenda.
*   **Step:**
    1. Avviare il flusso dell'AI Booking Assistant per una data occupata.
*   **Risultato atteso:** L'AI propone date o orari alternativi liberi piu' vicini a quelli originari (es. il giorno dopo o due ore dopo).

### Caso 7: Creazione automatica evento da preventivo confermato
*   **Prerequisiti:** Preventivo creato in ZAK in stato bozza.
*   **Step:**
    1. Cambiare lo stato del preventivo in "Confermato".
*   **Risultato atteso:** Viene effettuata una chiamata POST a Google Calendar API. L'evento viene creato con il titolo e le note del preventivo.

### Caso 8: Aggiornamento evento da preventivo modificato
*   **Prerequisiti:** Preventivo gia' confermato e sincronizzato con Google Calendar.
*   **Step:**
    1. Modificare l'orario del preventivo su ZAK (es. spostandolo dalle 16:00 alle 17:00).
*   **Risultato atteso:** ZAK invia una richiesta PATCH o PUT a Google Calendar aggiornando l'evento corrispondente identificato tramite `google_event_id`.

### Caso 9: Cancellazione evento da preventivo annullato
*   **Prerequisiti:** Preventivo confermato e presente su Google Calendar.
*   **Step:**
    1. Cambiare lo stato del preventivo in "Rifiutato" o eliminarlo da ZAK.
*   **Risultato atteso:** Invio di una richiesta DELETE a Google API e rimozione dell'evento sia dal calendario esterno che dall'agenda ZAK.

### Caso 10: Sync Inbound - Rilevazione evento aggiunto da Google Calendar
*   **Prerequisiti:** Sincronizzazione bidirezionale attiva.
*   **Step:**
    1. Creare un evento "Sopralluogo Rossi" direttamente dall'app di Google Calendar.
    2. Attendere la ricezione del webhook push di Google.
*   **Risultato atteso:** ZAK rileva la notifica, interroga le ultime modifiche, e inserisce l'evento corrispondente nell'agenda locale.

### Caso 11: Sync Inbound - Rilevazione evento eliminato da Google
*   **Prerequisiti:** Evento sincronizzato presente in entrambi i calendari.
*   **Step:**
    1. Eliminare l'evento dall'interfaccia di Google Calendar.
*   **Risultato atteso:** Ricezione del webhook push, identificazione dell'evento locale tramite `google_event_id` ed eliminazione dello stesso dall'agenda di ZAK.

### Caso 12: Gestione errore temporaneo e retry
*   **Prerequisiti:** Google API restituisce errore 503 (Servizio Temporaneamente Non Disponibile).
*   **Step:**
    1. Avviare un'operazione di sincronizzazione.
*   **Risultato atteso:** La richiesta fallisce ma viene inserita nella coda dei tentativi. Il sistema riprova con backoff esponenziale fino a 3 volte prima di notificare l'errore.

### Caso 13: Sospensione sync per revoca permessi
*   **Prerequisiti:** Sync attiva. L'utente revoca i permessi a ZAK dalle impostazioni del suo account Google.
*   **Step:**
    1. Tentare una sincronizzazione da ZAK.
*   **Risultato atteso:** Il server riceve errore 401/403. Lo stato di sincronizzazione dell'utente viene impostato su "Sospeso" e viene inviato un toast/alert che invita a ricollegare l'account.

### Caso 14: Timezone Europe/Rome
*   **Prerequisiti:** Impostazione timezone del server e di Google Calendar impostate su Europe/Rome.
*   **Step:**
    1. Creare un evento su Google Calendar alle ore 15:00.
*   **Risultato atteso:** L'evento viene visualizzato su ZAK esattamente alle ore 15:00 senza sfasamenti orari dovuti a conversioni UTC errate.
