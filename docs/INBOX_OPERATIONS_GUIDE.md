# Guida Operativa - Inbox Avanzata ZAK

L'Inbox di ZAK è il centro operativo per tutte le comunicazioni con i clienti. Raccoglie in tempo reale messaggi WhatsApp, chat di Instagram, lead dal sito web e chiamate vocali gestite dagli assistenti AI. Questa guida spiega allo staff come gestire le conversazioni in modo efficiente, collaborando con l'AI.

---

## 1. Struttura dell'Inbox e Stati dei Messaggi

L'interfaccia dell'Inbox è divisa in tre aree principali:
1. **Lista delle Conversazioni (a sinistra):** Mostra l'elenco dei contatti attivi ordinati per ultimo messaggio ricevuto.
2. **Area della Conversazione (al centro):** Mostra la timeline dei messaggi scambiati, incluse le note interne e le trascrizioni vocali.
3. **Dettaglio Contatto e Azioni (a destra):** Mostra i dettagli del contatto (nome, telefono, tipo di evento) e i collegamenti rapidi ai preventivi e ai task.

### Stati della Conversazione: Letti vs Non Letti
- **Non Letto (Pallino Blu / Testo in Grassetto):** Identifica messaggi in ingresso che non sono ancora stati visualizzati da un operatore umano o contrassegnati come gestiti.
- **Letto:** Conversazioni già visionate.
- **Archiviato / Gestito:** Conversazioni chiuse per cui non sono necessarie azioni immediate. È possibile riaprirle in qualsiasi momento cercando il contatto.

---

## 2. Filtri di Navigazione Rapida

Per gestire volumi elevati di messaggi, utilizza i filtri posizionati sopra la lista conversazioni:
- **Tutti:** Mostra ogni conversazione attiva nella venue.
- **Da Gestire / Non Letti:** Filtra solo i messaggi che richiedono attenzione immediata da parte dello staff.
- **Assegnati a Me:** Mostra solo le chat in cui tu sei l'operatore designato.
- **Canale Vocale (Voice):** Mostra solo le conversazioni contenenti telefonate gestite o trascritte dall'AI.
- **Stato Lead:** Filtra in base al progresso del cliente (es. *Nuovo*, *Contattato*, *Qualificato*, *Perso*).

---

## 3. Assegnazione Operatore e Presa in Carico

Ogni conversazione può essere assegnata a un membro dello staff per evitare risposte duplicate o disallineamenti:
1. Apri la conversazione di interesse.
2. Nel pannello di destra, individua la voce **Operatore Assegnato**.
3. Clicca sul menu a tendina e seleziona il tuo nome (o assegna la chat a un collega competente).
4. La conversazione mostrerà un badge con l'avatar dell'operatore assegnato nella lista principale.

---

## 4. Handoff AI (Passaggio di Consegne tra AI e Umano)

L'AI di ZAK risponde automaticamente ai clienti secondo le regole impostate (es. invio prezzi, disponibilità base). Quando un cliente richiede assistenza complessa o manifesta l'intenzione di concludere un accordo personalizzato, entra in gioco il meccanismo di **Handoff AI**:

### Come funziona l'Handoff automatico:
- L'AI rileva parole chiave o intenti specifici (es. *"Voglio parlare con una persona"*, *"Potete farmi uno sconto speciale?"*, *"Ho un problema con il pagamento"*).
- L'AI disattiva temporaneamente le proprie risposte automatiche per quel contatto (stato: **AI in Pausa**).
- Viene inviata una notifica push/email allo staff e la conversazione compare in cima alla lista con l'etichetta **Richiesta Intervento Umano**.

### Come gestire l'Handoff manualmente:
Se noti che l'AI sta rispondendo in modo impreciso o preferisci gestire personalmente la trattativa:
1. Clicca sul pulsante **Pausa AI** situato nella barra superiore della chat attiva.
2. Invia la tua risposta personalizzata.
3. Al termine della gestione umana, puoi cliccare su **Riattiva AI** per consentire nuovamente all'assistente virtuale di gestire le risposte automatiche di cortesia o i follow-up.

---

## 5. Canale Vocale (Voice Channel)

Il canale voice gestisce le chiamate telefoniche in entrata ed uscita tramite l'integrazione con Vapi/Bland.
Nell'Inbox, le chiamate vengono visualizzate così:
- **Trascrizione in tempo reale:** All'interno della chat compare un fumetto speciale di tipo "Telefonata" contenente il riassunto strutturato della chiamata e la trascrizione testuale completa del dialogo tra l'assistente vocale e il cliente.
- **Ascolto della registrazione:** Se configurato, è presente un player audio per ascoltare la chiamata registrata.
- **Analisi dell'Intento:** ZAK estrae automaticamente l'intento principale (es. *"Richiesta disponibilità per il 12 Settembre"*) e lo mostra come nota in evidenza, generando automaticamente un task per lo staff (es. *Verificare disponibilità per [Nome Cliente]*).

---

## 6. Esempio di Flusso Operativo Reale

Ecco uno scenario tipo di gestione quotidiana:
1. **Ore 09:00:** L'operatore accede all'Inbox e filtra per **Da Gestire**.
2. **Ore 09:05:** Trova una chat di *Giulia Bianchi* contrassegnata con **Richiesta Intervento Umano**. L'AI ha già raccolto le informazioni preliminari: laurea, 80 persone, luglio 2026. Giulia ha poi chiesto: *"Posso portare la mia torta o devo prenderla da voi?"* (l'AI è andata in pausa).
3. **Ore 09:10:** L'operatore si assegna la chat, legge la trascrizione del bot, e risponde direttamente: *"Ciao Giulia! Certamente, puoi portare la tua torta previa presentazione della certificazione HACCP della pasticceria..."*.
4. **Ore 09:12:** L'operatore invia una bozza di preventivo direttamente dalla chat e lascia l'AI in pausa fino al giorno successivo per attendere la risposta.
5. **Ore 09:15:** Arriva una telefonata vocale sul canale Voice. Il bot risponde, raccoglie la richiesta di *Davide Moretti* per una cena aziendale a dicembre, e aggancia. La chat di Davide compare nell'Inbox con la trascrizione della chiamata e un task automatico: *"Verificare menu aziendali per Davide Moretti"*. L'operatore clicca sul task e lo prende in carico.
