# Checklist review output Antigravity

Usare questa checklist ogni volta che Antigravity consegna modifiche parallele al progetto.

---

## 1. File modificati

- [ ] Il resoconto include elenco completo dei file creati o modificati.
- [ ] I file sono confinati ad aree consentite: `docs/`, `attached_assets/`, `artifacts/mockup-sandbox/`.
- [ ] Non sono stati toccati file core senza autorizzazione.

File core protetti:

- `lib/api-spec/openapi.yaml`
- `lib/api-client-react/src/generated/`
- `lib/api-zod/src/generated/`
- `lib/db/src/schema/`
- `artifacts/api-server/src/routes/`
- `artifacts/zak-app/src/pages/`
- `ROADMAP.md`
- `DOCUMENTAZIONE_PROGETTO_E_CHANGELOG.md`

---

## 2. Qualita documentazione

- [ ] I contenuti sono coerenti con lo stato reale del prodotto.
- [ ] I link interni funzionano.
- [ ] Le route citate esistono o sono marcate chiaramente come mockup/future.
- [ ] Non ci sono istruzioni operative pericolose o distruttive.
- [ ] Non sono presenti segreti, token, numeri reali o dati personali reali.

---

## 3. Encoding e formato

- [ ] File salvati in UTF-8.
- [ ] Accenti e simboli sono visualizzati correttamente in editor.
- [ ] Tabelle Markdown leggibili.
- [ ] CSV con intestazioni chiare e separatore virgola.

---

## 4. Sandbox mockup

- [ ] I mockup usano solo dati fittizi.
- [ ] I mockup non chiamano API reali.
- [ ] La preview sandbox e raggiungibile.
- [ ] Le modifiche alla mappa mockup sono coerenti con i nuovi componenti.

---

## 5. Passaggio a Codex

- [ ] Allegare riepilogo task completate.
- [ ] Indicare file modificati.
- [ ] Evidenziare eventuali dubbi o punti da integrare nel core.
- [ ] Codex esegue review e decide se aggiornare roadmap/changelog centrale.

*Ultimo aggiornamento: 2026-06-02*
