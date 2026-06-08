# Specifica Tecnica - Google Calendar Integration

Questa specifica definisce i requisiti e l'architettura tecnica per sincronizzare gli eventi dell'agenda e dei preventivi di ZAK con Google Calendar.

---

## 1. OAuth 2.0 vs Service Account

Per connettere l'applicazione a Google Calendar, sono valutabili due approcci di autenticazione:

| Criterio | OAuth 2.0 (User Consent Flow) | Service Account |
| :--- | :--- | :--- |
| **Descrizione** | Ogni utente/venue autorizza individualmente ZAK ad accedere al proprio account Google tramite schermata di consenso. | Un account robot centralizzato configurato su Google Cloud Console gestisce le letture/scritture delegando gli accessi. |
| **Pro** | Consente la sincronizzazione sui calendari personali reali degli utenti (es. l'agenda privata di ciascun operatore staff). Maggiore sicurezza granulare. | Facile da configurare centralmente per la venue. Non richiede passaggi di autorizzazione complessi per lo staff. |
| **Contro** | Richiede la gestione di Token di Accesso e Refresh Token a database per ogni utente, oltre a una procedura di verifica dell'app da parte di Google. | Tutti gli eventi finiscono in un unico calendario condiviso della venue. Richiede che gli amministratori di Google Workspace abilitino la delega a livello di dominio. |
| **Scelta per ZAK** | Si consiglia il flusso **OAuth 2.0** per consentire a ciascun membro dello staff di collegare il proprio calendario aziendale Google e mantenere sincronizzata la propria agenda personale. |

---

## 2. Flusso di Sincronizzazione (Sync Unidirezionale e Bidirezionale)

### Sincronizzazione dei Preventivi (Unidirezionale: ZAK -> Google Calendar)
- Quando un preventivo viene *confermato* su ZAK, il sistema crea automaticamente un evento corrispondente sul Google Calendar della Venue.
- Modifiche ai dettagli dell'evento (es. orario o note) fatte su ZAK aggiornano l'evento Google corrispondente.
- Le modifiche fatte su Google Calendar per questi eventi non si riflettono su ZAK (ZAK è la fonte unica di verità per gli eventi commerciali).

### Sincronizzazione dell'Agenda Personale (Bidirezionale: ZAK <-> Google Calendar)
- Gli operatori dello staff sincronizzano i propri impegni (es. visite mediche, incontri con fornitori).
- **ZAK -> Google:** Inserendo un impegno su ZAK, questo viene inviato a Google Calendar.
- **Google -> ZAK:** ZAK si iscrive tramite webhook di notifica di Google (Push Notifications) per rilevare cambi sul calendario dell'utente ed aggiornare l'agenda interna in tempo reale.

---

## 3. Mapping dei Dati a Database

Per mantenere il tracciamento, la tabella dell'agenda di ZAK deve salvare il riferimento all'evento esterno:

| Campo ZAK Agenda | Tipo Dati | Corrispondenza Google Calendar | Descrizione |
| :--- | :--- | :--- | :--- |
| `id` | Integer | - | Chiave primaria interna ZAK |
| `titolo` | String | `summary` | Oggetto dell'evento |
| `descrizione` | Text | `description` | Note dell'evento ed eventuale link alla scheda lead |
| `inizio` | Timestamp | `start.dateTime` | Data/ora inizio evento |
| `fine` | Timestamp | `end.dateTime` | Data/ora fine evento |
| `google_event_id`| String | `id` | ID univoco dell'evento restituito da Google API. Fondamentale per i successivi aggiornamenti. |
| `google_sync_token`| String | - | Token per la sincronizzazione incrementale dei webhook Google. |

---

## 4. Gestione dei Conflitti e Cancellazioni

### Gestione dei Conflitti (Sincronizzazione Bidirezionale)
In caso di modifiche simultanee:
1. **Timestamp dell'Ultimo Aggiornamento:** Il sistema confronta la data di ultima modifica (`updatedAt`) dell'evento ZAK con il campo `updated` di Google. L'evento con il timestamp più recente sovrascrive il precedente.
2. **Coda di Allineamento:** Tutte le modifiche vengono inserite in una coda gestita dal server (es. BullMQ o pg-boss) ed elaborate in sequenza ordinata per evitare conflitti di scrittura simultanei (*race conditions*).

### Gestione delle Cancellazioni
- **Eliminazione da ZAK:** Il server effettua una chiamata `DELETE` all'API di Google Calendar usando il `google_event_id` memorizzato, quindi elimina l'evento localmente.
- **Eliminazione da Google:** Il webhook di Google notifica l'eliminazione dell'evento. ZAK riceve la notifica, cerca l'evento tramite `google_event_id` e lo rimuove dal database locale.

---

## 5. Gestione Errori e Retry Policy

Le API di Google possono fallire per limitazioni di rate limit o instabilità di rete:
- **Errori Temporanei (5xx, Network Timeout):** Il job di sincronizzazione fallito viene reinserito in coda con un backoff esponenziale (primo tentativo dopo 1m, secondo dopo 5m, terzo dopo 15m).
- **Errori di Autenticazione (401 Unauthorized):** Se il token di accesso è scaduto ed il refresh token fallisce, ZAK disabilita temporaneamente la sincronizzazione per l'utente, contrassegna lo stato del sync come *Sospeso* e invia una notifica all'utente richiedendo di ripetere il login Google.
- **Variabili d'Ambiente Necessarie:**
  - `GOOGLE_CLIENT_ID`: Identificativo dell'app Google Developer Console.
  - `GOOGLE_CLIENT_SECRET`: Chiave segreta dell'app.
  - `GOOGLE_REDIRECT_URI`: URL di callback per il flusso OAuth (es. `https://zak.com/api/auth/google/callback`).
