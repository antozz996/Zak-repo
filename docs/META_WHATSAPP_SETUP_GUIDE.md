# Guida Setup - Meta WhatsApp Business Cloud API

Questa guida descrive i passi necessari per configurare l'account sviluppatore Meta e integrare le WhatsApp Cloud API all'interno dell'applicazione ZAK. La configurazione consente a ZAK di inviare e ricevere messaggi in tempo reale.

---

## 1. Prerequisiti
Prima di iniziare, assicurati di avere:
- Un account **Business Manager** verificato su Meta (indispensabile per rimuovere i limiti di invio della modalità sandbox).
- Un numero di telefono dedicato che non sia attualmente registrato su un'app WhatsApp standard o Business sul telefono (se registrato, va eliminato l'account WhatsApp prima di procedere).
- Accesso alle chiavi e impostazioni del portale [Meta for Developers](https://developers.facebook.com/).

---

## 2. Configurazione dell'Applicazione Meta

### Step 1: Creazione dell'App Sviluppatore
1. Accedi a [Meta Developers](https://developers.facebook.com/) e fai clic su **My Apps** -> **Create App**.
2. Scegli il tipo di app **Business** (o seleziona il caso d'uso WhatsApp se proposto dalle nuove interfacce).
3. Assegna un nome all'app (es. `ZAK Integration`) e collegala al tuo account Business Manager.

### Step 2: Aggiunta del Prodotto WhatsApp
1. Nella bacheca della tua nuova app Meta, scorri fino a trovare il prodotto **WhatsApp** e clicca su **Set Up**.
2. Verrà configurato un account sandbox temporaneo con un numero di test fornito da Meta.

---

## 3. Recupero dei Parametri di Configurazione

Per collegare WhatsApp a ZAK, avrai bisogno di raccogliere i seguenti parametri e inserirli nel file `.env` di produzione (o nelle impostazioni della venue sulla dashboard amministrativa).

> [!WARNING]
> Non salvare o committare mai le chiavi reali all'interno del repository Git. Usa sempre variabili d'ambiente.

### checklist Parametri da Recuperare:
- [ ] **Phone Number ID (ID numero di telefono):** Identificativo univoco del numero mittente. Si trova nella sezione *WhatsApp -> API Setup*.
- [ ] **WhatsApp Business Account ID (ID account WhatsApp Business):** Identificativo dell'account business a cui è legato il numero. Si trova nella stessa pagina *API Setup*.
- [ ] **App ID (ID applicazione):** Trovabile nella barra superiore del portale sviluppatori Meta.
- [ ] **App Secret (Chiave segreta dell'app):** Trovabile in *Settings -> Basic*. È una chiave privata che serve per validare le firme dei webhook.
- [ ] **System User Access Token (Token di accesso permanente):**
  1. Vai sulle impostazioni del tuo *Business Manager*.
  2. Crea un **System User** (Utente di sistema) con ruolo Admin.
  3. Genera un Token per l'utente selezionando l'app creata e spuntando i permessi `whatsapp_business_messaging` e `whatsapp_business_management`.
  4. Imposta la scadenza del token su **Never** (Permanente). Copia il token generato immediatamente (non sarà più visibile).

---

## 4. Configurazione del Webhook per i Messaggi Ricevuti

Il webhook consente a Meta di notificare ZAK istantaneamente ogni volta che un cliente invia un messaggio o quando lo stato di recapito cambia (consegnato, letto).

### Step per la Configurazione del Webhook su Meta:
1. Nella dashboard della tua App Meta, vai alla barra laterale sinistra e clicca su **WhatsApp** -> **Configuration**.
2. Alla voce **Webhook**, clicca su **Edit**.
3. Compila i campi:
   - **Callback URL:** `https://tuo-dominio-zak.com/api/webhook/whatsapp` (sostituisci con l'URL reale del server ZAK).
   - **Verify Token:** Inserisci una stringa segreta a tua scelta definita nella configurazione del server (es. `ZAK_VERIFY_TOKEN_2026_SECRET`).
4. Clicca su **Verify and Save**. Meta invierà una richiesta GET all'URL specificato per validare la stringa di verifica.
5. Sotto la voce **Webhook fields**, clicca su **Manage** e iscriviti all'evento **messages**. Questo è fondamentale per ricevere i testi dei messaggi in ingresso e le notifiche di stato.

---

## 5. Richiesta di Approvazione Template WhatsApp

Per poter iniziare una conversazione con un cliente dopo 24 ore di inattività, devi usare dei template pre-approvati.

### Procedura di Creazione:
1. Nella sezione *API Setup* di Meta, clicca sul link per gestire i template (oppure vai in *Meta Business Suite* -> *Strumenti di pianificazione* -> *Gestione messaggi template*).
2. Clicca su **Create Template**.
3. Scegli la categoria (es. *Utility* o *Marketing*).
4. Definisci la lingua (es. Italiano).
5. Inserisci il corpo del testo utilizzando le parentesi graffe per le variabili numeriche:
   > *"Ciao {{1}}, ti confermiamo che il preventivo per l'evento {{2}} del giorno {{3}} è pronto. Puoi visualizzarlo qui: {{4}}"*
6. Invia il template in revisione. Di solito Meta risponde in pochissimi minuti.
7. Una volta approvato, il template può essere richiamato all'interno delle automazioni di ZAK usando il nome del template registrato (es. `conferma_preventivo_utility`).
