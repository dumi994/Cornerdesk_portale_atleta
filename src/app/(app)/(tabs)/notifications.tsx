import { useState } from 'react';
import { Linking, Pressable, RefreshControl, ScrollView, StyleSheet, Text, View } from 'react-native';

import { colors } from '@/constants/colors';
import { useAuth } from '@/context/AuthContext';
import { useNotifications } from '@/context/NotificationsContext';
import type { NotificationItem } from '@/types/portal';

export default function NotificationsScreen() {
  const { host } = useAuth();
  const { items, loading, refresh, markRead } = useNotifications();
  const [expandedId, setExpandedId] = useState<number | null>(null);

  async function handlePress(item: NotificationItem) {
    if (!item.read_at) {
      await markRead(item.id).catch(() => {});
    }
    setExpandedId((current) => (current === item.id ? null : item.id));
  }

  function handleOpenAction(item: NotificationItem) {
    if (!item.action_url || !host) return;
    const absolute = item.action_url.startsWith('http') ? item.action_url : `${host}${item.action_url}`;
    Linking.openURL(absolute).catch(() => {});
  }

  return (
    <ScrollView
      contentContainerStyle={styles.container}
      refreshControl={<RefreshControl refreshing={loading} onRefresh={refresh} />}
    >
      {items.length === 0 && !loading ? (
        <Text style={styles.muted}>Nessuna notifica al momento.</Text>
      ) : (
        items.map((item) => {
          const isUnread = !item.read_at;
          const isExpanded = expandedId === item.id;
          return (
            <Pressable key={item.id} style={[styles.card, isUnread && styles.cardUnread]} onPress={() => handlePress(item)}>
              <View style={styles.headerRow}>
                {isUnread && <View style={styles.dot} />}
                <Text style={styles.title}>{item.title}</Text>
              </View>
              <Text style={styles.meta}>
                {item.sender ? `${item.sender} · ` : ''}
                {item.created_at_human}
              </Text>
              <Text style={styles.body} numberOfLines={isExpanded ? undefined : 2}>
                {isExpanded ? item.body : item.excerpt}
              </Text>
              {isExpanded && item.action_url && (
                <Pressable style={styles.actionButton} onPress={() => handleOpenAction(item)}>
                  <Text style={styles.actionText}>{item.action_label ?? 'Apri'}</Text>
                </Pressable>
              )}
            </Pressable>
          );
        })
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { padding: 16, gap: 10, flexGrow: 1 },
  muted: { color: colors.textMuted, fontSize: 13, textAlign: 'center', marginTop: 24 },
  card: {
    backgroundColor: colors.surfaceMuted,
    borderRadius: 12,
    padding: 14,
    gap: 4,
  },
  cardUnread: { borderWidth: 1, borderColor: colors.primary },
  headerRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  dot: { width: 8, height: 8, borderRadius: 4, backgroundColor: colors.primary },
  title: { fontSize: 15, fontWeight: '700', color: colors.text, flexShrink: 1 },
  meta: { fontSize: 12, color: colors.textMuted },
  body: { fontSize: 14, color: colors.text, marginTop: 4 },
  actionButton: {
    alignSelf: 'flex-start',
    marginTop: 8,
    backgroundColor: colors.primary,
    borderRadius: 8,
    paddingHorizontal: 14,
    paddingVertical: 8,
  },
  actionText: { color: '#fff', fontWeight: '700', fontSize: 13 },
});
