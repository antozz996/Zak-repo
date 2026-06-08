# Specifica Operativa - Google Calendar Sync

Questo documento definisce i requisiti tecnici e i flussi di integrazione per la sincronizzazione bidirezionale degli eventi tra ZAK e Google Calendar.

---

## 1. Flusso di Autenticazione OAuth 2.0

Per consentire a ZAK di accedere e scrivere sui calendari dello staff, ciascun utente (o la venue a livello centralizzato) deve eseguire l'autenticazione OAuth 2.0 con Google.

```
[Utente] --> Richiede Connessione Google Calendar
  --> [ZAK Server] Genera URL di Auth con scope:
      - https://www.googleapis.com/auth/calendar.events
      - https://www.googleapis.com/auth/calendar.readonly
  --> Redirect Utente su Google Consent Screen
  --> Utente Autorizza e Google reindirizza a ZAK con Authorization Code
  --> [ZAK Server] Scambia Code per Access Token & Refresh Token
  --> Salvataggio crittografato del Refresh Token in DB
```

*   **Refresh Token:** Deve essere salvato in modo sicuro (es. crittografato con AES-256-GCM) per consentire la sincronizzazione in background quando l'utente non e' loggato.

---

## 2. Selezione Calendario Principale

*   Una volta collegato l'account Google, la venue puo' scegliere quale specifico calendario utilizzare come destinazione per gli eventi (default: il calendario principale dell'utente).
*   ZAK crea un tag personalizzato o un gruppo di eventi per evitare di inquinare il calendario privato del gestore con note irrilevanti.

---

## 3. Webhook & Push Notifications (Google Calendar API)

Per catturare le modifiche effettuate dagli utenti direttamente all'interno dell'interfaccia di Google Calendar, ZAK registra un canale di notifica push.

*   **Endpoint di Webhook:** `POST /api/webhooks/google-calendar`
*   **Registrazione Canale (Watch):** ZAK richiede periodicamente (ogni 7 giorni, limite massimo di Google) il rinnovo del watch sul calendario target inviando un `id` univoco di canale e un `address` di callback.
*   **Gestione Notifiche Inbound:** Google invia una notifica ad ogni modifica (inserimento, modifica, eliminazione). Il corpo della notifica non contiene i dettagli dell'evento, ma solo l'ID della risorsa modificata. ZAK effettua quindi una chiamata API GET `events.get` per ottenere i dati aggiornati.

---

## 4. Risoluzione Conflitti ed Overbooking

In caso di modifiche concomitanti sia su ZAK che su Google Calendar (conflitto di sincronizzazione):

*   **Regola di Priorita' (Single Source of Truth):**
    *   Per le date bloccate o preventivi firmati, **ZAK ha la priorita' assoluta**. Se un evento Google Calendar viene spostato sovrapponendosi a una data bloccata su ZAK, lo spostamento su Google viene annullato o contrassegnato con un'etichetta *"CONFLITTO"* e lo staff riceve una notifica push immediata.
    *   Per le note e gli eventi informali di routine, l'ultima modifica effettuata in ordine temporale vince.
*   **Prevenzione Doppia Prenotazione:** ZAK blocca preventivamente la possibilita' di creare o accettare preventivi nelle fasce orarie che risultano occupate da eventi importati da Google Calendar (es. ferie dello staff o manutenzioni straordinarie).

---

## 5. Gestione Eventi Eliminati

*   **Eliminazione su Google:** Se un evento sincronizzato viene eliminato da Google Calendar, il webhook rileva lo stato `cancelled`. ZAK sposta l'evento corrispondente nella dashboard "Cestino" e invia un avviso allo staff per confermare l'eliminazione effettiva.
*   **Eliminazione su ZAK:** L'eliminazione di un evento su ZAK invia una richiesta HTTP `DELETE` all'API di Google Calendar rimuovendo istantaneamente l'evento sincronizzato.

---

## 6. Timezone e Standard Data

*   Tutti gli orari scambiati con le API di Google devono essere espressi in formato ISO 8601 comprensivi di offset di fuso orario.
*   **Timezone di Riferimento:** `Europe/Rome`.
*   Esempio di timestamp corretto: `2026-09-15T18:00:00+02:00` (ora legale estiva) o `2026-11-15T18:00:00+01:00` (ora solare).
*   ZAK converte internamente gli orari UTC del database nell'offset corrispondente italiano prima dell'invio.

---

## 7. Criteri di Retry e Gestione Limiti API (Rate Limiting)

*   **Backoff Esponenziale:** In caso di errore di connessione o errore temporaneo di Google (`500 Internal Server Error`), ZAK riprova l'invio dopo 1, 3, 9, 27 minuti.
*   **Gestione Limiti (Quota limits):** Google limita il numero di richieste al secondo. ZAK implementa una coda di scrittura asincrona (Redis/Queue) per scaglionare gli aggiornamenti massivi senza bloccare la UI.
