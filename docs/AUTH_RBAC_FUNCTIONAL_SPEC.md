# Specifica Funzionale - Autenticazione e Ruoli (RBAC)

Questa specifica definisce i requisiti per il modulo di autenticazione utenti e il controllo degli accessi basato sui ruoli (**RBAC - Role-Based Access Control**) per il sistema SaaS multi-venue ZAK.

---

## 1. Gestione della Sessione e Autenticazione

### Login e Logout
- **Login:** L'utente accede tramite inserimento di Email e Password. Il sistema convalida le credenziali ed emette un token JSON Web Token (JWT) firmato digitalmente memorizzato in un cookie sicuro `HttpOnly` e `SameSite=Strict`.
- **Logout:** La disconnessione invalida il cookie di sessione sia lato client che lato server (aggiungendo l'identificativo della sessione a una blacklist temporanea o rimuovendo il token dal database di sessione attiva).

### Sessione Utente
- **Durata della sessione:** Il token di autenticazione ha una scadenza fissa di **12 ore**. Se l'utente seleziona *"Rimani connesso"*, il client può richiedere un refresh token della durata di **7 giorni**.
- **Inattività:** Dopo 30 minuti di inattività totale da parte dell'utente, la sessione viene bloccata e l'applicazione richiede nuovamente la password per sbloccare lo schermo (senza perdere lo stato del lavoro in corso).

---

## 2. Definizione dei Ruoli e dei Privilegi

ZAK prevede tre ruoli distinti a livello di Venue:

### Ruolo: `admin` (Amministratore di Sistema)
- **Descrizione:** Ha il controllo completo su tutte le impostazioni globali e su tutte le venue collegate all'account business.
- **Pagine accessibili:** Tutte (Dashboard, Inbox, Contatti, Preventivi, Agenda, Task, Automazioni, Impostazioni di Sistema, Gestione Ruoli).
- **Azioni consentite:** Tutte, inclusa la modifica di configurazioni chiave (es. Webhook Meta, token Vapi), creazione/eliminazione di altre venue, assegnazione e cambio dei ruoli degli utenti, eliminazione definitiva di lead o preventivi.

### Ruolo: `manager` (Venue Manager)
- **Descrizione:** Gestisce l'operatività quotidiana e le configurazioni commerciali all'interno di una specifica Venue.
- **Pagine accessibili:** Dashboard, Inbox, Contatti, Preventivi, Agenda, Task, Automazioni, Impostazioni Venue. *Escluse: Impostazioni di Sistema globali, Gestione Ruoli a livello Admin.*
- **Azioni consentite:** Creazione ed invio preventivi, gestione ed esecuzione manuale delle automazioni, configurazione dei template WhatsApp approvati, visualizzazione dei log delle automazioni, assegnazione dei task allo staff.
- **Azioni vietate:** Modifica delle chiavi API di sistema (es. credenziali Meta globali), modifica o promozione dei ruoli degli operatori dello staff.

### Ruolo: `staff` (Operatore)
- **Descrizione:** Operatore focalizzato sulla gestione dei messaggi e sull'esecuzione dei task operativi (sopralluoghi, allestimenti).
- **Pagine accessibili:** Inbox, Contatti, Agenda personale, Task Board. *Escluse: Dashboard executive, Automazioni CRM, Impostazioni.*
- **Azioni consentite:** Lettura e risposta ai messaggi (presa in carico delle chat, pausing AI), aggiunta di note nella timeline del contatto, spunta dei task assegnati a se stesso, visualizzazione eventi a calendario.
- **Azioni vietate:** Creazione o modifica di preventivi, cancellazione definitiva di contatti, modifica delle impostazioni della venue, attivazione/disattivazione di regole di automazione.

---

## 3. Matrice dei Permessi per Ruolo

| Funzionalità / Azione | Admin | Manager | Staff |
| :--- | :---: | :---: | :---: |
| **Visualizzazione Dashboard Executive** | ✅ | ✅ | ❌ |
| **Presa in carico chat / Risposta manuale** | ✅ | ✅ | ✅ |
| **Pausa / Riattivazione AI in Inbox** | ✅ | ✅ | ✅ |
| **Creazione / Modifica Preventivi** | ✅ | ✅ | ❌ |
| **Configurazione / Avvio Automazioni CRM** | ✅ | ✅ | ❌ |
| **Visualizzazione Log / Errori Automazioni** | ✅ | ✅ | ❌ |
| **Modifica Impostazioni del Profilo Personale** | ✅ | ✅ | ✅ |
| **Assegnazione Task ad altri membri** | ✅ | ✅ | ❌ |
| **Modifica Configurazione Integrazioni (Meta/Vapi)** | ✅ | ❌ | ❌ |
| **Promozione/Revoca Ruoli Utenti** | ✅ | ❌ | ❌ |

---

## 4. Audit Log (Tracciamento delle Azioni)

Ogni azione sensibile deve registrare una riga nella tabella degli audit log. La struttura dell'audit log deve includere:
- `timestamp` (Data ed ora dell'azione)
- `utente_id` / `email` (Chi ha compiuto l'azione)
- `ruolo` (Il ruolo al momento dell'azione)
- `azione` (L'operazione eseguita, es. `USER_LOGIN`, `QUOTE_APPROVED`, `AI_PAUSED`, `USER_ROLE_UPDATED`)
- `entita` / `id` (L'elemento modificato, es. ID preventivo o ID contatto)
- `ip_address` (Indirizzo IP dell'operatore)

---

## 5. Gestione dei Casi Limite (Edge Cases)

### A. Utente Disattivato
Se l'amministratore disattiva un utente (stato `attivo` impostato a `false` nel DB):
- La sessione attiva dell'utente deve essere immediatamente invalidata entro 60 secondi (attraverso un controllo del token a database ad ogni chiamata API).
- Tentativi di login successivi devono essere rifiutati con un messaggio generico: *"Credenziali non valide o account disattivato"*.

### B. Tentativo di Registrazione con Email Duplicata
- Il sistema deve impedire la creazione di due utenti con la stessa email.
- Per motivi di sicurezza e prevenzione di *User Enumeration*, in fase di recupero password o registrazione, l'interfaccia deve mostrare messaggi generici (es. *"Se l'email è registrata, riceverai un link per reimpostare la password"*).

### C. Ruolo Mancante o Non Valido
- Se un record utente nel database presenta un ruolo non riconosciuto o nullo, il sistema deve impostare come fallback sicuro il livello minimo di permessi (`staff`) impedendo l'accesso alle pagine di amministrazione e lanciando un alert nei log di sistema.
