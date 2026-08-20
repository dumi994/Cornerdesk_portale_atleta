import { useState } from 'react';
import { ActivityIndicator, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';

import { ApiError, resolveTenantHost } from '@/api/client';
import { forgotPassword, resetPassword } from '@/api/portal';
import { TenantHostFields } from '@/components/TenantHostFields';
import { colors } from '@/constants/colors';

type Mode = 'request' | 'reset';

export default function ForgotPasswordScreen() {
  const [mode, setMode] = useState<Mode>('request');
  const [useCustomHost, setUseCustomHost] = useState(false);
  const [slug, setSlug] = useState('');
  const [customHost, setCustomHost] = useState('');
  const [email, setEmail] = useState('');
  const [resetToken, setResetToken] = useState('');
  const [password, setPassword] = useState('');
  const [passwordConfirmation, setPasswordConfirmation] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);

  const hostReady = useCustomHost ? customHost.trim().length > 0 : slug.trim().length > 0;

  async function handleRequestLink() {
    if (!hostReady || email.trim().length === 0 || submitting) return;
    setSubmitting(true);
    setError(null);
    setMessage(null);
    try {
      const response = await forgotPassword(resolveTenantHost(useCustomHost, slug, customHost), email.trim());
      setMessage(response.message);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Richiesta non riuscita. Riprova.');
    } finally {
      setSubmitting(false);
    }
  }

  async function handleReset() {
    if (!hostReady || !resetToken.trim() || !email.trim() || password.length === 0 || submitting) return;
    setSubmitting(true);
    setError(null);
    setMessage(null);
    try {
      const response = await resetPassword(resolveTenantHost(useCustomHost, slug, customHost), {
        token: resetToken.trim(),
        email: email.trim(),
        password,
        password_confirmation: passwordConfirmation,
      });
      setMessage(response.message);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Reset non riuscito. Riprova.');
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <ScrollView contentContainerStyle={styles.container} keyboardShouldPersistTaps="handled">
      <View style={styles.tabRow}>
        <Pressable style={[styles.tabButton, mode === 'request' && styles.tabButtonActive]} onPress={() => setMode('request')}>
          <Text style={[styles.tabText, mode === 'request' && styles.tabTextActive]}>Richiedi link</Text>
        </Pressable>
        <Pressable style={[styles.tabButton, mode === 'reset' && styles.tabButtonActive]} onPress={() => setMode('reset')}>
          <Text style={[styles.tabText, mode === 'reset' && styles.tabTextActive]}>Ho già un codice</Text>
        </Pressable>
      </View>

      <TenantHostFields
        useCustomHost={useCustomHost}
        onUseCustomHostChange={setUseCustomHost}
        slug={slug}
        onSlugChange={setSlug}
        customHost={customHost}
        onCustomHostChange={setCustomHost}
      />

      <View style={styles.field}>
        <Text style={styles.label}>Email</Text>
        <TextInput
          style={styles.input}
          placeholder="nome@esempio.it"
          autoCapitalize="none"
          autoCorrect={false}
          keyboardType="email-address"
          value={email}
          onChangeText={setEmail}
        />
      </View>

      {mode === 'reset' && (
        <>
          <View style={styles.field}>
            <Text style={styles.label}>Codice ricevuto via email</Text>
            <TextInput style={styles.input} autoCapitalize="none" value={resetToken} onChangeText={setResetToken} />
          </View>
          <View style={styles.field}>
            <Text style={styles.label}>Nuova password</Text>
            <TextInput style={styles.input} secureTextEntry value={password} onChangeText={setPassword} />
          </View>
          <View style={styles.field}>
            <Text style={styles.label}>Conferma nuova password</Text>
            <TextInput style={styles.input} secureTextEntry value={passwordConfirmation} onChangeText={setPasswordConfirmation} />
          </View>
        </>
      )}

      {error ? <Text style={styles.error}>{error}</Text> : null}
      {message ? <Text style={styles.success}>{message}</Text> : null}

      <Pressable style={styles.submitButton} onPress={mode === 'request' ? handleRequestLink : handleReset} disabled={submitting}>
        {submitting ? (
          <ActivityIndicator color="#fff" />
        ) : (
          <Text style={styles.submitText}>{mode === 'request' ? 'Invia link' : 'Reimposta password'}</Text>
        )}
      </Pressable>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flexGrow: 1, padding: 24, gap: 12 },
  tabRow: {
    flexDirection: 'row',
    borderRadius: 8,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: colors.primary,
    marginBottom: 8,
  },
  tabButton: { flex: 1, paddingVertical: 10, alignItems: 'center' },
  tabButtonActive: { backgroundColor: colors.primary },
  tabText: { color: colors.primary, fontWeight: '600' },
  tabTextActive: { color: '#fff' },
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
  error: { color: colors.error, fontSize: 14, textAlign: 'center' },
  success: { color: colors.success, fontSize: 14, textAlign: 'center' },
  submitButton: { backgroundColor: colors.primary, borderRadius: 8, paddingVertical: 14, alignItems: 'center', marginTop: 8 },
  submitText: { color: '#fff', fontWeight: '700', fontSize: 16 },
});
