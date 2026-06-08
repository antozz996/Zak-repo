# Guida Operativa - Ruoli e Permessi Staff (RBAC)

Questa guida e' destinata a tutto lo staff di ZAK (Amministratori, Manager e Operatori) per spiegare il funzionamento del controllo degli accessi basato sui ruoli (RBAC).

---

## 1. Definizione dei Ruoli dello Staff

ZAK prevede tre livelli di autorizzazione per garantire la sicurezza dei dati e la fluidita' operativa:

### A. Amministratore (`admin`)
*   **Chi e':** Il titolare della venue o il responsabile IT globale.
*   **Cosa fa:** Ha il controllo totale di tutte le venue collegate all'account business. Puo' modificare le configurazioni critiche di sistema, gestire le chiavi delle API (es. token Meta, credenziali Google), ed e' l'unico abilitato ad aggiungere, modificare o rimuovere utenti dello staff o a cambiare i loro ruoli.

### B. Venue Manager (`manager`)
*   **Chi e':** Il coordinatore commerciale e operativo di una specifica venue.
*   **Cosa fa:** Gestisce le vendite e i lead. Puo' creare, modificare ed inviare preventivi, gestire le automazioni del CRM, approvare i template WhatsApp e assegnare compiti (task) allo staff. Non puo' modificare le credenziali API globali o variare i ruoli dello staff.

### C. Operatore (`staff`)
*   **Chi e':** Il personale commerciale o addetto agli eventi sul campo (allestimenti, logistica, sopralluoghi).
*   **Cosa fa:** Gestisce le conversazioni quotidiane nell'Inbox, risponde ai clienti mettendo in pausa l'AI, aggiorna i contatti con note ed esegue i compiti a lui assegnati. Non puo' creare o modificare preventivi, cancellare lead o accedere alla dashboard executive delle performance.

---

## 2. Matrice di Accesso Rapida

| Funzionalita' / Pagina | Admin | Manager | Staff |
| :--- | :---: | :---: | :---: |
| **Visualizzazione Dashboard Executive** | ✅ | ✅ | ❌ |
| **Risposta manuale / Pausa AI in Inbox** | ✅ | ✅ | ✅ |
| **Creazione e Modifica Preventivi** | ✅ | ✅ | ❌ |
| **Configurazione Automazioni CRM** | ✅ | ✅ | ❌ |
| **Assegnazione Task ad altri operatori** | ✅ | ✅ | ❌ |
| **Modifica Chiavi API / Webhook (Meta, Google)** | ✅ | ❌ | ❌ |
| **Modifica / Abilitazione Ruoli Staff** | ✅ | ❌ | ❌ |

---

## 3. Gestione dei Casi Operativi

### A. Messaggio di Accesso Negato ("Access Denied")
Se provi ad accedere a una pagina non consentita dal tuo ruolo (ad esempio, un operatore `staff` che tenta di navigare su `/automazioni` o `/impostazioni`), il sistema mostrera' una schermata di avviso rossa con il testo:
> **Accesso Negato: Permessi Insufficienti**
> Il tuo ruolo corrente (Staff) non dispone dei privilegi necessari per visualizzare questa risorsa. Contatta l'Amministratore per richiedere l'abilitazione.

In questo caso, clicca sul pulsante **"Torna alla Dashboard"** o **"Vai alla Inbox"** per riprendere il lavoro consentito.

### B. Gestione Account Disattivati
Se un membro dello staff interrompe la collaborazione o viene sospeso, l'Amministratore impostera' il suo stato su **Disattivato** nel pannello di gestione.
*   **Effetto immediato:** La sessione attiva dell'operatore verra' terminata entro 60 secondi e verra' disconnesso automaticamente da tutti i dispositivi.
*   **Tentativi di login:** Qualsiasi tentativo di accesso successivo mostrera' l'errore: *"Credenziali non valide o account disattivato"*.

### C. Cambio di Ruolo in Corso d'Opera
Se un operatore viene promosso a Manager (o viceversa):
1.  L'Amministratore esegue la modifica nel pannello utenti.
2.  L'operatore interessato deve effettuare il **Logout** e successivamente un nuovo **Login** per rigenerare il token di sessione con i nuovi permessi.
3.  Fino a quando non viene effettuato il nuovo login, il client potrebbe mostrare comportamenti incongruenti a causa dei vecchi permessi memorizzati nella sessione locale.

---

## 4. Buone Pratiche per la Sicurezza della Sessione

*   **Scadenza della Sessione:** La sessione di lavoro ha una durata massima di **12 ore** consecutive (7 giorni se si seleziona *"Rimani connesso"* al login). Allo scadere del tempo, verrai reindirizzato alla pagina di login.
*   **Blocco Inattivita':** Dopo 30 minuti di inattivita' totale, lo schermo verra' oscurato e verra' richiesta la password di sblocco per continuare, al fine di evitare che estranei accedano ai dati commerciali dal tuo computer incustodito.
*   **Condivisione delle credenziali:** E' severamente vietato condividere le password personali dello staff. Ogni azione eseguita viene tracciata nell'Audit Log con l'indirizzo IP e il nome utente corrispondente.
