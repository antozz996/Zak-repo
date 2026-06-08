# Piano di Migrazione e Messa in Produzione - ZAK

Questo piano descrive i passi sequenziali necessari per spostare l'applicazione ZAK dall'ambiente di sviluppo/staging all'ambiente di produzione reale per il primo cliente.

---

## 1. Cronoprogramma della Migrazione (Fasi Temporali)

```
[ Fase 1: Preparazione DB ] --> [ Fase 2: Configurazione Servizi ] --> [ Fase 3: Rilascio DNS ] --> [ Fase 4: Smoke Test ]
```

---

## 2. Dettaglio delle Fasi Operative

### Fase 1: Preparazione e Migrazione del Database
1. **Provisioning Istanza Database:** Creare l'istanza PostgreSQL di produzione su un servizio gestito (es. Neon, AWS RDS, Supabase) con backup automatici e log attivi.
2. **Esecuzione delle Migrazioni (Schema Migration):** Eseguire le migrazioni per creare la struttura delle tabelle.
   ```bash
   pnpm db:migrate
   ```
3. **Popolamento Staff Iniziale (Seeding):** Inserire l'utente amministratore iniziale e gli utenti dello staff della venue tramite script di seed controllato. Evitare di caricare dati di contatti o preventivi di test.
   ```bash
   pnpm db:seed --prod
   ```
4. **Verifica Integrità:** Controllare che tutte le tabelle, indici e relazioni di chiavi esterne siano stati creati correttamente nel DB di produzione.

### Fase 2: Rimozione Dati Demo ed Asset Temporanei
1. **Svuotamento tabelle transazionali:** Accertarsi che le tabelle `leads`, `preventivi`, `messaggi`, `task` e `agenda` siano vuote.
2. **Pulizia Cloud Storage:** Eliminare eventuali PDF di preventivi di test o immagini caricate nel bucket S3 di prova per evitare spreco di spazio ed esposizione accidentale di dati fittizi.

### Fase 3: Configurazione Servizi e Integrazioni Esterne
1. **Iniezione Variabili d'Ambiente:** Configurare i secrets sull'host di produzione (es. Vercel, Heroku, AWS ECS):
   - `DATABASE_URL` (URL connessione DB produzione)
   - `WHATSAPP_ACCESS_TOKEN` (System user token permanente di Meta)
   - `WHATSAPP_PHONE_NUMBER_ID` (ID numero di produzione reale)
   - `WHATSAPP_VERIFY_TOKEN` (Segreto webhook)
   - `VAPI_API_KEY` (Chiave Vapi reale per voice channel)
   - `JWT_SECRET` (Chiave ad alta entropia per le sessioni)
2. **Configurazione Webhook su Meta:** Aggiornare l'URL del callback di Meta puntando all'indirizzo HTTPS di produzione e verificare la ricezione dell'evento di sfida (*challenge*).

### Fase 4: Configurazione Dominio e DNS
1. **Associazione Dominio:** Configurare i record CNAME e A sul pannello DNS (es. Cloudflare, GoDaddy) per far puntare `app.nomedominiocliente.com` all'infrastruttura ZAK.
2. **Generazione Certificato SSL:** Verificare l'avvenuta emissione del certificato HTTPS e la redirezione automatica del traffico HTTP su HTTPS.

---

## 3. Smoke Test (Verifica Post-Rilascio)

Subito dopo la migrazione, eseguire i seguenti test sul sistema di produzione:
- [ ] **Test di Login:** Accedere con le credenziali di uno staff member appena creato.
- [ ] **Test di Webhook Inbound:** Inviare un messaggio WhatsApp da un telefono personale al numero di produzione. Verificare che compaia istantaneamente nell'Inbox.
- [ ] **Test di Risposta Outbound:** Rispondere manualmente alla chat dall'Inbox. Verificare il recapito del messaggio sul telefono personale.
- [ ] **Test Generazione Preventivo:** Creare un preventivo rapido, verificare che venga salvato a database e che si possa visualizzare l'anteprima PDF online.

---

## 4. Piano di Rollback (Ripristino in Caso di Errore)

Se durante la migrazione si verificano errori bloccanti non risolvibili entro 30 minuti (es. crash del server web, fallimento migrazione DB incompatibile con perdite dati):

1. **Ripristino DNS:** Reindirizzare i record DNS al server di staging o alla vecchia landing page per evitare schermate di errore `502 Bad Gateway` agli utenti.
2. **Rollback Database:** Se le migrazioni hanno corrotto strutture preesistenti (in caso di aggiornamenti successivi):
   - Eseguire il rollback dello schema tramite CLI del database o ripristinare l'ultimo snapshot del database effettuato prima dell'inizio delle attività di migrazione.
3. **Analisi Log:** Esaminare i log di errore del server web e di database per individuare la causa esatta del fallimento prima di tentare un nuovo rilascio.
