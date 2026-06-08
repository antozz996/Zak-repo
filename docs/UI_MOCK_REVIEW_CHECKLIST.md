# Checklist per la Review dei Mock UI - Antigravity Workflow

Questo documento contiene la checklist standard utilizzata dai Venue Manager e dagli sviluppatori (Codex) per validare i prototipi e i mockup realizzati da Antigravity all'interno dell'ambiente sandbox prima del loro effettivo sviluppo nel codice portante del CRM Zak.

---

## 1. Funzionalita' ed Esperienza Utente (UX)
- [ ] **Selezione Stati**: I selettori e i pulsanti di cambio stato (es. cambio ruolo, cambio stato account, filtri) modificano correttamente lo stato React locale ed aggiornano la visualizzazione.
- [ ] **Stato Vuoto (Empty State)**: La pagina si comporta correttamente e mostra messaggi informativi quando i dati sono assenti o i filtri di ricerca non producono risultati.
- [ ] **Feedback delle Azioni**: Cliccando sui pulsanti di simulazione (es. esportazioni, salvataggi) viene mostrato un banner o una riga di log locale con indicazione chiara dell'esito.
- [ ] **Natura Simulativa**: E' presente in evidenza un avviso o banner che chiarisce che la pagina e' un prototipo e non effettua salvataggi reali sul database.

---

## 2. Design e Responsive Web Design
- [ ] **Visual Design Premium**: I colori sono coordinati con la palette cromatica dell'app (es. toni scuri, glassmorphic o colori coordinati con shadcn) per un feeling premium.
- [ ] **Tipografia**: La dimensione dei testi, dei titoli e delle etichette rispetta le gerarchie grafiche dell'app.
- [ ] **Layout Mobile**: Il mockup e' responsive e leggibile sia su desktop che su layout mobile-first (es. simulazione notch e status bar per i componenti mobile).
- [ ] **Uso delle Icone**: Le icone provengono tutte dalla libreria `lucide-react` e sono coerenti con le azioni indicate.

---

## 3. Qualita' del Codice e Integrita' (Pronto per Codex)
- [ ] **Nessuna Chiamata API Reale**: I componenti non contengono hook generati da `@workspace/api-client-react` ne' chiamate `fetch` reali che potrebbero fallire in assenza del backend.
- [ ] **Isolamento del Codice**: I dati fittizi sono interamente dichiarati all'interno dello stesso file del mockup per facilitare la successiva estrazione delle logiche.
- [ ] **Typecheck e Build**: Il file non genera warning o errori di compilazione TypeScript. Il comando `corepack pnpm run build` passa con successo.
- [ ] **Registrazione Sandbox**: Il file e' registrato correttamente nella mappa dei moduli `mockup-components.ts` per l'anteprima dinamica.
