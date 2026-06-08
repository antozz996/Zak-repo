# Dataset Demo Task Personali

Il file [demo-task-personali.csv](../attached_assets/demo-task-personali.csv) contiene 20 task fittizi pensati per testare la pagina `/task` e futuri flussi di import.

Nota: al momento il prodotto non implementa un import reale dei task personali. Questo dataset e preparatorio e puo essere usato per QA manuale, seed futuri o test di prototipi.

---

## Colonne

| Colonna | Descrizione |
|---------|-------------|
| `titolo` | Titolo operativo del task |
| `descrizione` | Nota breve per lo staff |
| `stato` | `aperto` o `completato` |
| `priorita` | `bassa`, `media`, `alta`, `urgente` |
| `fonte` | `manuale` o `voice` |
| `scadenza` | Data ISO con timezone |
| `contatto_nome` | Nome contatto demo collegato |

---

## Distribuzione dati

- 20 task totali
- 15 task aperti
- 5 task completati
- priorita distribuite tra bassa, media, alta e urgente
- fonti miste: manuale e voice
- contatti allineati al dataset demo contatti

---

## Uso consigliato

1. Importare prima `attached_assets/demo-contatti.csv` quando disponibile.
2. Usare `demo-task-personali.csv` come riferimento per creare task manuali in `/task`.
3. Verificare filtri per stato e priorita.
4. Verificare completamento e riapertura task.
5. Verificare che i task voice siano distinguibili dalla fonte `voice`.

---

## Checklist QA

- [ ] La pagina `/task` carica correttamente.
- [ ] I task aperti e completati sono distinguibili.
- [ ] I filtri per priorita funzionano.
- [ ] I task urgenti sono facili da individuare.
- [ ] I task completati possono essere riaperti.
- [ ] La differenza tra fonte `manuale` e `voice` e chiara allo staff.

*Ultimo aggiornamento: 2026-06-02*
