import { router } from 'expo-router';
import { useCallback, useEffect, useState } from 'react';
import { Linking, Modal, Pressable, RefreshControl, ScrollView, StyleSheet, Text, View } from 'react-native';

import { ApiError } from '@/api/client';
import { fetchDashboard } from '@/api/portal';
import { KpiTile } from '@/components/KpiTile';
import { MatchChart } from '@/components/MatchChart';
import { PageHeader } from '@/components/PageHeader';
import { SectionCard } from '@/components/SectionCard';
import { colors, documentTypeStyle } from '@/constants/colors';
import { useAuth } from '@/context/AuthContext';
import type { DashboardData, Receipt } from '@/types/portal';
import { daysUntil, formatCurrency, formatDate, formatMonthLabel } from '@/utils/format';

const CURRENT_YEAR = new Date().getFullYear();

export default function DashboardScreen() {
  const { host, token, student, tenantName } = useAuth();
  const [selectedYear, setSelectedYear] = useState(CURRENT_YEAR);
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedDiscipline, setSelectedDiscipline] = useState<string | null>(null);
  const [receiptModal, setReceiptModal] = useState<Receipt | null>(null);

  const load = useCallback(
    async (year: number, { isRefresh = false } = {}) => {
      if (!host || !token) return;
      isRefresh ? setRefreshing(true) : setLoading(true);
      setError(null);
      try {
        const result = await fetchDashboard(host, token, year);
        setData(result);
        const disciplineKeys = Object.keys(result.match_chart_data);
        setSelectedDiscipline((prev) => (prev && disciplineKeys.includes(prev) ? prev : (disciplineKeys[0] ?? null)));
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

  const documents = data ? Object.values(data.documents) : [];
  const disciplineEntries = data ? Object.entries(data.match_chart_data) : [];
  const currentDiscipline = selectedDiscipline ? data?.match_chart_data[selectedDiscipline] : undefined;

  const receiptByMonth = new Map((data?.receipts ?? []).map((r) => [r.month, r]));

  const avatarInitials = student
    ? `${student.first_name?.[0] ?? ''}${student.last_name?.[0] ?? ''}`.toUpperCase()
    : undefined;

  function openFile(relativeOrAbsoluteUrl: string) {
    if (!host) return;
    const absolute = relativeOrAbsoluteUrl.startsWith('http') ? relativeOrAbsoluteUrl : `${host}${relativeOrAbsoluteUrl}`;
    Linking.openURL(absolute).catch(() => setError('Impossibile aprire il file.'));
  }

  return (
    <View style={styles.flex}>
      <PageHeader
        eyebrow={tenantName ?? undefined}
        title={`Ciao, ${student?.first_name ?? 'atleta'}`}
        avatarInitials={avatarInitials}
      />

      <ScrollView
        contentContainerStyle={styles.container}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => load(selectedYear, { isRefresh: true })} />}
      >
        {error ? <Text style={styles.error}>{error}</Text> : null}
        {loading && !data ? <Text style={styles.muted}>Caricamento...</Text> : null}

        {data && (
          <>
            <SectionCard
              title="I tuoi documenti"
              accentColor={colors.primary}
              headerRight={
                <YearSelector year={selectedYear} canPrev={canGoPrev} canNext={canGoNext} onPrev={() => setSelectedYear((y) => y - 1)} onNext={() => setSelectedYear((y) => y + 1)} />
              }
            >
              {documents.length === 0 ? (
                <Text style={styles.muted}>Nessun documento caricato per il {selectedYear}.</Text>
              ) : (
                <>
                  <View style={styles.pillsRow}>
                    {documents.map((doc) => {
                      const style = documentTypeStyle(doc.type);
                      return (
                        <Pressable key={doc.id} style={[styles.pill, { backgroundColor: `${style.color}1a` }]} onPress={() => openFile(doc.url)}>
                          <Text style={styles.pillEmoji}>{style.emoji}</Text>
                          <Text style={[styles.pillLabel, { color: style.color }]}>{style.label}</Text>
                        </Pressable>
                      );
                    })}
                  </View>
                  {documents.map((doc) => {
                    const remaining = daysUntil(doc.expires_at);
                    if (remaining === null || remaining > 30) return null;
                    return (
                      <Text key={`expiry-${doc.id}`} style={styles.warning}>
                        ⚠ {documentTypeStyle(doc.type).label} {remaining < 0 ? 'scaduto' : `scade tra ${remaining} giorni`}
                      </Text>
                    );
                  })}
                </>
              )}
            </SectionCard>

            <SectionCard title="Prossime gare" accentColor={colors.primary}>
              {data.upcoming_competitions.length === 0 ? (
                <Text style={styles.muted}>Nessuna gara in programma al momento.</Text>
              ) : (
                <>
                  {data.upcoming_competitions.map((c) => (
                    <View key={c.id} style={styles.row}>
                      <Text style={styles.rowTitle}>{c.name}</Text>
                      <Text style={styles.rowSubtitle}>
                        {formatDate(c.event_date)}
                        {c.location ? ` · ${c.location}` : ''}
                      </Text>
                    </View>
                  ))}
                  <Pressable onPress={() => router.push('/competitions')}>
                    <Text style={styles.seeAllLink}>Vedi tutte</Text>
                  </Pressable>
                </>
              )}
            </SectionCard>

            {disciplineEntries.length > 0 && currentDiscipline && (
              <SectionCard title="Le mie gare" accentColor={colors.purple}>
                {disciplineEntries.length > 1 && (
                  <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.disciplineRow}>
                    {disciplineEntries.map(([key, discipline]) => (
                      <Pressable
                        key={key}
                        style={[styles.disciplineChip, key === selectedDiscipline && styles.disciplineChipActive]}
                        onPress={() => setSelectedDiscipline(key)}
                      >
                        <Text style={[styles.disciplineChipText, key === selectedDiscipline && styles.disciplineChipTextActive]}>
                          {discipline.label}
                        </Text>
                      </Pressable>
                    ))}
                  </ScrollView>
                )}

                <View style={styles.kpiRow}>
                  <KpiTile label="Totale" value={currentDiscipline.total} color={colors.neutralGray} />
                  <KpiTile label="Vittorie" value={currentDiscipline.wins} color={colors.green} />
                  <KpiTile label="Sconfitte" value={currentDiscipline.losses} color={colors.primary} />
                  <KpiTile label="Win-rate" value={`${currentDiscipline.win_rate}%`} color={colors.infoBlue} />
                </View>

                <MatchChart trend={currentDiscipline.trend} />
              </SectionCard>
            )}

            <SectionCard
              title="Storico pagamenti"
              accentColor={colors.green}
              headerRight={
                <YearSelector year={selectedYear} canPrev={canGoPrev} canNext={canGoNext} onPrev={() => setSelectedYear((y) => y - 1)} onNext={() => setSelectedYear((y) => y + 1)} />
              }
            >
              {data.memberships.length === 0 ? (
                <Text style={styles.muted}>Nessuna quota registrata per il {selectedYear}.</Text>
              ) : (
                data.memberships.map((m) => {
                  const receipt = receiptByMonth.get(m.month);
                  return (
                    <Pressable
                      key={m.id}
                      style={styles.row}
                      onPress={() => receipt && setReceiptModal(receipt)}
                      disabled={!receipt}
                    >
                      <View style={styles.paymentRowHeader}>
                        <Text style={styles.rowTitle}>{formatMonthLabel(m.month)}</Text>
                        {receipt && (
                          <View style={styles.receiptBadge}>
                            <Text style={styles.receiptBadgeText}>Ricevuta</Text>
                          </View>
                        )}
                      </View>
                      <Text style={styles.rowSubtitle}>
                        {formatCurrency(m.amount_paid)} · pagata il {formatDate(m.paid_at)}
                      </Text>
                    </Pressable>
                  );
                })
              )}

              {data.extra_payments.length > 0 && (
                <>
                  <Text style={styles.subHeading}>Pagamenti extra</Text>
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
                </>
              )}
            </SectionCard>
          </>
        )}
      </ScrollView>

      <Modal visible={!!receiptModal} transparent animationType="fade" onRequestClose={() => setReceiptModal(null)}>
        <View style={styles.modalBackdrop}>
          <View style={styles.modalCard}>
            <Text style={styles.modalTitle}>Ricevuta</Text>
            {receiptModal && (
              <>
                <Text style={styles.modalDetail}>
                  {formatMonthLabel(receiptModal.month)} {receiptModal.year} · {formatCurrency(receiptModal.amount)}
                </Text>
                <Text style={styles.modalDetail}>
                  {receiptModal.payment_method} · inviata il {formatDate(receiptModal.sent_at)}
                </Text>
                <Pressable
                  style={styles.modalPrimaryButton}
                  onPress={() => {
                    openFile(receiptModal.url);
                    setReceiptModal(null);
                  }}
                >
                  <Text style={styles.modalPrimaryButtonText}>Apri ricevuta</Text>
                </Pressable>
              </>
            )}
            <Pressable style={styles.modalCloseButton} onPress={() => setReceiptModal(null)}>
              <Text style={styles.modalCloseButtonText}>Chiudi</Text>
            </Pressable>
          </View>
        </View>
      </Modal>
    </View>
  );
}

