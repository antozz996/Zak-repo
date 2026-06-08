# Specifica Integrazione - Voice Assistant (Vapi/Bland)

Questo documento definisce le specifiche per l'integrazione di assistenti vocali AI telefonici tramite provider esterni come Vapi o Bland.ai all'interno dell'ecosistema ZAK.

---

## 1. Architettura e Flusso di Chiamata

ZAK delega la gestione della chiamata telefonica VoIP e della conversazione vocale in tempo reale (TTS/STT) al provider esterno, fornendo istruzioni dinamiche tramite webhook e ricevendo i dati strutturati al termine della telefonata.

```
[Cliente] <--- Telefonata (SIP/PSTN) ---> [Vapi / Bland.ai]
                                                 |
                                                 | (Richiesta prompt iniziale)
                                                 v
                                          [ZAK API Server] (Fornisce contesto venue/disponibilita')
                                                 |
                                                 | (Conversazione vocale in tempo reale)
                                                 v
                                        [Fine Telefonata]
                                                 |
                                                 | (Invia Trascrizione e Dati estratti)
                                                 v
                                          [ZAK Webhook] --> Aggiorna Agenda/Contatti
```

---

## 2. Payload Atteso al Termine della Chiamata (Call Webhook)

Quando la chiamata termina, il provider effettua una richiesta `POST /api/webhooks/voice` con i dati riassuntivi della telefonata.

```json
{
  "call_id": "c1234567-89ab-cdef-0123-456789abcdef",
  "phone_number_customer": "+393339876543",
  "direction": "inbound" | "outbound",
  "duration_seconds": 124,
  "status": "completed",
  "recording_url": "https://provider-storage.com/recordings/c1234567.mp3",
  "transcript": "Ciao, vorrei prenotare una visita alla villa per martedi' prossimo verso le sedici. Mi chiamo Giovanni Rossi.",
  "analysis": {
    "summary": "Il cliente Giovanni Rossi richiede un sopralluogo per martedi' 09/06/2026 alle ore 16:00.",
    "intent": "schedule_visit",
    "parameters": {
      "customer_name": "Giovanni Rossi",
      "date": "2026-06-09",
      "time": "16:00",
      "guests": null
    },
    "confidence_score": 0.92
  }
}
```

---

## 3. Parsing degli Intenti e Gestione della Confidenza (Confidence)

ZAK analizza il `confidence_score` restituito dal provider per decidere se elaborare automaticamente l'azione o richiedere la supervisione umana.

*   **Soglia di Approvazione Automatica (Confidence >= 0.85):**
    *   Il sistema esegue l'azione (es. prenota lo slot di visita in agenda come "provvisorio" o crea il task).
    *   Invia una notifica di riepilogo allo staff: *"Chiamata gestita con successo. Visita inserita il 09/06 alle 16:00."*
*   **Soglia di Supervisione Umana (0.60 <= Confidence < 0.85):**
    *   Lo slot in agenda viene contrassegnato come *"Da Confermare (Attesa Review)"* in colore arancione.
    *   Viene creato un task per lo staff commerciale: *"Rivedi trascrizione chiamata da +393339876543 e conferma data sopralluogo."*
*   **Soglia di Rifiuto / Fallback (Confidence < 0.60):**
    *   Nessuna operazione in agenda. Il sistema assegna la chat WhatsApp del cliente all'operatore umano per riprendere il contatto manualmente.

---

## 4. Gestione Errori e Fallback Telefonico durante la Chiamata

Se il sistema AI rileva criticita' durante la conversazione attiva:

*   **Difficolta' di Comprensione:** Se l'utente ripete la stessa richiesta o l'STT fallisce per 2 volte consecutive (rumore di fondo o dialetto stretto), l'assistente pronuncia la frase:
    > *"Mi dispiace, non sono sicuro di aver capito correttamente. Trasferisco subito la chiamata a un mio collega dello staff."*
*   **Trasferimento di Chiamata (SIP Transfer):** Il provider esegue un comando di deviazione di chiamata (SIP Refer) inoltrando la telefonata sul numero telefonico fisso o cellulare della venue.

---

## 5. Privacy, Sicurezza e Ritenzione dei Dati (GDPR)

Le registrazioni vocali e le trascrizioni contengono dati personali sensibili che richiedono misure rigorose:

*   **Consenso Vocale:** All'inizio della chiamata, l'assistente deve pronunciare una breve formula informativa: *"La chiamata e' gestita da assistente virtuale AI e potrebbe essere registrata per finalita' organizzative. Proseguendo acconsente alla nostra privacy policy."*
*   **Cancellazione delle Registrazioni:** I file audio (.mp3) memorizzati sui server temporanei del provider vocale devono essere scaricati su storage ZAK protetto ed eliminati dal provider esterno entro 24 ore.
*   **Retention Policy:** Trascrizioni e registrazioni memorizzate su ZAK vengono cancellate automaticamente dopo 90 giorni dall'evento, riducendo l'esposizione di dati sensibili a lungo termine.
