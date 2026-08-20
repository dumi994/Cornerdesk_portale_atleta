import { useCallback, useEffect, useState } from 'react';
import { ActivityIndicator, Alert, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';

import { ApiError } from '@/api/client';
import { fetchMe, updatePassword } from '@/api/portal';
import { Card } from '@/components/Card';
import { PageHeader } from '@/components/PageHeader';
import { colors } from '@/constants/colors';
import { useAuth } from '@/context/AuthContext';
import type { StudentProfile } from '@/types/portal';
import { formatDate } from '@/utils/format';

export default function ProfileScreen() {
  const { host, token, logout } = useAuth();
  const [profile, setProfile] = useState<StudentProfile | null>(null);
  const [loadingProfile, setLoadingProfile] = useState(true);
  const [profileError, setProfileError] = useState<string | null>(null);

  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [newPasswordConfirmation, setNewPasswordConfirmation] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [passwordError, setPasswordError] = useState<string | null>(null);
  const [passwordSuccess, setPasswordSuccess] = useState<string | null>(null);
  const [loggingOut, setLoggingOut] = useState(false);

  const loadProfile = useCallback(async () => {
    if (!host || !token) return;
    setLoadingProfile(true);
    setProfileError(null);
    try {
      const result = await fetchMe(host, token);
      setProfile(result);
    } catch (err) {
      setProfileError(err instanceof ApiError ? err.message : 'Impossibile caricare il profilo.');
    } finally {
      setLoadingProfile(false);
    }
  }, [host, token]);

  useEffect(() => {
    loadProfile();
  }, [loadProfile]);

  const canSubmitPassword =
    currentPassword.length > 0 && newPassword.length >= 6 && newPassword === newPasswordConfirmation;

  async function handleChangePassword() {
    if (!host || !token || !canSubmitPassword || submitting) return;
    setSubmitting(true);
    setPasswordError(null);
    setPasswordSuccess(null);
    try {
      const response = await updatePassword(host, token, {
        current_password: currentPassword,
        new_password: newPassword,
        new_password_confirmation: newPasswordConfirmation,
      });
      setPasswordSuccess(response.message);
      setCurrentPassword('');
      setNewPassword('');
      setNewPasswordConfirmation('');
    } catch (err) {
      if (err instanceof ApiError) {
        const firstFieldError = err.errors ? Object.values(err.errors)[0]?.[0] : undefined;
        setPasswordError(firstFieldError ?? err.message);
      } else {
        setPasswordError('Aggiornamento non riuscito. Riprova.');
      }
    } finally {
      setSubmitting(false);
    }
  }

  function handleLogout() {
    Alert.alert('Esci', 'Vuoi disconnettere questo device dal Portale Atleta?', [
      { text: 'Annulla', style: 'cancel' },
      {
        text: 'Esci',
        style: 'destructive',
        onPress: async () => {
          setLoggingOut(true);
          await logout();
        },
      },
    ]);
  }

  return (
    <View style={styles.flex}>
      <PageHeader title="Profilo" icon="👤" />
      <ScrollView contentContainerStyle={styles.container}>
      {loadingProfile && !profile ? <ActivityIndicator style={styles.spacingTop} /> : null}
      {profileError ? <Text style={styles.error}>{profileError}</Text> : null}

      {profile && (
        <Card title="I tuoi dati">
          <Text style={styles.name}>
            {profile.first_name} {profile.last_name}
          </Text>
          <Text style={styles.detail}>{profile.email}</Text>
          {profile.phone_number && <Text style={styles.detail}>{profile.phone_number}</Text>}
          {profile.enrollment_date && <Text style={styles.detail}>Iscritto dal {formatDate(profile.enrollment_date)}</Text>}
          {profile.primary_course && <Text style={styles.detail}>Corso principale: {profile.primary_course.title}</Text>}
        </Card>
      )}

      <Card title="Cambia password">
        <View style={styles.field}>
          <Text style={styles.label}>Password attuale</Text>
          <TextInput style={styles.input} secureTextEntry value={currentPassword} onChangeText={setCurrentPassword} />
        </View>
        <View style={styles.field}>
          <Text style={styles.label}>Nuova password</Text>
          <TextInput style={styles.input} secureTextEntry value={newPassword} onChangeText={setNewPassword} />
        </View>
        <View style={styles.field}>
          <Text style={styles.label}>Conferma nuova password</Text>
          <TextInput
            style={styles.input}
            secureTextEntry
            value={newPasswordConfirmation}
            onChangeText={setNewPasswordConfirmation}
          />
        </View>

        {passwordError ? <Text style={styles.error}>{passwordError}</Text> : null}
        {passwordSuccess ? <Text style={styles.success}>{passwordSuccess}</Text> : null}

        <Pressable
          style={[styles.submitButton, (!canSubmitPassword || submitting) && styles.submitButtonDisabled]}
          onPress={handleChangePassword}
          disabled={!canSubmitPassword || submitting}
        >
          {submitting ? <ActivityIndicator color="#fff" /> : <Text style={styles.submitText}>Aggiorna password</Text>}
        </Pressable>
      </Card>

      <Pressable style={styles.logoutButton} onPress={handleLogout} disabled={loggingOut}>
        {loggingOut ? <ActivityIndicator color={colors.error} /> : <Text style={styles.logoutText}>Esci</Text>}
      </Pressable>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  container: { padding: 16, gap: 16, flexGrow: 1 },
  spacingTop: { marginTop: 24 },
  error: { color: colors.error, fontSize: 13, textAlign: 'center' },
  success: { color: colors.success, fontSize: 13, textAlign: 'center' },
  name: { fontSize: 18, fontWeight: '700', color: colors.text },
  detail: { fontSize: 13, color: colors.textMuted },
  field: { gap: 4 },
  label: { fontSize: 13, color: colors.text, fontWeight: '600' },
  input: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 15,
  },
  submitButton: { backgroundColor: colors.primary, borderRadius: 8, paddingVertical: 12, alignItems: 'center', marginTop: 4 },
  submitButtonDisabled: { opacity: 0.5 },
  submitText: { color: '#fff', fontWeight: '700', fontSize: 15 },
  logoutButton: {
    borderWidth: 1,
    borderColor: colors.error,
    borderRadius: 8,
    paddingVertical: 12,
    alignItems: 'center',
  },
  logoutText: { color: colors.error, fontWeight: '700', fontSize: 15 },
});
