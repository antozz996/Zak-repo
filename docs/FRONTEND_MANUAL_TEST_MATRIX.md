# Matrice dei Test Manuali Frontend

Questo documento definisce la matrice dei test manuali da eseguire per verificare l'integrita' visiva e funzionale dell'interfaccia utente di ZAK.

---

## Tabella Matrice Test Manuali

| ID | Sezione / Pagina | Test Case | Descrizione Azione Utente | Priorita' | Stato / Risultato Atteso |
| :--- | :--- | :--- | :--- | :---: | :--- |
| **TC-01** | Dashboard | Esportazione Report CSV | Cliccare su "Esporta report CSV" in alto. | Media | Download del file `.csv` contenente i dati storici delle tabelle. |
| **TC-02** | Dashboard | Filtro Date | Inserire data d'inizio e fine e cliccare "Azzera". | Bassa | Le date vengono rimosse e i dati tornano allo stato iniziale. |
| **TC-03** | Inbox | Selezione Conversazione | Selezionare una conversazione dall'elenco a sinistra. | Alta | Caricamento storico chat e compilazione pannello info a destra. |
| **TC-04** | Inbox | Invio Messaggio | Scrivere una risposta e premere Invio o icona Send. | Alta | Il messaggio appare nella lista con spunta di invio. |
| **TC-05** | Contatti | Ricerca Contatti | Inserire "Mario" nella barra di ricerca. | Media | La lista visualizza unicamente i record corrispondenti a "Mario". |
| **TC-06** | Contatti | Nuovo Contatto | Fare clic su "Nuovo Contatto", compilare e salvare. | Alta | Il contatto viene salvato e reindirizzato alla lista generale. |
| **TC-07** | Preventivi | Generazione Proposta | Creare preventivo con 100 pax, DJ extra e calcolare. | Alta | Il totale calcolato corrisponde ai valori preimpostati. |
| **TC-08** | Preventivi | Preview PDF | Fare clic su "Anteprima PDF". | Alta | Apertura della rotta `/preventivo-pdf-preview` con foglio A4. |
| **TC-09** | Agenda | Drag & Drop | Trascinare un evento da un giorno all'altro in vista mese. | Media | Spostamento visivo riuscito e toast di conferma visualizzato. |
| **TC-10** | Task | Completamento Checkbox | Selezionare la spunta di un task attivo. | Media | Rigatura visiva immediata e rimozione dall'elenco da fare. |
| **TC-11** | Automazioni | Toggle Regola | Cliccare sul toggle di accensione di una regola CRM. | Media | Il toggle cambia stato e la regola viene aggiornata. |
| **TC-12** | Impostazioni | Salvataggio Modifiche | Modificare l'orario operativo e fare clic su Salva. | Bassa | Banner di notifica di avvenuto salvataggio delle preferenze. |
| **TC-13** | B2B & Competitor | Filtro per Categoria | Cambiare la selezione del dropdown categorie. | Media | La tabella dei competitor si aggiorna escludendo altre categorie. |
| **TC-14** | B2B & Competitor | Analisi AI | Selezionare competitor, prompt template e cliccare Genera. | Alta | Caricamento (spinner) di 1.5s ed esposizione report AI. |
| **TC-15** | B2B & Competitor | Slide Preview | Scorrere le slide dell'anteprima proposta. | Media | Le slide scorrono con navigazione a frecce destra/sinistra. |
| **TC-16** | Ruoli (Admin) | Subentro Permessi | Cambiare ruolo da Admin a Staff in `/login-mock`. | Alta | Visualizzazione di "/access-denied-mock" sulle pagine riservate. |
| **TC-17** | Ruoli (Admin) | Audit di Sicurezza | Verificare i filtri log in `/security-audit-mock`. | Media | I log si aggiornano in base alla categoria selezionata. |
