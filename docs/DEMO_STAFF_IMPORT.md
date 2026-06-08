# Guida all'Importazione Staff - Dataset Demo

Questo documento descrive la struttura del file `demo-utenti-staff.csv` situato in `attached_assets/`. Il file contiene un set di dati fittizi composto da **15 utenti staff** predisposti per testare il caricamento del team, la gestione dei ruoli e le simulazioni di controllo accessi (RBAC).

---

## Struttura del CSV

Il file e' strutturato con le seguenti colonne separate da virgola (`,`):

| Colonna | Descrizione | Valori Ammessi |
| :--- | :--- | :--- |
| `nome` | Nome completo del collaboratore dello staff | Testo libero |
| `email` | Indirizzo email aziendale fittizio | Email univoca (es. `@villazak.com`) |
| `ruolo` | Livello di permessi e accesso assegnati | `admin`, `manager`, `staff` |
| `stato` | Stato operativo dell'account dell'utente | `attivo`, `disattivato` |
| `ultimo_accesso_demo` | Timestamp simulato dell'ultimo accesso | Testo descrittivo (es. `Oggi 14:15`, `30 Mag`) |
| `note` | Annotazioni interne sul collaboratore | Testo libero |

---

## Logica di Importazione Futura (Codex)

Quando Codex implementera' il meccanismo di importazione reale dei membri del team a database, dovra' applicare le seguenti regole:

1. **Deduplicazione**: L'importazione deve fallire o saltare i record in cui l'indirizzo `email` risulta gia' registrato nella tabella `utenti` del database per prevenire duplicazioni.
2. **Assegnazione Ruolo Fallback**: Se la colonna `ruolo` contiene valori non riconosciuti, l'importatore deve assegnare di default il ruolo con privilegi minimi (`staff`).
3. **Invalidazione Sessione**: Gli utenti importati con lo stato `disattivato` non devono essere in grado di effettuare il login e le loro credenziali provvisorie non devono consentire l'accesso.
4. **Audit Log**: Ogni record importato con successo deve registrare un evento `USER_IMPORTED` nella tabella `audit_log`, indicando l'email del nuovo membro inserito e l'operatore che ha effettuato l'importazione.
