# Specifica Prodotto - B2B Competitor Intelligence

Questa specifica trasforma il mockup sandbox *B2B Competitor* in requisiti e schemi reali per implementare la feature all'interno del core di ZAK. Consente alle venue di monitorare la concorrenza locale, archiviare materiale promozionale (listini, brochure) ed utilizzare l'AI per redigere analisi di differenziazione e proposte commerciali.

---

## 1. Entità Dati e Schema DB Consigliato

Per supportare questa funzionalità, si raccomanda la creazione delle seguenti tabelle nel database (Drizzle ORM):

### Tabella: `competitors` (Archivio Competitor)
- `id` (Serial, Primary Key)
- `venue_id` (Integer, Foreign Key ref `venues.id`) - Associa il competitor alla singola venue.
- `nome` (String, Obbligatorio) - es. *Villa Reale Events*.
- `tipo` (String) - es. *Location storica*, *Club all'aperto*.
- `citta` (String) - es. *Milano*.
- `rating` (Decimal) - Punteggio da 1.0 a 5.0 basato sulla forza commerciale.
- `sito_web` (String) - URL del sito del competitor.
- `instagram_username` (String) - Profilo social.
- `note_interne` (Text) - Note e considerazioni dello staff.
- `updated_at` (Timestamp)

### Tabella: `competitor_materials` (Materiali Raccolti)
- `id` (Serial, Primary Key)
- `competitor_id` (Integer, Foreign Key ref `competitors.id` con eliminazione cascade)
- `nome_file` (String) - Nome del file caricato (es. *Listino prezzi 2026.pdf*).
- `storage_key` (String) - Chiave univoca dell'oggetto sul cloud storage (es. S3 key).
- `mime_type` (String) - Tipo file (es. `application/pdf`, `image/png`).
- `peso_bytes` (Integer)
- `created_at` (Timestamp)

### Tabella: `competitor_analyses` (Analisi AI Generate)
- `id` (Serial, Primary Key)
- `competitor_id` (Integer, Foreign Key ref `competitors.id`)
- `prompt_usato` (Text) - Il prompt inserito dall'utente.
- `contenuto_analisi` (Text) - Il report strutturato generato dall'LLM.
- `created_at` (Timestamp)

---

## 2. Flussi Utente (User Flows)

1. **Censimento Competitor:** L'utente accede alla sezione *B2B & Competitor*, fa clic su *"Nuovo Competitor"* e inserisce i dati di base (nome, tipo, contatti).
2. **Caricamento Documenti (Upload):** Nella scheda del competitor, l'utente trascina o seleziona un file (es. la brochure prezzi sottratta al competitor o recuperata pubblicamente). Il file viene caricato su Cloud Storage in modo sicuro e registrato nella tabella `competitor_materials`.
3. **Generazione Analisi AI:** L'utente seleziona uno o più competitor e digita un prompt (es. *"Confrontami con Villa Reale"*). L'applicazione richiama l'LLM passando le informazioni dei competitor e, se supportato, il testo estratto dai PDF caricati (tramite RAG o parsing OCR preliminare). L'AI restituisce il report di confronto.

---

## 3. Prompt AI per Analisi e Differenziazione

Ecco il template di prompt di sistema consigliato per l'integrazione dell'LLM:

```
Sei un consulente di marketing strategico per venue ed eventi commerciali. Il tuo obiettivo è analizzare i dati forniti sui nostri competitor e produrre un'analisi di differenziazione.

Dati dei competitor forniti:
{{COMPETITORS_DATA}}

Analizza i punti di forza e di debolezza di ciascun competitor rispetto alla nostra offerta. Produci un report suddiviso in:
1. Vantaggio Competitivo di ZAK (dove vinciamo noi).
2. Punti di Attenzione (dove i competitor sono più forti).
3. Strategia di Pricing Consigliata (come posizionare i nostri pacchetti).
4. Azioni Immediate consigliate allo staff commerciale.
```

---

## 4. Generazione Proposte B2B (Pitch Generator)

Il sistema include un generatore di lettere di offerta commerciali per scuole, aziende o partner:
- L'utente seleziona un template (es. *Corporate Team Building*).
- Inserisce il nome del target (es. *Deloitte*), il numero di partecipanti e le inclusioni.
- L'AI unisce le informazioni e scrive una proposta formale personalizzata, calcolando i subtotali commerciali e confrontandoli con il budget del cliente.

---

## 5. Rischi Legali, Privacy e Copyright (IMPORTANTE)

> [!WARNING]
> La raccolta di informazioni sui competitor e il caricamento di materiali solleva criticità legali che devono essere affrontate a livello di policy aziendale:
> 1. **Proprietà Intellettuale (Copyright):** Le brochure e i listini dei competitor sono opere protette. ZAK non deve ospitare o consentire la ridistribuzione pubblica di tali materiali. L'accesso deve essere strettamente limitato all'uso interno dello staff della venue.
> 2. **GDPR e Dati Personali:** Assicurarsi che i file caricati (es. preventivi reali dei competitor girati dai clienti) non contengano dati personali di soggetti terzi (nomi di sposi, numeri di telefono o email private). Lo staff deve essere istruito a oscurare i dati personali prima dell'upload.
> 3. **Concorrenza Sleale:** L'acquisizione di segreti commerciali tramite accessi abusivi a sistemi informatici dei competitor è reato. ZAK deve specificare nei termini d'uso che è consentito caricare esclusivamente materiali reperiti in modo lecito e pubblico.
