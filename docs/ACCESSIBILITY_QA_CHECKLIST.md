# Checklist QA Accessibilità UI - Conformità WCAG 2.1 AA

Questa checklist raccoglie i controlli manuali da eseguire per garantire che l'interfaccia utente di ZAK sia accessibile a tutti gli operatori, inclusi utenti con disabilità visive, motorie o cognitive. L'obiettivo è soddisfare i criteri WCAG 2.1 a livello AA.

---

## Sezione 1: Navigazione da Tastiera e Focus

- [ ] **1. Ordine Tab Logico (Tab Order):** Premendo il tasto `Tab`, il focus deve muoversi all'interno delle pagine (in particolare Dashboard e Inbox) seguendo un ordine logico da sinistra a destra e dall'alto in basso.
- [ ] **2. Visibilità del Focus (Focus Indicator):** Verificare che tutti gli elementi interattivi (pulsanti, input, schede, menu a tendina) mostrino un indicatore visivo chiaro e ad alto contrasto (es. bordo colorato o alone di focus) quando selezionati tramite tastiera.
- [ ] **3. Gestione del Focus nei Dialog / Modali:** Quando si apre una modale (es. *Nuovo Preventivo* o *Dettaglio Contatto*), il focus deve spostarsi immediatamente all'interno della modale e rimanervi intrappolato (*focus trap*) finché la modale non viene chiusa. Alla chiusura, il focus deve ritornare al pulsante che ha originato l'apertura.
- [ ] **4. Skip to Content (Salto al Contenuto Principale):** Presenza di un link invisibile attivabile al primo tabulator (es. *"Salta al contenuto principale"*) per permettere agli utenti con screen reader di saltare la barra di navigazione laterale (Sidebar) e andare direttamente alla parte centrale della pagina.
- [ ] **5. Chiusura con Esc:** Verificare che tutte le modali, dropdown e menu contestuali possano essere chiusi premendo il tasto `Esc` della tastiera.

---

## Sezione 2: Contrasto dei Colori e Supporto Visivo

- [ ] **6. Contrasto del Testo Normale:** Utilizzare uno strumento di verifica del contrasto per assicurarsi che tutti i testi normali abbiano un rapporto di contrasto di almeno **4.5:1** rispetto allo sfondo.
- [ ] **7. Contrasto del Testo Grande / Intestazioni:** Verificare che le intestazioni grandi (H1, H2, H3) abbiano un rapporto di contrasto di almeno **3:1**.
- [ ] **8. Contrasto degli Elementi UI non Testuali:** Verificare che le icone interattive (come i pulsanti di chiusura, ricerca o filtro) e i bordi degli input attivi abbiano un contrasto di almeno **3:1** rispetto al colore di sfondo.
- [ ] **9. Informazioni non basate solo sul Colore:** Assicurarsi che le informazioni chiave (es. stati dei preventivi *confermato/rifiutato*, o priorità dei task *urgente/bassa*) non siano comunicate esclusivamente tramite il colore. Aggiungere badge testuali descrittivi, icone differenziate o pattern grafici.
- [ ] **10. Zoom del Browser (Reflow):** Verificare che ingrandendo la pagina fino al **200%** tramite le impostazioni di zoom del browser, tutti i testi rimangano leggibili, non si sovrappongano e non si crei una barra di scorrimento orizzontale per il layout complessivo.

---

## Sezione 3: Etichette Semantiche (ARIA e HTML)

- [ ] **11. Uso dei Tag Semantici HTML5:** Verificare che il codice utilizzi i tag semantici appropriati per definire la struttura delle pagine: `<header>`, `<nav>`, `<main>`, `<section>`, `<article>`, `<footer>`.
- [ ] **12. Etichette per le Icone (Aria-Labels):** Tutte le icone prive di testo esplicito (es. un pulsante con solo l'icona del cestino per eliminare un task) devono avere l'attributo `aria-label` valorizzato in modo descrittivo (es. `aria-label="Elimina task"`).
- [ ] **13. Associazione Label-Input:** Verificare che ogni campo di input nei form (es. form dei preventivi, ricerca contatti) sia associato in modo esplicito al rispettivo tag `<label>` tramite l'attributo `htmlFor` (in React) o `for` (in HTML).
- [ ] **14. Stato di Espansione (Aria-Expanded):** Per i menu a tendina o la sidebar comprimibile, verificare che il trigger di attivazione cambi lo stato dell'attributo `aria-expanded` da `false` a `true` quando il menu viene aperto.
- [ ] **15. Annunci Dinamici (Aria-Live):** Quando l'utente riceve un nuovo messaggio in Inbox in tempo reale, assicurarsi che l'area sia contrassegnata con `aria-live="polite"` in modo che lo screen reader possa annunciare l'arrivo del messaggio senza interrompere l'azione corrente dell'utente.

---

## Sezione 4: Usabilità Mobile e Touch Target

- [ ] **16. Dimensioni Target di Tocco (Touch Targets):** Tutti i pulsanti e gli elementi cliccabili su mobile devono avere una dimensione minima di **44x44 pixel** per consentire un tocco agevole senza rischiare di cliccare elementi adiacenti.
- [ ] **17. Spaziatura degli Elementi Interattivi:** Assicurarsi che ci sia spazio a sufficienza (almeno 8px) tra pulsanti vicini (es. bottoni "Accetta" e "Rifiuta" in calce al preventivo).
- [ ] **18. Scrolling Mobile e Gestures:** Verificare che l'Inbox mobile sia facilmente navigabile con gesti standard (vertical scroll) e che eventuali slider o caroselli abbiano alternative visive chiare (frecce cliccabili).
- [ ] **19. Orientamento dello Schermo:** L'interfaccia deve riadattarsi in modo fluido e rimanere pienamente utilizzabile sia in orientamento verticale (portrait) che in orientamento orizzontale (landscape) sui dispositivi mobili.
- [ ] **20. Prevenzione dell'Autofocus su Mobile:** Evitare l'attivazione automatica dell'input di ricerca all'apertura delle pagine su dispositivi mobili, per evitare che la tastiera virtuale copra metà dello schermo impedendo la lettura del contenuto iniziale.
