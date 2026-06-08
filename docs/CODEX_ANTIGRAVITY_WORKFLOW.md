# Linee Guida - Collaborazione Codex & Antigravity

Questo documento definisce il flusso operativo di collaborazione tra **Codex** (l'AI core incaricata degli sviluppi infrastrutturali e della logica reale) e **Antigravity** (l'AI dedicata al supporto, alla scrittura di mockup interattivi e alla documentazione di progetto).

---

## 1. Mappatura delle Responsabilità

Per evitare conflitti di codice e garantire la stabilità del sistema, le aree di intervento sono rigidamente separate:

```
                  +-----------------------------------+
                  |   REQUISITI / INPUT DELL'UTENTE   |
                  +-----------------------------------+
                                    |
                  +-----------------+-----------------+
                  |                                   |
                  v                                   v
       +---------------------+             +---------------------+
       |    AGENTE CODEX     |             | AGENTE ANTIGRAVITY  |
       |  (Sviluppo Core)    |             | (Docs & Mockups)    |
       +---------------------+             +---------------------+
       | * Backend reale     |             | * File in docs/     |
       | * Frontend reale    |             | * File in assets/   |
       | * Schema Database   |             | * Componenti Sandbox|
       | * Integrazioni API  |             | * QA & Checklist    |
       +---------------------+             +---------------------+
                  |                                   |
                  +-----------------+-----------------+
                                    v
                  +-----------------------------------+
                  |    REVISIONE E MERGE DELL'UTENTE  |
                  +-----------------------------------+
```

---

## 2. Regole di Protezione dei File (Safe Areas vs Protected Areas)

### Aree Protette (NON toccare da Antigravity, riservate a Codex):
Antigravity ha il divieto assoluto di modificare i seguenti percorsi reali di backend e frontend, salvo autorizzazione esplicita dell'utente:
- `lib/api-spec/openapi.yaml`
- `lib/api-client-react/src/generated/`
- `lib/api-zod/src/generated/`
- `lib/db/src/schema/`
- `artifacts/api-server/src/routes/`
- `artifacts/zak-app/src/pages/`
- `artifacts/zak-app/src/App.tsx`
- `artifacts/zak-app/src/components/layout/sidebar-layout.tsx`
- `ROADMAP.md`
- `DOCUMENTAZIONE_PROGETTO_E_CHANGELOG.md`

### Aree di Scrittura Consentite (Aree Sicure per Antigravity):
Antigravity opera esclusivamente all'interno delle seguenti directory:
- `docs/` (guide, checklist, manuali d'uso)
- `attached_assets/` (file di test, dataset CSV demo)
- `artifacts/mockup-sandbox/src/components/mockups/` (componenti visuali di prototipazione)
- `artifacts/mockup-sandbox/src/.generated/mockup-components.ts` (solo per registrare i nuovi mockup)

---

## 3. Flusso Operativo Task-by-Task

1. **Definizione dell'Idea (Utente):** L'utente richiede una nuova funzionalità o esprime una problematica (es. "Vogliamo una vista B2B per proporre preventivi a scuole/aziende").
2. **Prototipazione Rapida (Antigravity):**
   - Antigravity crea un mockup sandbox interattivo in `artifacts/mockup-sandbox/src/components/mockups/` con dati fittizi e logiche locali.
   - Scrive la documentazione e la guida d'uso correlata per allineare lo staff.
   - Sottopone il lavoro all'utente per raccogliere feedback visuale rapido.
3. **Approvazione del Mockup (Utente):** L'utente valida l'interfaccia, i flussi d'uso e il comportamento simulato.
4. **Integrazione Core (Codex):**
   - Codex prende in carico il mockup validato.
   - Modifica gli schemi database (`lib/db/src/schema/`) e gli endpoint API (`lib/api-spec/openapi.yaml`).
   - Sostituisce i dati fittizi del mockup con le chiamate API reali (`@workspace/api-client-react`) e integra il componente nelle pagine reali dell'app (`artifacts/zak-app/`).
5. **Verifica Finale:** L'utente esegue i test di QA basandosi sulle checklist create da Antigravity.

---

## 4. Controllo di Conformità
Alla fine di ogni esecuzione, Antigravity deve compilare e stampare a video il report dettagliato descritto in `docs/ANTIGRAVITY_REPORT_TEMPLATE.md` per confermare all'utente che nessuna area protetta è stata accidentalmente sovrascritta.
