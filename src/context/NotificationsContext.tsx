import { createContext, useCallback, useContext, useEffect, useMemo, useState, type PropsWithChildren } from 'react';

import { fetchNotifications, fetchUnreadCount, markNotificationRead } from '@/api/portal';
import { useAuth } from '@/context/AuthContext';
import type { NotificationItem } from '@/types/portal';

// Nessuna push nativa (APNs/FCM fuori scope, ADR §7/§9.5): il centro
// notifiche si aggiorna via polling mentre l'app è in foreground.
const POLL_INTERVAL_MS = 30_000;

interface NotificationsContextValue {
  items: NotificationItem[];
  unreadCount: number;
  loading: boolean;
  refresh: () => Promise<void>;
  markRead: (id: number) => Promise<void>;
}

const NotificationsContext = createContext<NotificationsContextValue | null>(null);

export function NotificationsProvider({ children }: PropsWithChildren) {
  const { host, token, status } = useAuth();
  const [items, setItems] = useState<NotificationItem[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(false);

  const refresh = useCallback(async () => {
    if (!host || !token) return;
    setLoading(true);
    try {
      const [list, count] = await Promise.all([fetchNotifications(host, token), fetchUnreadCount(host, token)]);
      setItems(list.items);
      setUnreadCount(count.count);
    } catch {
      // Il centro notifiche non è critico: un fallimento silenzioso non deve bloccare il resto dell'app.
    } finally {
      setLoading(false);
    }
  }, [host, token]);

  useEffect(() => {
    if (status !== 'signedIn') {
      setItems([]);
      setUnreadCount(0);
      return;
    }
    refresh();
    const interval = setInterval(refresh, POLL_INTERVAL_MS);
    return () => clearInterval(interval);
  }, [status, refresh]);

  const markRead = useCallback(
    async (id: number) => {
      if (!host || !token) return;
      const wasUnread = items.find((n) => n.id === id)?.read_at == null;
      const { item } = await markNotificationRead(host, token, id);
      setItems((prev) => prev.map((n) => (n.id === id ? item : n)));
      if (wasUnread) setUnreadCount((prev) => Math.max(0, prev - 1));
    },
    [host, token, items]
  );

  const value = useMemo<NotificationsContextValue>(
    () => ({ items, unreadCount, loading, refresh, markRead }),
    [items, unreadCount, loading, refresh, markRead]
  );

  return <NotificationsContext.Provider value={value}>{children}</NotificationsContext.Provider>;
}

export function useNotifications(): NotificationsContextValue {
  const ctx = useContext(NotificationsContext);
  if (!ctx) throw new Error('useNotifications must be used within NotificationsProvider');
  return ctx;
}
