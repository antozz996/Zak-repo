# Playbook Go-Live Staff - Giorno di Lancio ZAK

Questo documento descrive la procedura operativa passo-passo che lo staff della venue deve seguire nel giorno del rilascio in produzione (go-live) del sistema ZAK.

---

## FASE 1: Accesso e Verifica Iniziale (Ore 08:30 - 09:00)

### 1. Primo Accesso al CRM
- Navigare sull'URL di produzione comunicato dall'amministratore (es. `https://crm.villazak.it`).
- Inserire l'email aziendale e la password provvisoria assegnata.
- **Cambio Password**: Al primo accesso, navigare in *Impostazioni Profilo* e modificare la password provvisoria con una chiave di sicurezza complessa (minimo 12 caratteri).

### 2. Verifica dei Ruoli ed Interfaccia
- Controllare la sidebar a sinistra:
  - Se sei un **Operatore Staff**: non devi vedere i link *Dashboard*, *Preventivi*, *Automazioni* e *Audit Log*.
  - Se sei un **Venue Manager**: devi vedere tutte le sezioni ad eccezione di *Audit Log* e *Impostazioni globali*.
- Segnalare immediatamente all'Amministratore eventuali discrepanze di visualizzazione per correggere il ruolo sul database.

---

## FASE 2: Monitoraggio Canali e Webhook (Ore 09:00 - 10:00)

### 1. Test di Ricezione Webhook (WhatsApp)
- Chiedere a un collaboratore esterno di inviare un messaggio WhatsApp di prova al numero business del locale (es. *"Buongiorno, vorrei informazioni per un evento"*).
- Verificare che il messaggio appaia entro 5 secondi nella lista **Inbox** di ZAK.
- Controllare che il contatto sia stato creato automaticamente in **Contatti CRM** con stato "Nuovo".

### 2. Cosa fare se il Webhook non arriva?
Se un messaggio inviato a WhatsApp non compare in Inbox entro 30 secondi:
1. **Verifica il log degli errori**: Chiedere all'Admin di controllare `whatsapp_outbound_log` a database o i log del server Express per identificare errori `401 Unauthorized` o `403 Forbidden` da Meta.
2. **Controllo Token Meta**: L'Admin deve verificare che il `META_WHATSAPP_ACCESS_TOKEN` non sia scaduto e che il webhook di Meta sia configurato correttamente sulla dashboard sviluppatori.
3. **Escalation**: Se l'errore persiste, segnalare il problema nel canale Slack/WhatsApp del team IT indicando l'ID del messaggio e l'ora del test.

---

## FASE 3: Gestione Leads e Assegnazione AI (Tutto il giorno)

### 1. Presa in Carico Chat
- All'arrivo di una richiesta, lasciare che **Zak AI** risponda per qualificare il lead (estrazione nome, invitati, data).
- Se il cliente richiede l'intervento umano o se appare il badge **Richiede staff**:
  - Cliccare sul pulsante di **assegnazione** nella chat.
  - Assegnare la chat a se stessi.
  - Rispondere manualmente (Zak AI si disattivera' automaticamente su questa chat).

### 2. Completamento Task e Preventivi
- Per ciascun contatto qualificato, i **Venue Manager** devono creare e inviare il preventivo entro 4 ore dalla richiesta.
- Gli operatori dello **Staff** devono completare i task operativi assegnati (es. sopralluoghi, telefonate) segnandoli come completati in `/task` alla fine del compito.

---

## FASE 4: Chiusura Giornata e Checklist di Controllo (Ore 18:00 - 18:30)

Prima di lasciare il locale, ogni operatore deve:
- [ ] Verificare che non ci siano chat con badge **Richiede staff** non gestite in Inbox.
- [ ] Controllare che tutti i task con scadenza odierna siano stati completati o riprogrammati.
- [ ] Segnalare al Venue Manager eventuali anomalie comportamentali del bot AI riscontrate durante il giorno.
