# Specifica Prodotto - LLM Booking Assistant (Structured JSON)

Questa specifica definisce i requisiti per l'evoluzione del bot di ZAK da un parsing di intenti rule-based (a regole rigide) a un assistente LLM generativo in grado di estrarre informazioni strutturate in formato JSON direttamente dalle chat WhatsApp e dalle trascrizioni vocali.

---

## 1. Informazioni da Estrarre (Schema JSON)

L'obiettivo dell'LLM è analizzare la conversazione e popolare il seguente schema JSON strutturato per facilitare l'inserimento automatico a database:

```json
{
  "$schema": "http://json-schema.org/draft-07/schema#",
  "title": "BookingExtraction",
  "type": "object",
  "properties": {
    "cliente_nome": {
      "type": "string",
      "description": "Nome e cognome del cliente, se forniti."
    },
    "tipo_evento": {
      "type": "string",
      "enum": ["compleanno", "laurea", "matrimonio", "aziendale", "altro", "sconosciuto"],
      "description": "Tipologia dell'evento richiesto."
    },
    "data_evento": {
      "type": "string",
      "format": "date",
      "description": "Data dell'evento in formato YYYY-MM-DD. Se indicata a parole (es. 'sabato prossimo'), convertire nella data effettiva rispetto alla data corrente del sistema."
    },
    "numero_invitati": {
      "type": "integer",
      "minimum": 0,
      "description": "Numero stimato di invitati all'evento."
    },
    "budget_stimato": {
      "type": "number",
      "minimum": 0,
      "description": "Budget massimo indicato dal cliente in Euro."
    },
    "preferenze": {
      "type": "array",
      "items": { "type": "string" },
      "description": "Richieste particolari come open bar, buffet vegano, DJ set, allestimento red carpet."
    },
    "livello_confidenza": {
      "type": "string",
      "enum": ["alto", "medio", "basso"],
      "description": "Grado di certezza dell'AI sui dati estratti basato sui messaggi."
    }
  },
  "required": ["tipo_evento", "livello_confidenza"]
}
```

---

## 2. Esempio Prompt di Sistema (System Prompt)

L'LLM (es. Gemini 1.5 Flash o GPT-4o) viene istruito con il seguente prompt di sistema:

```
Sei l'assistente virtuale di prenotazione di Villa ZAK. Il tuo compito è analizzare la cronologia dei messaggi scambiati con il cliente ed estrarre i parametri di prenotazione strutturati secondo lo schema JSON richiesto.

Data corrente del sistema: {{CURRENT_DATE}} (usa questo riferimento per calcolare date relative come "sabato prossimo" o "fine mese").

Regole di comportamento:
1. Sii estremamente preciso nell'estrazione dei dati. Non inventare o assumere parametri se il cliente non li ha espressi chiaramente.
2. Converti i numeri di invitati espressi a intervalli (es. "saremo tra i 50 e i 60") nel valore medio o massimo (es. 60).
3. Estrai le preferenze come elementi singoli dell'array (es. "open bar", "menu vegano").
4. Imposta "livello_confidenza" a "basso" se mancano più di due dati fondamentali (data, invitati, tipo evento) o se il cliente si esprime in modo vago.
```

---

## 3. Flusso Conversazionale ed Esempi

### Scenario A: Conversazione Lineare (Estrazione con Confidenza Alta)
- **Cliente:** *"Ciao, vorrei organizzare la mia festa di laurea per circa 80 persone il 20 giugno. Vorrei un buffet e un open bar."*
- **Risultato JSON dell'LLM:**
  ```json
  {
    "cliente_nome": null,
    "tipo_evento": "laurea",
    "data_evento": "2026-06-20",
    "numero_invitati": 80,
    "budget_stimato": null,
    "preferenze": ["buffet", "open bar"],
    "livello_confidenza": "alto"
  }
  ```
- **Azione ZAK:** Il sistema popola i campi della scheda di importazione, risponde confermando la disponibilità e chiedendo il nome del laureando.

---

## 4. Gestione Confidenza Bassa e Domande di Follow-up

Se il livello di confidenza è **basso** o **medio** (es. mancano dettagli essenziali):
- **Strategia di follow-up:** L'AI non deve inventare dati, ma formulare una risposta educata per completare lo schema JSON.
- **Esempio:**
  - *Cliente:* *"Ciao, avete spazio per una festa aziendale a fine mese?"*
  - *LLM JSON:*
    ```json
    {
      "tipo_evento": "aziendale",
      "data_evento": "2026-06-30",
      "livello_confidenza": "basso"
    }
    ```
  - *Risposta Generata dal Bot:* *"Certamente! Abbiamo ampi spazi per eventi aziendali a fine giugno. Per poterti inviare una proposta dettagliata, mi sapresti indicare approssimativamente il numero di partecipanti ed il vostro budget indicativo?"*

---

## 5. Criteri di Handoff allo Staff (Passaggio all'Umano)

Il bot deve sospendere le proprie risposte e passare la chat ad un operatore umano nei seguenti casi:
1. **Richiesta Sconto / Negoziazione:** Il cliente chiede sconti sul preventivo inviato (*"Potete farmi 1000€ invece di 1200€?"*).
2. **Insoddisfazione / Sentiment Negativo:** Rilevazione di toni frustrati o lamentele (*"State rispondendo in ritardo"*, *"Non mi piace questa proposta"*).
3. **Richiesta Esplicita di Supporto Umano:** Frasi come *"Voglio parlare con un operatore vero"* o *"Potete chiamarmi?"*.
4. **Confidenza Bassa Persistente:** Se dopo 3 messaggi di follow-up dell'AI il cliente continua a non fornire dati strutturati (es. messaggi confusi o inconcludenti).

---

## 6. Strategia di Fallback (Se l'LLM Fallisce)

- **Timeout o Errore API (es. limite di quota OpenAI/Gemini superato):** Il sistema passa immediatamente in modalità rule-based semplificata (inviando una risposta predefinita di cortesia: *"Grazie per la richiesta! Un nostro operatore ti risponderà a brevissimo"*).
- **Handoff forzato:** La chat viene impostata nello stato **Richiesta Intervento Umano** nell'Inbox dello staff con priorità **Urgente** per garantire che il cliente non rimanga senza risposte.
