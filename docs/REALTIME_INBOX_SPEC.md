# Specifica Tecnica - Inbox Realtime Multi-operatore

Questa specifica descrive l'architettura tecnica per abilitare l'aggiornamento in tempo reale (realtime) dell'Inbox di ZAK, consentendo a più operatori di collaborare contemporaneamente sulle stesse chat senza sovrascriversi.

---

## 1. WebSocket vs Server-Sent Events (SSE)

Per l'implementazione del realtime, ZAK valuta due tecnologie principali:

### WebSocket
- **Descrizione:** Protocollo di comunicazione bidirezionale persistente su una singola connessione TCP.
- **Pro:** Ideale per flussi in cui sia il client che il server devono inviare dati frequentemente (es. stato di digitazione dell'operatore, messaggi scritti dall'operatore). Latenza ridotta.
- **Contro:** Richiede una gestione più complessa della riconnessione, del bilanciamento del carico su più server (es. Sticky Sessions o Redis Adapter) e consuma più risorse sul server.

### Server-Sent Events (SSE)
- **Descrizione:** Connessione unidirezionale persistente basata su HTTP, in cui solo il server può spingere aggiornamenti al client.
- **Pro:** Nativo HTTP (riutilizza cookie e intestazioni di autorizzazione standard), riconnessione automatica gestita dal browser, molto leggero ed efficiente se il client invia risposte tramite normali chiamate REST POST.
- **Contro:** Limitazione di connessioni contemporanee nei vecchi browser su HTTP/1.1 (risolta con HTTP/2).

### Decisione Architetturale Consigliata:
Per ZAK si consiglia l'utilizzo di **WebSockets** (tramite librerie come Socket.io o nativo ws) per via della necessità di sincronizzare gli stati di scrittura (*typing*) degli operatori in tempo reale e mantenere canali attivi bidirezionali con latenze minime.

---

## 2. Eventi Realtime e Payload di Esempio

Di seguito sono definiti gli eventi che transitano sul canale realtime per sincronizzare tutti i client connessi all'interno della stessa Venue:

### A. Nuovo Messaggio Ricevuto (`message.new`)
Inviato quando un cliente invia un messaggio (WhatsApp/Instagram) o il bot/staff risponde.
```json
{
  "event": "message.new",
  "venueId": "venue_123",
  "data": {
    "id": 9845,
    "contattoId": 45,
    "mittente": "cliente",
    "canale": "whatsapp",
    "testo": "Perfetto, confermo l'appuntamento per domani.",
    "timestamp": "2026-06-02T12:40:00Z"
  }
}
```

### B. Messaggio Letto (`message.read`)
Sincronizza lo stato "letto" per eliminare i badge di notifica blu sui browser degli operatori.
```json
{
  "event": "message.read",
  "venueId": "venue_123",
  "data": {
    "contattoId": 45,
    "operatoreId": 12,
    "lettoAt": "2026-06-02T12:41:15Z"
  }
}
```

### C. Chat Assegnata (`chat.assigned`)
Notifica lo staff che un collega ha preso in carico una conversazione.
```json
{
  "event": "chat.assigned",
  "venueId": "venue_123",
  "data": {
    "contattoId": 45,
    "operatoreId": 12,
    "operatoreNome": "Giuseppe"
  }
}
```

### D. Operatore in Scrittura (`chat.typing`)
Mostra un indicatore visivo se un operatore sta scrivendo una risposta, evitando risposte duplicate.
```json
{
  "event": "chat.typing",
  "venueId": "venue_123",
  "data": {
    "contattoId": 45,
    "operatoreNome": "Giuseppe"
  }
}
```

---

## 3. Comportamento Multi-operatore e Prevenzione Conflitti

Quando più membri dello staff visualizzano la stessa chat contemporaneamente:
1. **Indicatore di Presenza:** Sopra la chat attiva vengono visualizzati gli avatar degli operatori che hanno la stessa chat aperta in quel momento.
2. **Locking Ottimistico:** Se l'operatore A inizia a scrivere nella chat, viene inviato l'evento `chat.typing` e l'operatore B vede a schermo l'indicatore *"Giuseppe sta scrivendo..."*.
3. **Avviso Risposta Doppia:** Se l'operatore A invia un messaggio mentre l'operatore B ha la chat aperta, il messaggio dell'operatore A viene inserito istantaneamente nella timeline dell'operatore B tramite l'evento `message.new`. Se l'operatore B aveva del testo scritto nel box di input, compare un avviso visivo soft: *"Un collega ha appena risposto a questa chat"*.

---

## 4. Strategia di Fallback ed Error Handling

Se la connessione WebSocket cade (es. problemi di rete del client o riavvio del server):
- **Stato di Riconnessione:** L'interfaccia utente deve mostrare un piccolo indicatore di stato visivo (es. pallino giallo *"Riconnessione in corso..."*).
- **Fallback a Polling:** Se la connessione non viene ripristinata entro **15 secondi**, il client disattiva temporaneamente il WebSocket e avvia un meccanismo di polling HTTP standard (richiesta GET all'endpoint dei messaggi ogni **10 secondi**).
- **Sincronizzazione post-ripristino:** Al ripristino del WebSocket, il client effettua una query rapida di allineamento per recuperare tutti i messaggi con timestamp successivo all'ultimo messaggio registrato in locale.
- **Riconnessione con Backoff Esponenziale:** I tentativi di riconnessione WebSocket devono avvenire con intervalli crescenti (1s, 2s, 5s, 10s, 30s) per evitare di sovraccaricare il server (Thundering Herd Problem).
