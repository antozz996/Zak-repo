# Checklist Pre-Merge e Consegna (Regression Checklist)

Questo documento elenca i controlli obbligatori da eseguire prima di procedere a qualsiasi fusione di codice (merge) o consegna del pacchetto di modifiche ad Antigravity.

---

## Elenco dei Controlli Obbligatori

### 1. File Protetti Non Toccati
Confermare che nessuno dei seguenti percorsi e' stato modificato o rimosso:
*   [ ] `lib/api-spec/openapi.yaml` (Definizione OpenAPI)
*   [ ] `lib/api-client-react/src/generated/` (Client generato)
*   [ ] `lib/api-zod/src/generated/` (Schema Zod generato)
*   [ ] `lib/db/src/schema/` (Definizioni Drizzle DB)
*   [ ] `artifacts/api-server/` (Backend reale)
*   [ ] `ROADMAP.md` (Roadmap di progetto gestita da Codex)
*   [ ] `DOCUMENTAZIONE_PROGETTO_E_CHANGELOG.md` (Changelog gestito da Codex)
*   [ ] `package.json` (Dipendenze di root)
*   [ ] `pnpm-lock.yaml` (Lockfile delle dipendenze)
*   [ ] `.github/` (Workflow CI/CD)

### 2. Controlli Sintattici e Compilazione
*   [ ] **Typecheck:** Eseguire `corepack pnpm run typecheck` e assicurarsi che non ci siano errori TypeScript nel monorepo.
*   [ ] **Build:** Eseguire `corepack pnpm run build` e verificare che tutti i pacchetti (mockup-sandbox, api-server, zak-app) compilino con successo.

### 3. Codifica ed Encoding
*   [ ] **Accenti e Mojibake:** Verificare che nelle stringhe visualizzate nell'interfaccia utente (UI) non vi siano lettere accentate italiane (`à`, `è`, `é`, `ì`, `ò`, `ù`). Sostituirle con lettere normali + apostrofo (es. `gia'`, `disponibilita'`, `e'`) per evitare corruzioni di codifica UTF-8/ASCII.
*   [ ] **Standard File:** Salvare tutti i nuovi file con codifica UTF-8 pulita.

### 4. Navigazione e Sidebar
*   [ ] **Rotte Registrate:** Verificare che tutte le nuove pagine siano registrate all'interno dello Switch in `App.tsx`.
*   [ ] **Sidebar Coerente:** Verificare che le rotte compaiano correttamente in `sidebar-layout.tsx` e che siano navigabili sia su desktop che su mobile (responsivita' testata).

### 5. Logiche e Chiamate API
*   [ ] **Nessun Fetch Fittizio:** Non utilizzare chiamate `fetch` o `axios` verso endpoint non implementati realmente da Codex. Usare esclusivamente query di React Query o simulazioni di stato React locali.
*   [ ] **Nessun Bypass di Sicurezza:** Non alterare o bypassare il meccanismo di autenticazione e RBAC reali.
