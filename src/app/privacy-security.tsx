import { router } from 'expo-router';
import { StyleSheet, Text, View } from 'react-native';
import { Header, Row, Screen } from '../components/HealthClanUI';
import { colors } from '../constants/healthclanDesign';

export default function PrivacySecurity() {
  return (
    <Screen>
      <Header title="Privacy & Security" backTo="/settings" />
      <View style={styles.hero}>
        <Text style={styles.eyebrow}>Account protection</Text>
        <Text style={styles.title}>Keep your HealthClan account secure</Text>
        <Text style={styles.sub}>Review devices, update your password, and read how your health and account information is handled.</Text>
      </View>
      <Text style={styles.section}>Security controls</Text>
      <View style={styles.list}>
        <Row title="Trusted Devices" subtitle="Review signed-in devices" onPress={() => router.push('/trusted-devices' as any)} />
        <Row title="Change Password" subtitle="Update account password" onPress={() => router.push('/change-password' as any)} />
      </View>
      <Text style={styles.section}>Data and privacy</Text>
      <View style={styles.list}>
        <Row title="Privacy Policy" subtitle="Read data handling details" onPress={() => router.push('/privacy-policy' as any)} />
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  hero: { borderRadius: 24, backgroundColor: colors.teal, padding: 20, marginBottom: 22 },
  eyebrow: { color: 'rgba(255,255,255,0.72)', fontFamily: 'Poppins', fontSize: 12, fontWeight: '900', marginBottom: 6 },
  title: { color: colors.white, fontFamily: 'Poppins', fontSize: 24, lineHeight: 30, fontWeight: '900' },
  sub: { color: 'rgba(255,255,255,0.84)', fontFamily: 'Poppins', fontSize: 13, lineHeight: 20, fontWeight: '700', marginTop: 8 },
  section: { color: colors.ink, fontFamily: 'Poppins', fontSize: 18, fontWeight: '900', marginBottom: 12 },
  list: { gap: 12, marginBottom: 22 },
});
