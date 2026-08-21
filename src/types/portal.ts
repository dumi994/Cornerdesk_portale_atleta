export interface StudentSummary {
  id: number;
  first_name: string;
  last_name: string;
  email: string;
}

export interface StudentProfile extends StudentSummary {
  phone_number: string | null;
  enrollment_date: string | null;
  primary_course: CourseRef | null;
}

export interface LoginResponse {
  token: string;
  token_type: string;
  student: StudentSummary;
}

export interface CourseRef {
  id: number;
  title: string;
}

export interface Membership {
  id: number;
  month: number;
  year: number;
  amount_paid: number;
  paid_at: string | null;
}

export interface Receipt {
  id: number;
  amount: number;
  payment_method: string;
  month: number;
  year: number;
  /** ISO8601 con orario (ADR §11.3 punto 4/v1.9) — il modale ricevute mostra data E ora. */
  sent_at: string | null;
  /** Path relativo al dominio del tenant (vedi ADR §9.4) — va prefissato con l'host dell'API. */
  url: string;
  extra_amount: number | null;
  extra_note: string | null;
}

export interface ExtraPayment {
  id: number;
  amount: number;
  note: string | null;
  payment_method: string;
  paid_at: string | null;
}

export interface StudentDocument {
  id: number;
  type: string;
  issued_at: string | null;
  expires_at: string | null;
  /** Path relativo al dominio del tenant, come receipts[].url (ADR §11.6). */
  url: string;
}

export type MatchOutcome = 'win' | 'loss' | 'draw';

export interface MatchChartSeriesPoint {
  date: string;
  outcome: MatchOutcome;
  event: string | null;
}

export interface MatchChartTrendPoint {
  date: string;
  score: number;
}

export interface MatchChartDiscipline {
  label: string;
  total: number;
  wins: number;
  losses: number;
  draws: number;
  win_rate: number;
  series: MatchChartSeriesPoint[];
  trend: MatchChartTrendPoint[] | null;
}

export interface UpcomingCompetition {
  id: number;
  name: string;
  event_date: string | null;
  location: string | null;
}

export interface DashboardData {
  selected_year: number;
  enrollment_year: number | null;
  enrollment_month: number | null;
  memberships: Membership[];
  receipts: Receipt[];
  extra_payments: ExtraPayment[];
  documents: Record<string, StudentDocument>;
  match_chart_data: Record<string, MatchChartDiscipline>;
  student_courses: CourseRef[];
  upcoming_competitions: UpcomingCompetition[];
}

export interface Competition {
  id: number;
  name: string;
  event_date: string | null;
  start_time: string | null;
  end_time: string | null;
  location: string | null;
  course: CourseRef | null;
}

export interface CompetitionsResponse {
  month: number;
  year: number;
  competitions: Competition[];
}

export interface NotificationItem {
  id: number;
  title: string;
  excerpt: string;
  body: string;
  sender: string | null;
  created_at: string;
  /** Es. "2 ore fa" — calcolato lato server (Carbon::diffForHumans). */
  created_at_human: string;
  read_at: string | null;
  action_url: string | null;
  action_label: string | null;
}

export interface NotificationsResponse {
  items: NotificationItem[];
}
