# Fixtures di Test - Automazioni CRM

Questo documento descrive le regole di business e i test case per verificare l'Engine delle Automazioni di ZAK.

---

## 1. File di Riferimento delle Fixtures
Il dataset di test delle regole di automazione e' memorizzato in:
*   [automazioni-test-fixtures.json](file:///c:/Users/virgi/Desktop/ZAK/attached_assets/automazioni-test-fixtures.json)

---

## 2. Dettaglio dei Casi di Test del CRM

### A. Re-Engagement Attivo
*   **Logica:** Rileva i contatti "addormentati" in stato di offerta commerciale inviata da oltre 5 giorni.
*   **Vincolo:** Se la finestra di chat standard Meta (24 ore) e' chiusa, l'engine deve forzare l'uso di un **Template Approvato** (`send_meta_template`) invece di messaggi a testo libero.

### B. Ricorrenze Annuali (Rinnovo)
*   **Logica:** Genera offerte un mese prima della ricorrenza di eventi passati (es. compleanni dell'anno precedente).
*   **Filtro Segmento:** L'engine deve escludere i clienti il cui evento precedente si e' concluso in stato di insolvenza o cancellazione con penale (`last_event_status = "cancelled"`).

### C. Promemoria Visite & Sopralluoghi
*   **Logica:** Invia promemoria via WhatsApp 24 ore prima dell'orario concordato.
*   **Idempotenza:** Se il flag `reminder_sent` e' attivo, l'engine non deve duplicare la consegna dei messaggi.

### D. Policy di Finestra WhatsApp (Meta 24h Window)
*   **Logica:** Verifica che l'invio di messaggi non-template (free text) fallisca se il cliente non ha interagito nelle ultime 24 ore, sollevando un'eccezione di violazione policy.

---

## 3. Struttura dei Test del CRM Engine

Nel runner di test, si consiglia di mockare l'orario di sistema e il client API WhatsApp per intercettare gli ordini di invio:

```typescript
import automazioniFixtures from '../attached_assets/automazioni-test-fixtures.json';
import { processAutomations } from './automation-engine';

describe('CRM Automation Engine', () => {
  it('should skip re-engagement if automation toggle is false', async () => {
    const fixture = automazioniFixtures.re_engagement_disattivato;
    const result = await processAutomations(fixture);
    expect(result.status).toBe(fixture.expected_status);
  });
});
```
