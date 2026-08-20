import type { ReactNode } from 'react';
import { StyleSheet, Text, View, type ViewStyle } from 'react-native';

import { colors } from '@/constants/colors';

interface Props {
  title: string;
  children: ReactNode;
  style?: ViewStyle;
}

export function Card({ title, children, style }: Props) {
  return (
    <View style={[styles.card, style]}>
      <Text style={styles.title}>{title}</Text>
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.surfaceMuted,
    borderRadius: 12,
    padding: 16,
    gap: 10,
  },
  title: { fontSize: 15, fontWeight: '700', color: colors.text },
});
