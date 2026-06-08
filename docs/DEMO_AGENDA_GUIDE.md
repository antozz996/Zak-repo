# Guida al Dataset Demo Agenda

Questo documento illustra la struttura del file `demo-agenda.csv` situato in `attached_assets/`. Il file contiene **20 eventi agenda demo** distribuiti tra attività lavorative, personali, telefonate e appuntamenti con i clienti.

---

## 1. Struttura del CSV

Il file `demo-agenda.csv` presenta le seguenti colonne:

- **`titolo` (Testo):** Il nome dell'evento o dell'attività pianificata (es. *Sopralluogo sala Marco Rossi*).
- **`descrizione` (Testo):** Le note esplicative o i dettagli dell'evento.
- **`categoria` (Enum):** La categoria logica dell'evento, utilizzata per la colorazione e i filtri a calendario. I valori ammessi sono:
  - `appuntamento`: Incontri fisici o virtuali con il cliente (es. visite alla sala, degustazioni).
  - `telefonata`: Chiamate di follow-up o pianificazione telefonica.
  - `lavoro`: Attività operative interne o l'evento stesso che si svolge nella venue (es. esecuzione festa, allestimenti).
  - `personale`: Impegni personali dello staff o ferie.
- **`inizio` (Data/Ora ISO):** Data e ora di inizio dell'evento (es. `2026-06-03T15:00:00+02:00`).
- **`fine` (Data/Ora ISO):** Data e ora di fine dell'evento.
- **`contatto_nome` (Testo - Opzionale):** Nome del contatto associato all'evento per il collegamento logico. Può essere vuoto se l'evento è un'attività interna o personale.

---

## 2. Tipologia e Distribuzione degli Eventi

Il dataset è strutturato per popolare una vista a calendario mensile/settimanale in modo variegato:

- **Date Past e Future:** Gli eventi sono distribuiti a partire da inizio giugno 2026 (orari passati e futuri rispetto alla data corrente del sistema, impostata al **2 giugno 2026**).
- **Associazione Clienti:** Molti eventi sono collegati direttamente ai clienti di `demo-contatti.csv` (es. sopralluoghi con Marco Rossi, chiamate con Giulia Bianchi o Valentina Conte).
- **Eventi Operativi di Lavoro:** Include le date effettive in cui si svolgono gli eventi confermati a sistema (es. *Festa laurea Antonio Ruggiero* il 28 giugno o *Compleanno Marco Rossi* il 20 giugno) e le relative fasi di allestimento.
- **Impegni Interni:** Eventi come riunioni con i fornitori o ferie dello staff che non hanno un cliente associato.
