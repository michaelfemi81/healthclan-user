import { useFocusEffect } from 'expo-router';
import { useCallback, useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { Header, Screen } from '../components/HealthClanUI';
import { colors } from '../constants/healthclanDesign';
import { healthclanApi } from '../lib/api';

type TrustedDevice = {
  _id: string;
  name?: string;
  platform?: string;
  lastActiveAt?: string;
  isTrusted?: boolean;
};

function formatLastActive(value?: string) {
  if (!value) return 'Last active date unavailable';

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return 'Last active date unavailable';

  return `Last active ${date.toLocaleDateString([], { month: 'short', day: 'numeric' })} at ${date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`;
}

export default function TrustedDevices() {
  const [devices, setDevices] = useState<TrustedDevice[]>([]);
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(true);
  const [removingId, setRemovingId] = useState('');

  const loadDevices = useCallback(() => {
    setMessage('');
    setLoading(true);
    healthclanApi.users.trustedDevices()
      .then(items => setDevices(items))
      .catch(error => setMessage(error instanceof Error ? error.message : 'Unable to load trusted devices.'))
      .finally(() => setLoading(false));
  }, []);

  useFocusEffect(loadDevices);

  async function removeDevice(id: string) {
    if (!id || removingId) return;

    setRemovingId(id);
    setMessage('');

    try {
      await healthclanApi.users.removeTrustedDevice(id);
      setDevices(current => current.filter(device => device._id !== id));
    } catch (error) {
      setMessage(error instanceof Error ? error.message : 'Unable to remove device.');
    } finally {
      setRemovingId('');
    }
  }

  return (
    <Screen>
      <Header title="Trusted Devices" backTo="/settings" />
      <View style={styles.hero}>
        <Text style={styles.title}>Signed-in devices</Text>
        <Text style={styles.sub}>Review devices that can receive alerts or stay trusted on your account.</Text>
      </View>
      {!!message && <Text style={styles.error}>{message}</Text>}
      {loading ? <Text style={styles.loading}>Loading trusted devices...</Text> : null}
      <View style={styles.list}>
        {devices.map(device => (
          <View key={device._id} style={styles.card}>
            <View style={styles.icon}>
              <Text style={styles.iconText}>{(device.name || device.platform || 'D').charAt(0)}</Text>
            </View>
            <View style={styles.copy}>
              <Text style={styles.name}>{device.name || 'Unknown device'}</Text>
              <Text style={styles.meta}>{device.platform || 'Device'} | {formatLastActive(device.lastActiveAt)}</Text>
              <Text style={[styles.status, device.isTrusted === false && styles.statusWarn]}>
                {device.isTrusted === false ? 'Review needed' : 'Trusted'}
              </Text>
            </View>
            <Pressable style={styles.remove} onPress={() => removeDevice(device._id)}>
              <Text style={styles.removeText}>{removingId === device._id ? '...' : 'Remove'}</Text>
            </Pressable>
          </View>
        ))}
      {!loading && devices.length === 0 ? (
          <View style={styles.empty}>
            <View style={styles.emptyIcon}>
              <Text style={styles.emptyIconText}>D</Text>
            </View>
            <Text style={styles.emptyTitle}>No trusted devices yet</Text>
            <Text style={styles.emptySub}>Devices will appear here after they are registered by the app. You can remove old devices from this page anytime.</Text>
          </View>
        ) : null}
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  hero: { borderRadius: 22, backgroundColor: colors.teal, padding: 16, marginBottom: 14 },
  title: { color: colors.white, fontFamily: 'Poppins', fontSize: 22, fontWeight: '900' },
  sub: { color: 'rgba(255,255,255,0.82)', fontFamily: 'Poppins', fontSize: 13, lineHeight: 20, fontWeight: '700', marginTop: 6 },
  list: { gap: 12 },
  card: { minHeight: 86, borderRadius: 18, backgroundColor: colors.white, borderWidth: 1, borderColor: colors.line, padding: 12, flexDirection: 'row', alignItems: 'center', gap: 12 },
  icon: { width: 48, height: 48, borderRadius: 16, backgroundColor: colors.panel, alignItems: 'center', justifyContent: 'center' },
  iconText: { color: colors.teal, fontFamily: 'Poppins', fontSize: 18, fontWeight: '900', textTransform: 'uppercase' },
  copy: { flex: 1, minWidth: 0 },
  name: { color: colors.ink, fontFamily: 'Poppins', fontSize: 15, fontWeight: '900' },
  meta: { color: colors.muted, fontFamily: 'Poppins', fontSize: 12, lineHeight: 17, fontWeight: '700', marginTop: 3 },
  status: { color: '#11a26f', fontFamily: 'Poppins', fontSize: 12, fontWeight: '900', marginTop: 4 },
  statusWarn: { color: '#B42318' },
  remove: { minHeight: 38, borderRadius: 999, backgroundColor: colors.panel, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 12 },
  removeText: { color: colors.teal, fontFamily: 'Poppins', fontSize: 12, fontWeight: '900' },
  empty: { borderRadius: 18, backgroundColor: colors.white, borderWidth: 1, borderColor: colors.line, padding: 20, alignItems: 'center' },
  emptyIcon: { width: 54, height: 54, borderRadius: 18, backgroundColor: colors.panel, alignItems: 'center', justifyContent: 'center', marginBottom: 10 },
  emptyIconText: { color: colors.teal, fontFamily: 'Poppins', fontSize: 20, fontWeight: '900' },
  emptyTitle: { color: colors.ink, fontFamily: 'Poppins', fontSize: 16, fontWeight: '900', textAlign: 'center' },
  emptySub: { color: colors.muted, fontFamily: 'Poppins', fontSize: 12, lineHeight: 18, fontWeight: '700', textAlign: 'center', marginTop: 4 },
  error: { color: '#B42318', fontFamily: 'Poppins', fontSize: 12, fontWeight: '800', marginBottom: 12, textAlign: 'center' },
  loading: { color: colors.muted, fontFamily: 'Poppins', fontSize: 12, fontWeight: '800', marginBottom: 12, textAlign: 'center' },
});
