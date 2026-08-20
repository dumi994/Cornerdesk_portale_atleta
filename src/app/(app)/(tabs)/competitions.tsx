import { useCallback, useEffect, useState } from 'react';
import { Pressable, RefreshControl, ScrollView, StyleSheet, Text, View } from 'react-native';

import { ApiError } from '@/api/client';
import { fetchCompetitions } from '@/api/portal';
import { colors } from '@/constants/colors';
import { useAuth } from '@/context/AuthContext';
import type { Competition } from '@/types/portal';
import { formatDate, formatMonthLabel } from '@/utils/format';

const now = new Date();

export default function CompetitionsScreen() {
  const { host, token } = useAuth();
  const [month, setMonth] = useState(now.getMonth() + 1);
  const [year, setYear] = useState(now.getFullYear());
  const [competitions, setCompetitions] = useState<Competition[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(
    async (targetMonth: number, targetYear: number, { isRefresh = false } = {}) => {
      if (!host || !token) return;
      isRefresh ? setRefreshing(true) : setLoading(true);
      setError(null);
      try {
        const result = await fetchCompetitions(host, token, targetMonth, targetYear);
        setCompetitions(result.competitions);
      } catch (err) {
        setError(err instanceof ApiError ? err.message : 'Impossibile caricare il calendario gare.');
      } finally {
        isRefresh ? setRefreshing(false) : setLoading(false);
      }
    },
    [host, token]
  );

  useEffect(() => {
    load(month, year);
  }, [load, month, year]);

  function goToPreviousMonth() {
    if (month === 1) {
      setMonth(12);
      setYear((y) => y - 1);
    } else {
      setMonth((m) => m - 1);
    }
  }

  function goToNextMonth() {
    if (month === 12) {
      setMonth(1);
      setYear((y) => y + 1);
    } else {
      setMonth((m) => m + 1);
    }
  }

  return (
    <ScrollView
      contentContainerStyle={styles.container}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => load(month, year, { isRefresh: true })} />}
    >
      <View style={styles.monthRow}>
        <Pressable onPress={goToPreviousMonth} style={styles.monthButton}>
          <Text style={styles.monthButtonText}>‹</Text>
        </Pressable>
        <Text style={styles.monthLabel}>
          {formatMonthLabel(month)} {year}
        </Text>
        <Pressable onPress={goToNextMonth} style={styles.monthButton}>
          <Text style={styles.monthButtonText}>›</Text>
        </Pressable>
      </View>

      {error ? <Text style={styles.error}>{error}</Text> : null}
      {loading && competitions.length === 0 ? <Text style={styles.muted}>Caricamento...</Text> : null}

      {!loading && competitions.length === 0 && !error ? (
        <Text style={styles.muted}>Nessuna gara in calendario per questo mese.</Text>
      ) : (
        competitions.map((competition) => (
          <View key={competition.id} style={styles.card}>
            <Text style={styles.name}>{competition.name}</Text>
            <Text style={styles.detail}>{formatDate(competition.event_date)}</Text>
            {(competition.start_time || competition.end_time) && (
              <Text style={styles.detail}>
                {competition.start_time ?? ''}
                {competition.start_time && competition.end_time ? ' – ' : ''}
                {competition.end_time ?? ''}
              </Text>
            )}
            {competition.location && <Text style={styles.detail}>{competition.location}</Text>}
            {competition.course && <Text style={styles.courseTag}>{competition.course.title}</Text>}
          </View>
        ))
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { padding: 16, gap: 12, flexGrow: 1 },
  monthRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 16, marginBottom: 4 },
  monthButton: { paddingHorizontal: 12, paddingVertical: 4 },
  monthButtonText: { fontSize: 22, color: colors.primary, fontWeight: '700' },
  monthLabel: { fontSize: 18, fontWeight: '700', color: colors.text, textTransform: 'capitalize', minWidth: 140, textAlign: 'center' },
  error: { color: colors.error, textAlign: 'center' },
  muted: { color: colors.textMuted, fontSize: 13, textAlign: 'center' },
  card: {
    backgroundColor: colors.surfaceMuted,
    borderRadius: 12,
    padding: 14,
    gap: 4,
  },
  name: { fontSize: 15, fontWeight: '700', color: colors.text },
  detail: { fontSize: 13, color: colors.textMuted },
  courseTag: { fontSize: 12, color: colors.primary, fontWeight: '600', marginTop: 2 },
});
