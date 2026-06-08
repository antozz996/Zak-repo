# Specifica UX - LLM Booking Assistant

Questo documento definisce l'esperienza conversazionale e le logiche di integrazione per l'assistente virtuale basato su Large Language Model (LLM) di ZAK, incaricato di pre-qualificare i lead tramite WhatsApp.

---

## 1. Flusso di Raccolta Dati Mandatori (Missing Steps)

L'assistente deve raccogliere quattro informazioni chiave prima di consentire la generazione di una proposta commerciale:

1.  **Tipologia di Evento:** es. Matrimonio, Festa di Laurea, Evento Aziendale.
2.  **Data dell'Evento:** Giorno preciso o mese/anno di riferimento.
3.  **Numero di Invitati:** Stima del numero di persone (pax).
4.  **Budget di Spesa Indicativo:** Range di spesa pianificato.

### Regola Conversazionale
L'assistente non deve porre piu' di una domanda alla volta. Deve analizzare le risposte dell'utente ed estrarre i dati in modo naturale, senza risultare rigido o meccanico.

---

## 2. Tono di Voce (Tone of Voice)

Il tono del bot deve essere configurato secondo i seguenti pilastri:

*   **Professionale e Accogliente:** Usa espressioni cordiali, da receptionist di alto livello.
*   **Chiaro ed Essenziale:** Risposte corte (massimo 2-3 frasi) adatte alla lettura su dispositivi mobile.
*   **Orientato all'Azione:** Ogni messaggio deve concludersi con un invito chiaro a fornire l'informazione mancante.
*   **Trasparenza Artificiale:** Se l'utente chiede esplicitamente "Sei un robot?", il bot deve dichiarare con trasparenza di essere l'assistente virtuale della venue.

---

## 3. Formato JSON Atteso (Extracted Data Schema)

Ad ogni interazione, l'LLM analizza la chat e restituisce in background un payload JSON contenente i dati estratti fino a quel momento:

```json
{
  "extracted_fields": {
    "event_type": "wedding" | "corporate" | "private_party" | null,
    "event_date": "YYYY-MM-DD" | null,
    "event_period_raw": "Settembre 2026" | null,
    "guest_count": 120 | null,
    "budget_estimated": 8000 | null
  },
  "missing_fields": ["event_date", "budget_estimated"],
  "conversation_complete": false,
  "requires_escalation": false,
  "escalation_reason": null
}
```

---

## 4. Handoff Umano (Escalation)

L'assistente virtuale deve disattivarsi immediatamente e trasferire la chat allo staff umano nei seguenti casi (Handoff):

1.  **Richiesta Esplicita:** L'utente scrive frasi come *"Voglio parlare con una persona"*, *"Passami un operatore"*.
2.  **Rilevamento Rabbia/Frustrazione:** Espressioni negative o lamentele rilevate dall'analisi del sentiment.
3.  **Casi Limite Complessi:** Richieste speciali fuori dai pacchetti standard (es. catering esterno kosher, allestimenti monumentali).
4.  **Loop Conversazionale:** Se l'assistente formula per 3 volte consecutive la stessa domanda senza ottenere una risposta valida, deve cedere il controllo dicendo: *"Vedo che ci sono dei dettagli particolari da definire. Passo la chat al nostro team commerciale che ti rispondera' a breve."*

---

## 5. Errori da Evitare (Antipatterns)

*   **Allucinazioni sulle tariffe:** Il bot non deve MAI inventare sconti o promettere prezzi non presenti nei pacchetti configurati. In caso di dubbio, deve rimandare la decisione allo staff.
*   **Messaggi troppo lunghi:** Evitare blocchi di testo infiniti che scoraggiano l'interazione del cliente.
*   **Mancata notifica allo staff:** Quando avviene un'escalation, lo staff deve ricevere una notifica push istantanea con badge di priorita' rossa.
