const MONTH_NAMES_IT = [
  'gennaio',
  'febbraio',
  'marzo',
  'aprile',
  'maggio',
  'giugno',
  'luglio',
  'agosto',
  'settembre',
  'ottobre',
  'novembre',
  'dicembre',
];

export function formatDate(isoDate: string | null): string {
  if (!isoDate) return '—';
  const [year, month, day] = isoDate.split('-').map(Number);
  if (!year || !month || !day) return isoDate;
  return `${day} ${MONTH_NAMES_IT[month - 1]} ${year}`;
}

export function formatMonthLabel(month: number): string {
  return MONTH_NAMES_IT[month - 1] ?? String(month);
}

export function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('it-IT', { style: 'currency', currency: 'EUR' }).format(amount);
}

/** Giorni mancanti a una data ISO (negativo se già passata). */
export function daysUntil(isoDate: string | null): number | null {
  if (!isoDate) return null;
  const target = new Date(`${isoDate}T00:00:00`);
  const now = new Date();
  now.setHours(0, 0, 0, 0);
  return Math.round((target.getTime() - now.getTime()) / 86_400_000);
}

const DOCUMENT_TYPE_LABELS: Record<string, string> = {
  medical_certificate: 'Certificato medico',
};

export function documentTypeLabel(type: string): string {
  return DOCUMENT_TYPE_LABELS[type] ?? type.replace(/_/g, ' ').replace(/^./, (c) => c.toUpperCase());
}
