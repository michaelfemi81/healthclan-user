import { StyleSheet, Text, View } from 'react-native';
import { Header, Screen } from '../components/HealthClanUI';
import { colors } from '../constants/healthclanDesign';

export default function TermsConditions() {
  return (
    <Screen>
      <Header title="Terms & Conditions" backTo="/settings" />
      <View style={styles.body}>
        <View style={styles.hero}>
          <Text style={styles.heading}>Terms & Conditions</Text>
          <Text style={styles.heroCopy}>The basics for using HealthClan safely and responsibly.</Text>
        </View>
        <View style={styles.card}>
          <Text style={styles.section}>Responsible use</Text>
          <Text style={styles.copy}>Use HealthClan responsibly for appointments, consultations, care requests, payments, and account management.</Text>
        </View>
        <View style={styles.card}>
          <Text style={styles.section}>Accurate details</Text>
          <Text style={styles.copy}>Keep your profile details accurate, attend scheduled appointments on time, and use video visits in a safe private setting.</Text>
        </View>
        <View style={styles.card}>
          <Text style={styles.section}>Emergency care</Text>
          <Text style={styles.copy}>HealthClan is not an emergency service. For urgent medical needs, contact local emergency services immediately.</Text>
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
