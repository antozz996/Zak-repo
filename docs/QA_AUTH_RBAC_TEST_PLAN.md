# Piano di Test QA - Autenticazione e Ruoli (RBAC)

Questo documento definisce il piano di test manuale per verificare il corretto funzionamento dell'autenticazione utente e del controllo degli accessi basato sui ruoli (RBAC).

---

## Scenari di Test (15 Casi)

### Caso 1: Login con credenziali valide
*   **Prerequisiti:** Utente registrato a database con email `admin@zak.com` e stato `attivo: true`.
*   **Step:**
    1. Navigare alla pagina `/login-mock`.
    2. Inserire email `admin@zak.com` e la password corretta.
    3. Cliccare su "Accedi".
*   **Risultato atteso:** Login eseguito con successo, reindirizzamento alla dashboard principale `/dashboard` e comparsa di un messaggio toast di conferma.

### Caso 2: Login con password errata
*   **Prerequisiti:** Utente registrato con email `admin@zak.com`.
*   **Step:**
    1. Navigare alla pagina `/login-mock`.
    2. Inserire email `admin@zak.com` e una password casuale errata.
    3. Cliccare su "Accedi".
*   **Risultato atteso:** Login fallito, nessun reindirizzamento, comparsa di un avviso visivo *"Credenziali errate"*.

### Caso 3: Login con email non registrata
*   **Prerequisiti:** Nessun utente registrato con email `sconosciuto@zak.com`.
*   **Step:**
    1. Navigare alla pagina `/login-mock`.
    2. Inserire `sconosciuto@zak.com` ed una password qualunque.
    3. Cliccare su "Accedi".
*   **Risultato atteso:** Messaggio di errore generico *"Credenziali non valide o account disattivato"* per prevenire l'enumerazione degli utenti.

### Caso 4: Logout utente
*   **Prerequisiti:** Utente loggato sul sistema.
*   **Step:**
    1. Cliccare sul pulsante "Esci" nella sidebar.
*   **Risultato atteso:** Sessione invalidata, eliminazione del token locale e reindirizzamento immediato alla schermata di login.

### Caso 5: Scadenza della sessione (12 ore)
*   **Prerequisiti:** Utente loggato con sessione creata da piu' di 12 ore.
*   **Step:**
    1. Effettuare una qualsiasi operazione o aggiornare la pagina.
*   **Risultato atteso:** Rilevazione del token scaduto, disconnessione automatica e reindirizzamento alla pagina di login.

### Caso 6: Blocco per inattivita' (30 minuti)
*   **Prerequisiti:** Utente loggato e inattivo (nessun movimento del mouse o digitazione) da 30 minuti.
*   **Step:**
    1. Lasciare la scheda del browser aperta e ferma per 30 minuti.
*   **Risultato atteso:** Lo schermo viene oscurato, viene mostrata una modale di sblocco che richiede il reinserimento della password senza perdere lo stato corrente della pagina.

### Caso 7: Accesso Admin a pagine riservate
*   **Prerequisiti:** Utente loggato con ruolo `admin`.
*   **Step:**
    1. Navigare su `/impostazioni` o `/admin-roles`.
*   **Risultato atteso:** La pagina viene caricata regolarmente e tutti i comandi di amministrazione sono visibili ed utilizzabili.

### Caso 8: Accesso Manager a pagine riservate
*   **Prerequisiti:** Utente loggato con ruolo `manager`.
*   **Step:**
    1. Navigare su `/preventivi` o `/automazioni`.
*   **Risultato atteso:** Le pagine sono accessibili e le funzionalita' di gestione (es. creazione preventivo) sono abilitate.

### Caso 9: Accesso Manager a funzioni Admin (Escluso)
*   **Prerequisiti:** Utente loggato con ruolo `manager`.
*   **Step:**
    1. Tenta di accedere alla pagina `/admin-roles` inserendo l'URL direttamente nel browser.
*   **Risultato atteso:** Reindirizzamento alla schermata `/access-denied-mock` con messaggio di errore.

### Caso 10: Accesso Staff a pagine consentite
*   **Prerequisiti:** Utente loggato con ruolo `staff`.
*   **Step:**
    1. Accedere a `/inbox` o `/task`.
*   **Risultato atteso:** Pagine accessibili per la lettura e risposta ai messaggi o gestione dei propri task.

### Caso 11: Accesso Staff a pagine vietate
*   **Prerequisiti:** Utente loggato con ruolo `staff`.
*   **Step:**
    1. Tentare di navigare direttamente su `/automazioni` o `/preventivi`.
*   **Risultato atteso:** Intercettazione del router e blocco con rendering della schermata `/access-denied-mock`.

### Caso 12: Tentativo di accesso di utente non autenticato (Guest)
*   **Prerequisiti:** Utente non loggato nel sistema.
*   **Step:**
    1. Digitare l'URL `/dashboard` direttamente nella barra degli indirizzi.
*   **Risultato atteso:** Il sistema rifiuta la navigazione e reindirizza forzatamente alla pagina di login.

### Caso 13: Utente disattivato dall'Amministratore
*   **Prerequisiti:** Operatore `staff` con sessione attiva. L'Admin disattiva il suo account.
*   **Step:**
    1. L'operatore tenta di inviare un messaggio o cambiare pagina.
*   **Risultato atteso:** Alla prima chiamata API il server rileva lo stato `attivo: false`, distrugge la sessione e disconnette l'utente mostrando l'avviso di account sospeso.

### Caso 14: Cambio di ruolo a runtime
*   **Prerequisiti:** Operatore `staff` loggato. L'Admin promuove l'utente a `manager`.
*   **Step:**
    1. L'utente prova ad accedere a `/preventivi` senza fare logout.
*   **Risultato atteso:** L'accesso viene negato finche' l'utente non effettua un logout e un nuovo login per aggiornare il token JWT.

### Caso 15: Integrita' dell'Audit Log delle azioni RBAC
*   **Prerequisiti:** Utente loggato esegue un'operazione sensibile.
*   **Step:**
    1. L'Admin accede a `/security-audit-mock`.
*   **Risultato atteso:** E' presente una nuova riga nell'audit log contenente timestamp, email dell'utente che ha agito, tipo di azione (`USER_LOGIN`, `ROLE_UPDATE`, etc.) ed IP.
