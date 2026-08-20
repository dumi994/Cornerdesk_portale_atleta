# Feature: App mobile Portale Atleta

## Obiettivo

App React Native (Expo) che consuma l'API JSON del Portale Atleta (`/api/portal/*`, guard Sanctum
su `Student`) per dare agli atleti login, dashboard (quote/ricevute/pagamenti extra/documenti/
gare/statistiche), calendario gare, centro notifiche e gestione profilo da mobile — installabile
senza store (Expo Go), come da `ADR-app-mobile-portale-atleta.md` v1.2.

## Dipendenze

- API esistente nel backend Laravel (`corner_Desk_ONLINE`): `PortalAuthController`,
  `PortalApiController`, `PortalNotificationApiController` — già disponibile, verificata solo
  staticamente (ADR §9.6, nessun DB reale raggiungibile durante lo sviluppo).
- Nessuna dipendenza da altre feature di questo repo.

## Stack

Expo SDK 57, Expo Router (file-based routing), TypeScript. `expo-secure-store` per token Bearer +
host tenant persistiti. `react-native-svg` per il grafico andamento gare (componente custom, niente
libreria di charting terza). Nessuna libreria di state management: `AuthContext` +
`NotificationsContext` bastano per lo scope.

## Output atteso

- Login con risoluzione tenant (sottodominio palestra o host personalizzato per test locali),
  password dimenticata (richiesta link + reset con codice).
- Dashboard con selettore anno: quote pagate, ricevute (link apribile), pagamenti extra, documenti
  (avviso scadenza certificato medico), prossime gare, grafico win-rate/andamento per disciplina.
- Calendario gare mensile (tutte le gare del tenant, non solo quelle dell'atleta).
- Centro notifiche con badge non lette sul tab, segna-come-letta, apertura link azione.
- Profilo: dati anagrafici, cambio password, logout (revoca token del device).

## Status

[x] Completata (sviluppo) — verificata con `tsc --noEmit` e bundling (`expo export`) ad ogni
feature, **non** con login reale contro un backend/DB (ADR §9.6: nessun ambiente con Laravel/MySQL
raggiungibile in questo ambiente di sviluppo).

Completata il: 2026-08-20
Note: nessuna deviazione sostanziale dal piano. Serve un test manuale con Expo Go contro un tenant
reale prima di considerarla pronta per l'uso — vedi README.md "Limiti noti".
