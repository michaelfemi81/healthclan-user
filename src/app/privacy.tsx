import { StyleSheet, Text, View } from 'react-native';
import { Header, Screen } from '../components/HealthClanUI';
import { colors } from '../constants/healthclanDesign';

export default function Privacy() {
  return (
    <Screen>
      <Header title="Privacy Policy" backTo="/create-account" />
      <View style={styles.body}>
        <Text style={styles.heading}>Privacy Policy</Text>
        <Text style={styles.copy}>HealthClan protects your account, care preferences, appointment details, and support requests. Your information is used to connect you with trusted care providers and improve your care experience.</Text>
        <Text style={styles.copy}>Only the details needed for care coordination should be shared with clinicians, carers, and support teams.</Text>
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  body: { gap: 14 },
  heading: { color: colors.teal, fontFamily: 'Poppins', fontSize: 24, fontWeight: '900' },
  copy: { color: colors.ink, fontFamily: 'Poppins', fontSize: 14, lineHeight: 23, fontWeight: '700' },
});
