# Fixtures di Test - Voice Assistant Webhook

Questo documento descrive come configurare e testare il webhook di ricezione delle chiamate del Voice Assistant AI (Vapi/Bland).

---

## 1. File di Riferimento delle Fixtures
Il dataset completo contenente i dati di trascrizione telefonica fittizi e' in:
*   [voice-assistant-test-fixtures.json](file:///c:/Users/virgi/Desktop/ZAK/attached_assets/voice-assistant-test-fixtures.json)

---

## 2. Dettaglio dei Casi di Test Vocali

### A. Creazione Evento Agenda
*   **Azione:** Fissare un appuntamento/sopralluogo indicando data relativa e orario.
*   **Proprieta' attese:** Identificazione corretta del tipo risorsa (`visit`), dell'orario (`15:30`) e conversione del giorno della settimana relativo (es. martedi' prossimo).

### B. Creazione Task
*   **Azione:** Lo staff o il cliente richiede di eseguire un'attivita' futura (es. inviare un listino prezzi).
*   **Proprieta' attese:** Generazione del task in stato da fare, con titolo esplicativo, priorita' corretta e scadenza.

### C. Associazione Contatto (Phone Matching)
*   **Azione:** Il webhook fornisce un numero di telefono.
*   **Proprieta' attese:** ZAK esegue una query sul DB per verificare se il contatto esiste gia'. Se esiste, lo associa alla chiamata. Altrimenti, crea un lead vuoto associando il nome pronunciato.

### D. Date Relative e Orari
*   **Casi d'uso:** Gestione di "domani", "dopodomani", o indicazioni generiche di orario come "alle 15".
*   **Proprieta' attese:** Calcolo corretto del timestamp ISO 8601 relativo in base al fuso orario `Europe/Rome`.

### E. Priorita' Urgente & Ambiguita'
*   **Casi d'uso:** Richieste concitate o frasi confuse a bassa confidenza.
*   **Proprieta' attese:** Deviazione immediata (SIP Transfer) o innesco di escalation commerciale manuale con alert nel log.
