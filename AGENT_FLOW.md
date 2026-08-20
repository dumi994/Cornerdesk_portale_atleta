# Agent Development Workflow — LexManager Prototyping

## Istruzioni Operative Generali

Questo flusso va eseguito in **loop continuo** per ogni singolo sotto-task della tabella di marcia.
L'agente **non deve passare al sotto-task successivo** finché quello corrente non è stato:

1. Sviluppato
2. Testato con esito positivo
3. Committato e fuso nel branch `dev`

---

## Step 1 — Isolamento della Feature (Branching)

Crea un branch dedicato partendo dall'ultimo stato stabile di `dev`:

```bash
git checkout dev
git pull origin dev
git checkout -b feature-<nome-sotto-task>
```

---

## Step 2 — Sviluppo e Mocking Visivo

Implementa **esclusivamente** la singola feature visiva richiesta dal sotto-task corrente.

| Vincolo                 | Regola                                      |
| ----------------------- | ------------------------------------------- |
| **Lingua del codice**   | Inglese (classi, ID, variabili, attributi)  |
| **Lingua dei commenti** | Italiano                                    |
| **Stack tecnologico**   | Solo HTML statico, Tailwind CSS e Alpine.js |
| **Divieto assoluto**    | Nessun file PHP o logica backend            |

---

## Step 3 — Test di Funzionamento

Prima di procedere al commit, verificare sul browser che:

- [ ] La feature sia **completamente interattiva** (es. i click aprono le modali, i tab cambiano vista)
- [ ] La console sviluppatori del browser riporti **zero errori** (nessun crash JavaScript, nessuna variabile null)

Se anche uno solo dei due controlli fallisce, tornare allo Step 2 e correggere.

---

## Step 4 — Staging e Commit Atomico

Selezionare **solo ed esclusivamente** i file che compongono la funzionalità appena completata.

Usare sempre git add <file> con il percorso esplicito. Mai git add .

```bash
# Verifica i file modificati
git status

# Aggiungi solo i file della feature corrente
git add resources/views/<file-modificato>.html

# Esegui il commit atomico seguendo i Conventional Commits
git commit -m "<prefisso>: descrizione in inglese della singola feature visiva"
```

---

## Step 5 — Chiusura del Ciclo (Merge & Clean)

Una volta che la funzionalità è stabile, eseguire nell'ordine:

```bash
# 1. Torna sul branch principale
git checkout dev

# 2. Fonde la feature mantenendo la storia dei commit
git merge feature-<nome-sotto-task> --no-ff -m "Merge feature: <descrizione>"

# 3. Invia il codice su GitHub
git push origin dev

# 4. Elimina il branch locale della feature completata
git branch -d feature-<nome-sotto-task>
```

Dopo questo step, il ciclo ricomincia dallo **Step 1** con il sotto-task successivo.

---

## Tabella di Marcia dei Sotto-Task

L'agente deve seguire **tassativamente** questo ordine di esecuzione.

| #   | Sotto-task Atomico             | Branch da Creare                   | Prefisso e Messaggio di Commit                                     |
| --- | ------------------------------ | ---------------------------------- | ------------------------------------------------------------------ |
| 1   | Setup Layout e Sidebar globale | `feature-1-sidebar-layout`         | `style: implement global sidebar and layout scaffolding`           |
| 2   | Vista Clienti e Modale Mock    | `feature-2-clients-view`           | `style: build static clients list with mock creation modal`        |
| 3   | Vista Pratiche e Badge Aree    | `feature-3-cases-view`             | `style: render legal cases view with area category tags`           |
| 4   | Calendario e Badge di Colore   | `feature-4-calendar-grid`          | `feat: integrate visual calendar grid with color-coded events`     |
| 5   | Interattività Dettaglio/Edit   | `feature-5-calendar-interactivity` | `feat: add client-side modal for editing and completing events`    |
| 6   | Dashboard e Filtri Alpine.js   | `feature-6-dashboard-filters`      | `feat: implement real-time dashboard filters for dates and status` |
