# Guida Operativa - Automazioni CRM ZAK

Le automazioni CRM di ZAK aiutano a convertire i lead in clienti paganti e a fidelizzare i clienti attuali senza lavoro manuale ripetitivo. Questo documento spiega ai Venue Manager come configurare, monitorare ed eseguire le campagne automatiche in modo sicuro e professionale.

---

## 1. Campagne di Re-engagement (Recupero Lead)

La campagna di re-engagement si attiva automaticamente quando un potenziale cliente smette di rispondere ai messaggi o non conclude una proposta dopo aver ricevuto un preventivo.

### Come funziona il flusso automatico:
1. **Fase di Attesa:** ZAK monitora l'ultimo contatto del lead. Se non ci sono messaggi da parte del cliente per **5 giorni** consecutivi e lo stato è *Contattato* o *Qualificato*, il lead diventa idoneo al re-engagement.
2. **Invio Messaggio di Controllo:** ZAK invia un messaggio amichevole tramite WhatsApp (utilizzando un template approvato da Meta) del tipo:
   > *"Ciao [Nome], spero tutto bene! Volevo solo verificare se hai avuto modo di dare un'occhiata al preventivo per il tuo evento [Tipo Evento]. Abbiamo ancora alcune date disponibili per quel periodo. Fammi sapere!"*
3. **Aggiornamento Stato:** Se il cliente risponde, l'AI si riattiva (o avvisa lo staff se rileva una richiesta complessa). Se non risponde dopo ulteriori 7 giorni, lo stato del lead viene aggiornato a *Perso* per mantenere il database pulito.

---

## 2. Ricorrenze ed Eventi Ciclici

Le ricorrenze consentono di ricontattare automaticamente i clienti passati in occasioni speciali per proporre nuovi eventi:
- **Compleanni:** Invio di un messaggio di auguri automatico con un'offerta speciale (es. *Sconto del 10% sulla prenotazione della sala*) 15 giorni prima del compleanno del cliente.
- **Anniversari di Evento:** Per le aziende o i clienti privati che hanno organizzato un evento memorabile l'anno precedente, ZAK invia un follow-up a distanza di 11 mesi per proporre l'edizione successiva (es. *"Ciao Roberto, l'anno scorso abbiamo ospitato il team building di [Nome Azienda]... vi piacerebbe organizzare la convention di quest'anno?"*).

---

## 3. Gestione dei Template WhatsApp (Meta)

Meta impone regole severe sull'invio di messaggi WhatsApp aziendali per evitare lo spam. Non è possibile inviare messaggi di testo libero se sono passate più di 24 ore dall'ultimo messaggio del cliente. È obbligatorio usare i **Template Approvati**.

### Regole per i Template:
- **Variabili:** I template contengono dei segnaposto come `{{1}}` per il nome, `{{2}}` per il tipo di evento. ZAK sostituisce automaticamente queste variabili con i dati del database prima dell'invio.
- **Registrazione:** Qualsiasi modifica al testo di un template deve essere preventivamente inviata a Meta per l'approvazione tramite la Dashboard Meta Business Suite (l'approvazione richiede solitamente da pochi minuti a 2 ore).
- **Politiche di Spam:** Se i clienti segnalano i messaggi come spam, Meta può ridurre la qualità del numero telefonico o bloccarlo. Utilizza messaggi cordiali e includi sempre un'opzione di opt-out (es. *"Scrivi STOP per non ricevere altri messaggi"*).

---

## 4. Esecuzione Manuale delle Automazioni

A volte potresti voler forzare l'esecuzione di un'automazione senza attendere i tempi previsti dal sistema:
1. Accedi alla scheda del **Contatto**.
2. Clicca sulla sezione **Automazioni** nel pannello di gestione.
3. Seleziona la regola desiderata (es. *Invia Follow-up Preventivo* o *Auguri di Compleanno*).
4. Clicca su **Esegui Ora**.
5. Il sistema verificherà che il contatto abbia i requisiti minimi (es. numero WhatsApp valido) ed eseguirà immediatamente l'azione, registrandola nella timeline del cliente.

---

## 5. Log delle Esecuzioni ed Errori Comuni

Tutte le automazioni registrano le proprie azioni nel **Monitor delle Automazioni**. Se qualcosa va storto, il sistema mostra un log dell'errore.

### Tabella degli Errori Comuni per i Manager:

| Sintomo / Messaggio di Errore | Possibile Causa | Soluzione Consigliata |
| :--- | :--- | :--- |
| `ERROR: Outside 24h window - Template required` | L'operatore ha cercato di inviare un messaggio di testo libero dopo 24 ore dall'ultimo messaggio del cliente. | Usa un template WhatsApp approvato o attendi che il cliente scriva per primo. |
| `ERROR: Phone number is not registered on WhatsApp` | Il numero di telefono inserito nella scheda cliente non ha un account WhatsApp attivo. | Verifica il numero con il cliente o contattalo tramite telefonata tradizionale. |
| `ERROR: Template placeholder mismatch` | Il template inviato richiede 3 variabili, ma ZAK ne ha fornite solo 2 (es. manca il tipo di evento nella scheda cliente). | Completa tutti i campi del profilo cliente prima di forzare l'automazione. |
| `ERROR: Meta API Rate Limit Exceeded` | Sono stati inviati troppi messaggi massivi contemporaneamente, superando i limiti del piano Meta. | ZAK riproverà l'invio automaticamente a scaglioni. Evita di avviare troppe campagne massive nello stesso minuto. |
| `STATUS: Ignored - Already sent recently` | L'automazione è stata saltata per evitare di inviare messaggi duplicati ravvicinati allo stesso cliente. | Nessuna azione richiesta. Il sistema protegge il cliente dallo spam. |
