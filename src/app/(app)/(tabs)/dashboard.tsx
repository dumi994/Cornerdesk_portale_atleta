import { useCallback, useEffect, useState } from 'react';
import { Linking, Pressable, RefreshControl, ScrollView, StyleSheet, Text, View } from 'react-native';

import { ApiError } from '@/api/client';
import { fetchDashboard } from '@/api/portal';
import { Card } from '@/components/Card';
import { MatchChart } from '@/components/MatchChart';
import { colors } from '@/constants/colors';
import { useAuth } from '@/context/AuthContext';
import type { DashboardData } from '@/types/portal';
import { daysUntil, documentTypeLabel, formatCurrency, formatDate, formatMonthLabel } from '@/utils/format';

const CURRENT_YEAR = new Date().getFullYear();

export default function DashboardScreen() {
  const { host, token, student } = useAuth();
  const [selectedYear, setSelectedYear] = useState(CURRENT_YEAR);
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(
    async (year: number, { isRefresh = false } = {}) => {
      if (!host || !token) return;
      isRefresh ? setRefreshing(true) : setLoading(true);
      setError(null);
      try {
        const result = await fetchDashboard(host, token, year);
        setData(result);
      } catch (err) {
        setError(err instanceof ApiError ? err.message : 'Impossibile caricare la dashboard.');
      } finally {
        isRefresh ? setRefreshing(false) : setLoading(false);
      }
    },
    [host, token]
  );

  useEffect(() => {
    load(selectedYear);
  }, [load, selectedYear]);

  const minYear = data?.enrollment_year ?? selectedYear;
  const canGoPrev = selectedYear > minYear;
  const canGoNext = selectedYear < CURRENT_YEAR;

  const disciplines = data ? Object.values(data.match_chart_data) : [];
  const documents = data ? Object.values(data.documents) : [];

  function openReceipt(relativeUrl: string) {
    if (!host) return;
    const absolute = relativeUrl.startsWith('http') ? relativeUrl : `${host}${relativeUrl}`;
    Linking.openURL(absolute).catch(() => {
      setError('Impossibile aprire la ricevuta.');
    });
  }

  return (
    <ScrollView
      contentContainerStyle={styles.container}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => load(selectedYear, { isRefresh: true })} />}
    >
      <Text style={styles.greeting}>Ciao, {student?.first_name ?? 'atleta'}</Text>

      <View style={styles.yearRow}>
        <Pressable onPress={() => canGoPrev && setSelectedYear((y) => y - 1)} disabled={!canGoPrev} style={styles.yearButton}>
          <Text style={[styles.yearButtonText, !canGoPrev && styles.yearButtonDisabled]}>‹</Text>
        </Pressable>
        <Text style={styles.yearLabel}>{selectedYear}</Text>
        <Pressable onPress={() => canGoNext && setSelectedYear((y) => y + 1)} disabled={!canGoNext} style={styles.yearButton}>
          <Text style={[styles.yearButtonText, !canGoNext && styles.yearButtonDisabled]}>›</Text>
        </Pressable>
      </View>

      {error ? <Text style={styles.error}>{error}</Text> : null}
      {loading && !data ? <Text style={styles.muted}>Caricamento...</Text> : null}

      {data && (
        <>
          {data.upcoming_competitions.length > 0 && (
            <Card title="Prossime gare">
              {data.upcoming_competitions.map((c) => (
                <View key={c.id} style={styles.row}>
                  <Text style={styles.rowTitle}>{c.name}</Text>
                  <Text style={styles.rowSubtitle}>
                    {formatDate(c.event_date)}
                    {c.location ? ` · ${c.location}` : ''}
                  </Text>
                </View>
              ))}
            </Card>
          )}

          {documents.length > 0 && (
            <Card title="Documenti">
              {documents.map((doc) => {
                const remaining = daysUntil(doc.expires_at);
                const expiring = remaining !== null && remaining <= 30;
                return (
                  <View key={doc.id} style={styles.row}>
                    <Text style={styles.rowTitle}>{documentTypeLabel(doc.type)}</Text>
                    <Text style={styles.rowSubtitle}>
                      Rilasciato il {formatDate(doc.issued_at)} · Scade il {formatDate(doc.expires_at)}
                    </Text>
                    {expiring && (
                      <Text style={styles.warning}>
                        {remaining! < 0 ? 'Scaduto' : `Scade tra ${remaining} giorni`}
                      </Text>
                    )}
                  </View>
                );
              })}
            </Card>
          )}

          <Card title="Quote pagate">
            {data.memberships.length === 0 ? (
              <Text style={styles.muted}>Nessuna quota registrata per il {selectedYear}.</Text>
            ) : (
              data.memberships.map((m) => (
                <View key={m.id} style={styles.row}>
                  <Text style={styles.rowTitle}>{formatMonthLabel(m.month)}</Text>
                  <Text style={styles.rowSubtitle}>
                    {formatCurrency(m.amount_paid)} · pagata il {formatDate(m.paid_at)}
                  </Text>
                </View>
              ))
            )}
          </Card>

          <Card title="Ricevute">
            {data.receipts.length === 0 ? (
              <Text style={styles.muted}>Nessuna ricevuta per il {selectedYear}.</Text>
            ) : (
              data.receipts.map((r) => (
                <Pressable key={r.id} style={styles.row} onPress={() => openReceipt(r.url)}>
                  <Text style={[styles.rowTitle, styles.link]}>
                    {formatMonthLabel(r.month)} {r.year} · {formatCurrency(r.amount)}
                  </Text>
                  <Text style={styles.rowSubtitle}>
                    {r.payment_method} · inviata il {formatDate(r.sent_at)}
                  </Text>
                </Pressable>
              ))
            )}
          </Card>

          {data.extra_payments.length > 0 && (
            <Card title="Pagamenti extra">
              {data.extra_payments.map((p) => (
                <View key={p.id} style={styles.row}>
                  <Text style={styles.rowTitle}>
                    {p.note ?? 'Pagamento extra'} · {formatCurrency(p.amount)}
                  </Text>
                  <Text style={styles.rowSubtitle}>
                    {p.payment_method} · {formatDate(p.paid_at)}
                  </Text>
                </View>
              ))}
            </Card>
          )}

          {disciplines.length > 0 && (
            <Card title="Andamento gare">
              {disciplines.map((discipline) => (
                <MatchChart key={discipline.label} discipline={discipline} />
              ))}
            </Card>
          )}
        </>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { padding: 16, gap: 16, flexGrow: 1 },
  greeting: { fontSize: 22, fontWeight: '700', color: colors.text },
  yearRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 16 },
  yearButton: { paddingHorizontal: 12, paddingVertical: 4 },
  yearButtonText: { fontSize: 22, color: colors.primary, fontWeight: '700' },
  yearButtonDisabled: { color: colors.border },
  yearLabel: { fontSize: 18, fontWeight: '700', color: colors.text, minWidth: 56, textAlign: 'center' },
  error: { color: colors.error, textAlign: 'center' },
  muted: { color: colors.textMuted, fontSize: 13 },
  row: { gap: 2, paddingVertical: 6, borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: colors.border },
  rowTitle: { fontSize: 14, fontWeight: '600', color: colors.text, textTransform: 'capitalize' },
  rowSubtitle: { fontSize: 12, color: colors.textMuted },
  warning: { fontSize: 12, color: colors.warning, fontWeight: '700' },
  link: { color: colors.primary },
});
