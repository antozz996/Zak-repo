# Bozza Policy di Ritenzione dei Dati (Data Retention Policy)

Questo documento costituisce la bozza delle regole di ritenzione e cancellazione automatica dei dati all'interno del sistema ZAK, in conformita' con i requisiti del GDPR (General Data Protection Regulation) e le best practice di ottimizzazione delle prestazioni del database.

---

## 1. Classificazione dei Dati e Tempi di Conservazione

I dati gestiti dal CRM ZAK sono divisi in categorie con differenti tempi massimi di conservazione prima della purga automatica o dell'anonimizzazione:

| Categoria Dati | Descrizione | Periodo di Conservazione | Azione Post Scadenza |
| :--- | :--- | :--- | :--- |
| **Messaggi Chat (WhatsApp, Instagram)** | Storico delle conversazioni testuali e media inviati/ricevuti dai clienti | **24 mesi** dall'ultimo contatto attivo | Cancellazione fisica dei record e rimozione dei file media allegati dal cloud storage. |
| **Trascrizioni Vocali (Voice Transcripts)** | Testo convertito da chiamate telefoniche gestite dall'assistente vocale | **12 mesi** dalla chiamata | Cancellazione delle trascrizioni testuali e degli eventuali file audio di registrazione. |
| **Audit Log di Sicurezza** | Registro delle azioni dello staff per conformita' e tracciamento sicurezza | **36 mesi** dalla creazione | Archiviazione in storage a freddo compresso; cancellazione definitiva dopo ulteriori 12 mesi. |
| **Contatti inattivi e Lead Persi** | Schede anagrafiche dei clienti che non hanno mai confermato un evento | **36 mesi** dall'ultimo cambio stato | Anonimizzazione dei campi identificativi (nome, telefono, email, Instagram) per mantenere le metriche statistiche storiche. |
| **Preventivi ed Eventi (Confermati)** | Contratti, date e voci economiche relative ad eventi realmente svolti | **10 anni** (limite legale fiscale) | Conservazione obbligatoria per ragioni fiscali. |

---

## 2. Dettagli sul GDPR e Diritti dell'Interessato

- **Diritto alla Cancellazione (Diritto all'Oblio)**: Il sistema deve esporre un comando per consentire all'Amministratore, su richiesta esplicita del cliente, di cancellare immediatamente tutti i suoi dati personali (inclusi messaggi, preventivi e note CRM) prima del termine dei 24 mesi, a patto che non vi siano obblighi fiscali pendenti (es. fatture o eventi gia' pagati).
- **Esportabilita' dei Dati**: I clienti possono richiedere copia delle loro informazioni. Il CRM deve supportare l'esportazione in un formato strutturato e leggibile (es. JSON o CSV) delle conversazioni e delle anagrafiche associate al loro contatto.

---

## 3. Linee Guida per l'Implementazione Tecnica Futura (Codex)

Quando Codex implementera' il motore di cancellazione automatica (Retention Engine):

1. **Job Schedulati**: Il motore deve girare come un job notturno (es. ogni domenica alle 02:00) per non impattare sulle prestazioni del server durante l'orario di lavoro commerciale.
2. **Cancellazione a Cascata**: La rimozione di un contatto CRM inattivo deve eliminare a cascata tutti i record correlati nella tabella `messaggi`, `task_personali` e `whatsapp_outbound_log` per evitare record orfani nel database.
3. **Tracciabilita' dell'Eliminazione**: L'eliminazione automatica per retention deve essere registrata nell'Audit Log come azione di sistema (`SYSTEM_DATA_PURGED`), omettendo i dettagli personali del cliente eliminato.
