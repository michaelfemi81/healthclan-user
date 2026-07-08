import { router } from 'expo-router';
import { StyleSheet, Text, View } from 'react-native';
import { Header, Row, Screen } from '../components/HealthClanUI';
import { colors } from '../constants/healthclanDesign';

export default function HelpSupport() {
  return (
    <Screen>
      <Header title="Help & Support" backTo="/settings" />
      <View style={styles.hero}>
        <View style={styles.icon}>
          <Text style={styles.iconText}>?</Text>
        </View>
        <Text style={styles.title}>We are here to help</Text>
        <Text style={styles.sub}>Send a support request, check response expectations, or review account help when something feels off.</Text>
      </View>

      <Text style={styles.section}>Contact</Text>
      <View style={styles.list}>
        <Row title="Email Support" subtitle="Create a support request and track recent replies" onPress={() => router.push('/email-support' as any)} />
        <Row title="Response time" subtitle="Most account requests are reviewed by email within 24-48 hours." />
      </View>

      <Text style={styles.section}>Quick help</Text>
      <View style={styles.list}>
        <Row title="Appointments" subtitle="Booking, rescheduling, video visits, and doctor notes" onPress={() => router.push('/history' as any)} />
        <Row title="Payments" subtitle="Saved cards, checkout, and billing updates" onPress={() => router.push('/payment-methods' as any)} />
        <Row title="Privacy & Security" subtitle="Password, trusted devices, and data controls" onPress={() => router.push('/privacy-security' as any)} />
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  hero: { borderRadius: 24, backgroundColor: colors.teal, padding: 20, alignItems: 'center', marginBottom: 22 },
  icon: { width: 58, height: 58, borderRadius: 20, backgroundColor: 'rgba(255,255,255,0.16)', alignItems: 'center', justifyContent: 'center', marginBottom: 12 },
  iconText: { color: colors.white, fontFamily: 'Poppins', fontSize: 28, fontWeight: '900' },
  title: { color: colors.white, fontFamily: 'Poppins', fontSize: 24, lineHeight: 30, fontWeight: '900', textAlign: 'center' },
  sub: { maxWidth: 520, color: 'rgba(255,255,255,0.84)', fontFamily: 'Poppins', fontSize: 13, lineHeight: 20, fontWeight: '700', textAlign: 'center', marginTop: 8 },
  section: { color: colors.ink, fontFamily: 'Poppins', fontSize: 18, fontWeight: '900', marginBottom: 12 },
  list: { gap: 12, marginBottom: 22 },
});
