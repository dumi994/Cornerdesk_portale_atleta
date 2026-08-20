import { StyleSheet, Text, View } from 'react-native';
import Svg, { Circle, Line, Polyline } from 'react-native-svg';

import { colors } from '@/constants/colors';
import type { MatchChartTrendPoint } from '@/types/portal';

const CHART_HEIGHT = 120;

/**
 * Grafico a linea dell'andamento cumulativo (ADR §11.3.3) via react-native-svg
 * invece di una libreria di charting terza — già supportato in Expo Go.
 */
export function MatchChart({ trend }: { trend: MatchChartTrendPoint[] | null }) {
  if (!trend || trend.length < 2) {
    return (
      <View style={styles.empty}>
        <Text style={styles.emptyText}>Servono almeno 2 incontri per mostrare l'andamento.</Text>
      </View>
    );
  }

  const scores = trend.map((point) => point.score);
  const min = Math.min(...scores, 0);
  const max = Math.max(...scores, 0);
  const range = max - min || 1;

  return (
    <View style={styles.container}>
      <ChartSvg trend={trend} min={min} range={range} />
    </View>
  );
}

function ChartSvg({ trend, min, range }: { trend: MatchChartTrendPoint[]; min: number; range: number }) {
  const width = 280;
  const stepX = width / (trend.length - 1);
  const points = trend
    .map((point, index) => {
      const x = index * stepX;
      const y = CHART_HEIGHT - ((point.score - min) / range) * CHART_HEIGHT;
      return `${x},${y}`;
    })
    .join(' ');
  const lastPoint = trend[trend.length - 1];
  const lastX = (trend.length - 1) * stepX;
  const lastY = CHART_HEIGHT - ((lastPoint.score - min) / range) * CHART_HEIGHT;
  const zeroY = CHART_HEIGHT - ((0 - min) / range) * CHART_HEIGHT;

  return (
    <Svg width={width} height={CHART_HEIGHT}>
      <Line x1={0} y1={zeroY} x2={width} y2={zeroY} stroke={colors.border} strokeWidth={1} />
      <Polyline points={points} fill="none" stroke={colors.infoBlue} strokeWidth={2} />
      <Circle cx={lastX} cy={lastY} r={4} fill={colors.infoBlue} />
    </Svg>
  );
}

const styles = StyleSheet.create({
  container: { alignItems: 'center' },
  empty: { paddingVertical: 12 },
  emptyText: { fontSize: 12, color: colors.textMuted, textAlign: 'center' },
});
