# Specifica Tecnica - Preventivo PDF Reale

Questo documento specifica la struttura, il layout e i flussi di invio per i preventivi in formato PDF generati dal sistema ZAK.

---

## 1. Struttura del Documento PDF (Layout A4)

I preventivi reali esportati in PDF devono conformarsi a un layout standard A4 suddiviso nelle seguenti sezioni obbligatorie:

### A. Intestazione (Header)
*   **Logo della Venue:** Posizionato in alto a sinistra.
*   **Dati Societari Venue:** Ragione sociale, P.IVA, indirizzo, contatti (telefono ed email).
*   **Identificativo Preventivo:** Numero documento (es. `PRV-2026-0422`), data di emissione e data di validita' (default: 15 giorni dalla creazione).

### B. Dati Cliente & Evento (Client & Event Details)
*   **Dati Cliente:** Nome, Cognome, Azienda (se applicabile), Codice Fiscale / P.IVA ed email.
*   **Dati Evento:**
    *   Tipologia evento (es. Matrimonio, Cena Aziendale).
    *   Data stabilita dell'evento.
    *   Orari concordati (es. dalle 16:00 alle 02:00).
    *   Numero di invitati stimati (pax).

### C. Pacchetti & Servizi Inclusi (Packages & Line Items)
Una tabella dettagliata con l'elenco delle voci commerciali:

| Codice | Descrizione Servizio | Quantita' | Prezzo Unitario | Totale |
| :--- | :--- | :---: | :---: | :---: |
| AFF-01 | Noleggio esclusivo location (Sale + Parco) | 1 | € 2.500,00 | € 2.500,00 |
| CAT-02 | Menu Dinner Premium (Antipasti, 2 Primi, Secondo) | 100 pax | € 85,00 | € 8.500,00 |
| SER-05 | Allestimento floreale e confettata | 1 | € 600,00 | € 600,00 |

### D. Riascolto Fiscale (Imponibile & IVA)
In calce alla tabella dei servizi, devono essere esplicitati:
*   **Totale Imponibile:** Somma delle voci al netto delle imposte.
*   **Aliquota IVA applicata:** 10% per servizi di somministrazione alimenti e bevande, 22% per noleggi e servizi organizzativi.
*   **Totale Preventivo (Lordo):** Somma imponibile + IVA.

---

## 2. Condizioni Generali e Termini di Pagamento

Questa sezione contiene le note legali e le scadenze:
*   **Scadenze di Pagamento:**
    1.  *Acconto di Conferma:* 30% del totale da versare alla firma del preventivo.
    2.  *Saldo:* Restante 70% da saldare entro 10 giorni lavorativi prima della data dell'evento.
*   **Politica di Cancellazione:** Termini di rimborso dell'acconto in base al preavviso fornito dal cliente.
*   **Foro Competente:** Foro legale di riferimento in caso di controversie commerciali.

---

## 3. Accettazione e Firma Digitale (Approval)

Il preventivo digitale visualizzato tramite web app include una sezione di accettazione interattiva:
*   **Firma Grafometrica Mock:** Un'area canvas che consente al cliente di tracciare la propria firma con mouse o touchscreen.
*   **Verifica OTP:** Invio facoltativo di un codice SMS di conferma sul numero del cliente per convalidare l'accettazione.
*   **Aggiornamento di Stato:** Alla firma, lo stato del preventivo nel database di ZAK passa da `inviato` ad `accettato` e viene notificato allo staff.

---

## 4. Flusso di Invio (WhatsApp / Email Delivery)

*   **Invio via Email:** Il sistema genera il PDF, lo salva su Cloud Storage (S3) e invia un'email al cliente tramite provider di posta (es. SendGrid) allegando il file.
*   **Invio via WhatsApp:** Il sistema invia un messaggio template approvato da Meta al cliente contenente un testo del tipo:
    > *"Ciao [Nome], ecco il preventivo personalizzato per il tuo evento. Clicca sul link per visualizzarlo e firmarlo online: [Link Proposta]"*
*   Il link rimanda alla pagina interattiva web dove il cliente puo' scaricare il PDF reale o procedere alla firma diretta.
