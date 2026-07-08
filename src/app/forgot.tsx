import { router } from 'expo-router';
import { useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { Field, Header, PrimaryButton, Screen } from '../components/HealthClanUI';
import { colors } from '../constants/healthclanDesign';
import { healthclanApi } from '../lib/api';
import { isValidEmail } from '../lib/validation';

export default function Forgot() {
  const [email, setEmail] = useState('');
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(false);

  async function recover() {
    if (loading) return;

    if (!isValidEmail(email)) {
      setMessage('Enter a valid email address.');
      return;
    }

    setLoading(true);

    try {
      await healthclanApi.auth.forgotPassword(email.trim());
      setMessage('Reset instructions sent. Open the link in your email to continue.');
      router.push({
        pathname: '/password',
        params: { email: email.trim() },
      } as any);
    } catch (error) {
      setMessage(error instanceof Error ? error.message : 'Unable to send reset instructions.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <Screen>
      <Header title="Recover" backTo="/sign-in" />
      <View style={styles.form}>
        <Text style={styles.title}>Forgot Password?</Text>
        <Text style={styles.sub}>Enter your email to receive a 6-digit password reset code.</Text>
        <Field placeholder="Email" value={email} onChangeText={setEmail} />
        {!!message && <Text style={styles.message}>{message}</Text>}
        <PrimaryButton title={loading ? 'Sending...' : 'Recover'} onPress={recover} loading={loading} />
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  form: { gap: 14, alignItems: 'center' },
  title: { color: colors.ink, fontFamily: 'Poppins', fontSize: 26, fontWeight: '900' },
  sub: { color: colors.muted, fontFamily: 'Poppins', fontSize: 14, fontWeight: '700', textAlign: 'center' },
  message: { color: colors.teal, fontFamily: 'Poppins', fontSize: 12, fontWeight: '800', textAlign: 'center' },
});
