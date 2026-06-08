# Fixtures di Test - LLM Booking Assistant

Questo documento descrive come utilizzare il dataset di test delle spec di parsing per verificare la correttezza dell'LLM Booking Assistant di ZAK.

---

## 1. File di Riferimento delle Fixtures
Il dataset completo in formato JSON e' memorizzato in:
*   [booking-assistant-test-fixtures.json](file:///c:/Users/virgi/Desktop/ZAK/attached_assets/booking-assistant-test-fixtures.json)

---

## 2. Tipologie di Test Case ed Aspettative

### A. Richiesta Completa (Compleanno / Laurea / Eventi)
*   **Caso d'uso:** Il cliente fornisce tutte le informazioni mandatorie (tipo evento, numero invitati, data, budget) in un unico messaggio iniziale.
*   **Obiettivo Test:** Verificare che l'estrattore non generi omissioni e imposti `confidence` elevata (>= 0.95), procedendo all'inserimento automatico del contatto e del lead in pipeline.

### B. Richiesta Incompleta (Graduations / Weddings)
*   **Caso d'uso:** Mancano campi fondamentali come la data o il budget.
*   **Obiettivo Test:** Verificare che l'array `campi_mancanti` contenga gli identificativi esatti e che il bot formuli una domanda mirata solo sulle informazioni assenti.

### C. Conflitti di Agenda (Data Occupata)
*   **Caso d'uso:** La data richiesta risulta gia' bloccata o opzionata in agenda da un'altra trattativa confermata.
*   **Obiettivo Test:** Verificare che l'estrattore riconosca il conflitto e proponga date alternative basate sui giorni liberi adiacenti rilevati dal DB.

### D. Richiesta Escaltion Umana (Handoff)
*   **Caso d'uso:** Il cliente esprime fastidio per l'AI o richiede esplicitamente di parlare con un operatore.
*   **Obiettivo Test:** Verificare l'arresto immediato del bot e l'assegnazione della chat alla coda di smistamento staff.

### E. Richieste Fuori Contesto (Out of Context)
*   **Caso d'uso:** Domande estranee alla prenotazione di eventi (es. pizzeria d'asporto).
*   **Obiettivo Test:** Verificare che l'AI rifiuti la richiesta cortesemente rimandando all'attivita' reale della venue.

---

## 3. Strategia di Esecuzione dei Test Unitari

L'integrazione del test runner (es. Vitest o Jest) dovra' caricare il file JSON delle fixtures ed eseguire asserzioni del tipo:

```typescript
import fixtures from '../attached_assets/booking-assistant-test-fixtures.json';
import { parseBookingMessage } from './booking-assistant-parser';

describe('Booking Assistant NLU Parser', () => {
  it('should parse complete birthday requests', async () => {
    const data = fixtures.richiesta_compleanno_completa;
    const result = await parseBookingMessage(data.raw_input);
    expect(result.tipo_evento).toBe(data.expected_extraction.tipo_evento);
    expect(result.numero_invitati).toBe(data.expected_extraction.numero_invitati);
    expect(result.data_evento).toBe(data.expected_extraction.data_evento);
  });
});
```
