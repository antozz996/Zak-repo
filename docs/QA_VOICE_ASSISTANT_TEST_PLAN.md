# Piano di Test QA - Voice Assistant (Vapi/Bland.ai)

Questo documento definisce i casi di test manuali per convalidare il flusso di webhook, l'analisi degli intenti delle chiamate vocali e l'integrazione con il CRM e l'agenda di ZAK.

---

## Scenari di Test (14 Casi)

### Caso 1: Ricezione webhook post-chiamata (successo)
*   **Prerequisiti:** Chiamata telefonica simulata completata sul provider.
*   **Step:**
    1. Inviare una richiesta POST a `/api/webhooks/voice` con un payload JSON valido.
*   **Risultato atteso:** Il server risponde con `200 OK` e registra la chiamata a database.

### Caso 2: Webhook con firma di sicurezza non valida
*   **Prerequisiti:** Endpoint `/api/webhooks/voice` protetto da firma.
*   **Step:**
    1. Inviare un payload post-chiamata alterando l'header di firma (es. `X-Vapi-Signature` errato).
*   **Risultato atteso:** Il server risponde con `401 Unauthorized` e rifiuta l'elaborazione del payload.

### Caso 3: Intento "schedule_visit" con confidenza alta
*   **Prerequisiti:** Payload con `confidence_score` = 0.92, data, ora e nome cliente presenti.
*   **Step:**
    1. Inviare il webhook con i parametri estratti.
*   **Risultato atteso:** L'agenda di ZAK inserisce un evento provvisorio in verde, il contatto viene creato ed associato, non viene richiesto intervento manuale.

### Caso 4: Intento "schedule_visit" con confidenza media
*   **Prerequisiti:** Payload con `confidence_score` = 0.70 (es. orario espresso in modo approssimativo).
*   **Step:**
    1. Inviare il webhook.
*   **Risultato atteso:** L'evento viene inserito in agenda nello stato "Da Confermare" (in arancione) e viene generato un task per lo staff commerciale.

### Caso 5: Intento "schedule_visit" con confidenza bassa
*   **Prerequisiti:** Payload con `confidence_score` = 0.50.
*   **Step:**
    1. Inviare il webhook.
*   **Risultato atteso:** Nessun evento viene creato in agenda. La chat WhatsApp del contatto viene assegnata in Inbox con stato "Richiesta Intervento Umano" e priorita' "Urgente".

### Caso 6: Intento commerciale ("commercial_info")
*   **Prerequisiti:** Payload con richiesta di informazioni di prezzo o pacchetti catering.
*   **Step:**
    1. Inviare il webhook con intent `commercial_info`.
*   **Risultato atteso:** Il sistema crea un task commerciale assegnato al Manager: *"Ricontattare per preventivo e listino prezzi"*.

### Caso 7: Intento promemoria ("create_reminder")
*   **Prerequisiti:** Il cliente chiama chiedendo di ricordare allo staff un dettaglio dell'evento.
*   **Step:**
    1. Inviare il webhook.
*   **Risultato atteso:** Viene generato un task con scadenza corretta nella Task Board con i dettagli della nota.

### Caso 8: Trascrizione ambigua o fuori contesto
*   **Prerequisiti:** Trascrizione con frasi incomprensibili o spam.
*   **Step:**
    1. Inviare il webhook con intent `none` o `unknown`.
*   **Risultato atteso:** Il sistema contrassegna la chiamata come "Da revisionare" e non crea appuntamenti automatici.

### Caso 9: Payload duplicato (Call ID gia' elaborato)
*   **Prerequisiti:** Webhook per la chiamata con `call_id: "c123"` gia' elaborato in precedenza.
*   **Step:**
    1. Inviare nuovamente lo stesso payload con `call_id: "c123"`.
*   **Risultato atteso:** Il server risponde con `200 OK` (o `208 Already Reported`) e ignora l'elaborazione per evitare duplicazioni in agenda o nei task.

### Caso 10: Errore del server durante l'avvio chiamata
*   **Prerequisiti:** Il provider interroga ZAK prima di avviare la chiamata per avere informazioni.
*   **Step:**
    1. Simulare un blocco delle API di ZAK (timeout).
*   **Risultato atteso:** Il provider vocale applica il fallback predefinito, risponde al cliente e avvia la deviazione di chiamata (SIP Refer) allo staff.

### Caso 11: Telefonata senza audio / Trascrizione vuota
*   **Prerequisiti:** Chiamata muta o con solo rumore bianco.
*   **Step:**
    1. Inviare webhook con `transcript: ""` e `duration_seconds: 5`.
*   **Risultato atteso:** La chiamata viene registrata come "Muta/Fallita" nel log contatti, non viene creata alcuna attivita' o agenda.

### Caso 12: Associazione a contatto esistente tramite numero di telefono
*   **Prerequisiti:** Contatto "Luigi Verdi" presente a database con telefono `+39333111222`.
*   **Step:**
    1. Ricevere un webhook di chiamata proveniente dal numero `+39333111222`.
*   **Risultato atteso:** La chiamata e la trascrizione vengono salvate direttamente all'interno della timeline del contatto "Luigi Verdi" gia' esistente.

### Caso 13: Creazione nuovo contatto da numero non registrato
*   **Prerequisiti:** Nessun contatto in rubrica con numero `+393444555666`.
*   **Step:**
    1. Ricevere un webhook da `+393444555666`.
*   **Risultato atteso:** Creazione automatica di una nuova scheda contatto CRM popolando il numero telefonico ed inserendo il nome qualificato dall'AI.

### Caso 14: Cancellazione automatica dei dati (Retention GDPR)
*   **Prerequisiti:** Record di chiamata vocale e file audio vecchi di 91 giorni memorizzati.
*   **Step:**
    1. Esecuzione del cron job di pulizia dati notturno.
*   **Risultato atteso:** Il file audio viene eliminato dallo storage e la trascrizione viene rimossa o oscurata, mantenendo solo i metadati statistici anonimizzati della telefonata.
