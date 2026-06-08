# Piano dei Test Integrazione Webhook WhatsApp

Questo documento definisce le specifiche e le procedure di test di integrazione per il gestore di webhook WhatsApp Cloud API (Meta) di ZAK.

---

## 1. Dataset dei Payload di Riferimento

Tutti i payload JSON per gli scenari descritti di seguito sono disponibili e documentati nel file:
*   [whatsapp-webhook-sample-payloads.json](file:///c:/Users/virgi/Desktop/ZAK/attached_assets/whatsapp-webhook-sample-payloads.json)

---

## 2. Scenari di Test di Integrazione

### Scenario 2.1: Challenge di Verifica Meta (GET Verification)
*   **Obiettivo:** Rispondere correttamente alla richiesta di validazione iniziale inviata dai server di Meta per confermare la proprieta' del webhook.
*   **Metodo HTTP:** `GET`
*   **Query Params (Mock):**
    *   `hub.mode=subscribe`
    *   `hub.challenge=1158201444`
    *   `hub.verify_token=zak_secure_verify_token_2026`
*   **Risultato Atteso:**
    *   Stato HTTP: `200 OK`
    *   Body: `1158201444` (Esattamente il valore del parametro challenge).

### Scenario 2.2: Messaggio Inbound di Testo (POST)
*   **Obiettivo:** Ricevere un messaggio di testo, abbinarlo o creare un contatto, e inserire il messaggio nella coda della Inbox.
*   **Payload di Riferimento:** `inbound_text_message`
*   **Risultato Atteso:**
    *   Stato HTTP: `200 OK` (Per notificare a Meta la ricezione riuscita ed evitare retry).
    *   Contatto "Mario Rossi" creato o aggiornato nel DB.
    *   Messaggio visibile nell'Inbox in tempo reale.

### Scenario 2.3: Messaggio Inbound con Allegato Immagine (POST)
*   **Obiettivo:** Ricevere un allegato multimediale, scaricare l'ID dell'immagine tramite API di Meta, salvarlo nello storage locale/S3 e registrare il link nel DB.
*   **Payload di Riferimento:** `inbound_media_image`
*   **Risultato Atteso:**
    *   Stato HTTP: `200 OK`.
    *   Record del file inserito in tabella `messages` e associato al competitor o contatto.

### Scenario 2.4: Stato Consegna Messaggi (POST Status: Delivered / Read)
*   **Obiettivo:** Aggiornare gli indicatori grafici (spunte grigie o blu) in base allo stato di recapito riportato da Meta.
*   **Payload di Riferimento:** `message_status_delivered` e `message_status_read`
*   **Risultato Atteso:**
    *   Stato HTTP: `200 OK`.
    *   Il record del messaggio inviato viene aggiornato con `status = "delivered"` e successivamente `status = "read"`.

---

## 3. Sicurezza e Firma dei Payload (Signature Validation)

Meta invia un'intestazione HTTP `X-Hub-Signature-256` calcolata come hash HMAC-SHA256 del corpo della richiesta utilizzando il segreto dell'App (App Secret) come chiave.

### Scenario 3.1: Firma Valida
*   **Azione:** Inviare una richiesta POST con payload valido e header `X-Hub-Signature-256` calcolato correttamente.
*   **Risultato Atteso:** `200 OK`, richiesta elaborata.

### Scenario 3.2: Firma Invalida o Mancante
*   **Azione:** Inviare una richiesta con firma casuale o vuota.
*   **Risultato Atteso:** `401 Unauthorized` o `403 Forbidden`, la richiesta viene bloccata a livello di middleware.

---

## 4. Gestione degli Errori e Tolleranza ai Guasti

### Scenario 4.1: Payload Duplicato (Idempotenza)
*   **Azione:** Inviare lo stesso identico payload di messaggio due volte di seguito (simulando un retry di rete da parte di Meta).
*   **Risultato Atteso:** Il sistema riconosce l'ID del messaggio (`wamid...`) gia' presente nel database e non effettua un secondo inserimento, restituendo comunque un codice `200 OK` per chiudere il loop di Meta.

### Scenario 4.2: Payload Incompleto o Malformato
*   **Payload di Riferimento:** `incomplete_payload`
*   **Risultato Atteso:** `400 Bad Request`. Il sistema logga l'errore senza crashare e rifiuta il payload anomalo.
