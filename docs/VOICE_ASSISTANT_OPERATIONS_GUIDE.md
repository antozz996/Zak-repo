# Guida Operativa - Voice Assistant (Vapi/Bland.ai)

ZAK integra un assistente vocale AI telefonico che risponde alle chiamate dei clienti, acquisisce le loro richieste e le inserisce direttamente nel CRM sotto forma di note, compiti (task) o eventi in agenda.

---

## 1. Funzioni Principali dell'Assistente Vocale

L'AI telefonica e' configurata per svolgere tre compiti principali:
1.  **Rispondere fuori orario:** Gestire le telefonate quando l'ufficio commerciale e' chiuso.
2.  **Qualificare il lead:** Capire chi chiama (nome, telefono) e cosa desidera (sopralluogo, informazioni prezzi).
3.  **Registrare ed inserire:** Salvare la trascrizione testuale, l'audio registrato, e creare in automatico gli elementi di lavoro su ZAK.

---

## 2. Differenza tra gli Elementi Creati

Al termine di ogni telefonata gestita dall'AI, ZAK genera i seguenti elementi:

*   **Chiamata / Trascrizione:** L'intero testo del dialogo tra cliente e AI, salvato nella timeline del contatto CRM.
*   **Task (Compito):** Creato se la richiesta richiede un'azione dello staff (es. *"Inviare preventivo personalizzato per matrimonio"*).
*   **Evento in Agenda:** Creato provvisoriamente se il cliente concorda una data e ora di sopralluogo o appuntamento (es. *"Sopralluogo Villa Rossi"*).

---

## 3. Monitoraggio e Validazione dello Staff

Poiche' l'AI puo' commettere imprecisioni (ad esempio trascrivendo male un nome o impostando una data errata), lo staff deve monitorare le chiamate dal pannello **Review Chiamate Vocali** (o `/voice-command-review` nella sandbox):

### Quando e' necessaria la revisione umana?
*   **Confidenza Alta (&ge; 85%):** Il sistema esegue l'operazione in automatico. Non e' richiesto intervento, ma e' consigliata una rapida lettura.
*   **Confidenza Media (60% - 84%):** L'evento in agenda viene bloccato in stato *"Da Confermare"* (in arancione). Lo staff riceve un task di notifica per verificare e confermare manualmente i dettagli.
*   **Confidenza Bassa (< 60%):** L'AI non effettua alcuna operazione. La chat WhatsApp del contatto viene assegnata a un operatore con priorita' *"Urgente"* per ricontattare il cliente.

---

## 4. Esempi Pratici di Conversazione ed Elaborazione

### Caso A: Richiesta Appuntamento (Successo)
*   **Cliente:** *"Vorrei venire a vedere la villa giovedi' prossimo alle quindici. Sono Marco Neri."*
*   **Elaborazione AI:** Rileva intento `schedule_visit` con data e ora corretti.
*   **Azione ZAK:** Crea contatto "Marco Neri", inserisce l'evento in agenda per giovedi' alle 15:00 ed emette notifica di conferma.

### Caso B: Richiesta Commerciale Generica (Task)
*   **Cliente:** *"Volevo sapere se fate pacchetti tutto incluso e quanto costa il catering."*
*   **Elaborazione AI:** Rileva intento `commercial_info`.
*   **Azione ZAK:** Crea un task assegnato al Manager: *"Contattare cliente per info pacchetti catering"*.

### Caso C: Chiamata Non Chiara o Rumorosa (Escalation)
*   **Cliente:** *(voce confusa, rumore di fondo)* *"Si'.. vorrei.. forse fine anno.. non so"*
*   **Elaborazione AI:** Rileva confidenza molto bassa.
*   **Azione ZAK:** Interrompe la chiamata dicendo *"Passo la chiamata al nostro staff"* (SIP Transfer) e devia la telefonata sul cellulare della venue.

---

## 5. Norme sulla Privacy e Gestione dei Dati (GDPR)

*   **Informativa iniziale obbligatoria:** All'inizio di ogni telefonata, l'AI pronuncia sempre la formula: *"Questa chiamata e' gestita da un assistente virtuale e puo' essere registrata per scopi organizzativi. Continuando acconsente al trattamento dei dati."*
*   **Registrazioni audio:** I file audio della chiamata vengono memorizzati sul server protetto di ZAK. Le registrazioni vengono cancellate automaticamente dopo **90 giorni**.
*   **Modifica e cancellazione:** Se un cliente richiede la rimozione delle proprie registrazioni, l'amministratore puo' eliminarle singolarmente dalla scheda contatto del CRM cliccando sull'icona del cestino accanto alla trascrizione chiamata.
