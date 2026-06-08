# Guida UX - Ruoli e Controllo Accessi (RBAC)

Questa guida descrive i requisiti di esperienza utente (UX) e le regole di interfaccia per la futura implementazione del controllo degli accessi basato sui ruoli (**RBAC**) all'interno dell'applicazione Zak.

---

## 1. Mappatura Sezioni e Pagine per Ruolo

L'interfaccia si adatta dinamicamente a seconda del ruolo dell'utente loggato. I link nella barra laterale (sidebar) e le relative pagine sono regolati come segue:

| Sezione / Pagina | Admin | Venue Manager | Operatore Staff |
| :--- | :---: | :---: | :---: |
| **Dashboard Executive** | Visibile | Visibile | Nascosta |
| **Inbox Omnicanale** | Visibile | Visibile | Visibile |
| **Contatti CRM** | Visibile | Visibile | Visibile |
| **Preventivi Eventi** | Visibile | Visibile | Nascosta |
| **Agenda Personale** | Visibile | Visibile | Visibile |
| **Task Board** | Visibile | Visibile | Visibile |
| **Automazioni CRM** | Visibile | Visibile | Nascosta |
| **Audit Log** | Visibile | Nascosto | Nascosto |
| **Impostazioni** | Visibile | Nascosto | Nascosto |

---

## 2. Azioni Consentite e Gestione dell'Interfaccia

Nelle sezioni accessibili da piu' ruoli, le singole azioni all'interno della pagina sono regolate in base ai permessi specifici:

### A. Inbox Omnicanale
- **Risposta Manuale / Presa in Carico**: Consentito a tutti (`admin`, `manager`, `staff`).
- **Pausa / Avvio dell'AI (Zak AI)**: Consentito a tutti (`admin`, `manager`, `staff`).

### B. Contatti CRM
- **Creazione / Modifica Contatto**: Consentito a tutti (`admin`, `manager`, `staff`).
- **Eliminazione Contatto**: Consentito solo ad `admin` e `manager`. Per lo `staff`, il pulsante di eliminazione deve essere **nascosto** o **disabilitato**.
- **Modifica Note Interne Staff**: Consentito a tutti.

### C. Preventivi Eventi
- **Creazione / Modifica / Conferma**: Consentito solo ad `admin` e `manager`.
- **Eliminazione**: Consentito solo ad `admin`.

---

## 3. Linee Guida UX per Pulsanti Disabilitati e Permessi Mancanti

Per mantenere un'interfaccia utente coerente ed evitare disorientamento, l'applicazione deve seguire queste regole:

1. **Elementi non accessibili nella sidebar**:
   - I link a pagine non consentite per il ruolo corrente non devono essere renderizzati nella sidebar. Ad esempio, per un utente con ruolo `staff`, le voci *Dashboard*, *Preventivi*, *Automazioni*, *Audit Log* e *Impostazioni* non devono apparire.
2. **Pulsanti di azione all'interno delle pagine**:
   - Se un utente ha accesso a una pagina ma non puo' eseguire un'azione specifica, il relativo pulsante deve essere **disabilitato** (con opacity ridotta e cursore `not-allowed`).
   - Al passaggio del mouse (hover) sul pulsante disabilitato, deve apparire un **Tooltip** che spiega il motivo: *"Azione riservata a Venue Manager o Amministratori"*.
3. **Gestione del caricamento diretto via URL (Router Gate)**:
   - Se un utente tenta di accedere direttamente a un percorso non autorizzato modificando l'URL del browser (es. `/audit-log` digitato manualmente da uno `staff`), il router del frontend deve intercettare la richiesta prima del caricamento dei dati, bloccare la pagina e reindirizzare l'utente a `/access-denied-mock` (o alla pagina reale di Accesso Negato).

---

## 4. Comportamento in Caso di Modifica della Sessione

- **Account Disattivato**: Se l'amministratore disattiva un account mentre l'utente e' connesso, al successivo clic o ricaricamento della pagina, il client deve rilevare l'invalidita' della sessione, cancellare i dati locali e mostrare la pagina di login con il messaggio: *"Account disattivato. Contatta l'amministratore."*
- **Scadenza Sessione**: Dopo 12 ore di inattivita' o alla scadenza del token di sessione, l'utente deve essere disconnesso in modo sicuro e riportato al login.

> **Nota di Sviluppo**: Tutte le restrizioni di sicurezza descritte in questa guida devono essere validate lato backend (su ciascun endpoint API) per evitare bypass. L'integrazione della logica di sicurezza reale a database e a livello API e' a carico di Codex.
