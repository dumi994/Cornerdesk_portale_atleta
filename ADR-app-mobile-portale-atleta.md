# ADR — App Nativa iOS/Android per il Portale Atleta

> **Progetto:** Corner Desk — Portale Atleta
> **Versione:** 1.3
> **Data:** 2026-08-20
> **Stato:** 🟢 App costruita (Expo Router + TypeScript) — non ancora verificata end-to-end contro un
> backend/DB reale, vedi changelog v1.2 → v1.3 e `.specs/plans/feature-app-mobile-portale-atleta.md`
> **Autore:** Claude (AI Assistant), su richiesta

> **Nota:** `ADR.md` v3.1, sezione "Cosa NON è in Scope", elenca **"App mobile nativa (solo PWA
> installabile)"** come scelta deliberata per il prodotto **commerciale** Corner Desk — quella
> decisione resta valida e la sua motivazione (§2-§6 sotto) va letta come contesto/analisi, non come
> istruzione operativa. **Questo documento specifico è il progetto extra di un corso**: la
> raccomandazione "non ora" di §5 riguarda il business reale (zero clienti paganti), non il lavoro di
> sviluppo dell'app in sé, che procede — vedi [§9](#9-handoff-tecnico--api-già-disponibile) per lo
> stato tecnico e il contratto API su cui costruire.

