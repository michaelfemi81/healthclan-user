import { StyleSheet, Text, View } from 'react-native';
import { Header, Screen } from '../components/HealthClanUI';
import { colors } from '../constants/healthclanDesign';

export default function PrivacyPolicy() {
  return (
    <Screen>
      <Header title="Privacy Policy" backTo="/settings" />
      <View style={styles.body}>
        <View style={styles.hero}>
          <Text style={styles.heading}>Privacy Policy</Text>
          <Text style={styles.heroCopy}>How HealthClan protects your care, account, and support information.</Text>
        </View>
        <View style={styles.card}>
          <Text style={styles.section}>What we protect</Text>
          <Text style={styles.copy}>HealthClan protects your profile, appointments, care requests, payment references, preferences, and support conversations.</Text>
        </View>
        <View style={styles.card}>
          <Text style={styles.section}>How it is used</Text>
          <Text style={styles.copy}>Your information is used to coordinate care, process appointments, send important notifications, and improve account security.</Text>
        </View>
        <View style={styles.card}>
          <Text style={styles.section}>Who sees it</Text>
          <Text style={styles.copy}>Only the details needed for care coordination are shared with clinicians, carers, and support teams.</Text>
        </View>
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  body: { gap: 12 },
  hero: { borderRadius: 24, backgroundColor: colors.teal, padding: 20, marginBottom: 4 },
  heading: { color: colors.white, fontFamily: 'Poppins', fontSize: 24, lineHeight: 30, fontWeight: '900' },
  heroCopy: { color: 'rgba(255,255,255,0.84)', fontFamily: 'Poppins', fontSize: 13, lineHeight: 20, fontWeight: '700', marginTop: 8 },
  card: { borderRadius: 18, backgroundColor: colors.white, borderWidth: 1, borderColor: colors.line, padding: 16 },
  section: { color: colors.teal, fontFamily: 'Poppins', fontSize: 16, fontWeight: '900', marginBottom: 6 },
  copy: { color: colors.ink, fontFamily: 'Poppins', fontSize: 14, lineHeight: 23, fontWeight: '700' },
});
