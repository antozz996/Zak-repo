# Template Resoconto Finale - Antigravity

*Questo template deve essere utilizzato da Antigravity per riassumere il lavoro svolto al termine di ogni turno o task assegnato.*

---

## 1. Stato dei Task
*Elenco dei task affrontati nella sessione con relativo stato di completamento.*
- [ ] **Task 1: [Nome Task]** - [Completato / In Corso / Non Iniziato]
- [ ] **Task 2: [Nome Task]** - [Completato / In Corso / Non Iniziato]

## 2. File Creati o Modificati
*Elenco dei file toccati durante l'esecuzione con relativi percorsi assoluti/relativi.*
- `[NUOVO / MODIFICATO]` `docs/[NOME_FILE].md`
- `[NUOVO / MODIFICATO]` `attached_assets/[NOME_FILE].csv`
- `[NUOVO / MODIFICATO]` `artifacts/mockup-sandbox/src/components/mockups/[NOME_COMPONENTE].tsx`

## 3. Conferma Aree Protette
*Dichiarazione esplicita del rispetto dei vincoli di scrittura sul codice core.*
> [!IMPORTANT]
> **Conferma di sicurezza:** Si attesta che nessun file al di fuori delle aree sicure consentite (`docs/`, `attached_assets/`, `artifacts/mockup-sandbox/src/components/mockups/`) è stato modificato o eliminato in questa sessione. Nessun file reale di backend o frontend è stato intaccato.

## 4. Test di Verifica Eseguiti
*Comandi eseguiti per validare la correttezza del codice aggiunto (es. typecheck, build).*
- [ ] **Typecheck del Sandbox:** Comando `pnpm --filter @workspace/mockup-sandbox typecheck` eseguito con esito positivo.
- [ ] **Build del Sandbox:** Comando `pnpm --filter @workspace/mockup-sandbox build` eseguito con successo.

## 5. Warning, Rischi e Note per Codex
*Note di rilievo per lo sviluppatore o per l'agente Codex che dovrà integrare il codice nel core.*
- **Punto di attenzione 1:** [Descrizione del potenziale rischio o scelta di design]
- **Indicazioni di integrazione:** [Suggerimenti su come collegare il mockup alle API reali]
