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

const MONTH_NAMES_SHORT_IT = ['Gen', 'Feb', 'Mar', 'Apr', 'Mag', 'Giu', 'Lug', 'Ago', 'Set', 'Ott', 'Nov', 'Dic'];

export function formatMonthShortLabel(month: number): string {
  return MONTH_NAMES_SHORT_IT[month - 1] ?? String(month);
}

/** "gg/mm/aaaa HH:mm" — il modale ricevute mostra data E ora (ADR §11.3 punto 4/v1.9), non solo la data. */
export function formatDateTime(isoDateTime: string | null): string {
  if (!isoDateTime) return '—';
  const date = new Date(isoDateTime);
  if (Number.isNaN(date.getTime())) return isoDateTime;
  const day = String(date.getDate()).padStart(2, '0');
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const hours = String(date.getHours()).padStart(2, '0');
  const minutes = String(date.getMinutes()).padStart(2, '0');
  return `${day}/${month}/${date.getFullYear()} ${hours}:${minutes}`;
}

/** Etichetta breve per l'asse X del grafico gare, es. "12 mar". */
export function formatShortDate(isoDate: string): string {
  const [, month, day] = isoDate.split('-').map(Number);
  if (!month || !day) return isoDate;
  return `${day} ${MONTH_NAMES_SHORT_IT[month - 1]?.toLowerCase() ?? ''}`;
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
