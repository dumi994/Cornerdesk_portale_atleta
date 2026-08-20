import { StyleSheet, Text, View } from 'react-native';

export default function ProfilePlaceholder() {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>Profilo</Text>
      <Text style={styles.subtitle}>Implementata in feature/profile.</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 8, padding: 24 },
  title: { fontSize: 24, fontWeight: '700' },
  subtitle: { fontSize: 14, color: '#666', textAlign: 'center' },
});
