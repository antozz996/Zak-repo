# Guida all'Importazione Audit Log - Dataset Demo

Questo documento descrive il formato e la struttura del file `demo-audit-log.csv` situato in `attached_assets/`. Il file contiene un set di dati fittizi composto da **40 eventi di audit log** che simulano la cronologia delle azioni operative ed eventi di sicurezza eseguiti dallo staff di Villa ZAK.

---

## Struttura del CSV

Il file e' strutturato con le seguenti colonne separate da virgola (`,`):

| Colonna | Descrizione | Esempio |
| :--- | :--- | :--- |
| `timestamp` | Data ed ora in cui e' avvenuta l'azione (formato ISO 8601) | `2026-06-02T18:15:22+02:00` |
| `utente_email` | Indirizzo email del collaboratore che ha compiuto l'azione | `alessandro.rossi@villazak.com` |
| `ruolo` | Ruolo dell'utente al momento dell'azione | `admin`, `manager`, `staff`, `sistema`, `sconosciuto` |
| `azione` | Tipo di operazione eseguita | `USER_LOGIN`, `USER_ROLE_UPDATED`, `ACCESS_DENIED`, etc. |
| `entita` | Nome della tabella o risorsa del database interessata | `utenti`, `contatti_crm`, `preventivi_eventi` |
| `id_entita` | Identificativo numerico del record modificato/creato | `1`, `12`, `0` (se non applicabile) |
| `ip_address` | Indirizzo IP del dispositivo dell'operatore | `192.168.1.45`, `89.24.112.5` |
| `dettagli` | Descrizione testuale sintetica dell'operazione | `Accesso riuscito per amministratore` |

---

## Logica di Importazione Futura (Codex)

Quando Codex implementera' il meccanismo di caricamento iniziale (seed) o di migrazione dei log di audit storici a database, dovra' applicare le seguenti regole:

1. **Risoluzione Chiave Esterna (Utente)**: L'importatore deve verificare se il campo `utente_email` corrisponde a un record esistente nella tabella `utenti`. Se corrisponde, deve collegare l'ID utente reale all'audit log, altrimenti deve salvare l'evento con il fallback `sistema` o `utente sconosciuto`.
2. **Integrita' dei Dati**: I log di audit importati devono essere immutabili una volta scritti. Il database deve applicare permessi di sola lettura sulla tabella `audit_log` per gli utenti non-admin.
3. **Conversione Timestamp**: L'importatore deve convertire le date stringa ISO 8601 in oggetti `Timestamp` PostgreSQL nativi rispettando il fuso orario del locale (Milano, UTC+2 con ora legale).
