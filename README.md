# Portale Atleta — App mobile (Expo)

App React Native per gli atleti delle palestre Corner Desk: dashboard quote/ricevute/documenti/gare,
calendario gare, centro notifiche, profilo. Consuma l'API JSON `/api/portal/*` del backend Laravel
(`corner_Desk_ONLINE`). Decisione e contratto API completo: `ADR-app-mobile-portale-atleta.md`.

## Setup

```bash
npm install
npx expo start
```

Scansiona il QR code con l'app **Expo Go** (Android/iOS, gratuita, dagli store) — vedi
["Distribuzione senza store"](ADR-app-mobile-portale-atleta.md#10-distribuzione-senza-store)
nell'ADR per il perché su iOS è l'unica via a costo zero.

## Puntare l'app a una palestra (tenant)

Ogni palestra è un sottodominio: nella schermata di login inserisci solo il nome (es. `fightgym`
per `fightgym.cornerdesk.it`). Per puntare a un backend locale in sviluppo, attiva "Usa un indirizzo
personalizzato" e inserisci l'host completo (es. `http://192.168.1.10:8000`).

## Limiti noti

- **Non testata end-to-end contro un backend/DB reale.** Sviluppata senza un ambiente Laravel/MySQL
  raggiungibile (stesso limite che l'ADR segnala per l'API stessa, §9.6): verificata con
  `npx tsc --noEmit` e bundling (`npx expo export`), non con un login reale. Prima di un uso vero,
  serve una passata manuale contro un tenant reale.
- **Notifiche push native**: implementate via Expo Push API (canale parallelo al Web Push della PWA,
  vedi `ExpoPushNotificationService` nel backend). Il centro notifiche in-app continua comunque ad
  aggiornarsi via polling ogni 30s mentre l'app è in foreground, indipendentemente dalla push.
  - **Android**: richiede un progetto Firebase (FCM) con le credenziali caricate su EAS
    (`eas credentials`) — funziona solo su build reali (APK/EAS), non dentro Expo Go: da **Expo SDK
    53 le push remote non sono più supportate in Expo Go su Android**.
  - **iOS**: richiede una chiave APNs (.p8), generabile solo con un account Apple Developer Program
    a pagamento — stesso vincolo già discusso per la distribuzione (§10.2). Il Simulatore Xcode non
    può comunque mai ricevere push reali (limite Apple), quindi su iOS le push sono testabili solo
    su un device fisico con build firmata.
- **Nessun upload documenti/certificato medico** e **nessuna generazione pagamenti Stripe da
  mobile** — l'API attuale copre solo lettura (ADR §9.5).
- **Dentro Expo Go l'app non ha icona/nome proprio** sulla home screen (limite di Apple su iOS, non
  di questo progetto — ADR §10.2). Per un'icona propria serve un dev-client o build firmata, che
  richiedono un account Apple Developer a pagamento o scadono dopo 7 giorni.

## Struttura

```
src/
  app/            Expo Router: (auth)/ login+reset, (app)/(tabs)/ dashboard/gare/notifiche/profilo
  api/            client.ts (fetch wrapper, sessione SecureStore), portal.ts (funzioni per endpoint)
  context/        AuthContext, NotificationsContext
  components/     Card, MatchChart (react-native-svg), TenantHostFields
  types/          Tipi del contratto API (ADR §9.3/§9.4)
  utils/          Formattazione date/valuta
```
