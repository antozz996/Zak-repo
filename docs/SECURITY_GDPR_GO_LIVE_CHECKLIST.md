# Checklist di Sicurezza e Conformita' GDPR - Go-Live

Questo documento definisce i controlli obbligatori da effettuare prima di spostare il sistema ZAK in ambiente di produzione.

---

## 1. Gestione dei Segreti e Variabili d'Ambiente

- [ ] **Esclusione chiavi nei sorgenti:** Verificare che nessuna chiave API o password sia inserita a codice (*hardcoded*). Tutti i segreti devono essere caricati tramite variabili d'ambiente (.env o gestore di segreti cloud).
- [ ] **Meta Cloud API Token:** Assicurarsi che il token di accesso permanente a Meta Cloud API sia memorizzato in modo sicuro e configurato con i permessi minimi richiesti.
- [ ] **Google OAuth Credentials:** Controllare che `GOOGLE_CLIENT_ID` e `GOOGLE_CLIENT_SECRET` siano registrati su Google Developer Console sotto la corretta organizzazione aziendale e che l'app sia impostata in produzione (non test).
- [ ] **Vapi / Bland.ai Keys:** Configurare i token di sicurezza per validare le richieste in ingresso ed evitare che soggetti esterni possano inviare webhook simulati a ZAK.

---

## 2. Conformita' GDPR e Trattamento Dati Personali

- [ ] **Informativa Telefonica AI (Consenso):** Verificare che il prompt iniziale dell'assistente vocale includa la richiesta di consenso e la menzione alla registrazione della chiamata.
- [ ] **Informativa WhatsApp:** Accertarsi che il primo messaggio inviato dal bot WhatsApp includa il link alla Privacy Policy della venue e un'opzione di opt-out (es. *"scrivi STOP per disattivare l'assistente"*).
- [ ] **Retention Policy delle Trascrizioni:** Configurare il job automatico che elimina o anonimizza i file audio e le trascrizioni testuali memorizzate a database dopo **90 giorni** dal completamento dell'evento.
- [ ] **Esportazione dei Dati (Diritto alla Portabilita'):** Testare lo script/funzione per esportare tutti i dati di un singolo cliente in formato JSON/CSV su richiesta del titolare.
- [ ] **Cancellazione dei Dati (Diritto all'Oblio):** Testare la cancellazione logica e fisica di un contatto e di tutti i suoi preventivi/messaggi associati.

---

## 3. Log e Diagnostica Sicura

- [ ] **Mascheramento dati sensibili:** Verificare che i log dell'applicazione (es. Pino, Winston) non scrivano password, codici fiscali, numeri di carte di credito o token di accesso.
- [ ] **Sanitizzazione degli input:** Assicurarsi che tutte le query di database utilizzino parametri preparati (Drizzle ORM previene le SQL Injection nativamente) e che le API validino gli input tramite Zod.

---

## 4. Controllo Accessi ed Esecuzione RBAC

- [ ] **Password Policy:** Imporre password con lunghezza minima di 12 caratteri per lo staff al primo accesso.
- [ ] **Timeout Sessione:** Verificare che il cookie di sessione scada dopo 12 ore e che il blocco per inattivita' dopo 30 minuti sia abilitato.
- [ ] **Verifica Ruoli:** Eseguire un test di sicurezza a database per verificare che non vi siano utenti senza ruolo assegnato (fallback automatico su `staff`).
- [ ] **Configurazione HTTPS:** Forzare l'uso di HTTPS per tutte le connessioni client-server, configurando gli header HSTS (HTTP Strict Transport Security) e cookie impostati su `Secure`, `HttpOnly` e `SameSite=Strict`.

---

## 5. Protezione Infrastruttura e Business Continuity

- [ ] **Rate Limiting:** Configurare il rate limit a livello di API Gateway (o middleware Express) per proteggere gli endpoint sensibili (es. `/api/auth/login`, webhook) da attacchi di tipo Denial of Service (DoS) o Brute Force.
- [ ] **Database Backup:** Verificare che il backup automatico del database PostgreSQL sia attivo giornalmente, con cifratura a riposo e test di ripristino mensile.
- [ ] **Webhooks Signatures:** Abilitare la verifica delle firme crittografiche (SHA256) per tutti i webhook in ingresso da Meta (WhatsApp) per accertarsi che provengano realmente dai server di Facebook.
- [ ] **Rollback Plan:** Assicurarsi che il team conosca i comandi di ripristino rapido della versione precedente in caso di anomalie bloccanti subito dopo il rilascio.
