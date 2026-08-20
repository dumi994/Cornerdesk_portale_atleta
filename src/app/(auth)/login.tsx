import { Link } from 'expo-router';
import { useState } from 'react';
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';

import { ApiError } from '@/api/client';
import { TenantHostFields } from '@/components/TenantHostFields';
import { colors } from '@/constants/colors';
import { useAuth } from '@/context/AuthContext';

export default function LoginScreen() {
  const { loginWithSlug, loginWithCustomHost } = useAuth();
  const [useCustomHost, setUseCustomHost] = useState(false);
  const [slug, setSlug] = useState('');
  const [customHost, setCustomHost] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const hostReady = useCustomHost ? customHost.trim().length > 0 : slug.trim().length > 0;
  const canSubmit = hostReady && email.trim().length > 0 && password.length > 0;

  async function handleSubmit() {
    if (!canSubmit || submitting) return;
    setSubmitting(true);
    setError(null);
    try {
      if (useCustomHost) {
        await loginWithCustomHost(customHost, email.trim(), password);
      } else {
        await loginWithSlug(slug, email.trim(), password);
      }
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Accesso non riuscito. Riprova.');
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <KeyboardAvoidingView style={styles.flex} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <ScrollView contentContainerStyle={styles.container} keyboardShouldPersistTaps="handled">
        <Text style={styles.title}>Portale Atleta</Text>
        <Text style={styles.subtitle}>Accedi con le credenziali della tua palestra.</Text>

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

        <View style={styles.field}>
          <Text style={styles.label}>Password</Text>
          <TextInput style={styles.input} placeholder="••••••••" secureTextEntry value={password} onChangeText={setPassword} />
        </View>

        {error ? <Text style={styles.error}>{error}</Text> : null}

        <Pressable
          style={[styles.submitButton, (!canSubmit || submitting) && styles.submitButtonDisabled]}
          onPress={handleSubmit}
          disabled={!canSubmit || submitting}
        >
          {submitting ? <ActivityIndicator color="#fff" /> : <Text style={styles.submitText}>Accedi</Text>}
        </Pressable>

        <Link href="/forgot-password" style={styles.forgotLink}>
          Password dimenticata?
        </Link>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  container: { flexGrow: 1, justifyContent: 'center', padding: 24, gap: 12 },
  title: { fontSize: 28, fontWeight: '700', textAlign: 'center' },
  subtitle: { fontSize: 14, color: colors.textMuted, textAlign: 'center', marginBottom: 12 },
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
  submitButton: {
    backgroundColor: colors.primary,
    borderRadius: 8,
    paddingVertical: 14,
    alignItems: 'center',
    marginTop: 8,
  },
  submitButtonDisabled: { opacity: 0.5 },
  submitText: { color: '#fff', fontWeight: '700', fontSize: 16 },
  forgotLink: { textAlign: 'center', color: colors.primary, marginTop: 16, fontSize: 14 },
});
