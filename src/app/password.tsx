import { useLocalSearchParams, router } from 'expo-router';
import { useState } from 'react';
import { Text, View } from 'react-native';
import { CodeInput, Field, Header, PrimaryButton, Screen } from '../components/HealthClanUI';
import { colors } from '../constants/healthclanDesign';
import { apiRequest } from '../lib/api';
import { digitsOnly, isStrongEnoughPassword, isValidToken } from '../lib/validation';

export default function Password() {
  const params = useLocalSearchParams();
  const email = typeof params.email === 'string' ? params.email : '';
  const [token, setToken] = useState(typeof params.token === 'string' ? digitsOnly(params.token).slice(0, 6) : '');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [passwordVisible, setPasswordVisible] = useState(false);
  const [confirmPasswordVisible, setConfirmPasswordVisible] = useState(false);
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(false);

  async function updatePassword() {
    if (loading) return;

    if (!isValidToken(token)) {
      setMessage('Enter the 6-digit reset code from your email.');
      return;
    }
    if (!isStrongEnoughPassword(password)) {
      setMessage('Password must be at least 8 characters.');
      return;
    }
    if (password !== confirmPassword) {
      setMessage('Passwords must match.');
      return;
    }

    setLoading(true);

    try {
      await apiRequest('/auth/reset-password', {
        method: 'POST',
        body: { token, password, type: 'patient' },
        offlineQueue: false,
      });
      setMessage('Password updated. You can sign in now.');
      setTimeout(() => router.replace('/sign-in' as any), 500);
    } catch (error) {
      setMessage(error instanceof Error ? error.message : 'Unable to update password.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <Screen>
      <Header title="Reset Password" backTo="/forgot" />
      <View style={{ gap: 12, alignItems: 'center' }}>
        <Text style={{ maxWidth: 430, color: colors.muted, fontFamily: 'Poppins', fontSize: 14, lineHeight: 22, fontWeight: '700', textAlign: 'center' }}>
          {email ? `Enter the 6-digit reset code sent to ${email}.` : 'Enter the 6-digit reset code from your email.'}
        </Text>
        <CodeInput value={token} onChangeText={value => setToken(digitsOnly(value).slice(0, 6))} />
        <Field
          placeholder="New Password"
          secureTextEntry={!passwordVisible}
          value={password}
          onChangeText={setPassword}
          rightLabel={passwordVisible ? 'Hide' : 'Show'}
          onRightPress={() => setPasswordVisible(current => !current)}
        />
        <Field
          placeholder="Confirm Password"
          secureTextEntry={!confirmPasswordVisible}
          value={confirmPassword}
          onChangeText={setConfirmPassword}
          rightLabel={confirmPasswordVisible ? 'Hide' : 'Show'}
          onRightPress={() => setConfirmPasswordVisible(current => !current)}
        />
        {!!message && <Text style={{ color: colors.teal, fontFamily: 'Poppins', fontSize: 12, fontWeight: '800', textAlign: 'center' }}>{message}</Text>}
        <PrimaryButton title={loading ? 'Updating...' : 'Update Password'} onPress={updatePassword} loading={loading} />
      </View>
    </Screen>
  );
}
