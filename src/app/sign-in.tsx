import { router } from 'expo-router';
import { useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { Field, Header, PrimaryButton, Screen } from '../components/HealthClanUI';
import { colors } from '../constants/healthclanDesign';
import { goHomeAfterAuth, signInSession } from '../constants/session';
import { healthclanApi } from '../lib/api';
import { registerTrustedDevice } from '../lib/device-registration';
import { isValidEmail } from '../lib/validation';

export default function SignIn() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [passwordVisible, setPasswordVisible] = useState(false);
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(false);

  async function submit() {
    if (loading) return;

    setMessage('');

    if (!isValidEmail(email)) {
      setMessage('Enter a valid email address.');
      return;
    }

    if (!password) {
      setMessage('Enter your password.');
      return;
    }

    setLoading(true);

    try {
      const response = await healthclanApi.auth.login({ email: email.trim(), password, type: 'patient' });
      signInSession(response.token);
      registerTrustedDevice();
      goHomeAfterAuth();
      router.replace('/');
    } catch (error) {
      setMessage(error instanceof Error ? error.message : 'Unable to sign in.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <Screen>
      <Header title="Login" backTo="/onboard" />
      <View style={styles.form}>
        <Text style={styles.title}>Welcome Back</Text>
        <Text style={styles.sub}>Lets get you back on track with your health goals. Please sign in to continue.</Text>
        <Field placeholder="Email" value={email} onChangeText={setEmail} />
        <Field
          placeholder="Password"
          secureTextEntry={!passwordVisible}
          value={password}
          onChangeText={setPassword}
          rightLabel={passwordVisible ? 'Hide' : 'Show'}
          onRightPress={() => setPasswordVisible(current => !current)}
        />
        {!!message && <Text style={styles.message}>{message}</Text>}
        <Pressable onPress={() => router.replace('/forgot' as any)}>
          <Text style={styles.link}>Forgot Password?  <Text style={styles.strong}>Recover</Text></Text>
        </Pressable>
        <PrimaryButton
          title={loading ? 'Logging in...' : 'Login'}
          onPress={submit}
          loading={loading}
        />
        <Pressable onPress={() => router.replace('/create-account' as any)}>
          <Text style={styles.center}>Haven't registered yet?  <Text style={styles.strong}>Signup</Text></Text>
        </Pressable>
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  form: { gap: 14, alignItems: 'center' },
  title: { color: colors.ink, fontFamily: 'Poppins', fontSize: 28, fontWeight: '900', textAlign: 'center' },
  sub: { maxWidth: 430, color: colors.muted, fontFamily: 'Poppins', fontSize: 14, lineHeight: 22, fontWeight: '700', textAlign: 'center', marginBottom: 8 },
  link: { width: '100%', maxWidth: 520, color: colors.ink, fontFamily: 'Poppins', fontSize: 12, fontWeight: '700' },
  center: { color: colors.ink, fontFamily: 'Poppins', fontSize: 12, fontWeight: '700', textAlign: 'center' },
  strong: { color: colors.teal, fontWeight: '900' },
  message: { maxWidth: 430, color: '#B42318', fontFamily: 'Poppins', fontSize: 12, fontWeight: '800', textAlign: 'center' },
});
