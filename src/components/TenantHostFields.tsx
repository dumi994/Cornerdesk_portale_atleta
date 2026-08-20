import { StyleSheet, Switch, Text, TextInput, View } from 'react-native';

import { colors } from '@/constants/colors';

interface Props {
  useCustomHost: boolean;
  onUseCustomHostChange: (value: boolean) => void;
  slug: string;
  onSlugChange: (value: string) => void;
  customHost: string;
  onCustomHostChange: (value: string) => void;
}

/**
 * L'API non ha un host globale: ogni palestra è un sottodominio
 * (ADR §9.1). Il campo "avanzato" serve a puntare a un host completo
 * (es. un backend locale in sviluppo), utile perché l'API non è mai
 * stata provata end-to-end contro un DB reale (ADR §9.6).
 */
export function TenantHostFields({
  useCustomHost,
  onUseCustomHostChange,
  slug,
  onSlugChange,
  customHost,
  onCustomHostChange,
}: Props) {
  return (
    <>
      {!useCustomHost ? (
        <View style={styles.field}>
          <Text style={styles.label}>Sottodominio palestra</Text>
          <View style={styles.slugRow}>
            <TextInput
              style={[styles.input, styles.slugInput]}
              placeholder="es. fightgym"
              autoCapitalize="none"
              autoCorrect={false}
              value={slug}
              onChangeText={onSlugChange}
            />
            <Text style={styles.slugSuffix}>.cornerdesk.it</Text>
          </View>
        </View>
      ) : (
        <View style={styles.field}>
          <Text style={styles.label}>Indirizzo del server</Text>
          <TextInput
            style={styles.input}
            placeholder="https://fightgym.cornerdesk.it"
            autoCapitalize="none"
            autoCorrect={false}
            keyboardType="url"
            value={customHost}
            onChangeText={onCustomHostChange}
          />
        </View>
      )}

      <View style={styles.switchRow}>
        <Text style={styles.switchLabel}>Usa un indirizzo personalizzato</Text>
        <Switch value={useCustomHost} onValueChange={onUseCustomHostChange} />
      </View>
    </>
  );
}

const styles = StyleSheet.create({
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
  slugRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  slugInput: { flex: 1 },
  slugSuffix: { fontSize: 14, color: colors.textMuted },
  switchRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingVertical: 4 },
  switchLabel: { fontSize: 13, color: colors.textMuted },
});
