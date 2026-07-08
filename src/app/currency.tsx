import { router, useFocusEffect } from 'expo-router';
import { useCallback, useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { Header, Screen } from '../components/HealthClanUI';
import { colors } from '../constants/healthclanDesign';
import { currencyOptions, getPreferredCurrency, loadBackendExchangeRates, setPreferredCurrency, type SupportedCurrency } from '../lib/currency';

export default function CurrencyPreference() {
  const [selected, setSelected] = useState<SupportedCurrency>(() => getPreferredCurrency());
  const [message, setMessage] = useState('Loading backend exchange rates...');

  useFocusEffect(
    useCallback(() => {
      setMessage('Loading backend exchange rates...');
      loadBackendExchangeRates()
        .then(payload => setMessage(`Rates updated from HealthClan${payload.updatedAt ? ` on ${new Date(payload.updatedAt).toLocaleDateString()}` : ''}.`))
        .catch(error => setMessage(error instanceof Error ? error.message : 'Using cached exchange rates.'));
    }, [])
  );

  function chooseCurrency(currency: SupportedCurrency) {
    setSelected(currency);
    setPreferredCurrency(currency);
    requestAnimationFrame(() => router.back());
  }

  return (
    <Screen>
      <Header title="Currency" backTo="/settings" />
      <View style={styles.hero}>
        <Text style={styles.title}>Display currency</Text>
        <Text style={styles.sub}>Prices are converted with backend exchange rates. Final checkout is still processed securely by HealthClan.</Text>
      </View>
      {!!message && <Text style={styles.message}>{message}</Text>}
      <View style={styles.list}>
        {currencyOptions.map(currency => {
          const active = currency.code === selected;

          return (
            <Pressable key={currency.code} style={[styles.row, active && styles.rowActive]} onPress={() => chooseCurrency(currency.code)}>
              <View style={styles.symbol}>
                <Text style={styles.symbolText}>{currency.symbol}</Text>
              </View>
              <View style={styles.copy}>
                <Text style={styles.name}>{currency.label}</Text>
                <Text style={styles.code}>{currency.code}</Text>
              </View>
              <Text style={[styles.status, active && styles.statusActive]}>{active ? 'Selected' : 'Use'}</Text>
            </Pressable>
          );
        })}
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  hero: { borderRadius: 24, backgroundColor: colors.teal, padding: 18, marginBottom: 18 },
  title: { color: colors.white, fontFamily: 'Poppins', fontSize: 24, lineHeight: 30, fontWeight: '900' },
  sub: { color: 'rgba(255,255,255,0.84)', fontFamily: 'Poppins', fontSize: 13, lineHeight: 20, fontWeight: '700', marginTop: 8 },
  list: { gap: 12 },
  message: { color: colors.teal, fontFamily: 'Poppins', fontSize: 12, lineHeight: 18, fontWeight: '800', textAlign: 'center', marginBottom: 12 },
  row: { minHeight: 74, borderRadius: 18, backgroundColor: colors.white, borderWidth: 1, borderColor: colors.line, padding: 12, flexDirection: 'row', alignItems: 'center', gap: 12 },
  rowActive: { borderColor: 'rgba(8,81,97,0.42)', backgroundColor: colors.panel },
  symbol: { width: 48, height: 48, borderRadius: 16, backgroundColor: colors.white, borderWidth: 1, borderColor: colors.line, alignItems: 'center', justifyContent: 'center' },
  symbolText: { color: colors.teal, fontFamily: 'Poppins', fontSize: 18, fontWeight: '900' },
  copy: { flex: 1, minWidth: 0 },
  name: { color: colors.ink, fontFamily: 'Poppins', fontSize: 15, fontWeight: '900' },
  code: { color: colors.muted, fontFamily: 'Poppins', fontSize: 12, fontWeight: '800', marginTop: 4 },
  status: { color: colors.teal, fontFamily: 'Poppins', fontSize: 12, fontWeight: '900' },
  statusActive: { color: '#11a26f' },
});