> **Changelog v1.0 → v1.1**: l'API JSON che §4.2/§7 elencavano come prerequisito mancante per
> l'Opzione B è stata costruita (autenticazione Sanctum su `Student`, endpoint dashboard/gare/
> notifiche) — vedi §9. Aggiunto come sezione di handoff per chi sviluppa l'app.
>
> **Changelog v1.1 → v1.2**: framework fissato — **React Native (con Expo)**, non più "React
> Native/Flutter/altro". Aggiunto requisito esplicito: l'app deve essere installabile su Android e
> iOS **senza passare dagli store** — vedi nuova [§10](#10-distribuzione-senza-store) per i vincoli
> reali (soprattutto su iOS, dove non è una scelta tecnica ma un limite imposto da Apple).
>
> **Changelog v1.2 → v1.3**: l'app è stata costruita (Expo Router + TypeScript, `expo-secure-store`
> per il token, `react-native-svg` per il grafico andamento gare) — login con risoluzione tenant,
> dashboard, calendario gare, centro notifiche con badge, profilo/cambio password/logout. Verificata
> con `tsc --noEmit` e bundling (`expo export`) ad ogni feature, **non** con un login reale (nessun
> backend/DB raggiungibile in questo ambiente di sviluppo, stesso limite già segnalato in §9.6 per
> l'API). Dettagli in `README.md` e `.specs/plans/feature-app-mobile-portale-atleta.md`.

---

## 1. Decisione

Per il **prodotto commerciale Corner Desk**: non costruire un'app nativa/cross-platform ora, restare
sulla PWA esistente, rivalutare ai trigger di [§6](#6-quando-rivalutare-trigger-concreti) — analisi
invariata rispetto alla v1.0, vedi §2-§6.

**Per questo progetto extra**: si procede con l'**Opzione B (cross-platform su API dedicata)**, framework
**fissato: React Native con Expo** — è l'assegnazione del corso, non una scelta di prodotto. Il
prerequisito tecnico che in v1.0 rendeva B "il più costoso dei due investimenti reali" (nessuna API)
è **già risolto**: l'API esiste, vedi §9. Resta da costruire l'app.

**Vincolo aggiuntivo (v1.2)**: l'app deve essere installabile su Android e iOS **senza passare dagli
store**. Su Android questo non cambia nulla di sostanziale (un APK si installa direttamente, sempre
stato possibile). Su iOS è un vincolo imposto da Apple, non aggirabile con scelte tecniche — vedi
[§10](#10-distribuzione-senza-store) per cosa è realisticamente possibile e cosa no.

---

## 2. Contesto

### 2.1 Cosa esiste oggi

Il portale atleta web (`PortalController`, guard `student`, sessione) resta **interamente
server-rendered** — Blade, non JSON. Quella parte non è cambiata.

**Aggiornamento v1.1**: da questa versione esiste anche un layer API JSON parallelo, dedicato all'app
(`App\Http\Controllers\Api\Portal*`, guard a token Sanctum su `Student`) — vedi il contratto completo
in [§9](#9-handoff-tecnico--api-già-disponibile). Non sostituisce il portale web, gli sta accanto: la
stessa logica applicativa (query, regole, feature-gating) è replicata in JSON per i client che non
possono usare sessione/cookie browser (l'app mobile).

È già installabile come **PWA** (manifest dedicato `/portale/manifest-atleta.webmanifest`, service
worker, icone, `display: standalone`) e già riceve **notifiche push reali** via `minishlink/web-push`
(Web Push standard) — non è "quasi una app", è già installabile su home screen con icona propria e
notifiche, oggi.

### 2.2 Chi lo userebbe, davvero

Il Portale Atleta è una **feature di piano Business** (`tenant_has_feature('portal')`,
`PortalController::login()` riga 34) — non tutti i tenant la abilitano nemmeno via web, figuriamoci
via app nativa. L'utente finale dell'ipotetica app non è "chiunque usi Corner Desk", è "l'atleta di
una palestra che ha scelto il piano più caro e ha attivato il portale".

### 2.3 Fatti di partenza (non opinioni)

- **Zero tenant attivi/paganti** al momento di questo documento — nessun dato reale di richiesta da
  clienti, solo un'ipotesi.
- Team di sviluppo: un solo developer (te). Un'app nativa/cross-platform aggiunge una piattaforma di
  build, firma e distribuzione da mantenere **per sempre**, non solo da costruire una volta.
- Nessuna API esiste oggi per il portale — è un prerequisito tecnico per qualunque opzione diversa dal
  wrapper (§4.2, §4.4), non un dettaglio implementativo minore.

---

## 3. Cosa "app nativa" NON risolve da sola

Prima di guardare le opzioni tecniche, va detto cosa questa richiesta _non_ è: un'app negli store non
crea domanda che non esiste già. Se oggi zero atleti chiedono un'app (perché zero atleti usano ancora
il portale, perché zero tenant sono live), costruirla non genera clienti — nella migliore delle
ipotesi rimuove una frizione che nessuno ha ancora segnalato come reale. Vale la pena separare "sarebbe
bello avere" da "un cliente pagante l'ha chiesto esplicitamente e ha detto di no per questo motivo".

---

## 4. Opzioni considerate

### 4.1 Opzione A — Nativo puro (Swift + Kotlin separati)

Due codebase separate, ognuna che riscrive da zero login, dashboard, pagamenti, ricevute, documenti,
calendario gare, notifiche — tutto ciò che oggi vive in Blade.

- **Costo**: il più alto in assoluto. Due linguaggi, due toolchain (Xcode/Android Studio), ogni
  feature del portale va implementata **due volte** oltre che mantenuta in sync con la versione web.
- **Quando avrebbe senso**: mai per questo progetto, a meno di un team dedicato mobile che oggi non
  esiste.

**Scartata.**

### 4.2 Opzione B — Cross-platform su nuova API — framework: **React Native (Expo)**

Una sola codebase mobile in React Native, che consuma un'API JSON dedicata — autenticazione via
Sanctum token invece di sessione, endpoint per dashboard/pagamenti/ricevute/documenti/gare/notifiche.
Uso **Expo** (non React Native CLI puro): build Android via EAS senza Android Studio locale, e
compatibilità con Expo Go per iOS senza account Apple Developer — vedi [§10](#10-distribuzione-senza-store).

- **Costo (v1.0, quando l'API non esisteva)**: alto — non "solo" l'app, ma API + app.
- **Costo (v1.1, aggiornato)**: il prerequisito API è **già costruito** (§9) — resta solo il costo
  dell'app stessa. La web app Blade esistente resta comunque una seconda implementazione parallela
  della stessa UI (a meno di riscrivere anche il portale web sopra la nuova API, non fatto qui).
- **Quando avrebbe senso per il prodotto commerciale**: se il portale diventasse un prodotto centrale
  con volumi reali e un team che può permettersi di mantenere due superfici (web + app) sync — questo
  giudizio resta invariato per Corner Desk come business.

**Per il prodotto commerciale: non ora.** **Per questo progetto di corso: è l'opzione scelta**, col
prerequisito più costoso già tolto di mezzo.

### 4.3 Opzione C — Wrapper ibrido del PWA esistente (Capacitor/TWA)

Impacchetta il PWA **già esistente** (stesso Blade, stesso service worker, stessa API... cioè
nessuna API nuova) dentro un contenitore nativo minimo, per ottenere una voce su App Store/Play Store.

- **Capacitor**: WebView nativa che carica l'app web, con bridge per funzionalità native extra (non
  necessarie qui, il PWA le ha già via Web Push/manifest). Richiede comunque account
  Apple Developer ($99/anno) + Google Play ($25 una tantum) + processo di review.
- **Trusted Web Activity / Bubblewrap** (solo Android): wrapper ancora più leggero, praticamente il
  browser Chrome senza barra degli indirizzi che punta al PWA. iOS non supporta TWA — per iOS servirebbe
  comunque Capacitor o simile.
- **Costo**: basso rispetto a B — nessuna riscrittura, nessuna nuova API. Il costo reale è il
  mantenimento continuo degli account store e la ri-sottomissione a ogni major update di iOS/Android
  (le policy Apple in particolare vietano "semplici wrapper di siti web" senza valore aggiunto nativo
  — rischio concreto di rifiuto in review, da verificare con le linee guida App Store aggiornate prima
  di investirci tempo).
- **Quando avrebbe senso**: se la ragione per volere un'app è **commerciale** (un titolare di palestra
  in demo chiede "c'è un'app?" e "installa il sito come app" non converte quanto "sì, è sull'App
  Store") più che tecnica — a quel punto è la scelta più economica per ottenere la voce sullo store
  senza il costo di B.

### 4.4 Opzione D — Status quo: solo PWA

Nessuna modifica. Il portale resta installabile via browser (Android: prompt nativo "Aggiungi a
schermata Home"; iOS: Safari → Condividi → Aggiungi a Home, meno scoperto dagli utenti ma funzionante),
con push reali già attive.

- **Costo**: zero — è già fatto.
- **Limite reale**: non compare in una ricerca App Store/Play Store, e su iOS l'installazione richiede
  un passaggio manuale meno intuitivo di un download da store.

---

## 5. Raccomandazione

**Opzione D ora, Opzione C come prima mossa se/quando serve una voce sullo store per motivi
commerciali, Opzione B solo con segnali di domanda reali e un team che può sostenerne la manutenzione.**

Motivazione, in ordine di peso:

1. **Zero clienti paganti oggi.** Costruire per una domanda ipotetica prima del lancio è il rischio
   più comune di over-engineering pre-prodotto: tempo speso su un canale di distribuzione invece che
   su ciò che fa vendere il primo cliente.
2. **Il portale è già un prodotto di nicchia dentro un prodotto di nicchia** — feature Business-tier,
   per l'atleta (non il decisore d'acquisto, che è il titolare/direttore tecnico della palestra). Anche
   in scenario di successo, la popolazione che scaricherebbe l'app è piccola.
3. **Il PWA esistente copre già la sostanza** (installabilità, icona, notifiche push) — quello che manca
   è solo la _vetrina_ dello store, non la funzionalità. Il gap è di percezione/marketing, non tecnico:
   per quel gap specifico C è sufficiente, B è overkill.
4. **Nessuna API oggi** è un prerequisito nascosto che rende B molto più costoso di quanto sembri a
   prima vista — non è "fare un'app", è "costruire un secondo backend per la stessa funzionalità".

---

## 6. Quando rivalutare (trigger concreti)

Rivalutare **C** (wrapper) quando:

- Un titolare in fase di demo/vendita chiede esplicitamente la presenza su App Store/Play Store come
  condizione (anche informale) per la decisione d'acquisto.

Rivalutare **B** (cross-platform con API dedicata) solo quando **tutti** questi sono veri:

- Il piano Business (che include il portale) ha un numero di tenant attivi significativo, non 1-2.
- Gli atleti usano davvero il portale via mobile in modo intensivo (dato misurabile da analytics, non
  supposizione).
- C'è un motivo tecnico concreto che il wrapper non risolve (es. serve accesso a API native reali —
  biometria, calendario di sistema, notifiche più ricche di quelle Web Push).

Se nessuno di questi si verifica, il PWA resta la scelta giusta indefinitamente — non è una soluzione
"temporanea in attesa dell'app vera", è l'architettura corretta per questo prodotto a questo stadio.

---

## 7. Vincoli tecnici per l'Opzione B — stato: parzialmente fatto

Aggiornato in v1.1 — quanto segue era la lista di prerequisiti in v1.0, ora con lo stato reale:

- ✅ **Layer API per il guard `student`**, autenticato via Laravel Sanctum invece di sessione cookie
  — fatto, vedi §9.
- ✅ **Endpoint JSON** per dashboard, pagamenti/ricevute, documenti, calendario gare, notifiche
  (lettura/segna-come-letta) — fatto, vedi §9. Non ancora coperti via API: upload documenti/certificato
  medico, generazione/pagamento link Stripe dal lato atleta (oggi il portale web li mostra come
  read-only lato atleta, non li genera — verificare se serve prima di assumerli mancanti).
- ⬜ **Notifiche push native**: restano da fare. Il sistema attuale è Web Push
  (`minishlink/web-push`), che **non funziona in un'app nativa/cross-platform** — servono
  APNs (iOS) e FCM (Android), sistema di invio lato server diverso da quello oggi in
  `App\Services\...` per il PWA. Se l'app del corso deve avere notifiche push, va costruito da zero
  questo pezzo — non riusa nulla dell'infrastruttura Web Push esistente.
- ⬜ **UI in sync tra Blade (web) e app**: non affrontato da questo lavoro — l'API è a sé stante,
  nessuna modifica al portale web esistente. Per il progetto di corso non è un problema (l'app è
  l'obiettivo, non serve tenerla sincronizzata con nient'altro).

---

## 8. Cosa NON è in scope di questa proposta

- Migrazione del gestionale staff (admin/trainer) a mobile — richiesta riguardava solo il Portale Atleta.
- Redesign dell'esperienza utente del portale — la valutazione qui è solo sul canale di distribuzione.
- Le notifiche push native (APNs/FCM) — vedi §7, da costruire separatamente se servono per il corso.
- Upload file (documenti/certificato medico) e generazione pagamenti Stripe dal lato atleta via API —
  l'API attuale copre lettura/consultazione, non queste due azioni di scrittura più delicate.

---

## 9. Handoff tecnico — API già disponibile

Questa sezione è per chi sviluppa l'app (anche un altro agente): cosa esiste, come si autentica, cosa
ritorna ogni endpoint. Codice sorgente: `app/Http/Controllers/Api/PortalAuthController.php`,
`PortalApiController.php`, `PortalNotificationApiController.php`, rotte in `routes/api.php` sotto
`/api/portal/*`.

### 9.1 Come raggiungere l'API

Ogni palestra (tenant) ha il proprio sottodominio — l'app deve puntare a
`https://{nome-palestra}.cornerdesk.it/api/portal/...` (o al dominio custom del tenant, se ne ha
uno). Non esiste un endpoint "globale" unico: il tenant si risolve dall'host della richiesta, esattamente
come per il sito web. In sviluppo locale, dal dominio/porta configurato in `.env`.

### 9.2 Autenticazione

Token Bearer (Laravel Sanctum), non sessione/cookie. Flusso:

1. `POST /api/portal/login` con `email`, `password`, `device_name` (opzionale, es. "iPhone 15 di Marco"
   — permette di revocare un device specifico senza disconnettere gli altri) → risposta con `token`.
2. Ogni richiesta successiva: header `Authorization: Bearer {token}`.
3. `POST /api/portal/logout` (autenticato) revoca solo il token usato in quella richiesta.

Il token non scade automaticamente (nessun `expiration` configurato in `config/sanctum.php`) — resta
valido finché non viene revocato via logout o reset password (il reset password revoca **tutti** i
token dell'atleta, vedi 9.3).

### 9.3 Endpoint

| Metodo | Path                                     | Auth | Body / Query                                                    | Risposta                                                                                                                                                                                    |
| ------ | ---------------------------------------- | ---- | --------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| POST   | `/api/portal/login`                      | No   | `email`, `password`, `device_name?`                             | `{ token, token_type, student: {id, first_name, last_name, email} }` — 401 se credenziali errate o portale non abilitato per il piano/l'atleta                                              |
| POST   | `/api/portal/logout`                     | Sì   | —                                                               | `{ message }`                                                                                                                                                                               |
| POST   | `/api/portal/password/forgot`            | No   | `email`                                                         | `{ message }` generico (non rivela se l'email esiste)                                                                                                                                       |
| POST   | `/api/portal/password/reset`             | No   | `token`, `email`, `password`, `password_confirmation`           | `{ message }` — 422 se il link è scaduto/non valido                                                                                                                                         |
| GET    | `/api/portal/me`                         | Sì   | —                                                               | Profilo: `id, first_name, last_name, email, phone_number, enrollment_date, primary_course`                                                                                                  |
| GET    | `/api/portal/dashboard`                  | Sì   | `year?` (default anno corrente)                                 | `{ selected_year, enrollment_year, enrollment_month, memberships[], receipts[], extra_payments[], documents{}, match_chart_data{}, student_courses[], upcoming_competitions[] }` — vedi 9.4 |
| GET    | `/api/portal/competitions`               | Sì   | `month?`, `year?` (default mese/anno corrente)                  | `{ month, year, competitions[] }` — calendario gare del tenant nel mese, non solo quelle dell'atleta                                                                                        |
| POST   | `/api/portal/password`                   | Sì   | `current_password`, `new_password`, `new_password_confirmation` | `{ message }` — 422 se la password attuale è sbagliata                                                                                                                                      |
| GET    | `/api/portal/notifications`              | Sì   | —                                                               | `{ items[] }` — ultime 15, formato `{id, title, excerpt, body, sender, created_at, read_at, action_url, action_label}`                                                                      |
| GET    | `/api/portal/notifications/unread-count` | Sì   | —                                                               | `{ count }`                                                                                                                                                                                 |
| POST   | `/api/portal/notifications/{id}/read`    | Sì   | —                                                               | `{ item }` — idempotente, 403 se la notifica non appartiene all'atleta autenticato                                                                                                          |

### 9.4 Dettaglio `/dashboard` (l'endpoint più corposo)

```jsonc
{
  "selected_year": 2026,
  "enrollment_year": 2025,
  "enrollment_month": 9,
  "memberships": [{ "id": 1, "month": 8, "year": 2026, "amount_paid": 49.0, "paid_at": "2026-08-03" }],
  "receipts": [{ "id": 1, "amount": 49.0, "payment_method": "Contanti", "month": 8, "year": 2026, "sent_at": "2026-08-03", "url": "/tenancy/assets/..." }],
  "extra_payments": [{ "id": 1, "amount": 20.0, "note": "Kimono", "payment_method": "POS", "paid_at": "2026-08-10" }],
  "documents": { "medical_certificate": { "id": 1, "type": "medical_certificate", "issued_at": "2026-01-10", "expires_at": "2027-01-10" } },
  "match_chart_data": { "judo": { "label": "Judo", "total": 5, "wins": 3, "losses": 2, "win_rate": 60.0, "series": [...], "trend": [...] } },
  "student_courses": [{ "id": 3, "title": "Judo Adulti" }],
  "upcoming_competitions": [{ "id": 7, "name": "Trofeo Regionale", "event_date": "2026-09-15", "location": "Palestra Comunale" }]
}
```

`receipts[].url` è un path **relativo** al dominio del tenant (`/tenancy/assets/...`) — l'app deve
prefissarlo con lo stesso host usato per chiamare l'API (§9.1), non è un URL assoluto.

### 9.5 Cosa NON copre (vedi anche §7-§8)

Nessun endpoint di scrittura per documenti/certificati (solo lettura) e nessun endpoint per generare
pagamenti Stripe dal lato atleta — se l'app deve permettere all'atleta di pagare una quota da mobile,
è un endpoint da aggiungere, non presente oggi. Nessuna push notification nativa (APNs/FCM) — solo
in-app (centro notifiche via polling/pull su `/notifications`).

### 9.6 Limite di verifica

L'API è stata verificata staticamente (sintassi, autoload, `route:list`, coerenza con i modelli reali)
ma **non testata end-to-end contro un database reale** — nessun MySQL raggiungibile dall'ambiente in
cui è stata scritta (stesso limite ricorrente di altre feature di questo progetto, vedi
`reflections.md`). Prima di costruirci sopra l'app, vale la pena una passata di test manuali (Postman/
curl) contro un ambiente con DB vero.

---

## 10. Distribuzione senza store

Requisito (v1.2): l'app deve essere installabile su Android e iOS **senza passare da App Store/Play
Store**. Le due piattaforme non sono simmetriche — su una è banale, sull'altra è un vincolo imposto
da Apple che nessuna scelta tecnica aggira.

### 10.1 Android — nessun vincolo reale

Un **APK** si installa direttamente sul device, sempre stato possibile, non è una limitazione di
Google che va aggirata. Con Expo:

```
eas build --platform android --profile preview
```

produce un file `.apk` scaricabile (link diretto, email, chiavetta) e installabile abilitando una
volta "Installa da fonti sconosciute" nelle impostazioni Android. Nessun account sviluppatore,
nessun costo, nessuna revisione, nessuna scadenza.

### 10.2 iOS — qui la richiesta si scontra con un vincolo di Apple

Apple controlla come un'app arriva su un iPhone in modo più stretto di Android — questo vale per
**qualunque** app di terzi, indipendentemente dal framework (React Native, Flutter, nativo: stesso
vincolo per tutti, non è un problema che si risolve cambiando tecnologia). Le uniche vie realmente
esistenti:

| Opzione                         | Costo                 | Account Apple richiesto               | Limiti                                                                                                                                                                                                          |
| ------------------------------- | --------------------- | ------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Expo Go** (consigliata qui)   | Gratis                | Nessuno (dal tuo lato)                | L'app gira dentro il "contenitore" Expo Go, scaricato una volta dall'App Store dall'utente (gratis, generico, non è la tua app pubblicata) — non supporta moduli nativi custom fuori dal set incluso in Expo Go |
| **Development build via Xcode** | Gratis (serve un Mac) | Apple ID gratuito                     | Installa sul device via cavo USB, ma **scade dopo 7 giorni** con account gratuito — va reinstallata periodicamente                                                                                              |
| **Ad-hoc distribution**         | $99/anno              | Apple Developer Program (a pagamento) | UDID di ogni device da registrare in anticipo, max 100 device/anno — pensato per beta testing controllato, non per distribuzione libera                                                                         |
| **TestFlight**                  | $99/anno              | Apple Developer Program (a pagamento) | Tecnicamente non è l'App Store pubblico, ma resta infrastruttura Apple con un minimo di revisione per tester esterni                                                                                            |
| **App Store pubblico**          | $99/anno              | Apple Developer Program (a pagamento) | Escluso per requisito esplicito di questo documento                                                                                                                                                             |

**Per questo progetto: Expo Go.** È l'unica via a costo zero e senza account Apple — coerente con
"progetto extra di corso", non un prodotto da distribuire a utenti reali. L'app di questo progetto
consuma solo API REST (fetch, storage locale, navigazione, eventualmente notifiche locali) — dentro
il set di moduli supportati da Expo Go, quindi **non serve un development build custom** per questo
caso d'uso specifico.

**Compromesso da accettare**: dentro Expo Go l'app non ha una propria icona sulla home screen né un
nome proprio nello switcher — è un progetto aperto dentro l'app Expo Go (via QR code o link). Se in
un secondo momento serve un'icona/nome proprio su iOS, è necessario uno degli altri quattro punti
della tabella — e comportano comunque o un account Apple a pagamento o una scadenza di 7 giorni: non
esiste una quinta via che eviti del tutto Apple su iOS, è un limite della piattaforma, non
un'omissione di questo documento.