function YearSelector({
  year,
  canPrev,
  canNext,
  onPrev,
  onNext,
}: {
  year: number;
  canPrev: boolean;
  canNext: boolean;
  onPrev: () => void;
  onNext: () => void;
}) {
  return (
    <View style={styles.yearRow}>
      <Pressable onPress={() => canPrev && onPrev()} disabled={!canPrev} hitSlop={8}>
        <Text style={[styles.yearButtonText, !canPrev && styles.yearButtonDisabled]}>‹</Text>
      </Pressable>
      <Text style={styles.yearLabel}>{year}</Text>
      <Pressable onPress={() => canNext && onNext()} disabled={!canNext} hitSlop={8}>
        <Text style={[styles.yearButtonText, !canNext && styles.yearButtonDisabled]}>›</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  container: { padding: 16, gap: 16, flexGrow: 1 },
  error: { color: colors.error, textAlign: 'center' },
  muted: { color: colors.textMuted, fontSize: 13 },
  yearRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  yearButtonText: { fontSize: 18, color: colors.textOnDark, fontWeight: '700' },
  yearButtonDisabled: { color: 'rgba(255,255,255,0.3)' },
  yearLabel: { fontSize: 13, fontWeight: '700', color: colors.textOnDark, minWidth: 32, textAlign: 'center' },
  row: { gap: 2, paddingVertical: 6, borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: colors.border },
  paymentRowHeader: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  rowTitle: { fontSize: 14, fontWeight: '600', color: colors.text, textTransform: 'capitalize' },
  rowSubtitle: { fontSize: 12, color: colors.textMuted },
  seeAllLink: { fontSize: 13, color: colors.primary, fontWeight: '700', marginTop: 4 },
  warning: { fontSize: 12, color: colors.warning, fontWeight: '700' },
  subHeading: { fontSize: 12, fontWeight: '700', color: colors.textMuted, marginTop: 8, textTransform: 'uppercase' },
  pillsRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  pill: { flexDirection: 'row', alignItems: 'center', gap: 6, borderRadius: 20, paddingVertical: 8, paddingHorizontal: 12 },
  pillEmoji: { fontSize: 14 },
  pillLabel: { fontSize: 12, fontWeight: '700' },
  receiptBadge: { backgroundColor: colors.purple, borderRadius: 10, paddingHorizontal: 8, paddingVertical: 2 },
  receiptBadgeText: { color: '#fff', fontSize: 10, fontWeight: '700' },
  disciplineRow: { marginBottom: 4 },
  disciplineChip: {
    borderRadius: 16,
    paddingVertical: 6,
    paddingHorizontal: 12,
    backgroundColor: colors.surfaceMuted,
    marginRight: 8,
  },
  disciplineChipActive: { backgroundColor: colors.purple },
  disciplineChipText: { fontSize: 12, fontWeight: '600', color: colors.text, textTransform: 'capitalize' },
  disciplineChipTextActive: { color: '#fff' },
  kpiRow: { flexDirection: 'row', gap: 8 },
  modalBackdrop: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', alignItems: 'center', justifyContent: 'center', padding: 24 },
  modalCard: { backgroundColor: colors.background, borderRadius: 16, padding: 20, width: '100%', gap: 8 },
  modalTitle: { fontSize: 17, fontWeight: '700', color: colors.text },
  modalDetail: { fontSize: 14, color: colors.textMuted },
  modalPrimaryButton: { backgroundColor: colors.primary, borderRadius: 8, paddingVertical: 12, alignItems: 'center', marginTop: 8 },
  modalPrimaryButtonText: { color: '#fff', fontWeight: '700' },
  modalCloseButton: { paddingVertical: 10, alignItems: 'center' },
  modalCloseButtonText: { color: colors.textMuted, fontWeight: '600' },
});
