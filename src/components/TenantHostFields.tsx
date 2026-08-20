import { useState } from 'react';
import { Pressable, StyleSheet, Text, TextInput, View } from 'react-native';

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
 * L'API non ha un host globale: ogni palestra è un sottodominio (ADR §9.1).
 * Il campo mostrato all'atleta è "Nome palestra", senza mai mostrare
 * ".cornerdesk.it" — l'app lo aggiunge internamente. L'opzione "indirizzo
 * personalizzato" (per puntare a un backend locale in sviluppo) resta
 * accessibile ma discreta, non è nella UI descritta in ADR §11.2.
 */
export function TenantHostFields({
  useCustomHost,
  onUseCustomHostChange,
  slug,
  onSlugChange,
  customHost,
  onCustomHostChange,
}: Props) {
  const [showAdvanced, setShowAdvanced] = useState(useCustomHost);

  return (
    <>
      {!useCustomHost ? (
        <View style={styles.field}>
          <Text style={styles.label}>Nome palestra</Text>
          <TextInput
            style={styles.input}
            placeholder="es. judoclubroma"
            autoCapitalize="none"
            autoCorrect={false}
            value={slug}
            onChangeText={onSlugChange}
          />
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

      {!showAdvanced ? (
        <Pressable
          onPress={() => {
            setShowAdvanced(true);
          }}
        >
          <Text style={styles.advancedLink}>Sviluppatore: usa indirizzo personalizzato</Text>
        </Pressable>
      ) : (
        <Pressable
          onPress={() => {
            onUseCustomHostChange(!useCustomHost);
          }}
        >
          <Text style={styles.advancedLink}>
            {useCustomHost ? 'Usa invece il nome palestra' : 'Usa invece un indirizzo personalizzato'}
          </Text>
        </Pressable>
      )}
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
  advancedLink: { fontSize: 12, color: colors.textMuted, textAlign: 'center', marginTop: 2 },
});
