# Guida all'Importazione Google Calendar - Dataset Demo

Questo documento descrive la struttura del file `demo-google-calendar-events.csv` situato in `attached_assets/`. Il file contiene un set di dati fittizi composto da **20 eventi** sincronizzati o in conflitto, utili per testare il connettore con le API di Google Calendar.

---

## Struttura del CSV

Il file e' strutturato con le seguenti colonne separate da virgola (`,`):

| Colonna | Descrizione | Valori Ammessi |
| :--- | :--- | :--- |
| `titolo` | Titolo dell'evento a calendario | Testo libero |
| `descrizione` | Note o dettagli dell'evento | Testo libero |
| `data_inizio` | Data e ora di inizio evento in formato ISO | Timestamp (`YYYY-MM-DDTHH:MM:SS`) |
| `data_fine` | Data e ora di fine evento in formato ISO | Timestamp (`YYYY-MM-DDTHH:MM:SS`) |
| `tipo_evento` | Tipologia commerciale dell'evento | `matrimonio`, `laurea`, `compleanno`, `aziendale`, `sopralluogo`, `altro` |
| `stato` | Stato corrente della sincronizzazione | `synced` (sincronizzato), `conflict` (conflitto rilevato) |
| `source_calendar` | Sorgente in cui e' nato l'evento | `zak` (sistema interno), `google` (calendario Google) |
| `external_event_id` | Identificativo fittizio di Google Calendar | Testo univoco (es. `ext_event_001`) |
| `timezone` | Timezone di riferimento per le date | `Europe/Rome` |

---

## Logica di Importazione ed Allineamento (Codex)

Quando Codex implementera' l'importatore o la sync automatica reale, dovra' applicare le seguenti regole:

1.  **Deduplicazione tramite ID Esterno:** Gli eventi in ingresso che possiedono un `external_event_id` gia' presente a database devono essere considerati aggiornamenti (*updates*) e non nuove creazioni.
2.  **Rilevamento del Conflitto Orario:** Se un evento proveniente da `google` presenta una sovrapposizione oraria con un evento in stato "Opzionato" o "Confermato" di `zak`, il sistema deve marcare lo stato come `conflict` ed inviare una notifica di review manuale allo staff.
3.  **Conversione Timezone:** Tutte le date devono essere lette ed elaborate considerando la timezone `Europe/Rome` per evitare sfasamenti di orario (es. eventi che si spostano di 1 o 2 ore per calcoli errati del fuso UTC).
4.  **Logging delle Operazioni:** Ogni evento sincronizzato o aggiornato deve inserire una riga di tracciamento nell'Audit Log.
