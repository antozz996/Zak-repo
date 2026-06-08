# Guida Incident Response - Gestione Disservizi ZAK

Questa guida e' pensata per i Venue Manager e lo Staff. Descrive le procedure non tecniche per gestire in modo coordinato e tempestivo i disservizi piu' comuni che possono verificarsi nell'uso quotidiano del CRM.

---

## 1. Meta / WhatsApp API Down (Interruzione del Canale)

### Sintomi
- Impossibilita' di inviare o ricevere messaggi WhatsApp da ZAK.
- Errori continui di invio o messaggi contrassegnati come "Non inviati" in Inbox.

### Azioni immediate per lo Staff
1. **Verifica dello Stato Esterno**: Accedere alla dashboard ufficiale di Meta Status o a Downdetector per verificare se si tratta di un'interruzione globale delle API di WhatsApp.
2. **Canale di Backup (Email/Telefono)**: Se il disservizio e' di Meta, utilizzare i contatti telefonici ed email presenti nella scheda del cliente CRM per continuare le trattative urgenti.
3. **Avviso Clienti**: Se possibile, inserire una nota temporanea sul sito web o una risposta automatica sul canale telefonico per invitare i clienti a chiamare direttamente o scrivere via email.

---

## 2. AI (Zak AI) risponde in modo errato o allucina

### Sintomi
- L'assistente automatico propone date occupate, sbaglia l'estrazione dei prezzi o risponde in modo incoerente alle domande dei clienti.

### Azioni immediate per lo Staff
1. **Presa in Carico Immediata**: Cliccare sul pulsante di assegnazione per bloccare immediatamente il bot sulla chat del cliente e scusarsi per l'incomprensione.
2. **Correzione Dati**: Correggere manualmente i dati errati estratti dal bot all'interno del pannello laterale del contatto (es. tipo evento o invitati).
3. **Segnalazione Bug**: Copiare il testo dell'allucinazione e l'ID del contatto e inviarlo all'amministratore IT per affinare i prompt e le regole di parsing del bot.

---

## 3. Doppia Prenotazione / Conflitto Date (Overbooking)

### Sintomi
- Due preventivi diversi risultano "Confermati" per lo stesso giorno a causa di un inserimento manuale scorretto o di un bypass del database.

### Azioni immediate per i Venue Manager
1. **Blocco Data**: Impedire qualsiasi ulteriore offerta commerciale per quel giorno specifico.
2. **Contatto del Cliente a Basso Valore**: Identificare quale dei due contratti ha l'acconto piu' basso o la data di inserimento piu' recente.
3. **Escalation Commerciale**: Contattare telefonicamente il cliente proponendo una data alternativa con un pacchetto migliorato (es. open bar gratuito o sconto sul buffet) come compensazione commerciale.

---

## 4. Database o Server Disconnesso (App Irraggiungibile)

### Sintomi
- Schermata bianca all'apertura del CRM o errori di rete persistenti (`502 Bad Gateway`, `504 Gateway Timeout`).

### Azioni immediate per lo Staff
1. **Modalita' Cartacea Temporanea**: Utilizzare l'agenda cartacea o un file Excel locale di emergenza per annotare i lead telefonici e gli impegni del giorno.
2. **Notifica Admin**: Contattare con urgenza l'amministratore IT via telefono o canale dedicato per riavviare l'istanza del server su Render/AWS o la connessione al database PostgreSQL.
3. **Nessun Reinserimento di Massa**: Una volta ripristinato il sistema, evitare di inserire contemporaneamente decine di contatti per non generare colli di bottiglia o duplicati.

---

## 5. Sospetto Account Compromesso (Cybersecurity)

### Sintomi
- Messaggi non inviati dallo staff che appaiono in Inbox, accessi non riconosciuti registrati in Security Log, o modifiche non autorizzate ai preventivi.

### Azioni immediate per lo Staff
1. **Reset Password**: Cambiare immediatamente la password del proprio account dalle impostazioni del CRM.
2. **Notifica Amministratore**: Richiedere all'Admin di terminare tutte le sessioni attive dell'utente compromesso e disattivare l'account a database se necessario.
3. **Analisi Security Log**: L'Admin deve controllare il `/security-audit-mock` o la tabella `audit_log` reale per individuare gli IP esterni e identificare l'entita' dell'intrusione.
