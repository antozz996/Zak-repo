# Piano GDPR e Data Privacy - ZAK Ecosystem AI

> [!WARNING]
> **DISCLAIMER IMPORTANTE:** Questo documento costituisce una specifica tecnica e un'analisi dei flussi di dati all'interno del software. Non costituisce consulenza legale o parere legale formale. Si consiglia al cliente di sottoporre il piano al proprio Responsabile della Protezione dei Dati (DPO) o a un consulente legale specializzato per la convalida finale.

---

## 1. Dati Personali Trattati e Finalità

ZAK tratta dati personali per conto della venue (Titolare del Trattamento). L'applicazione funge da Responsabile del Trattamento (Data Processor).

### Categorie di Dati Raccolti:
- **Dati Anagrafici e di Contatto:** Nome, Cognome, indirizzo Email, Numero di telefono, Username di Instagram dei lead e dei clienti.
- **Dati dell'Evento:** Tipo di evento, data dell'evento, numero stimato di partecipanti, preferenze alimentari (che potrebbero rivelare dati particolari es. intolleranze, scelte religiose).
- **Comunicazioni:** Trascrizioni e file audio delle telefonate sul canale vocale (Vapi/Bland), cronologia dei messaggi WhatsApp e Instagram.
- **Log Amministrativi:** Indirizzi IP e attività degli operatori dello staff.

### Finalità del Trattamento:
- Esecuzione di misure precontrattuali (formulazione preventivi commerciali).
- Esecuzione del contratto (gestione logistica e organizzativa dell'evento).
- Re-engagement commerciale e fidelizzazione (invio comunicazioni promozionali previo consenso esplicito).

---

## 2. Tempi di Conservazione Consigliati (Data Retention)

Per rispettare il principio di *limitazione della conservazione* del GDPR, si raccomandano le seguenti politiche di retention automatiche:

| Categoria Dati | Periodo di Conservazione | Azione al termine |
| :--- | :--- | :--- |
| **Lead Non Convertiti (Persi)** | 12 mesi dall'ultimo contatto | Anonimizzazione o eliminazione definitiva. |
| **Contatti con Evento Confermato** | 10 anni (requisiti fiscali e civilistici) | Conservazione in archivio storico protetto. |
| **Registrazioni Audio Telefonate** | 30 giorni dalla telefonata | Cancellazione definitiva del file MP3 dal Cloud Storage (mantenendo solo la trascrizione testuale sintetica se necessaria). |
| **Log di Audit Interni** | 24 mesi dalla registrazione | Cancellazione o archiviazione offline. |

---

## 3. Gestione dei Diritti dell'Interessato (Diritto all'Oblio ed Esportazione)

Il sistema deve consentire ai Venue Manager (ruolo `manager` o `admin`) di adempiere alle richieste dei clienti:

### Cancellazione dei Dati (Diritto all'Oblio)
- ZAK deve includere un pulsante **"Elimina Definitivamente Contatto"** nella scheda cliente.
- L'eliminazione deve eseguire una cancellazione a cascata (`ON DELETE CASCADE`) nel database: rimuovendo contatti, messaggi associati, note dello staff, log di chiamate e preventivi.
- Se il cliente ha un preventivo confermato e fatturato, i dati necessari per obblighi di legge di contabilità devono essere mantenuti in sola lettura in una tabella di archivio storico blindata, separata dal CRM attivo.

### Esportazione dei Dati (Portabilità dei Dati)
- Fornire una funzionalità di esportazione che generi un file JSON o CSV contenente tutte le informazioni associate a quel contatto (anagrafica, messaggi WhatsApp, trascrizioni e preventivi).
- Il file può essere scaricato dall'operatore e inviato al cliente richiedente in formato leggibile da dispositivo automatico.

---

## 4. Trascrizioni Vocali e Messaggistica WhatsApp/Meta

### Canale Voice (Vapi/Bland.ai)
- **Informativa Telefonica:** La chiamata telefonica gestita dall'AI deve iniziare obbligatoriamente con un messaggio di informativa breve (es. *"La chiamata è gestita dall'assistente virtuale di Villa ZAK e la trascrizione verrà salvata per gestire la richiesta. Rimanendo in linea acconsenti al trattamento. Per info scrivi a privacy@villazak.com"*).
- **Consenso:** Se il cliente non desidera la registrazione, deve poter richiedere di parlare con un umano o interrompere la chiamata.

### Canale WhatsApp & Instagram (Meta Cloud API)
- Meta agisce come sub-responsabile del trattamento per l'infrastruttura di rete.
- ZAK deve configurare le API Meta Cloud in modo che i messaggi in transito siano crittografati durante il trasporto (HTTPS/TLS) e che le credenziali dell'API siano memorizzate in modo sicuro.
- Inserire sempre un'opzione di opt-out rapido nei messaggi di marketing automatico (es. *"Scrivi STOP per non ricevere altre comunicazioni"*).
