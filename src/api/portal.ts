import { apiFetch } from '@/api/client';
import type {
  CompetitionsResponse,
  DashboardData,
  LoginResponse,
  NotificationItem,
  NotificationsResponse,
  StudentProfile,
} from '@/types/portal';

export function login(host: string, email: string, password: string, deviceName?: string) {
  return apiFetch<LoginResponse>(host, '/login', {
    method: 'POST',
    body: { email, password, device_name: deviceName },
  });
}

export function logout(host: string, token: string) {
  return apiFetch<{ message: string }>(host, '/logout', { method: 'POST', token });
}

export function forgotPassword(host: string, email: string) {
  return apiFetch<{ message: string }>(host, '/password/forgot', { method: 'POST', body: { email } });
}

export function resetPassword(
  host: string,
  params: { token: string; email: string; password: string; password_confirmation: string }
) {
  return apiFetch<{ message: string }>(host, '/password/reset', { method: 'POST', body: params });
}

export function fetchMe(host: string, token: string) {
  return apiFetch<StudentProfile>(host, '/me', { token });
}

export function fetchDashboard(host: string, token: string, year?: number) {
  return apiFetch<DashboardData>(host, '/dashboard', { token, query: { year } });
}

export function fetchCompetitions(host: string, token: string, month?: number, year?: number) {
  return apiFetch<CompetitionsResponse>(host, '/competitions', { token, query: { month, year } });
}

export function updatePassword(
  host: string,
  token: string,
  params: { current_password: string; new_password: string; new_password_confirmation: string }
) {
  return apiFetch<{ message: string }>(host, '/password', { method: 'POST', token, body: params });
}

export function fetchNotifications(host: string, token: string) {
  return apiFetch<NotificationsResponse>(host, '/notifications', { token });
}

export function fetchUnreadCount(host: string, token: string) {
  return apiFetch<{ count: number }>(host, '/notifications/unread-count', { token });
}

export function markNotificationRead(host: string, token: string, id: number) {
  return apiFetch<{ item: NotificationItem }>(host, `/notifications/${id}/read`, { method: 'POST', token });
}
