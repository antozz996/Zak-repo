# Specifica Tecnica - Generazione Preventivo PDF

Questa specifica definisce i requisiti, la struttura e le linee guida grafiche per il motore di generazione automatica dei preventivi in formato PDF all'interno di ZAK.

---

## 1. Struttura del Documento A4

Il preventivo generato deve essere ottimizzato per la stampa ed il salvataggio in formato **A4 verticale (portrait)**, idealmente confinato in una singola pagina per eventi semplici o al massimo due pagine per convenzioni aziendali complesse.

### Layout del PDF:
1. **Intestazione (Header):**
   - Logo della venue posizionato in alto a sinistra.
   - Nome della Venue, contatti, indirizzo email e recapito telefonico in alto a destra.
   - Numero identificativo del preventivo (es. `PRV-2026-0082`) e Data di emissione.
2. **Dati del Cliente:**
   - Nome e Cognome / Ragione Sociale.
   - Recapito telefonico e indirizzo Email.
3. **Riepilogo Dettagli Evento:**
   - Tipologia evento (es. *Matrimonio*, *Festa di Laurea*).
   - Data concordata ed Orario (inizio/fine stimati).
   - Numero di invitati confermati.
4. **Tabella Economica (Pacchetti & Servizi):**
   - Tabella dettagliata contenente le voci di costo: descrizione del servizio (es. *Affitto sala Loft*, *Catering buffet*, *DJ Set*), quantità, prezzo unitario e subtotale.
   - Riquadro del **Totale complessivo** evidenziato (Imponibile, IVA, Totale Lordo).
5. **Note e Condizioni Legali (Footer):**
   - Termine di validità della proposta (es. *"La presente offerta è valida per 14 giorni dall'emissione"*).
   - Modalità di pagamento (es. *"Acconto del 30% per il blocco della data, saldo entro 7 giorni dall'evento"*).
   - Condizioni di recesso e note HACCP per le torte esterne.

---

## 2. Dettagli Dati Richiesti (Schema Database)

Il generatore di PDF (es. utilizzando librerie come `react-pdf` o `pdfkit` su Node.js) deve ricevere in ingresso un oggetto JSON strutturato:

```json
{
  "preventivo_codice": "PRV-2026-0042",
  "data_emissione": "2026-06-02",
  "scadenza_offerta": "2026-06-16",
  "cliente": {
    "nome": "Giulia Bianchi",
    "telefono": "+39 348 9876543",
    "email": "giulia.bianchi@example.com"
  },
  "evento": {
    "tipo": "Laurea",
    "data": "2026-06-28",
    "partecipanti": 80
  },
  "servizi": [
    { "descrizione": "Affitto esclusivo Sala Loft con impianto audio", "prezzo": 1000.00 },
    { "descrizione": "Servizio catering a buffet (finger food caldi e freddi)", "prezzo": 1200.00 },
    { "descrizione": "DJ Set con console e tecnico luci", "prezzo": 500.00 }
  ],
  "totale_imponibile": 2700.00,
  "aliquota_iva": 22,
  "totale_iva": 594.00,
  "totale_complessivo": 3294.00,
  "condizioni": "Acconto del 30% da versare tramite bonifico bancario per confermare la prenotazione."
}
```

---

## 3. Stile Visuale Consigliato

Il PDF deve rispecchiare l'estetica premium di ZAK:
- **Tipografia:** Utilizzo di font puliti e moderni (es. *Helvetica* o *Roboto*).
- **Tavolozza Colori:**
  - Colore primario (Intestazioni e bordi principali): Grigio scuro / Antracite (`#111827`).
  - Colore di accento (Prezzi e totali): Blu Navy (`#1e3a8a`) o Violetto (`#6d28d9`).
  - Colore di sfondo tabelle: Grigio chiaro neutro (`#f9fafb`).
- **Margini:** Margine fisso di 20mm su tutti i lati per garantire una corretta formattazione in fase di stampa.

---

## 4. Convenzione Naming File

I file PDF generati e memorizzati su cloud storage (es. AWS S3 o Google Cloud Storage) devono seguire una convenzione standardizzata per facilitare la ricerca e l'archiviazione:

`preventivo_[CODICE_PREVENTIVO]_[NOME_CLIENTE]_[DATA_EVENTO].pdf`

*Esempio:* `preventivo_PRV-2026-0042_Giulia_Bianchi_2026-06-28.pdf` (tutti i caratteri speciali e gli spazi vanno sanitizzati in underscore).

---

## 5. Condivisione e Recapito (WhatsApp & Email)

Una volta generato il PDF a backend:
1. **Salvataggio su Cloud Storage:** Il server carica il file e ottiene un URL pubblico temporaneo o firmato (Signed URL) valido per 30 giorni.
2. **Invio via WhatsApp:** ZAK richiama le API Meta WhatsApp Business inviando un messaggio di tipo template multimediale (`document`) contenente il link al PDF. Il cliente visualizza l'anteprima del file direttamente nella chat di WhatsApp.
3. **Invio via Email:** Il sistema invia un'email automatica contenente il preventivo in allegato e il link interattivo per la conferma online.
