# Guida al Dataset Demo Preventivi

Questo documento descrive la struttura del file `demo-preventivi.csv` situato in `attached_assets/`. Il file contiene un set di dati fittizi composto da **20 preventivi** collegati direttamente ai contatti registrati in `demo-contatti.csv`.

---

## 1. Struttura del CSV

Il file `demo-preventivi.csv` presenta le seguenti colonne:

- **`titolo` (Testo):** Il nome descrittivo del preventivo (es. *Proposta Laurea Medicina Giulia Bianchi*).
- **`importo` (Decimale):** Il valore economico stimato dell'evento espresso in Euro (es. `1800.00`).
- **`stato` (Enum):** Lo stato corrente della trattativa. I valori ammessi sono:
  - `opzionato`: Preventivo inviato e in attesa di conferma o con data bloccata temporaneamente.
  - `confermato`: Preventivo accettato dal cliente con acconto versato o contratto firmato.
  - `rifiutato`: Proposta respinta dal cliente (es. per budget o cambio location).
- **`data_creazione` (Data YYYY-MM-DD):** La data in cui il preventivo è stato emesso (es. `2026-05-29`).
- **`contatto_nome` (Testo):** Il nome e cognome del contatto di riferimento. Questo campo funge da chiave di collegamento logico con la colonna `nome` in `demo-contatti.csv`.
- **`note` (Testo):** Dettagli aggiuntivi sulla composizione del prezzo o sulle richieste del cliente.

---

## 2. Collegamento con i Contatti

I preventivi sono stati mappati uno-a-uno sui 20 contatti esistenti a sistema per consentire una simulazione realistica dei dati. Di seguito sono elencati alcuni esempi significativi:

1. **Marco Rossi (Festa 30 anni):**
   - *Stato:* `opzionato` (Importo: € 1.200,00)
   - *Scenario:* In attesa di follow-up per la scelta del buffet.
2. **Roberto Esposito (Team Building Azienda Tech):**
   - *Stato:* `confermato` (Importo: € 4.500,00)
   - *Scenario:* Evento corporate per 60 persone, acconto registrato.
3. **Francesco Di Maio (Compleanno 40 anni):**
   - *Stato:* `rifiutato` (Importo: € 2.200,00)
   - *Scenario:* Il lead è contrassegnato come *Perso* a causa del prezzo ritenuto troppo alto.
4. **Laura Benedetti (Doppia Laurea Gemelle):**
   - *Stato:* `confermato` (Importo: € 3.000,00)
   - *Scenario:* Evento confermato e calendarizzato per le due sorelle.

---

## 3. Indicazioni per futuri Sviluppatori (Data Import)

Durante lo sviluppo della funzione di importazione reale dei preventivi nel database, tenere a mente che:
1. **Risoluzione della Relazione:** Il sistema di import deve prima leggere `demo-contatti.csv` per popolare la tabella dei contatti, quindi leggere `demo-preventivi.csv` e associare ciascun preventivo all'ID del contatto corrispondente cercando per corrispondenza esatta sul campo `contatto_nome`.
2. **Validazione dello Stato:** Assicurarsi che l'importatore converta le stringhe di stato (`opzionato`, `confermato`, `rifiutato`) nei corrispondenti valori dell'Enum definito a livello di schema di database.
3. **Conversione Decimali:** Il campo `importo` va importato come valore numerico a virgola mobile o decimale esatto (evitando arrotondamenti che compromettano la contabilità).
