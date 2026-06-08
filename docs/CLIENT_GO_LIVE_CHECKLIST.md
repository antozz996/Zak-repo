# Checklist Go-Live Cliente - Messa in Produzione ZAK

Questa checklist elenca tutti i controlli e le configurazioni da completare prima di attivare ZAK per una venue ed iniziare ad interagire con clienti e dati reali.

---

## 1. Configurazione Infrastruttura e Credenziali

- [ ] **1. Connessione Database sicura:** Verificare che la stringa di connessione punti al database di produzione reale e che la password sia complessa e sicura.
- [ ] **2. Backup Database pianificato:** Configurare un backup automatico giornaliero (es. pg_dump automatico su cloud storage esterno) e testare la procedura di ripristino (*restore*).
- [ ] **3. Certificato SSL Attivo:** Accertarsi che il dominio di produzione sia protetto da HTTPS (SSL valido tramite Let's Encrypt o Cloudflare).
- [ ] **4. Log Rotation e Ritenzione:** Verificare che il server di produzione scriva i log su disco con rotazione automatica per evitare di esaurire lo spazio in memoria.

---

## 2. Configurazione Canali di Messaggistica (Meta & Voice)

- [ ] **5. Numero WhatsApp Ufficiale:** Completare la verifica del numero di telefono nel Business Manager di Meta, assicurandosi che sia rimosso dalla sandbox e associato all'app ZAK in produzione.
- [ ] **6. Verifica Webhook Meta:** Configurare l'URL del webhook definitivo e controllare che i messaggi in ingresso vengano ricevuti ed elaborati dal server di produzione.
- [ ] **7. Approvazione Template WhatsApp:** Inviare a Meta e verificare l'approvazione di tutti i template necessari per i primi contatti e follow-up automatici (es. conferma preventivo, auguri).
- [ ] **8. Integrazione Assistente Vocale (Vapi/Bland.ai):** Associare il numero telefonico reale di assistenza vocale sul portale del provider e inserire la chiave segreta dell'API su ZAK per la sincronizzazione del post-call webhook.

---

## 3. Pulizia Dati e Rimozione Demo

- [ ] **9. Rimozione Contatti Demo:** Eseguire lo script di pulizia a database per eliminare tutti i record di test (inclusi i contatti presenti nei CSV di demo come `demo-contatti.csv`, `demo-preventivi.csv`, ecc.).
- [ ] **10. Svuotamento Coda Messaggi:** Cancellare la cronologia dei messaggi scambiati in fase di test per presentare l'Inbox pulita allo staff.
- [ ] **11. Ripristino Contatore Preventivi:** Verificare che i codici o i numeri progressivi dei preventivi reali ripartano da 1 o da un numero iniziale desiderato dal cliente.

---

## 4. Test Funzionali in Produzione (Sanity Check)

- [ ] **12. Test di Invio Messaggio Singolo:** Inviare manualmente un messaggio WhatsApp reale a un numero di test dello staff. Verificare il recapito corretto e la visualizzazione nell'Inbox.
- [ ] **13. Test Risposta Automatica AI:** Scrivere al numero WhatsApp di produzione simulando un cliente. Verificare che l'AI risponda in modo coerente secondo le istruzioni caricate.
- [ ] **14. Test Chiamata Vocale Reale:** Effettuare una telefonata reale all'assistente vocale. Verificare che la chiamata venga trascritta e che compaia in tempo reale all'interno della bacheca.
- [ ] **15. Test Generazione Preventivo:** Creare un preventivo di test per un contatto reale dello staff, inviare il link e simulare la firma/conferma da parte del cliente per verificare l'aggiornamento automatico dello stato.

---

## 5. Formazione dello Staff (Staff Training)

- [ ] **16. Condivisione Manuale Utente:** Inviare a tutto lo staff operativo la *Guida Inbox Avanzata* (`docs/INBOX_OPERATIONS_GUIDE.md`).
- [ ] **17. Sessione di Training Live:** Effettuare una simulazione di 30 minuti con il team per mostrare come prendere in carico una chat, come mettere in pausa l'AI e come gestire i task di follow-up quotidiani.
- [ ] **18. Gestione delle Emergenze:** Istruire lo staff su come disattivare globalmente l'AI (pulsante di emergenza) in caso di comportamenti anomali del bot.

---

## 6. Firma e Avvio Ufficiale

- [ ] **19. Approvazione del Cliente:** Ricevere la conferma scritta dal Venue Manager dell'avvenuto collaudo delle funzionalità.
- [ ] **20. Switch del DNS / Go-Live:** Reindirizzare definitivamente il traffico del dominio principale verso il server di produzione di ZAK.
