// Palette reale del Portale Atleta (ADR §11.1) — non un tema generico.
export const colors = {
  navyStart: '#1a1a2e',
  navyEnd: '#15215a',
  primary: '#dc3545', // rosso brand — accento principale (stesso rosso del manifest PWA)
  purple: '#6f42c1', // accento "Le mie gare"
  green: '#22c55e', // avatar utente, accento "Storico pagamenti"
  infoBlue: '#3b82f6', // solo KPI "Win-rate" in "Le mie gare" (ADR §11.3.3)
  neutralGray: '#6b7280', // solo KPI "Totale" in "Le mie gare"
  text: '#1a1a1a',
  textMuted: '#666666',
  textOnDark: 'rgba(255,255,255,0.94)',
  textOnDarkMuted: 'rgba(255,255,255,0.7)',
  border: '#e2e5ea',
  background: '#ffffff',
  surfaceMuted: '#f5f6f8',
  error: '#dc3545',
  success: '#22c55e',
  warning: '#b8860b',

  // Grafico "Le mie gare" (Chart.js match-results-chart.js, ADR §11.3 punto 3/v1.8) —
  // colori verificati nel sorgente, DIVERSI dall'accento viola della sezione che lo contiene.
  chartLine: 'rgba(30,41,59,1)',
  chartFill: 'rgba(30,41,59,0.08)',
  chartWin: 'rgba(40,167,69,1)',
  chartLoss: 'rgba(220,53,69,1)',
  chartDraw: 'rgba(108,117,125,1)',

  // Griglia pagamenti a 12 mesi (ADR §11.3 punto 4/v1.6) — il rosso "non pagato" è
  // leggermente diverso dal rosso brand (#dc3545), verificato nel CSS sorgente.
  unpaidDot: '#ef4444',
  receiptBadgeGradientStart: '#667eea',
  receiptBadgeGradientEnd: '#764ba2',
};

// Colori/icone per tipo di documento (ADR §11.3.1) — badge cliccabili nella card "I tuoi documenti".
export const documentTypeStyles: Record<string, { color: string; emoji: string; label: string }> = {
  medical_certificate: { color: '#06b6d4', emoji: '🩺', label: 'Certificato Medico' },
  parental_authorization: { color: '#eab308', emoji: '👪', label: 'Autorizzazione Genitoriale' },
  enrollment_form: { color: '#22c55e', emoji: '📋', label: 'Modulo Iscrizione' },
  liability_release: { color: '#dc3545', emoji: '📄', label: 'Liberatoria' },
  medical_history: { color: '#6b7280', emoji: '📝', label: 'Scheda Anamnestica' },
};

export function documentTypeStyle(type: string) {
  return (
    documentTypeStyles[type] ?? {
      color: '#6b7280',
      emoji: '📄',
      label: type.replace(/_/g, ' ').replace(/^./, (c) => c.toUpperCase()),
    }
  );
}
