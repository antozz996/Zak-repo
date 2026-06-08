# Specifica UX - Realtime Inbox Multi-Operatore

Questo documento specifica i requisiti d'esperienza utente (UX) e di gestione degli stati in tempo reale per l'Inbox condivisa da piu' operatori contemporaneamente.

---

## 1. Presenza Operatori (Online/Offline)

La barra laterale sinistra dell'Inbox mostra l'elenco degli operatori dello staff attualmente attivi nella piattaforma.

*   **Indicatore Visivo:** Ogni operatore ha un badge circolare sul proprio avatar:
    *   **Verde (#22c55e):** Online e attivo sulla pagina Inbox negli ultimi 2 minuti.
    *   **Grigio (#94a3b8):** Offline o non attivo da oltre 5 minuti.
*   **Stato "In Lettura":** Se un altro operatore sta visualizzando la stessa chat dell'utente corrente, compare un piccolo occhio indaco con il testo *"Operatore [Nome] sta guardando questa conversazione"*.

---

## 2. Indicatore di Digitazione ("Sta scrivendo...")

Quando il cliente o un altro operatore digita nell'area di inserimento testo, deve essere mostrato un feedback visivo immediato.

*   **Lato Cliente (Inbound):** Se il cliente sta scrivendo su WhatsApp, compare un'animazione a tre puntini sospesi in fondo alla chat: `... [Nome Cliente] sta scrivendo`.
*   **Lato Operatore (Outbound):** Se un altro operatore sta componendo una risposta per la stessa conversazione, viene mostrato sopra l'area di input: `[Nome Operatore] sta scrivendo una risposta...`.

---

## 3. Stato di Lettura dei Messaggi (Spunte)

ZAK riflette gli stati di consegna reali riportati dai webhook di WhatsApp:

*   **Singola Spunta Grigia:** Messaggio inviato con successo dai server di ZAK ai server di Meta.
*   **Doppia Spunta Grigia:** Messaggio consegnato sul dispositivo del destinatario.
*   **Doppia Spunta Blu:** Messaggio letto dal destinatario.
*   *Nota:* Se il destinatario ha disattivato le conferme di lettura nelle proprie impostazioni di privacy su WhatsApp, il messaggio si fermera' allo stato di doppia spunta grigia.

---

## 4. Lock della Conversazione (Blocco Conflitti)

Per evitare che piu' operatori inviino risposte contrastanti allo stesso cliente contemporaneamente:

*   **Acquisizione Lock Automatico:** Nel momento in cui un operatore inizia a digitare nell'area di testo, la conversazione entra nello stato di **Lock Attivo** a suo nome.
*   **Visualizzazione per Altri Operatori:** Per tutti gli altri operatori che visualizzano quella chat, l'area di input viene disabilitata mostrando il messaggio:
    > 🔒 *Questa conversazione e' temporaneamente bloccata da [Nome Operatore].*
*   **Rilascio del Lock:** Il lock viene rilasciato automaticamente se:
    1.  L'operatore invia il messaggio.
    2.  L'operatore cambia conversazione.
    3.  Inattivita' di digitazione superiore a 45 secondi (Timeout automatico).
*   **Forzatura Sblocco (Escalation):** Un utente con ruolo `admin` o `manager` puo' premere un pulsante "Sblocca/Forza subentro" per rimuovere il lock e prendere in carico la conversazione.

---

## 5. Gestione Conflitti e Fallback Realtime

Se la connessione WebSocket o SSE (Server-Sent Events) si interrompe:

*   **Rilevamento Disconnessione:** Il sistema mostra un banner giallo in alto all'Inbox:
    > ⚠️ *Connessione in tempo reale persa. Tentativo di riconnessione in corso...*
*   **Modalita' Sola Lettura:** Durante la disconnessione, l'invio di messaggi viene inibito per evitare duplicazioni o invii fuori ordine.
*   **Polling di Fallback:** In caso di errore persistente, il client passa a una modalita' di polling HTTP ogni 10 secondi per aggiornare la chat in modo asincrono fino al ripristino del canale realtime.
