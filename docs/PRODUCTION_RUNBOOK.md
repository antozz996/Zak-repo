# Runbook di Produzione - Rilascio e Diagnostica

Questo runbook operativo descrive i passaggi per eseguire il deploy in produzione di ZAK, verificare il corretto avvio di tutti i servizi e diagnosticare eventuali anomalie bloccanti.

---

## 1. Fasi del Deploy in Produzione

### Step 1: Configurazione Variabili d'Ambiente (.env)
Verificare la presenza di tutte le variabili d'ambiente essenziali nel server di produzione:
*   `DATABASE_URL`: Stringa di connessione a PostgreSQL.
*   `JWT_SECRET`: Chiave privata per la firma delle sessioni staff.
*   `META_APP_SECRET` & `META_VERIFY_TOKEN`: Per la ricezione e la convalida dei webhook WhatsApp.
*   `GOOGLE_CLIENT_ID` & `GOOGLE_CLIENT_SECRET`: Credenziali OAuth per Google Calendar.
*   `PORT`: Porta di ascolto del backend server (default: 5000).

### Step 2: Migrazione Database
Eseguire le migrazioni a database prima dell'avvio del server:
```bash
corepack pnpm --filter @workspace/db db:migrate
```
*   **Verifica:** Accedere alla console del database e verificare che tutte le tabelle siano state create correttamente (contatti, preventivi, messaggi, agenda, audit_logs).

### Step 3: Compilazione ed Avvio Server
Eseguire la build del monorepo TypeScript e avviare il processo di produzione:
```bash
corepack pnpm run build
corepack pnpm --filter @workspace/api-server start
```

---

## 2. Piani di Verifica Post-Rilascio

### A. Verifica API e Backend
*   **Azione:** Effettuare una richiesta HTTP GET sull'endpoint `/api/health`.
*   **Risultato atteso:** Risposta `200 OK` con stato dei servizi interni (database connesso, cron job attivi).

### B. Verifica Webhook Meta (WhatsApp)
*   **Azione:** Inviare una richiesta di challenge simulando l'autenticazione Meta.
*   **Risultato atteso:** Il server risponde restituendo il valore `hub.challenge` corretto.

### C. Verifica Google Calendar
*   **Azione:** Eseguire l'accesso su ZAK con un utente di test e provare a cliccare su "Connetti Google Calendar".
*   **Risultato atteso:** Apertura della schermata OAuth ufficiale senza errori di configurazione del redirect URI.

---

## 3. Monitoraggio Prime 48 Ore

Durante le prime 48 ore dal rilascio, monitorare costantemente:
1.  **Log degli Errori:** Controllare il file di log del server (o la console di monitoraggio cloud) per intercettare eccezioni di tipo `FATAL` o `ERROR`.
2.  **Coda dei Webhook:** Monitorare che il tempo di elaborazione dei messaggi WhatsApp in ingresso sia inferiore a 2 secondi.
3.  **Uptime Database:** Monitorare il pool di connessioni a PostgreSQL per assicurarsi che non si verifichino saturazioni o leak di connessione.

---

## 4. Troubleshooting (Risoluzione Anomalie Critiche)

### Problema 1: Il server API non parte
*   **Causa:** Variabili d'ambiente mancanti o porta occupata.
*   **Soluzione:**
    1. Eseguire `cat .env` (o verificare i segreti nel pannello cloud) per assicurarsi che tutti i parametri siano valorizzati.
    2. Controllare se ci sono altri processi in ascolto sulla porta designata: `netstat -ano | findstr <PORT>`.

### Problema 2: I webhook WhatsApp non vengono ricevuti
*   **Causa:** Token di verifica non allineato o errore di convalida firma.
*   **Soluzione:**
    1. Confrontare `META_VERIFY_TOKEN` inserito su ZAK con quello impostato sulla console Meta Developers.
    2. Controllare i log di errore del server: se viene registrato un errore di firma (`Invalid signature`), verificare che il `META_APP_SECRET` sia aggiornato.

### Problema 3: Il frontend non si carica o mostra pagina bianca
*   **Causa:** File statici non compilati correttamente o errore di routing SPA.
*   **Soluzione:**
    1. Verificare che la cartella `dist/public` contenga il bundle compilato (index.html e assets JS/CSS).
    2. Assicurarsi che il server Express sia configurato per servire l'index.html per qualsiasi rotta sconosciuta (fallback SPA).

---

## 5. Procedura di Rollback

In caso di anomalie bloccanti non risolvibili entro 15 minuti:
1.  **Sospendere il traffico:** Indirizzare il bilanciatore di carico verso una pagina statica di manutenzione.
2.  **Ripristinare versione stabile:** Eseguire il checkout del tag git della versione precedente:
    ```bash
    git checkout <TAG_VERSIONE_PRECEDENTE>
    corepack pnpm install
    corepack pnpm run build
    ```
3.  **Riavviare i servizi:** Avviare la versione precedente ed eseguire il restore del database se le migrazioni hanno alterato lo schema in modo non retrocompatibile.
