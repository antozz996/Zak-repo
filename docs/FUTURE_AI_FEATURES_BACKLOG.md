# Backlog Funzionalità AI Future - ZAK Ecosystem AI

Questo backlog raccoglie idee e proposte per estendere le capacità di Intelligenza Artificiale all'interno di ZAK nelle future iterazioni di sviluppo, classificate in base al valore commerciale stimato e alla difficoltà tecnica di implementazione.

---

## Tabella Comparativa delle Funzionalità

| Funzionalità AI | Descrizione sintetica | Valore Commerciale | Difficoltà Tecnica | Priorità consigliata |
| :--- | :--- | :--- | :--- | :--- |
| **Suggerimenti di Risposta (Smart Replies)** | L'AI suggerisce allo staff 3 risposte rapide basate sul contesto della chat attuale. L'operatore può cliccare per inviare o modificare prima dell'invio. | Alta | Bassa | **Alta** (Quick Win) |
| **Scoring Automatico del Lead** | Algoritmo che analizza il comportamento del cliente (tempi di risposta, sentiment, risposte su budget) per assegnare un punteggio di conversione (da 1 a 100). | Media | Media | **Media** |
| **Voice Intent Parsing avanzato** | Integrazione con modelli LLM per estrarre in modo ultra-preciso data, numero invitati e preferenze dalle chiamate vocali, inserendoli direttamente come campi strutturati nel DB. | Alta | Media | **Alta** |
| **Generazione PDF Preventivo AI** | Generazione automatica del PDF del preventivo (impaginazione e grafica inclusa) a partire da un semplice prompt in linguaggio naturale (es. *"Crea un PDF per un compleanno di 50 persone con buffet e DJ"*). | Media | Alta | **Bassa** |
| **Sentiment Analysis sulle Chat** | Monitoraggio del sentiment del cliente nei messaggi per allertare lo staff in caso di sentiment negativo (es. cliente arrabbiato o frustrato), mettendo in pausa l'AI automaticamente. | Media | Bassa | **Media** |
| **Previsioni Dinamiche sulle Date (Dynamic Pricing)** | L'AI analizza lo storico degli anni passati e i preventivi in corso per suggerire aumenti o sconti di prezzo in tempo reale in base alla domanda per una specifica data. | Alta | Alta | **Bassa** (Lungo termine) |

---

## Dettaglio Funzionalità Prioritarie

### 1. Suggerimenti di Risposta (Smart Replies) - *Valore: Alto / Difficoltà: Bassa*
* **Come funziona:** Quando un operatore umano prende in carico una chat (AI in Pausa), ZAK analizza gli ultimi messaggi del cliente e propone 3 bozze di risposta cliccabili nella parte inferiore dell'input.
* **Tecnologia:** Chiamata a un modello LLM leggero (es. Gemini Flash) passando come contesto gli ultimi 10 messaggi e le FAQ aziendali.
* **Beneficio:** Velocizza notevolmente il tempo di risposta del personale di sala.

### 2. Voice Intent Parsing Avanzato - *Valore: Alto / Difficoltà: Media*
* **Come funziona:** Estensione del webhook `/api/webhook/voice-assistant`. Invece di limitarsi a inserire il testo trascritto, un prompt strutturato analizza il testo con JSON output controllato (tramite schemi Zod) per compilare i campi del database delle tabelle `leads` e `preventivi` (es. data evento, budget, numero invitati) senza alcun inserimento manuale.
* **Tecnologia:** OpenAI Structured Outputs o Gemini Structured JSON.
* **Beneficio:** Eliminazione totale del data entry per le chiamate in ingresso.

### 3. Scoring Automatico del Lead - *Valore: Medio / Difficoltà: Medio*
* **Come funziona:** ZAK analizza costantemente l'interazione del cliente. Se il cliente risponde in pochi minuti ed esprime un budget allineato alla venue, il lead ottiene un punteggio alto (es. 90/100) e viene messo in evidenza nell'Inbox dello staff. Se il cliente risponde dopo giorni e richiede continui sconti, il punteggio cala.
* **Beneficio:** Aiuta lo staff commerciale a dare priorità ai contatti con maggiori probabilità di conversione.
