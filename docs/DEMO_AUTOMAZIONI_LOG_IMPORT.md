# Guida all'Importazione Log Automazioni - Dataset Demo

Questo documento descrive la struttura del file `demo-automazioni-log.csv` situato in `attached_assets/`. Il file contiene un set di dati fittizi composto da **40 esecuzioni storiche delle automazioni** (re-engagement e ricorrenze) pianificate ed eseguite dal CRM di Villa ZAK.

---

## Struttura del CSV

Il file e' strutturato con le seguenti colonne separate da virgola (`,`):

| Colonna | Descrizione | Esempio |
| :--- | :--- | :--- |
| `timestamp` | Data ed ora in cui e' stata eseguita l'automazione | `2026-06-02T09:00:15+02:00` |
| `tipo` | Nome del job o flusso di automazione eseguito | `reengagement`, `ricorrenza` |
| `esito` | Risultato finale del flusso di esecuzione | `eseguito`, `saltato`, `errore` |
| `contatto_nome` | Nome completo del contatto CRM interessato | `Marco Rossi` |
| `messaggio` | Preview del messaggio testuale inviato (se eseguito) | `Ciao Marco! Volevamo sapere...` |
| `dettagli` | Descrizione dell'esito o del motivo del blocco/errore | `Messaggio inviato correttamente via Meta API` |

---

## Logica di Importazione Futura (Codex)

Quando Codex implementera' il meccanismo di caricamento iniziale (seed) o di visualizzazione avanzata dei log storici a database, dovra' applicare le seguenti regole:

1. **Associazione al Contatto**: L'importatore deve mappare il campo `contatto_nome` con il record corrispondente nella tabella `contatti_crm` e inserire la chiave esterna `contatto_id` all'interno del database.
2. **Aggiornamento Messaggi Inbox**: Per i log con esito `eseguito`, l'importatore deve verificare che sia stato registrato un messaggio outbound corrispondente nella tabella `messaggi` del contatto per garantire la coerenza della timeline della chat.
3. **Gestione Errori**: I log con esito `errore` devono popolare anche i campi di tracciamento diagnostico del database per consentire ai Venue Manager di visualizzare i motivi dei fallimenti direttamente dalla dashboard delle automazioni.
