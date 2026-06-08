# Guida all'Importazione Chiamate Vocali - Dataset Demo

Questo documento descrive la struttura del file `demo-voice-calls.csv` situato in `attached_assets/`. Il file contiene un set di dati fittizi composto da **20 chiamate telefoniche** gestite tramite gli assistenti vocali di Vapi e Bland.ai.

---

## Struttura del CSV

Il file e' strutturato con le seguenti colonne separate da virgola (`,`):

| Colonna | Descrizione | Valori Ammessi |
| :--- | :--- | :--- |
| `caller_name` | Nome del cliente identificato durante la chiamata | Testo libero o `Sconosciuto` |
| `caller_phone` | Numero di telefono del chiamante | Formato internazionale (`+39...`) |
| `transcript` | Trascrizione letterale del dialogo | Testo libero |
| `intent` | Intenzione rilevata dall'assistente vocale | `schedule_visit`, `check_availability`, `commercial_info`, `reschedule_visit`, `create_reminder`, `confirm_booking`, `cancel_visit`, `other`, o nullo |
| `confidence` | Confidenza dell'STT/NLU | Decimale compreso tra `0.00` e `1.00` |
| `output_type` | Tipo di attivita' generata a sistema | `agenda`, `task`, `none` |
| `created_task_title` | Titolo del task eventualmente creato | Testo libero o nullo |
| `created_agenda_title` | Titolo dell'evento a calendario creato | Testo libero o nullo |
| `provider` | Provider che ha gestito la chiamata VoIP | `vapi`, `bland` |
| `call_started_at` | Data e ora di avvio chiamata in formato ISO | Timestamp (`YYYY-MM-DDTHH:MM:SSZ`) |

---

## Logica di Importazione ed Allineamento (Codex)

Quando Codex implementera' l'importatore o l'elaboratore dei webhook di chiamata:

1.  **Deduplicazione tramite Numero Telefonico:** Il sistema deve cercare se il `caller_phone` e' gia' registrato in rubrica. Se presente, associa la chiamata a quel contatto; in caso contrario, crea un nuovo contatto CRM impostando `origine` come `chiamata_vocale`.
2.  **Soglie di Confidenza (NLU):**
    *   Se `confidence` &ge; 0.85 ed `output_type` = `agenda`, viene inserito un evento provvisorio direttamente a calendario.
    *   Se `confidence` e' compresa tra 0.60 e 0.84, l'evento viene inserito come *"Da Confermare"* e viene creato un task di review per lo staff.
    *   Se `confidence` < 0.60, non viene creato nessun evento o task, ma la conversazione viene contrassegnata per l'intervento umano.
3.  **Generazione dei Task:** Per tutti gli intenti che prevedono risposte commerciali o promemoria (`output_type` = `task`), viene creato un record nella tabella `task` assegnando la priorita' in base all'urgenza rilevata.
