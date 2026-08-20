import { LinearGradient } from 'expo-linear-gradient';
import { router } from 'expo-router';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { colors } from '@/constants/colors';
import { useNotifications } from '@/context/NotificationsContext';

interface Props {
  /** Piccolo testo maiuscolo sopra il titolo (nome palestra) — solo variante dashboard. */
  eyebrow?: string;
  title: string;
  /** Emoji mostrata prima del titolo — variante schermate semplici (es. Gare). */
  icon?: string;
  /** Iniziali per l'avatar cerchio verde — se assente, l'avatar non è mostrato. */
  avatarInitials?: string;
  /** false nella schermata Notifiche stessa, per non mostrare un link a se stessa. */
  showBell?: boolean;
}

/**
 * Header di pagina in navy (ADR §11.1/§11.3) con campanella notifiche (badge
 * non lette) e, quando fornite, iniziali avatar. Bell e avatar sono
 * scorciatoie alle stesse destinazioni della tab bar (Notifiche/Profilo),
 * non un menu a tendina separato — ADR §11.5.
 */
export function PageHeader({ eyebrow, title, icon, avatarInitials, showBell = true }: Props) {
  const insets = useSafeAreaInsets();
  const { unreadCount } = useNotifications();

  return (
    <LinearGradient colors={[colors.navyStart, colors.navyEnd]} style={[styles.container, { paddingTop: insets.top + 12 }]}>
      <View style={styles.row}>
        <View style={styles.titleBlock}>
          {eyebrow && <Text style={styles.eyebrow}>{eyebrow}</Text>}
          <Text style={styles.title}>
            {icon ? `${icon} ` : ''}
            {title}
          </Text>
        </View>

        <View style={styles.actions}>
          {showBell && (
            <Pressable style={styles.bellButton} onPress={() => router.push('/notifications')}>
              <Text style={styles.bellIcon}>🔔</Text>
              {unreadCount > 0 && (
                <View style={styles.badge}>
                  <Text style={styles.badgeText}>{unreadCount > 9 ? '9+' : unreadCount}</Text>
                </View>
              )}
            </Pressable>
          )}

          {avatarInitials && (
            <Pressable style={styles.avatar} onPress={() => router.push('/profile')}>
              <Text style={styles.avatarText}>{avatarInitials}</Text>
            </Pressable>
          )}
        </View>
      </View>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: { paddingHorizontal: 16, paddingBottom: 16 },
  row: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  titleBlock: { flexShrink: 1 },
  eyebrow: { fontSize: 11, fontWeight: '700', color: colors.textOnDarkMuted, textTransform: 'uppercase', letterSpacing: 0.5 },
  title: { fontSize: 22, fontWeight: '700', color: colors.textOnDark, marginTop: 2 },
  actions: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  bellButton: { width: 36, height: 36, alignItems: 'center', justifyContent: 'center' },
  bellIcon: { fontSize: 20 },
  badge: {
    position: 'absolute',
    top: 2,
    right: 2,
    minWidth: 16,
    height: 16,
    borderRadius: 8,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 3,
  },
  badgeText: { color: '#fff', fontSize: 9, fontWeight: '700' },
  avatar: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: colors.green,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: { color: '#fff', fontWeight: '700', fontSize: 13 },
});
