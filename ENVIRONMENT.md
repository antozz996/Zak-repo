# Configurazione Ambiente

Riferimento rapido per variabili ambiente, segreti e fallback runtime del progetto Zak Ecosystem AI.

## Variabili obbligatorie

- `DATABASE_URL`
  - usata dal backend Express e da Drizzle per connettersi a PostgreSQL
- `PORT`
  - richiesta dal server API in [artifacts/api-server/src/index.ts](C:/Users/virgi/Desktop/ZAK/artifacts/api-server/src/index.ts)
- `ZAK_AUTH_SECRET`
  - segreto HMAC per firmare i token sessione staff
  - obbligatorio in produzione; in sviluppo esiste un fallback solo per non bloccare build/test locali

## Variabili consigliate sicurezza/auth

- `ZAK_BOOTSTRAP_ADMIN_TOKEN`
  - token operativo per autorizzare `POST /api/auth/bootstrap-admin` quando esistono gia utenti nel database
  - serve per impostare/proteggere il primo admin senza aprire liberamente la creazione admin in ambienti non vuoti
- `SESSION_SECRET`
  - fallback compatibile per `ZAK_AUTH_SECRET` se gia presente nell'ambiente

## Variabili opzionali LLM Booking Assistant

- `ZAK_LLM_BOOKING_ENABLED`
  - impostare a `true` per abilitare l'estrazione LLM reale nel Booking Assistant WhatsApp
  - se manca o vale altro, resta attivo il fallback rule-based
- `OPENAI_API_KEY`
  - chiave OpenAI usata dall'adapter LLM backend
- `ZAK_LLM_BOOKING_MODEL`
  - modello OpenAI usato per output JSON strutturato
  - default applicativo: `gpt-5.4-nano`
- `OPENAI_BASE_URL`
  - opzionale, default `https://api.openai.com/v1`
- `ZAK_LLM_BOOKING_TIMEOUT_MS`
  - timeout chiamata LLM, default `12000`

Se l'LLM fallisce, restituisce JSON invalido o non e configurato, il Booking Assistant continua a usare il parser rule-based esistente.

## Variabili opzionali Google Calendar

- `ZAK_GOOGLE_CALENDAR_ENABLED`
  - impostare a `true` per abilitare disponibilita e sync Google Calendar reali
- `GOOGLE_CLIENT_ID`
  - OAuth client id Google Cloud
- `GOOGLE_CLIENT_SECRET`
  - OAuth client secret Google Cloud
- `GOOGLE_REFRESH_TOKEN`
  - refresh token OAuth dell'account calendario venue/staff da usare lato server
- `GOOGLE_CALENDAR_ID`
  - calendario da usare, default `primary`
- `GOOGLE_CALENDAR_TIMEZONE`
  - timezone calendario, default `Europe/Rome`
- `GOOGLE_CHANNEL_TOKEN`
  - token facoltativo per verificare `POST /api/webhook/google-calendar`
- `ZAK_GOOGLE_DELETE_CANCELLED`
  - default non distruttivo: se non vale `true`, gli eventi cancellati su Google marcano conflitto invece di eliminare record agenda ZAK

Quando Google non e configurato, l'endpoint disponibilita usa il calendario interno e il CRM resta operativo.

## Variabili opzionali Voice Assistant provider

- `VOICE_WEBHOOK_SECRET`
  - secret generico per proteggere `POST /api/webhook/voice-assistant`
- `VAPI_WEBHOOK_SECRET`
  - secret specifico Vapi, accettato via header `Authorization: Bearer ...`, `X-Webhook-Secret` o `X-Vapi-Secret`
- `BLAND_WEBHOOK_SECRET`
  - secret specifico Bland, accettato via header `Authorization: Bearer ...`, `X-Webhook-Secret` o `X-Bland-Webhook-Secret`

Se nessun secret voice e configurato, il webhook resta aperto per compatibilita locale/test; in produzione e consigliato configurarne almeno uno.

## Variabili opzionali integrazione Meta WhatsApp

- `META_WHATSAPP_ACCESS_TOKEN`
  - token per chiamate outbound alla Meta WhatsApp Cloud API
- `META_WHATSAPP_PHONE_NUMBER_ID`
  - ID del numero WhatsApp Business mittente
- `META_APP_SECRET`
  - secret dell'app Meta usato per verificare firme webhook WhatsApp in produzione
- `META_WEBHOOK_VERIFY_TOKEN`
  - token scelto da noi e inserito anche nel pannello Meta per verificare la challenge del webhook WhatsApp
- `META_GRAPH_API_VERSION`
  - opzionale, default `v20.0`
- `META_WHATSAPP_TEMPLATE_LANGUAGE`
  - lingua default dei template WhatsApp approvati
  - default applicativo: `it`
- `META_WHATSAPP_REENGAGEMENT_TEMPLATE_NAME`
  - nome del template Meta approvato per automazioni di re-engagement
  - parametri body attesi: nome contatto
- `META_WHATSAPP_RICORRENZA_TEMPLATE_NAME`
  - nome del template Meta approvato per automazioni di ricorrenza/fidelizzazione
  - parametri body attesi: nome contatto, tipo evento, anno successivo

Se questi valori mancano:

- i messaggi outbound restano salvati in inbox;
- il backend salta l'invio reale verso Meta senza bloccare il flusso CRM.

## Variabili frontend locale

- `BASE_PATH`
  - opzionale per build Vite
- `PORT`
  - usata anche dai frontend locali quando configurata

I Vite config di `zak-app` e `mockup-sandbox` hanno fallback locali e non falliscono piu se queste variabili non sono presenti in sviluppo/build locale.

## Regole pratiche

- non committare `.env` reali nel repository;
- usare valori di test o sandbox per Meta fino alla validazione completa webhook/firme;
- documentare qui ogni nuova integrazione che introduce segreti esterni;
- se una variabile diventa obbligatoria per una feature core, aggiornare anche `DOCUMENTAZIONE_PROGETTO_E_CHANGELOG.md` e `ROADMAP.md`.
