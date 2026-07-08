import { StyleSheet, Text, View } from 'react-native';
import { Header, Screen } from '../components/HealthClanUI';
import { colors } from '../constants/healthclanDesign';

export default function Terms() {
  return (
    <Screen>
      <Header title="Terms of Use" backTo="/create-account" />
      <View style={styles.body}>
        <Text style={styles.heading}>Terms of Use</Text>
        <Text style={styles.copy}>Use HealthClan responsibly for appointments, consultations, care requests, and account management. Keep your profile details accurate and attend scheduled appointments on time.</Text>
        <Text style={styles.copy}>HealthClan is not an emergency service. For urgent medical needs, contact local emergency services immediately.</Text>
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  body: { gap: 14 },
  heading: { color: colors.teal, fontFamily: 'Poppins', fontSize: 24, fontWeight: '900' },
  copy: { color: colors.ink, fontFamily: 'Poppins', fontSize: 14, lineHeight: 23, fontWeight: '700' },
});
