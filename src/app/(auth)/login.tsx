import { LinearGradient } from 'expo-linear-gradient';
import { Link } from 'expo-router';
import { useEffect, useState } from 'react';
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

import { ApiError, clearSession, loadLastTenant, type LastTenant } from '@/api/client';
import { TenantHostFields } from '@/components/TenantHostFields';
import { colors } from '@/constants/colors';
import { useAuth } from '@/context/AuthContext';

export default function LoginScreen() {
  const { loginWithSlug, loginWithCustomHost } = useAuth();
  const [checkingLastTenant, setCheckingLastTenant] = useState(true);
  const [lastTenant, setLastTenant] = useState<LastTenant | null>(null);
  const [useCustomHost, setUseCustomHost] = useState(false);
  const [slug, setSlug] = useState('');
  const [customHost, setCustomHost] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [rememberMe, setRememberMe] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    (async () => {
      const tenant = await loadLastTenant();
      setLastTenant(tenant);
      setCheckingLastTenant(false);
    })();
  }, []);

  const hostReady = lastTenant ? true : useCustomHost ? customHost.trim().length > 0 : slug.trim().length > 0;
  const canSubmit = hostReady && email.trim().length > 0 && password.length > 0;

  async function handleSubmit() {
    if (!canSubmit || submitting) return;
    setSubmitting(true);
    setError(null);
    try {
      if (lastTenant) {
        if (lastTenant.isCustomHost) {
          await loginWithCustomHost(lastTenant.host, email.trim(), password);
        } else {
          await loginWithSlug(lastTenant.displayName, email.trim(), password);
        }
      } else if (useCustomHost) {
        await loginWithCustomHost(customHost, email.trim(), password);
      } else {
        await loginWithSlug(slug, email.trim(), password);
      }
      if (!rememberMe) {
        // "Ricordami" deselezionato: resta autenticato per questa sessione
        // dell'app, ma non al prossimo avvio — il token non viene persistito.
        await clearSession();
      }
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Accesso non riuscito. Riprova.');
    } finally {
      setSubmitting(false);
    }
  }

  const title = lastTenant?.displayName || 'Portale Atleta';
  const subtitle = lastTenant ? 'Portale Atleta' : 'Accedi con le credenziali della tua palestra';

  return (
    <LinearGradient colors={[colors.navyStart, colors.navyEnd]} style={styles.flex}>
      <KeyboardAvoidingView style={styles.flex} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <ScrollView contentContainerStyle={styles.container} keyboardShouldPersistTaps="handled">
          <View style={styles.card}>
            <View style={styles.iconCircle}>
              <Text style={styles.iconGlyph}>🔐</Text>
            </View>
            <Text style={styles.title}>{title}</Text>
            <Text style={styles.subtitle}>{subtitle}</Text>

            {checkingLastTenant ? (
              <ActivityIndicator style={styles.spacingTop} />
            ) : lastTenant ? (
              <View style={styles.tenantRow}>
                <Text style={styles.tenantLabel}>
                  Palestra: <Text style={styles.tenantValue}>{lastTenant.displayName}</Text>
                </Text>
                <Pressable
                  onPress={() => {
                    setLastTenant(null);
                  }}
                >
                  <Text style={styles.changeTenantLink}>Non è la tua palestra?</Text>
                </Pressable>
              </View>
            ) : (
              <TenantHostFields
                useCustomHost={useCustomHost}
                onUseCustomHostChange={setUseCustomHost}
                slug={slug}
                onSlugChange={setSlug}
                customHost={customHost}
                onCustomHostChange={setCustomHost}
              />
            )}

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
              <TextInput
                style={styles.input}
                placeholder="••••••••"
                secureTextEntry
                value={password}
                onChangeText={setPassword}
              />
            </View>

            <View style={styles.optionsRow}>
              <Pressable style={styles.rememberRow} onPress={() => setRememberMe((v) => !v)}>
                <View style={[styles.checkbox, rememberMe && styles.checkboxChecked]}>
                  {rememberMe && <Text style={styles.checkboxMark}>✓</Text>}
                </View>
                <Text style={styles.rememberLabel}>Ricordami</Text>
              </Pressable>
              <Link href="/forgot-password" style={styles.forgotLink}>
                Password dimenticata?
              </Link>
            </View>

            {error ? <Text style={styles.error}>{error}</Text> : null}

            <Pressable
              style={[styles.submitButton, (!canSubmit || submitting) && styles.submitButtonDisabled]}
              onPress={handleSubmit}
              disabled={!canSubmit || submitting}
            >
              {submitting ? <ActivityIndicator color="#fff" /> : <Text style={styles.submitText}>Accedi</Text>}
            </Pressable>

            <Text style={styles.footer}>Problemi di accesso? Contatta la segreteria.</Text>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  container: { flexGrow: 1, justifyContent: 'center', padding: 24 },
  card: {
    backgroundColor: colors.background,
    borderRadius: 20,
    padding: 24,
    gap: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 20,
    elevation: 4,
  },
  iconCircle: {
    alignSelf: 'center',
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: '#ede7f6',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 4,
  },
  iconGlyph: { fontSize: 28 },
  title: { fontSize: 22, fontWeight: '700', textAlign: 'center', color: colors.text, textTransform: 'capitalize' },
  subtitle: { fontSize: 13, color: colors.textMuted, textAlign: 'center', marginBottom: 8 },
  spacingTop: { marginTop: 8 },
  tenantRow: { alignItems: 'center', gap: 4, marginBottom: 4 },
  tenantLabel: { fontSize: 13, color: colors.textMuted },
  tenantValue: { fontWeight: '700', color: colors.text, textTransform: 'capitalize' },
  changeTenantLink: { fontSize: 12, color: colors.purple, fontWeight: '600' },
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
  optionsRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: 2 },
  rememberRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  checkbox: {
    width: 18,
    height: 18,
    borderRadius: 4,
    borderWidth: 1.5,
    borderColor: colors.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkboxChecked: { backgroundColor: colors.primary, borderColor: colors.primary },
  checkboxMark: { color: '#fff', fontSize: 12, fontWeight: '700' },
  rememberLabel: { fontSize: 13, color: colors.textMuted },
  forgotLink: { fontSize: 13, color: colors.purple, fontWeight: '600' },
  error: { color: colors.error, fontSize: 14, textAlign: 'center' },
  submitButton: {
    backgroundColor: '#111111',
    borderRadius: 8,
    paddingVertical: 14,
    alignItems: 'center',
    marginTop: 4,
  },
  submitButtonDisabled: { opacity: 0.5 },
  submitText: { color: '#fff', fontWeight: '700', fontSize: 16 },
  footer: { fontSize: 11, color: colors.textMuted, textAlign: 'center', marginTop: 4 },
});
