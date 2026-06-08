# Piano di Test QA - LLM Booking Assistant (WhatsApp Bot)

Questo documento definisce il piano di test manuale per convalidare il flusso di qualificazione automatica delle chat WhatsApp e l'estrazione JSON strutturata tramite LLM.

---

## Scenari di Test (16 Casi)

### Caso 1: Estrazione lead completa (successo)
*   **Prerequisiti:** Conversazione in cui il cliente fornisce nome, tipo evento, data, invitati e budget.
*   **Step:**
    1. Simulare la ricezione dei messaggi contenenti tutti i dati.
*   **Risultato atteso:** L'LLM genera un JSON con confidenza "alto" e tutti i campi valorizzati.

### Caso 2: Lead senza data specificata
*   **Prerequisiti:** Il cliente indica il tipo di evento e gli invitati, ma non quando si terra'.
*   **Step:**
    1. Inviare il testo: *"Vorrei fare una festa di compleanno con 50 persone, mi date info?"*
*   **Risultato atteso:** JSON estratto con `data_evento: null` e `livello_confidenza: basso`. Il bot risponde chiedendo la data o il periodo di preferenza.

### Caso 3: Lead senza numero invitati
*   **Prerequisiti:** Il cliente specifica tipo evento e data, ma non la quantita' di invitati.
*   **Step:**
    1. Inviare: *"Vorrei prenotare per un matrimonio il 10 Ottobre 2026."*
*   **Risultato atteso:** JSON con `numero_invitati: null`. Il bot risponde chiedendo il numero approssimativo di partecipanti per consigliare la sala adatta.

### Caso 4: Data richiesta gia' occupata
*   **Prerequisiti:** La data del 12 Settembre 2026 risulta occupata da un evento confermato a database.
*   **Step:**
    1. Il cliente scrive: *"Vorrei prenotare la sala per il mio matrimonio il 12 Settembre 2026."*
*   **Risultato atteso:** L'AI rileva l'occupazione e risponde proponendo date alternative disponibili (es. i fine settimana adiacenti).

### Caso 5: Data richiesta libera
*   **Prerequisiti:** La data richiesta e' completamente libera a calendario.
*   **Step:**
    1. Il cliente richiede il sopralluogo per una data libera.
*   **Risultato atteso:** Il bot conferma la disponibilita' provvisoria e prosegue con la richiesta degli altri dati per il preventivo.

### Caso 6: Richiesta fuori tema (off-topic)
*   **Prerequisiti:** Messaggio non correlato alla prenotazione di eventi (es. richieste di lavoro, curiosita').
*   **Step:**
    1. Il cliente invia: *"State cercando personale per le pulizie?"*
*   **Risultato atteso:** L'AI non valorizza i campi dell'evento e risponde cortesemente indicando che inoltrera' la richiesta al reparto competente, attivando l'handoff.

### Caso 7: Messaggio offensivo, aggressivo o spam
*   **Prerequisiti:** Chat con insulti o pubblicita' non richiesta.
*   **Step:**
    1. Inviare un messaggio volgare o spam.
*   **Risultato atteso:** Handoff umano immediato. Il bot si spegne e la chat viene segnalata come "Urgente" per blocco/segnalazione.

### Caso 8: Richiesta esplicita di operatore umano
*   **Prerequisiti:** Chat attiva gestita dall'AI.
*   **Step:**
    1. Inviare: *"Voglio parlare con una persona reale, non con un bot."*
*   **Risultato atteso:** Sospensione immediata del bot (stato `ai_paused: true`), assegnazione all'operatore e notifica in Inbox.

### Caso 9: Richiesta di sconti o trattativa commerciale
*   **Prerequisiti:** Preventivo gia' noto o inviato.
*   **Step:**
    1. Il cliente scrive: *"Il prezzo e' troppo alto, potete farmi uno sconto del 10%?"*
*   **Risultato atteso:** Handoff automatico allo staff umano, poiche' l'AI non e' autorizzata a negoziare tariffe economiche.

### Caso 10: Rilevazione sentiment negativo
*   **Prerequisiti:** Cliente frustrato dai tempi di attesa o risposte.
*   **Step:**
    1. Il cliente scrive: *"State impiegando troppo tempo a rispondere, servizio pessimo!"*
*   **Risultato atteso:** Handoff umano immediato per gestire il cliente insoddisfatto.

### Caso 11: Validazione del formato JSON generato
*   **Prerequisiti:** L'LLM restituisce la risposta.
*   **Step:**
    1. Passare il testo generato al parser JSON di ZAK.
*   **Risultato atteso:** Il JSON e' sintatticamente valido e rispetta fedelmente lo schema richiesto in `LLM_BOOKING_ASSISTANT_SPEC.md`.

### Caso 12: Gestione JSON non valido o troncato
*   **Prerequisiti:** L'LLM restituisce una stringa non valida (es. per interruzione della connessione).
*   **Step:**
    1. Alimentare il sistema con una risposta JSON troncata.
*   **Risultato atteso:** Il parser rileva l'errore, attiva il fallback senza rompere l'applicazione e passa la chat allo staff.

### Caso 13: Fallback per timeout o superamento quote LLM
*   **Prerequisiti:** API di OpenAI/Gemini non raggiungibile.
*   **Step:**
    1. Inviare un messaggio utente mentre l'API esterna e' bloccata.
*   **Risultato atteso:** Risposta di cortesia predefinita inviata entro 10 secondi e disattivazione del bot per quella sessione.

### Caso 14: Aggiornamento contatto CRM
*   **Prerequisiti:** Estrazione conclusa con successo.
*   **Step:**
    1. L'operatore approva l'estrazione.
*   **Risultato atteso:** I campi del contatto CRM (nome, tipo evento prediletto) vengono aggiornati nel database con i dati estratti.

### Caso 15: Creazione preventivo in bozza
*   **Prerequisiti:** Dati estratti approvati.
*   **Step:**
    1. Cliccare su "Approva Estrazione".
*   **Risultato atteso:** Creazione automatica di un record nella tabella preventivi associato al contatto, con il numero ospiti e il budget inseriti come valori iniziali in stato "Bozza".

### Caso 16: Conversazione multi-turn (follow-up sequenziali)
*   **Prerequisiti:** Conversazione in piu' passaggi.
*   **Step:**
    1. Messaggio 1: *"Vorrei fare una laurea"* -> AI chiede data.
    2. Messaggio 2: *"Il 18 Luglio"* -> AI chiede invitati.
    3. Messaggio 3: *"Saremo circa 40"* -> AI chiede budget.
*   **Risultato atteso:** Il bot mantiene il contesto (stato conversazione a database) e raccoglie progressivamente i dati fino a completare il JSON finale.
