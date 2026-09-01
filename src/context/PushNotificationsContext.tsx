import Constants from 'expo-constants';
import * as Notifications from 'expo-notifications';
import { router } from 'expo-router';
import { createContext, useContext, useEffect, useMemo, useState, type PropsWithChildren } from 'react';
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

export type PushRegistrationStatus =
  | 'idle'
  | 'requesting-permission'
  | 'permission-denied'
  | 'fetching-token'
  | 'registering'
  | 'registered'
  | 'error';

interface PushNotificationsContextValue {
  status: PushRegistrationStatus;
  errorMessage: string | null;
  /** Primi caratteri del token Expo, solo per diagnostica in UI — mai il token intero (chi lo possiede può inviare push a questo device). */
  tokenPreview: string | null;
}

const PushNotificationsContext = createContext<PushNotificationsContextValue>({
  status: 'idle',
  errorMessage: null,
  tokenPreview: null,
});

/**
 * Richiede il permesso, ottiene il push token Expo e lo registra sul backend
 * (`POST /api/portal/push-tokens`, canale Expo Push parallelo al Web Push
 * della PWA). A differenza della versione precedente (hook "fire and
 * forget"), lo stato di ogni passo è esposto via contesto — consumato dalla
 * schermata Profilo per la diagnostica, dato che qui non c'è un modo facile
 * di vedere i log della console su una build reale installata.
 *
 * Nota: dentro Expo Go le notifiche push remote non sono più supportate da
 * Expo SDK 53 in poi — serve una build reale (le APK/build EAS di questo
 * progetto lo sono già, non Expo Go).
 */
export function PushNotificationsProvider({ children }: PropsWithChildren) {
  const { status: authStatus, host, token } = useAuth();
  const [status, setStatus] = useState<PushRegistrationStatus>('idle');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [tokenPreview, setTokenPreview] = useState<string | null>(null);

  useEffect(() => {
    if (authStatus !== 'signedIn' || !host || !token) return;

    let cancelled = false;

    (async () => {
      try {
        setErrorMessage(null);
        setStatus('requesting-permission');

        const { status: existingStatus } = await Notifications.getPermissionsAsync();
        let finalStatus = existingStatus;
        if (existingStatus !== 'granted') {
          const { status: requested } = await Notifications.requestPermissionsAsync();
          finalStatus = requested;
        }
        if (cancelled) return;
        if (finalStatus !== 'granted') {
          setStatus('permission-denied');
          return;
        }

        if (Platform.OS === 'android') {
          await Notifications.setNotificationChannelAsync('default', {
            name: 'default',
            importance: Notifications.AndroidImportance.DEFAULT,
          });
        }

        setStatus('fetching-token');
        const projectId = Constants.expoConfig?.extra?.eas?.projectId as string | undefined;
        const { data: expoPushToken } = await Notifications.getExpoPushTokenAsync(projectId ? { projectId } : undefined);
        if (cancelled) return;

        setTokenPreview(`${expoPushToken.slice(0, 28)}…`);
        setStatus('registering');
        await registerPushToken(host, token, expoPushToken, Platform.OS === 'ios' ? 'iPhone' : 'Android');
        if (cancelled) return;

        setStatus('registered');
      } catch (err) {
        if (cancelled) return;
        setStatus('error');
        setErrorMessage(err instanceof Error ? err.message : String(err));
      }
    })();

    const subscription = Notifications.addNotificationResponseReceivedListener(() => {
      router.push('/notifications');
    });

    return () => {
      cancelled = true;
      subscription.remove();
    };
  }, [authStatus, host, token]);

  const value = useMemo<PushNotificationsContextValue>(
    () => ({ status, errorMessage, tokenPreview }),
    [status, errorMessage, tokenPreview]
  );

  return <PushNotificationsContext.Provider value={value}>{children}</PushNotificationsContext.Provider>;
}

export function usePushNotificationsStatus(): PushNotificationsContextValue {
  return useContext(PushNotificationsContext);
}
