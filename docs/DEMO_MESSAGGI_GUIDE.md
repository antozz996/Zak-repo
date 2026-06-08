# Guida al Dataset Demo Messaggi Inbox

Questo documento descrive il formato e la struttura del file `demo-messaggi.csv` situato in `attached_assets/`. Il file contiene **40 messaggi demo** (inbound, outbound e risposte AI) scambiati con 10 contatti diversi presenti nel database di ZAK.

---

## 1. Struttura del CSV

Il file `demo-messaggi.csv` presenta le seguenti colonne:

- **`contatto_nome` (Testo):** Il nome e cognome del contatto di riferimento (chiave esterna logica con la colonna `nome` di `demo-contatti.csv`).
- **`timestamp` (Data/Ora ISO):** La data e l'ora esatte in cui è avvenuto lo scambio del messaggio (es. `2026-06-02T10:00:00+02:00`).
- **`mittente` (Enum):** Chi ha originato il messaggio:
  - `cliente`: Messaggio inviato dal cliente (inbound).
  - `staff`: Risposta manuale scritta da un operatore umano (outbound).
  - `ai`: Messaggio automatico inviato dall'assistente virtuale ZAK (outbound).
- **`canale` (Enum):** Il canale di comunicazione utilizzato:
  - `whatsapp`: Messaggio di testo standard.
  - `instagram`: Messaggio direct di Instagram.
  - `voice`: Chiamata vocale (il contenuto rappresenta il riassunto o la trascrizione).
- **`contenuto` (Testo):** Il corpo del messaggio o il log riassuntivo della telefonata vocale.
- **`stato_lettura` (Enum):** Se il messaggio è stato preso in carico dallo staff:
  - `letto`: Messaggio visualizzato.
  - `non_letto`: Richiede attenzione immediata da parte degli operatori.

---

## 2. Casi di Conversazione Notevoli

Nel dataset sono presenti conversazioni strutturate per testare flussi logici complessi dell'inbox:

- **Marco Rossi (Conversazione WhatsApp Completa):** Mostra una tipica transizione in cui il bot avvia la conversazione, raccoglie le informazioni di base (compleanno 30 anni, 50 invitati, 20 giugno) e lo staff subentra inviando il link del preventivo da 1200€.
- **Giulia Bianchi (Conversazione Multi-Canale):** La cliente contatta inizialmente il locale su Instagram chiedendo informazioni generiche. L'AI risponde su Instagram, si fa lasciare il numero di telefono e la conversazione prosegue via WhatsApp.
- **Luca Verdi & Davide Moretti (Canale Voice):** Esempi di trascrizioni di chiamate gestite dagli agenti vocali (Vapi/Bland). La telefonata di Davide Moretti è contrassegnata come `non_letto` per testare la notifica di nuova chiamata vocale in bacheca.
- **Elena Marchetti (Festa a Sorpresa / Riservatezza):** Conversazione in cui il cliente esprime la necessità di non ricevere email per evitare che il marito scopra la festa a sorpresa. Il bot si adatta e memorizza l'istruzione.
