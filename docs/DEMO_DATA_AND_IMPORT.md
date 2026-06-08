# Dataset Demo e Guida Import CSV

Guida pratica per importare dati di test nel CRM Zak Ecosystem AI e per comprendere il formato CSV accettato.

---

## 1. File demo fornito

Il file [demo-contatti.csv](../attached_assets/demo-contatti.csv) contiene **20 contatti fittizi** pronti per l'importazione.

### Distribuzione dati demo

| Dimensione | Valori presenti |
|------------|-----------------|
| **Stati lead** | `nuovo` (8), `contattato` (5), `qualificato` (4), `confermato` (2), `perso` (2) |
| **Tipi evento** | `compleanno` (6), `laurea` (4), `matrimonio` (5), `aziendale` (5) |
| **Origini lead** | `whatsapp` (7), `instagram` (5), `telefono` (4), `sito_web` (4) |
| **Con Instagram** | 12 contatti su 20 |
| **Con note interne** | tutti i 20 contatti |

Questo mix è pensato per testare:

- la distribuzione della pipeline lead nella dashboard
- i filtri per stato, tipo evento e origine nella pagina contatti
- la deduplicazione su telefono e Instagram
- le metriche di conversione
- le automazioni di re-engagement (lead "perso") e ricorrenze (eventi confermati)

---

## 2. Formato CSV accettato

Il sistema accetta file `.csv` con le seguenti colonne (intestazioni nella prima riga):

| Colonna | Obbligatoria | Descrizione | Valori accettati |
|---------|:---:|-------------|------------------|
| `nome` | ✅ | Nome del contatto | Testo libero |
| `telefono` | ❌ | Numero di telefono | Formato internazionale consigliato (es. `+39 333 1234567`) |
| `instagram_username` | ❌ | Username Instagram | Con o senza `@` iniziale |
| `origine_lead` | ❌ | Origine del contatto | `whatsapp`, `instagram`, `telefono`, `sito_web`, ecc. |
| `tipo_evento` | ❌ | Tipo di evento richiesto | `compleanno`, `laurea`, `matrimonio`, `aziendale`, ecc. |
| `stato_lead` | ❌ | Stato corrente del lead | `nuovo`, `contattato`, `qualificato`, `confermato`, `perso` |
| `note_interna` | ❌ | Note riservate allo staff | Testo libero |

### Regole importanti

- **Encoding**: UTF-8 (evitare file salvati con encoding ANSI/Windows-1252 per non perdere caratteri speciali)
- **Separatore**: virgola (`,`)
- **Intestazione**: la prima riga deve contenere i nomi delle colonne
- **Campi opzionali**: se una colonna è vuota, il campo viene importato come `null`
- **Virgole nel testo**: racchiudere il valore tra virgolette doppie (es. `"Nota con, virgola"`)

---

## 3. Deduplicazione

Il sistema applica **deduplicazione automatica** durante l'import:

### Per telefono

- Il confronto è indipendente da spazi, trattini, parentesi e prefisso `00` vs `+`
- Esempio: `+39 333 1234567`, `00393331234567`, `333-123-4567` sono considerati lo stesso numero
- Se il telefono esiste già nel CRM, il contatto viene saltato

### Per Instagram

- Il confronto ignora il simbolo `@` iniziale e il maiuscolo/minuscolo
- Esempio: `@Marco_Rossi`, `marco_rossi` sono considerati lo stesso username
- Se l'username esiste già nel CRM, il contatto viene saltato

### All'interno del file

- Se lo stesso telefono o Instagram compare più volte nello stesso file CSV, solo la prima occorrenza viene importata

---

## 4. Procedura di import

### Da interfaccia web

1. Aprire la sezione **Contatti** (`/contatti`)
2. Cliccare il pulsante **Importa CSV**
3. Selezionare il file `.csv` dal computer
4. Attendere l'elaborazione
5. Leggere il riepilogo:
   - **Creati**: numero di contatti importati con successo
   - **Duplicati saltati**: contatti con telefono o Instagram già esistente
   - **Errori**: righe con problemi di formato o dati invalidi

### Da API (per test automatici)

```bash
curl -X POST http://localhost:<PORT>/api/contatti/import-csv \
  -F "file=@attached_assets/demo-contatti.csv"
```

Risposta attesa:

```json
{
  "creati": 20,
  "duplicati": 0,
  "errori": 0
}
```

---

## 5. Verifica dopo l'import

Dopo aver importato il file demo, verificare:

### Dashboard (`/dashboard`)

- [ ] Contatti totali = 20 (o +20 se esistevano già altri contatti)
- [ ] Pipeline lead mostra la distribuzione: 8 nuovo, 5 contattato, 4 qualificato, 2 confermato, 2 perso
- [ ] Nuovi contatti oggi = 20 (se importati oggi)

### Contatti (`/contatti`)

- [ ] La lista mostra tutti i 20 contatti
- [ ] Filtro per stato "perso" → mostra 2 contatti (Francesco Di Maio, Giuseppe Martini)
- [ ] Filtro per tipo evento "matrimonio" → mostra 5 contatti
- [ ] Filtro per origine "instagram" → mostra 5 contatti
- [ ] Ricerca "Rossi" → mostra Marco Rossi
- [ ] Dettaglio contatto mostra le note interne importate

### Deduplicazione (test ripetuto)

- [ ] Re-importare lo stesso file → risultato atteso: 0 creati, 20 duplicati, 0 errori

### Automazioni (`/automazioni`)

- [ ] Eseguire re-engagement manuale → deve processare i 2 lead "perso"
- [ ] Eseguire ricorrenze manuale → deve processare i 2 eventi "confermato"

### Audit log (`/audit-log`)

- [ ] Filtrare per azione "import" → deve mostrare l'azione di import CSV con dettagli

---

## 6. Creare dataset personalizzati

Se hai bisogno di dataset più grandi o con caratteristiche specifiche, segui questo template:

```csv
nome,telefono,instagram_username,origine_lead,tipo_evento,stato_lead,note_interna
Nome Cognome,+39 3XX XXXXXXX,username_ig,whatsapp,compleanno,nuovo,Note opzionali
```

### Suggerimenti

- **Per testare la deduplicazione**: inserire 2-3 contatti con lo stesso telefono in formati diversi
- **Per testare le automazioni**: inserire contatti con stato `perso` (re-engagement) e con eventi `confermato` nel passato (ricorrenze)
- **Per testare la pipeline**: distribuire i contatti su tutti i 5 stati lead
- **Per testare i filtri**: variare le origini lead e i tipi evento
- **Per testare le note**: inserire note con virgole e caratteri speciali tra virgolette doppie

---

*Ultimo aggiornamento: 2026-06-02*
