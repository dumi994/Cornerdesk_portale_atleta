import { StyleSheet, Text, View } from 'react-native';
import Svg, { Line, Polyline } from 'react-native-svg';

import { colors } from '@/constants/colors';
import type { MatchChartDiscipline, MatchChartTrendPoint } from '@/types/portal';

const SPARKLINE_WIDTH = 260;
const SPARKLINE_HEIGHT = 56;

/**
 * Grafico custom via react-native-svg invece di una libreria di charting terza:
 * per il solo caso d'uso di `match_chart_data` (barra win-rate + sparkline
 * cumulativa) non serve altro, e react-native-svg è già supportato in Expo Go.
 */
export function MatchChart({ discipline }: { discipline: MatchChartDiscipline }) {
  const { label, wins, losses, draws, total, win_rate, trend } = discipline;
  const points = buildSparklinePoints(trend);

  return (
    <View style={styles.container}>
      <View style={styles.headerRow}>
        <Text style={styles.label}>{label}</Text>
        <Text style={styles.record}>
          {wins}V · {losses}S{draws ? ` · ${draws}P` : ''}
        </Text>
      </View>

      <View style={styles.barTrack}>
        <View style={[styles.barFill, { width: `${Math.min(100, Math.max(0, win_rate))}%` }]} />
      </View>
      <Text style={styles.winRate}>
        {win_rate}% vittorie su {total} incontr{total === 1 ? 'o' : 'i'}
      </Text>

      {points && (
        <Svg width={SPARKLINE_WIDTH} height={SPARKLINE_HEIGHT} style={styles.sparkline}>
          <Line
            x1={0}
            y1={SPARKLINE_HEIGHT / 2}
            x2={SPARKLINE_WIDTH}
            y2={SPARKLINE_HEIGHT / 2}
            stroke={colors.border}
            strokeWidth={1}
          />
          <Polyline points={points} fill="none" stroke={colors.primary} strokeWidth={2} />
        </Svg>
      )}
    </View>
  );
}

function buildSparklinePoints(trend: MatchChartTrendPoint[] | null): string | null {
  if (!trend || trend.length < 2) return null;

  const scores = trend.map((point) => point.score);
  const min = Math.min(...scores, 0);
  const max = Math.max(...scores, 0);
  const range = max - min || 1;
  const stepX = SPARKLINE_WIDTH / (trend.length - 1);

  return trend
    .map((point, index) => {
      const x = index * stepX;
      const y = SPARKLINE_HEIGHT - ((point.score - min) / range) * SPARKLINE_HEIGHT;
      return `${x},${y}`;
    })
    .join(' ');
}

const styles = StyleSheet.create({
  container: { gap: 6 },
  headerRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'baseline' },
  label: { fontSize: 14, fontWeight: '700', color: colors.text, textTransform: 'capitalize' },
  record: { fontSize: 13, color: colors.textMuted },
  barTrack: { height: 8, borderRadius: 4, backgroundColor: '#e2e5ea', overflow: 'hidden' },
  barFill: { height: '100%', backgroundColor: colors.primary, borderRadius: 4 },
  winRate: { fontSize: 12, color: colors.textMuted },
  sparkline: { alignSelf: 'center', marginTop: 4 },
});
