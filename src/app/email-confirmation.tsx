import { router, useLocalSearchParams } from 'expo-router';
import { useEffect, useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { CodeInput, Header, PrimaryButton, Screen } from '../components/HealthClanUI';
import { colors } from '../constants/healthclanDesign';
import { getApiToken, healthclanApi } from '../lib/api';
import { digitsOnly, isValidToken } from '../lib/validation';

export default function EmailConfirmation() {
  const params = useLocalSearchParams();
  const email = typeof params.email === 'string' ? params.email : '';
  const authToken = typeof params.authToken === 'string' ? params.authToken : '';
  const [token, setToken] = useState(typeof params.token === 'string' ? digitsOnly(params.token).slice(0, 6) : '');
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const [resending, setResending] = useState(false);

  useEffect(() => {
    if (typeof params.token === 'string' && params.token !== token) {
      setToken(digitsOnly(params.token).slice(0, 6));
    }
  }, [params.token, token]);

  async function confirmEmail() {
    if (loading) return;

    if (!isValidToken(token)) {
      setMessage('Enter the confirmation token from your email.');
      return;
    }

    setLoading(true);
    setMessage('');

    try {
      await healthclanApi.auth.verifyEmail(token.trim());
      setMessage('Email confirmed. Taking you to your dashboard.');
      setTimeout(() => router.replace('/' as any), 600);
    } catch (error) {
      setMessage(error instanceof Error ? error.message : 'Unable to confirm email.');
    } finally {
      setLoading(false);
    }
  }

  async function resendToken() {
    if (resending) return;

    const tokenForResend = authToken || getApiToken();

    if (!tokenForResend) {
      setMessage('Log in after signup before requesting another confirmation token.');
      return;
    }

    setResending(true);
    setMessage('');

    try {
      const response = await healthclanApi.auth.resendVerificationEmail(tokenForResend) as { verificationEmailSent?: boolean } | undefined;
      setMessage(
        response?.verificationEmailSent === false
          ? 'The confirmation email could not be sent. Please check the email provider setup and try again.'
          : 'A new confirmation token has been sent to your email.'
      );
    } catch (error) {
      setMessage(error instanceof Error ? error.message : 'Unable to resend confirmation email.');
    } finally {
      setResending(false);
    }
  }

  return (
    <Screen>
      <Header title="Confirm Email" backTo="/create-account" />
      <View style={styles.form}>
        <Text style={styles.title}>Check your email</Text>
        <Text style={styles.sub}>
          {email
            ? `We sent a confirmation token to ${email}. Enter it below to finish setting up your account.`
            : 'Enter the confirmation token from your email to finish setting up your account.'}
        </Text>
        <CodeInput value={token} onChangeText={value => setToken(digitsOnly(value).slice(0, 6))} />
        {!!message && <Text style={styles.message}>{message}</Text>}
        <PrimaryButton title={loading ? 'Confirming...' : 'Confirm Email'} onPress={confirmEmail} loading={loading} />
        <PrimaryButton title={resending ? 'Sending...' : 'Resend Token'} onPress={resendToken} loading={resending} />
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  form: { gap: 14, alignItems: 'center' },
  title: { color: colors.ink, fontFamily: 'Poppins', fontSize: 28, fontWeight: '900', textAlign: 'center' },
  sub: { maxWidth: 430, color: colors.muted, fontFamily: 'Poppins', fontSize: 14, lineHeight: 22, fontWeight: '700', textAlign: 'center' },
  message: { maxWidth: 430, color: colors.teal, fontFamily: 'Poppins', fontSize: 12, fontWeight: '800', textAlign: 'center' },
});
