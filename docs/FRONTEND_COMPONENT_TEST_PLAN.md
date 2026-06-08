# Piano dei Test Componenti Frontend (QA Interfaccia)

Questo documento definisce gli scenari di test critici per i componenti dell'interfaccia utente (UI) dell'applicazione ZAK. Ogni scenario include i prerequisiti, le azioni dell'utente e il risultato atteso per la verifica manuale o automatica (es. tramite Playwright/Cypress).

---

## 1. Inbox Multi-Operatore (`inbox.spec.ts`)

Verifica la gestione in tempo reale della chat e delle presenze operatori.

### Scenario 1.1: Aggiornamento Stato Presenza Operatori
*   **Prerequisiti:** L'utente e' loggato e si trova sulla pagina `/inbox`. Un secondo operatore effettua l'accesso da un altro browser.
*   **Azione Utente:** Osservare il pannello laterale della presenza operatori.
*   **Risultato Atteso:** Il badge del secondo operatore passa da grigio (offline) a verde (online) con l'indicazione del nome.

### Scenario 1.2: Lock Conversazione Inibito
*   **Prerequisiti:** Conversazione con il cliente "Mario Rossi" aperta e attualmente in gestione/lock da parte dell'operatore A. L'utente (operatore B) apre la stessa conversazione.
*   **Azione Utente:** Provare a digitare nell'area di testo ed inviare un messaggio.
*   **Risultato Atteso:** L'area di testo e' disabilitata e mostra un avviso: *"Conversazione bloccata da Operatore A. Non puoi inviare messaggi."*

---

## 2. Gestione Contatti (`contatti.spec.ts`)

Verifica la visualizzazione, ricerca ed editing dei contatti.

### Scenario 2.1: Ricerca e Filtro Contatti
*   **Prerequisiti:** Database popolato con contatti demo (es. Mario Rossi, Luca Bianchi).
*   **Azione Utente:** Digitare "Mario" nella barra di ricerca e filtrare per "Stato: Attivo".
*   **Risultato Atteso:** La tabella mostra solo i record contenenti "Mario" che sono in stato attivo. I record non corrispondenti scompaiono.

### Scenario 2.2: Rilevamento Duplicato in Creazione
*   **Prerequisiti:** Esiste gia' un contatto con telefono `+393339998887`.
*   **Azione Utente:** Fare clic su "Nuovo Contatto" e inserire lo stesso numero di telefono.
*   **Risultato Atteso:** Compare un banner di avviso giallo: *"Attenzione: Un contatto con questo numero esiste gia'. Clicca qui per visualizzarlo o unire i dati."*

---

## 3. Gestione Preventivi (`preventivi.spec.ts`)

Verifica la creazione dei preventivi e la preview PDF.

### Scenario 3.1: Variazione Prezzo Dinamica
*   **Prerequisiti:** Modulo di creazione preventivo aperto.
*   **Azione Utente:** Inserire 100 ospiti, prezzo per persona a €90, e aggiungere un costo extra "DJ Set" di €500.
*   **Risultato Atteso:** Il calcolatore visuale aggiorna il totale a €9.500 in tempo reale senza ricaricare la pagina.

### Scenario 3.2: Apertura Anteprima PDF
*   **Prerequisiti:** Preventivo compilato.
*   **Azione Utente:** Fare clic sul pulsante "Anteprima PDF".
*   **Risultato Atteso:** Si apre la rotta `/preventivo-pdf-preview` mostrando il foglio A4 formattato con i dati appena configurati.

---

## 4. Agenda & Calendario (`agenda.spec.ts`)

Verifica la pianificazione e visualizzazione degli eventi.

### Scenario 4.1: Drag & Drop Evento
*   **Prerequisiti:** Visualizzazione mensile o settimanale dell'agenda aperta.
*   **Azione Utente:** Trascinare un evento dal giorno 10 al giorno 12.
*   **Risultato Atteso:** L'evento si sposta visivamente. Viene mostrato un toast di notifica: *"Data evento aggiornata al 12 settembre."* L'evento si riposiziona correttamente.

---

## 5. Gestione Task (`task.spec.ts`)

Verifica la checklist e le scadenze dello staff.

### Scenario 5.1: Completamento Task
*   **Prerequisiti:** Elenco dei task visualizzato nella dashboard o nella pagina dedicata.
*   **Azione Utente:** Spuntare la checkbox del task "Invia contratto a Rossi".
*   **Risultato Atteso:** La riga del task viene barrata visivamente, il contatore dei task completati sale e il task scompare dall'elenco "Da fare" dopo 1 secondo.

---

## 6. Configurazione Automazioni (`automazioni.spec.ts`)

Verifica l'interfaccia di regole e ricorrenze.

### Scenario 6.1: Creazione Nuova Regola
*   **Prerequisiti:** Pagina `/automazioni` aperta.
*   **Azione Utente:** Fare clic su "Nuova Regola", impostare Trigger = "Preventivo Creato" e Azione = "Invia WhatsApp di Benvenuto".
*   **Risultato Atteso:** La regola viene salvata e mostrata nell'elenco delle automazioni attive con un interruttore di attivazione/disattivazione.

---

## 7. Impostazioni Staff e Gestione Ruoli Mock (`admin-roles.spec.ts`)

Verifica il comportamento della UI in base ai ruoli configurati.

### Scenario 7.1: Simulazione Ruolo Staff (Autorizzazioni Limitate)
*   **Prerequisiti:** Pagina `/admin-roles` aperta. Ruolo simulato impostato su "Staff".
*   **Azione Utente:** Provare ad accedere alla pagina `/security-audit-mock` o tentare di modificare i permessi di un utente.
*   **Risultato Atteso:** I pulsanti di salvataggio permessi sono disabilitati o nascosti. Se si tenta l'accesso diretto alla rotta riservata, si viene reindirizzati alla pagina `/access-denied-mock`.
