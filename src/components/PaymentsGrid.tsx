import { LinearGradient } from 'expo-linear-gradient';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { colors } from '@/constants/colors';
import type { Membership, Receipt } from '@/types/portal';
import { formatCurrency, formatMonthShortLabel } from '@/utils/format';

const now = new Date();
const CURRENT_YEAR = now.getFullYear();
const CURRENT_MONTH = now.getMonth() + 1;

type MonthStatus = 'paid' | 'unpaid' | 'neutral';

interface Props {
  year: number;
  enrollmentYear: number | null;
  enrollmentMonth: number | null;
  memberships: Membership[];
  receipts: Receipt[];
  onSelectMonth: (month: number) => void;
}

/**
 * Griglia di 12 mesi (ADR §11.3 punto 4/v1.6) — non una lista di pagamenti:
 * il web (`dashboard.blade.php`) mostra una card per mese con un pallino
 * colorato (verde pagato, rosso non pagato, grigio futuro/pre-iscrizione),
 * importo se pagato, badge ricevute — 3 colonne su schermo telefono.
 */
export function PaymentsGrid({ year, enrollmentYear, enrollmentMonth, memberships, receipts, onSelectMonth }: Props) {
  const membershipByMonth = new Map(memberships.map((m) => [m.month, m]));
  const receiptCountByMonth = new Map<number, number>();
  for (const r of receipts) {
    receiptCountByMonth.set(r.month, (receiptCountByMonth.get(r.month) ?? 0) + 1);
  }

  function statusFor(month: number): MonthStatus {
    const isPreEnrollment = !!enrollmentYear && (year < enrollmentYear || (year === enrollmentYear && month < (enrollmentMonth ?? 1)));
    const isFuture = year > CURRENT_YEAR || (year === CURRENT_YEAR && month > CURRENT_MONTH);
    if (membershipByMonth.has(month)) return 'paid';
    if (isPreEnrollment || isFuture) return 'neutral';
    return 'unpaid';
  }

  return (
    <View>
      <View style={styles.grid}>
        {Array.from({ length: 12 }, (_, i) => i + 1).map((month) => {
          const status = statusFor(month);
          const membership = membershipByMonth.get(month);
          const receiptCount = receiptCountByMonth.get(month) ?? 0;
          const dotColor = status === 'paid' ? colors.success : status === 'unpaid' ? colors.unpaidDot : colors.border;

          return (
            <Pressable
              key={month}
              style={styles.cell}
              onPress={() => status === 'paid' && onSelectMonth(month)}
              disabled={status !== 'paid'}
            >
              <Text style={styles.monthLabel}>{formatMonthShortLabel(month)}</Text>

              <View style={styles.dotWrapper}>
                {status !== 'neutral' && <View style={[styles.dotGlow, { backgroundColor: dotColor }]} />}
                <View style={[styles.dot, { backgroundColor: dotColor }]} />
              </View>

              {status === 'paid' && membership && <Text style={styles.amount}>{formatCurrency(membership.amount_paid)}</Text>}

              {receiptCount > 0 && (
                <LinearGradient
                  colors={[colors.receiptBadgeGradientStart, colors.receiptBadgeGradientEnd]}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 1 }}
                  style={styles.receiptBadge}
                >
                  <Text style={styles.receiptBadgeText}>🧾 {receiptCount}</Text>
                </LinearGradient>
              )}
            </Pressable>
          );
        })}
      </View>

      <View style={styles.legend}>
        <LegendItem color={colors.success} label="Pagato" />
        <LegendItem color={colors.unpaidDot} label="Non pagato" />
        <LegendItem color={colors.border} label="Futuro / Pre-iscrizione" />
      </View>
    </View>
  );
}

function LegendItem({ color, label }: { color: string; label: string }) {
  return (
    <View style={styles.legendItem}>
      <View style={[styles.legendDot, { backgroundColor: color }]} />
      <Text style={styles.legendLabel}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  cell: {
    width: '31%',
    alignItems: 'center',
    gap: 4,
    paddingVertical: 10,
    borderRadius: 12,
    backgroundColor: colors.surfaceMuted,
  },
  monthLabel: { fontSize: 12, fontWeight: '700', color: colors.text },
  dotWrapper: { width: 20, height: 20, alignItems: 'center', justifyContent: 'center' },
  dotGlow: { position: 'absolute', width: 20, height: 20, borderRadius: 10, opacity: 0.25 },
  dot: { width: 10, height: 10, borderRadius: 5 },
  amount: { fontSize: 11, fontWeight: '700', color: colors.success },
  receiptBadge: { borderRadius: 10, paddingHorizontal: 6, paddingVertical: 2, marginTop: 2 },
  receiptBadgeText: { fontSize: 9, fontWeight: '700', color: '#fff' },
  legend: { flexDirection: 'row', flexWrap: 'wrap', gap: 12, marginTop: 12, justifyContent: 'center' },
  legendItem: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  legendDot: { width: 8, height: 8, borderRadius: 4 },
  legendLabel: { fontSize: 10, color: colors.textMuted },
});
