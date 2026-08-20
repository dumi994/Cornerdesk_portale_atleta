import { LinearGradient } from 'expo-linear-gradient';
import type { ReactNode } from 'react';
import { StyleSheet, Text, View } from 'react-native';

import { colors } from '@/constants/colors';

interface Props {
  title: string;
  /** Colore della barretta laterale d'accento — rosso/viola/verde a seconda della sezione (ADR §11.1). */
  accentColor: string;
  /** Contenuto libero nell'header, a destra del titolo (selettore anno, link "Vedi tutte", ecc.). */
  headerRight?: ReactNode;
  children: ReactNode;
}

/**
 * Card-sezione della dashboard (ADR §11.3): header scuro (stesso navy della
 * pagina) con barretta colorata d'accento + titolo, corpo bianco sotto.
 */
export function SectionCard({ title, accentColor, headerRight, children }: Props) {
  return (
    <View style={styles.card}>
      <LinearGradient colors={[colors.navyStart, colors.navyEnd]} style={styles.header}>
        <View style={[styles.accentBar, { backgroundColor: accentColor }]} />
        <Text style={styles.title}>{title}</Text>
        <View style={styles.headerRight}>{headerRight}</View>
      </LinearGradient>
      <View style={styles.body}>{children}</View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: 20,
    overflow: 'hidden',
    backgroundColor: colors.background,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 20,
    elevation: 3,
  },
  header: { flexDirection: 'row', alignItems: 'center', paddingVertical: 12, paddingHorizontal: 16, gap: 10 },
  accentBar: { width: 4, height: 18, borderRadius: 2 },
  title: { flex: 1, fontSize: 15, fontWeight: '700', color: colors.textOnDark },
  headerRight: { flexShrink: 0 },
  body: { padding: 16, gap: 10 },
});
