# Guida Operativa - LLM Booking Assistant (WhatsApp Bot)

L'LLM Booking Assistant e' il bot intelligente di ZAK che conversa in autonomia con i clienti su WhatsApp per raccogliere e qualificare le richieste di prenotazione eventi, inserendole direttamente nel CRM come lead.

---

## 1. Obiettivo dell'Assistente Conversazionale

Il bot assiste il team commerciale rispondendo istantaneamente ai nuovi contatti 24/7. Il suo obiettivo e' raccogliere 5 informazioni essenziali per formulare una proposta:
1.  **Nome e Cognome** del cliente.
2.  **Tipo di Evento** (es. Matrimonio, Laurea, Compleanno, Evento Aziendale).
3.  **Data dell'Evento** (esatta o mese/anno desiderato).
4.  **Numero di Invitati** (anche approssimativo, es. *"circa 100"*).
5.  **Budget Indicativo** del cliente.

---

## 2. Elaborazione dei Dati (Structured JSON)

A differenza dei vecchi bot a regole rigide, l'AI analizza l'intero contesto dei messaggi e lo traduce in un tracciato JSON strutturato. 
*   **Date relative:** Se il cliente scrive *"vorrei festeggiare sabato prossimo"*, l'AI calcola la data esatta basandosi sulla data corrente del server (es. convertendo in `2026-06-13`) prima di salvare il record.
*   **Intervalli di ospiti:** Se il cliente dice *"saremo tra i 60 e i 70"*, il bot estrae il valore massimo (`70`) o medio per garantire la capienza corretta.

---

## 3. Flusso di Lavoro dello Staff e Correzione dei Dati

Lo staff commerciale ha il controllo totale sulle estrazioni dell'AI tramite la pagina **Review Assistente LLM** (`/llm-booking-review-mock` o `/llm-booking-review-mock` nella sandbox):
1.  **Verifica dei Dati:** I campi estratti dall'AI compaiono in un modulo a schermo.
2.  **Modifica Manuale:** Se l'AI ha frainteso una parola (es. registrando "Compleanno" invece di "Laurea"), l'operatore puo' modificare direttamente il campo di testo.
3.  **Approvazione:** Cliccando su **"Approva Estrazione"**, i dati qualificati vengono salvati permanentemente nella scheda del contatto CRM e la data viene registrata come opzione.

---

## 4. Criteri di Handoff (Quando l'AI si ferma)

Il bot smette immediatamente di rispondere e passa la conversazione allo staff umano nei seguenti casi:
*   **Negoziazione prezzi:** Se il cliente chiede sconti, tariffe speciali o fa domande complesse sui prezzi (*"Fate sconti per gruppi?"*).
*   **Richiesta esplicita:** Se il cliente scrive frasi come *"Voglio parlare con una persona"* o *"Potete chiamarmi al telefono?"*.
*   **Toni negativi o lamentele:** Rilevamento di sentiment negativo, insulti o proteste.
*   **Stallo conversazionale:** Se dopo 3 messaggi di follow-up dell'AI il cliente continua a non fornire le informazioni di base.

Quando si attiva l'handoff, l'operatore riceve una notifica sonora e visiva sull'Inbox e l'icona dell'AI si spegne (passando in grigio).

---

## 5. Limiti e Comportamenti di Fallback

*   **Caduta del Servizio AI (Timeout):** Se i server di OpenAI o Gemini non rispondono entro 10 secondi, ZAK disattiva temporaneamente il bot e invia un messaggio di cortesia standard: *"Grazie per la richiesta. Un nostro addetto commerciale ti rispondera' tra pochissimo."*
*   **Lingue Straniere:** Il bot e' configurato per comprendere l'inglese, lo spagnolo e il francese, ma in caso di messaggi in lingue non supportate, esegue l'handoff automatico allo staff umano.
*   **Allegati e Foto:** Il bot non e' in grado di analizzare piantine di allestimento o foto di torte inviate dal cliente. Gli allegati vengono mostrati in Inbox per la gestione manuale dello staff.
