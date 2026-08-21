import { useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import Svg, { Circle, Line, Polygon, Polyline } from 'react-native-svg';

import { colors } from '@/constants/colors';
import type { MatchChartSeriesPoint, MatchChartTrendPoint, MatchOutcome } from '@/types/portal';
import { formatShortDate } from '@/utils/format';

const CHART_WIDTH = 280;
const CHART_HEIGHT = 140;
const X_AXIS_HEIGHT = 24;
const MAX_X_LABELS = 6;

const OUTCOME_COLOR: Record<MatchOutcome, string> = {
  win: colors.chartWin,
  loss: colors.chartLoss,
  draw: colors.chartDraw,
};

const OUTCOME_LABEL: Record<MatchOutcome, string> = {
  win: 'Vittoria',
  loss: 'Sconfitta',
  draw: 'Pareggio',
};

interface ChartPoint {
  date: string;
  score: number;
  outcome: MatchOutcome;
  event: string | null;
}

/**
 * Grafico "Le mie gare" (ADR §11.3 punto 3): equivalente nativo del Chart.js
 * `match-results-chart.js` del web — stesso colore linea/punti, stesse date
 * reali sull'asse X, stesso tooltip (qui: tap-to-reveal). Via react-native-svg,
 * già supportato in Expo Go, invece di Chart.js (che usa <canvas>, non disponibile in RN).
 */
export function MatchChart({
  series,
  trend,
}: {
  series: MatchChartSeriesPoint[];
  trend: MatchChartTrendPoint[] | null;
}) {
  const [selectedIndex, setSelectedIndex] = useState<number | null>(null);

  if (!trend || trend.length < 2) {
    return (
      <View style={styles.empty}>
        <Text style={styles.emptyText}>Servono almeno 2 incontri per mostrare l'andamento.</Text>
      </View>
    );
  }

  // series e trend derivano dalla stessa collezione ordinata lato server
  // (Student::buildMatchChartData) — stesso indice, stesso incontro.
  const points: ChartPoint[] = trend.map((t, i) => ({
    date: t.date,
    score: t.score,
    outcome: series[i]?.outcome ?? 'draw',
    event: series[i]?.event ?? null,
  }));

  const scores = points.map((p) => p.score);
  const min = Math.min(...scores, 0);
  const max = Math.max(...scores, 0);
  const range = max - min || 1;
  const stepX = CHART_WIDTH / (points.length - 1);

  const coords = points.map((p, i) => ({
    x: i * stepX,
    y: CHART_HEIGHT - ((p.score - min) / range) * CHART_HEIGHT,
  }));

  const linePoints = coords.map((c) => `${c.x},${c.y}`).join(' ');
  const fillPoints = `0,${CHART_HEIGHT} ${linePoints} ${CHART_WIDTH},${CHART_HEIGHT}`;
  const zeroY = CHART_HEIGHT - ((0 - min) / range) * CHART_HEIGHT;

  const labelStep = Math.max(1, Math.ceil(points.length / MAX_X_LABELS));
  const selected = selectedIndex !== null ? points[selectedIndex] : null;

  return (
    <View style={styles.container}>
      <Text style={styles.legend}>Punteggio cumulativo</Text>

      <Svg width={CHART_WIDTH} height={CHART_HEIGHT + X_AXIS_HEIGHT}>
        <Line x1={0} y1={zeroY} x2={CHART_WIDTH} y2={zeroY} stroke={colors.border} strokeWidth={1} />
        <Polygon points={fillPoints} fill={colors.chartFill} stroke="none" />
        <Polyline points={linePoints} fill="none" stroke={colors.chartLine} strokeWidth={2} strokeLinejoin="round" />
        {coords.map((c, i) => (
          <Circle
            key={i}
            cx={c.x}
            cy={c.y}
            r={5}
            fill={OUTCOME_COLOR[points[i].outcome]}
            onPress={() => setSelectedIndex(i === selectedIndex ? null : i)}
          />
        ))}
      </Svg>

      <View style={styles.xAxisRow}>
        {points.map((p, i) =>
          i % labelStep === 0 || i === points.length - 1 ? (
            <Text key={i} style={styles.xLabel}>
              {formatShortDate(p.date)}
            </Text>
          ) : null
        )}
      </View>

      {selected && (
        <Text style={styles.tooltip}>
          {OUTCOME_LABEL[selected.outcome]} → {selected.score >= 0 ? `+${selected.score}` : selected.score}
          {selected.event ? ` — ${selected.event}` : ''}
        </Text>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { alignItems: 'center', gap: 4 },
  legend: { fontSize: 12, color: colors.textMuted, fontWeight: '600' },
  empty: { paddingVertical: 12 },
  emptyText: { fontSize: 12, color: colors.textMuted, textAlign: 'center' },
  xAxisRow: { flexDirection: 'row', justifyContent: 'space-between', width: CHART_WIDTH },
  xLabel: { fontSize: 9, color: colors.textMuted, transform: [{ rotate: '-45deg' }] },
  tooltip: { fontSize: 12, color: colors.text, fontWeight: '600', marginTop: 4, textAlign: 'center' },
});
