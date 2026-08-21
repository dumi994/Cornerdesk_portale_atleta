import Constants from 'expo-constants';
import * as Notifications from 'expo-notifications';
import { router } from 'expo-router';
import { useEffect } from 'react';
import { Platform } from 'react-native';

import { registerPushToken } from '@/api/portal';
import { useAuth } from '@/context/AuthContext';

// Mostra la notifica anche mentre l'app è in foreground (default: la
// nasconde) — coerente con l'aspettativa di un centro notifiche reattivo.
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
    shouldShowBanner: true,
    shouldShowList: true,
  }),
});

/**
 * Richiede il permesso, ottiene il push token Expo e lo registra sul backend
 * (`POST /api/portal/push-tokens`, ADR: canale Expo Push parallelo al Web
 * Push della PWA). Fallisce silenziosamente se negato/non disponibile — il
 * centro notifiche in-app (polling) resta comunque utilizzabile.
 *
 * Nota: dentro Expo Go le notifiche push remote non sono più supportate da
 * Expo SDK 53 in poi — serve una build reale (le APK/build EAS di questo
 * progetto lo sono già, non Expo Go).
 */
export function usePushNotifications() {
  const { status, host, token } = useAuth();

  useEffect(() => {
    if (status !== 'signedIn' || !host || !token) return;

    let cancelled = false;

    (async () => {
      try {
        const { status: existingStatus } = await Notifications.getPermissionsAsync();
        let finalStatus = existingStatus;
        if (existingStatus !== 'granted') {
          const { status: requested } = await Notifications.requestPermissionsAsync();
          finalStatus = requested;
        }
        if (finalStatus !== 'granted' || cancelled) return;

        if (Platform.OS === 'android') {
          await Notifications.setNotificationChannelAsync('default', {
            name: 'default',
            importance: Notifications.AndroidImportance.DEFAULT,
          });
        }

        const projectId = Constants.expoConfig?.extra?.eas?.projectId as string | undefined;
        const { data: expoPushToken } = await Notifications.getExpoPushTokenAsync(projectId ? { projectId } : undefined);

        if (cancelled) return;

        await registerPushToken(host, token, expoPushToken, Platform.OS === 'ios' ? 'iPhone' : 'Android');
      } catch {
        // Permesso negato, Expo Go senza supporto push, o rete assente:
        // non bloccante, vedi commento sopra la funzione.
      }
    })();

    const subscription = Notifications.addNotificationResponseReceivedListener(() => {
      router.push('/notifications');
    });

    return () => {
      cancelled = true;
      subscription.remove();
    };
  }, [status, host, token]);
}
