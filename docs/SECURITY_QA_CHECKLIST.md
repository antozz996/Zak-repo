# Checklist QA Sicurezza - Controlli Manuali e Architetturali

Questa checklist contiene almeno 20 controlli di sicurezza manuali e architetturali per proteggere l'infrastruttura di ZAK (inclusi i webhook Meta/Vapi, le API esposte e le sessioni utente) da accessi non autorizzati o attacchi di tipo Denial of Service.

---

## Sezione 1: Autenticazione, Sessioni e Permessi

- [ ] **1. Robustezza delle Password:** Verificare manualmente che il form di registrazione/cambio password impedisca l'uso di password inferiori a 8 caratteri o prive di combinazioni di numeri e lettere.
- [ ] **2. Invalidazione della Sessione al Logout:** Effettuare il login, copiare il token JWT/session cookie, effettuare il logout e verificare che inviando una chiamata manuale (es. tramite Postman) con il vecchio token il server risponda con `401 Unauthorized`.
- [ ] **3. Protezione da Cross-Tenant Access:** Verificare che un utente loggato della *Venue A* non possa visualizzare, modificare o eliminare i lead, i preventivi o i task della *Venue B* modificando l'ID della venue nei parametri dell'URL (`/api/venue/B/dashboard`). Il server deve restituire `403 Forbidden`.
- [ ] **4. Autenticazione Endpoint Webhook:** Verificare che i webhook (`/api/webhook/whatsapp` e `/api/webhook/voice-assistant`) non accettino chiamate arbitrarie prive dei rispettivi token di firma o di autenticazione, ritornando `401 Unauthorized`.
- [ ] **5. Durata dei Session Token:** Verificare che i token di sessione abbiano una scadenza definita e ragionevole (es. 24 ore) e che non siano validi a tempo indeterminato.

---

## Sezione 2: Sicurezza delle API e Webhook Signature

- [ ] **6. Verifica Firma Webhook Meta (SHA256):** Verificare che il server ZAK convalidi l'header `X-Hub-Signature-256` inviato da Meta decifrandolo con il client secret. Modificare una lettera del payload e verificare che il server risponda con `401 Unauthorized` / firma non valida.
- [ ] **7. Verifica Firma Webhook Voice (Vapi/Bland):** Verificare che le chiamate in ingresso sul canale voice abbiano l'header segreto corretto configurato. Tentare una chiamata senza tale header e verificare che il log registri il rifiuto e restituisca `401`.
- [ ] **8. Prevenzione dell'SQL Injection:** Verificare che tutti gli input utente (in particolare le barre di ricerca dell'inbox o dell'agenda) utilizzino query parametrizzate (tramite Drizzle/Zod) e che stringhe contenenti caratteri speciali (es. `' OR 1=1 --`) vengano interpretate solo come testo.
- [ ] **9. Prevenzione Cross-Site Scripting (XSS) nell'Inbox:** Inviare un messaggio WhatsApp contenente codice JavaScript (`<script>alert('XSS')</script>`). Verificare che nell'Inbox di ZAK il testo venga visualizzato in modalità protetta (escaped) e che il codice non venga eseguito dal browser.
- [ ] **10. Validazione Input via Zod:** Verificare che i payload HTTP inviati alle API siano convalidati dagli schemi Zod. Tentare di inviare un campo non previsto o con tipo dati errato e verificare che il server rifiuti la richiesta con `400 Bad Request` fornendo dettagli dell'errore strutturati.

---

## Sezione 3: Rate Limiting ed Error Handling

- [ ] **11. Rate Limiting sulle API Pubbliche:** Inviare più di 100 richieste al minuto a un endpoint pubblico (es. il form di contatto o di login). Verificare che il server risponda con l'errore `429 Too Many Requests` e l'header `Retry-After`.
- [ ] **12. Rate Limiting sui Webhook:** Verificare la presenza di una coda di gestione per i webhook in modo che picchi improvvisi di messaggi WhatsApp (es. campagne massive) non sovraccarichino il server principale portando a timeout.
- [ ] **13. Gestione Concorrenza (Errori 409 Conflict):** Tentare di modificare contemporaneamente lo stato dello stesso preventivo da due browser diversi. Il sistema deve gestire la concorrenza in modo pulito (es. aggiornamento ottimistico o blocco della seconda transazione con codice `409`).
- [ ] **14. Mascheramento degli Errori Interni:** Eseguire una chiamata che genera un errore del database (es. violazione di chiave esterna indotta). Verificare che il server non esponga i dettagli dello stack trace SQL all'utente, ma risponda con un generico codice `500 Internal Server Error` salvando i dettagli solo nei log protetti del server.

---

## Sezione 4: Gestione dei Segreti e Codice Sorgente

- [ ] **15. Scansione Segreti Committati:** Verificare che nel file `.gitignore` siano presenti tutti i file sensibili (es. `.env`, `.env.local`, chiavi PEM).
- [ ] **16. Variabili d'Ambiente in Produzione:** Controllare che sul server di produzione non esistano file `.env` con credenziali hardcoded, ma che le chiavi siano iniettate in modo sicuro tramite il pannello di controllo del cloud provider o del sistema di orchestrazione.
- [ ] **17. Disattivazione Source Map in Produzione:** Verificare che nella build di produzione del frontend i file `.map` (source maps) non siano accessibili pubblicamente, evitando che utenti malintenzionati possano ricostruire il codice sorgente originale TypeScript.

---

## Sezione 5: Logs, Auditing e Monitoraggio

- [ ] **18. Audit Log per Operazioni Sensibili:** Verificare che ogni cambio di stato di un preventivo, eliminazione di contatti o modifica delle impostazioni della venue registri una riga nella tabella degli audit log con l'ID dell'utente che ha compiuto l'azione, l'orario e l'indirizzo IP.
- [ ] **19. Mascheramento Dati Personali nei Log:** Controllare che nei file di log del server (es. Winston, Pino) non vengano mai scritti dati sensibili in chiaro come password, token di accesso o dati di pagamento.
- [ ] **20. Monitoraggio Accessi Falliti:** Verificare che 5 tentativi di login consecutivi falliti sullo stesso account blocchino temporaneamente l'indirizzo IP o l'account stesso, inviando un alert di sicurezza al sistema di monitoraggio.
