# Piano dei Test Unitari Backend (QA Tecnico)

Questo documento definisce il piano di test unitari per il backend di ZAK, specificando gli scenari di test, i moduli target e i comportamenti attesi.

---

## 1. Booking Assistant Parsing (`booking-assistant-parser.test.ts`)

Verifica la capacita' del parser LLM/JSON di estrarre informazioni strutturate da messaggi non strutturati inviati dai clienti.

*   **Test Case 1.1: Estrazione Completa**
    *   *Input:* "Vorrei prenotare per circa 80 persone il 15 settembre 2026, budget €6000."
    *   *Output atteso:* `guests = 80`, `date = "2026-09-15"`, `budget = 6000`.
*   **Test Case 1.2: Dati Incompleti**
    *   *Input:* "Vorrei organizzare una festa ad agosto."
    *   *Output atteso:* `guests = null`, `date = null` (rilevamento mese = agosto, richiede follow-up per giorno preciso).
*   **Test Case 1.3: Date Relative**
    *   *Input:* "Festa sabato prossimo alle 20:00." (Assumendo data odierna Lunedi' 01/06/2026).
    *   *Output atteso:* `date = "2026-06-06"`, `time = "20:00"`.

---

## 2. Deduplicazione Contatti (`contact-deduplication.test.ts`)

Verifica l'algoritmo di merge e deduplicazione automatica dei contatti inbound.

*   **Test Case 2.1: Matching Numero WhatsApp**
    *   *Input:* Nuovo lead con telefono `+393331234567` e nome "Mario R.". Lead esistente con lo stesso telefono e nome "Mario Rossi".
    *   *Output atteso:* Identificazione duplicato, merge dei dettagli, nessun record duplicato creato.
*   **Test Case 2.2: Matching Email**
    *   *Input:* Email `mario.rossi@example.com` associata a contatti con telefoni diversi.
    *   *Output atteso:* Segnalazione duplicato per operatore con richiesta di conferma unione.
*   **Test Case 2.3: Numeri con Prefissi Differenti**
    *   *Input:* Confronto tra `0039 333 1234567`, `3331234567` e `+393331234567`.
    *   *Output atteso:* Identificati come lo stesso numero normalizzato E.164.

---

## 3. Finestra Temporale WhatsApp 24h (`whatsapp-window-policy.test.ts`)

Verifica il rispetto della policy Meta che vieta l'invio di messaggi non-template (session messages) dopo 24 ore dall'ultimo messaggio dell'utente.

*   **Test Case 3.1: Messaggio in Finestra Attiva**
    *   *Stato:* Ultimo messaggio utente ricevuto 2 ore fa.
    *   *Azione:* Invio messaggio di testo libero da parte dell'operatore.
    *   *Risultato atteso:* Successo (messaggio inviato alla coda di consegna).
*   **Test Case 3.2: Messaggio Fuori Finestra (Scaduta)**
    *   *Stato:* Ultimo messaggio utente ricevuto 25 ore fa.
    *   *Azione:* Invio messaggio di testo libero da parte dell'operatore.
    *   *Risultato atteso:* Errore di validazione policy (`403 Forbidden - Outside 24h Window`).
*   **Test Case 3.3: Invio di Template Autorizzato**
    *   *Stato:* Finestra chiusa (ultimo messaggio 3 giorni fa).
    *   *Azione:* Invio di un messaggio contrassegnato come Template registrato Meta.
    *   *Risultato atteso:* Successo (consentito da Meta per riaprire la finestra).

---

## 4. Validazione Agenda e Conflitti Prenotazioni (`agenda-validator.test.ts`)

Verifica le regole di lock e prevenzione dell'overbooking o dei conflitti orari.

*   **Test Case 4.1: Slot Libero**
    *   *Azione:* Inserimento prenotazione per il 20/06/2026 ore 18:00-24:00 (Nessun evento presente).
    *   *Risultato atteso:* Validazione superata.
*   **Test Case 4.2: Conflitto Diretto (Sovrapposizione)**
    *   *Stato:* Evento esistente il 20/06/2026 ore 15:00-20:00.
    *   *Azione:* Inserimento nuovo evento il 20/06/2026 ore 18:00-23:00.
    *   *Risultato atteso:* Fallimento validazione (`BookingConflictError`).
*   **Test Case 4.3: Buffer Time di Pulizia**
    *   *Stato:* Evento A termina alle 18:00. Regola di sistema richiede 2 ore di pulizia/buffer.
    *   *Azione:* Inserimento Evento B a partire dalle 19:00 nello stesso spazio.
    *   *Risultato atteso:* Fallimento validazione (violazione buffer time).

---

## 5. Configurazione e Risoluzione Automazioni (`automation-resolver.test.ts`)

Verifica l'esecuzione dei trigger e delle condizioni delle automazioni commerciali.

*   **Test Case 5.1: Trigger Stato Preventivo**
    *   *Trigger:* Cambiamento stato preventivo in `inviato`.
    *   *Azione attesa:* Creazione task di follow-up a +3 giorni.
    *   *Risultato atteso:* Task inserito correttamente nel DB con la scadenza calcolata.
*   **Test Case 5.2: Condizione Orario Operativo**
    *   *Trigger:* Ricezione messaggio alle 23:30 (Fuori orario).
    *   *Risultato atteso:* Invio immediato del messaggio di auto-risposta fuori orario.

---

## 6. Parsing Voice Intent (`voice-intent-parser.test.ts`)

Verifica la traduzione dei testi trascritti dalle chiamate in comandi/intenti strutturati per l'agenda.

*   **Test Case 6.1: Intento "Segna Visita"**
    *   *Trascrizione:* "Ok allora ci vediamo per il sopralluogo martedi' prossimo alle tre del pomeriggio."
    *   *Output atteso:* `intent = "schedule_visit"`, `datetime = "2026-06-09T15:00:00"`.
*   **Test Case 6.2: Rilevamento Confidenza Bassa**
    *   *Trascrizione:* "Si' forse passo in settimana ciao."
    *   *Output atteso:* `confidence = low`, richiede fallback/assegnazione a operatore umano.

---

## 7. Verifica Ruoli e Stati Utente (`user-auth-roles.test.ts`)

Verifica il controllo accessi (RBAC) a livello di API backend.

*   **Test Case 7.1: Accesso Admin a Security Log**
    *   *Utente:* Ruolo `admin`.
    *   *Risultato atteso:* `200 OK` sull'endpoint `/api/security/audit-log`.
*   **Test Case 7.2: Accesso Staff a Security Log**
    *   *Utente:* Ruolo `staff`.
    *   *Risultato atteso:* `403 Forbidden`.
*   **Test Case 7.3: Utente Disattivato**
    *   *Utente:* Ruolo `manager` con stato `disattivato`.
    *   *Risultato atteso:* `401 Unauthorized` su qualsiasi endpoint.
