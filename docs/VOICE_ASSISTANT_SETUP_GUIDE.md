# Guida Integrazione - Voice Assistant AI (Vapi / Bland.ai)

Questa guida documenta come collegare provider esterni di assistenti vocali telefonici (come Vapi o Bland.ai) al webhook di ZAK per sincronizzare le chiamate effettuate con i lead e i contatti a sistema.

---

## 1. Architettura dell'Integrazione

L'assistente vocale (es. Vapi) gestisce la conversazione telefonica (TTS, STT, LLM Agent). Al termine della chiamata, o durante passaggi intermedi significativi, il provider invia una richiesta HTTP POST al webhook di ZAK:

```
[Telefono Cliente] <--> [Vapi / Bland.ai] (Chiamata Vocale)
                                |
                        (Webhook POST)
                                v
               [Server ZAK: /api/webhook/voice-assistant]
```

L'endpoint `/api/webhook/voice-assistant` elabora il report della chiamata, associa il contatto corrispondente tramite il numero di telefono, aggiorna la timeline ed eventualmente genera i task di follow-up per lo staff.

---

## 2. Configurazione su Vapi / Bland.ai

1. Accedi alla dashboard del tuo provider (es. [Vapi Dashboard](https://dashboard.vapi.ai/)).
2. Seleziona l'Assistente Vocale configurato per la tua venue.
3. Trova la sezione **Webhooks** o **Publish Settings**.
4. Imposta l'URL del Webhook a:
   `https://tuo-dominio-zak.com/api/webhook/voice-assistant`
5. Configura la chiave segreta (Header Authorization) per autenticare le chiamate in arrivo su ZAK.

---

## 3. Payload di Esempio (Vapi Post-Call Webhook)

ZAK si aspetta un payload JSON contenente i dettagli della telefonata, il riassunto strutturato e l'analisi degli intenti. Ecco la struttura di riferimento inviata da Vapi alla fine della conversazione:

```json
{
  "message": {
    "type": "end-of-call-report",
    "call": {
      "id": "c1234567-89ab-cdef-0123-456789abcdef",
      "customer": {
        "number": "+393331234567"
      },
      "startedAt": "2026-06-02T10:15:30Z",
      "endedAt": "2026-06-02T10:20:15Z",
      "durationSeconds": 285,
      "recordingUrl": "https://api.vapi.ai/recordings/rec_987654321.mp3",
      "transcript": "Bot: Ciao! Benvenuto a Villa ZAK. Come posso aiutarti?\nCliente: Ciao, vorrei informazioni per organizzare una festa di compleanno per i miei 30 anni a giugno.\nBot: Ottimo! Quanti invitati prevedi e per quale giorno?\nCliente: Saremo circa 50 persone, idealmente il weekend del 20 giugno. Vorrei sapere se c'è disponibilità e un'idea di costo.\nBot: Perfetto, ho registrato la richiesta per il 20 giugno con 50 persone. Ti faccio preparare un preventivo personalizzato dal nostro staff. C'è un indirizzo email a cui posso inviarlo?\nCliente: Sì, marco.rossi@example.com.\nBot: Perfetto, Marco. Riceverai presto una proposta su WhatsApp ed email. Grazie, buona giornata!",
      "summary": "Il cliente Marco Rossi ha richiesto disponibilità per una festa di compleanno di 30 anni per circa 50 persone il 20 giugno 2026. Ha fornito l'email marco.rossi@example.com ed è in attesa di un preventivo.",
      "analysis": {
        "intent": "richiesta_preventivo_compleanno",
        "parameters": {
          "guest_count": 50,
          "event_date": "2026-06-20",
          "customer_email": "marco.rossi@example.com",
          "customer_name": "Marco Rossi"
        },
        "sentiment": "positivo"
      }
    }
  }
}
```

---

## 4. Elaborazione del Webhook lato ZAK

Quando il server ZAK riceve il payload:
1. **Verifica Autenticità:** Verifica l'header di autorizzazione (es. `X-Webhook-Secret`) per assicurarsi che la chiamata arrivi effettivamente da Vapi.
2. **Ricerca Contatto:** Cerca un contatto nel database con il numero di telefono `+393331234567`.
   - Se il contatto esiste, associa la telefonata.
   - Se il contatto non esiste, ne crea uno nuovo inserendo le informazioni raccolte (`Marco Rossi`, email, telefono).
3. **Aggiornamento Timeline:** Crea un log di evento "chiamata vocale" con la trascrizione, il riassunto e il link di registrazione audio.
4. **Creazione Task Automatico:** Genera un task per lo staff con priorità basata sull'analisi:
   - *Titolo:* `"Follow-up chiamata voice - Marco Rossi"`
   - *Descrizione:* `"Preparare preventivo compleanno per 50 persone il 20 giugno 2026. Email fornita: marco.rossi@example.com"`
   - *Scadenza:* +24h dalla telefonata.

---

## 5. Checklist di Test per l'Integrazione

Per verificare che l'integrazione funzioni prima del rilascio in produzione:

- [ ] **Test Autenticazione:** Effettua una chiamata POST all'endpoint senza header segreto. Verifica che il server risponda con `401 Unauthorized`.
- [ ] **Test Formato Payload:** Invia un JSON malformato o privo di campi obbligatori (`customer.number`, `transcript`). Verifica che l'API gestisca l'errore con `400 Bad Request` senza mandare in crash l'applicazione.
- [ ] **Test Nuovo Contatto:** Esegui una chiamata POST di test simulando un numero di telefono non presente a database. Verifica che nel CRM venga inserita la nuova scheda cliente con i dati estratti dall'analisi dell'assistente vocale.
- [ ] **Test Contatto Esistente:** Esegui una chiamata POST simulando un numero di telefono già censito. Verifica che non si creino duplicati e che l'evento compaia nella timeline del contatto esistente.
- [ ] **Test Generazione Task:** Verifica che al termine del webhook venga generato correttamente un record nella tabella `tasks` associato a quel contatto e visibile nel pannello operativo.
- [ ] **Test Link Audio:** Verifica che l'URL `recordingUrl` sia formattato correttamente e che il player audio nell'Inbox riproduca il file MP3.
