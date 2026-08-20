import { StyleSheet, Text, View } from 'react-native';

interface Props {
  label: string;
  value: string | number;
  color: string;
}

/** Riquadro KPI colorato (ADR §11.3.3: Totale/grigio, Vittorie/verde, Sconfitte/rosso, Win-rate/blu). */
export function KpiTile({ label, value, color }: Props) {
  return (
    <View style={[styles.tile, { backgroundColor: `${color}1a` }]}>
      <Text style={[styles.value, { color }]}>{value}</Text>
      <Text style={styles.label}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  tile: { flex: 1, borderRadius: 12, paddingVertical: 12, alignItems: 'center', gap: 2 },
  value: { fontSize: 20, fontWeight: '700' },
  label: { fontSize: 11, color: '#555', fontWeight: '600' },
});
