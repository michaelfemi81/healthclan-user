import { router } from 'expo-router';
import { useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { Field, Header, PrimaryButton, Screen } from '../components/HealthClanUI';
import { colors } from '../constants/healthclanDesign';
import { healthclanApi } from '../lib/api';
import { isStrongEnoughPassword } from '../lib/validation';

export default function ChangePassword() {
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [currentVisible, setCurrentVisible] = useState(false);
  const [newVisible, setNewVisible] = useState(false);
  const [confirmVisible, setConfirmVisible] = useState(false);
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(false);

  async function savePassword() {
    if (loading) return;

    if (!currentPassword || !newPassword || !confirmPassword) {
      setMessage('Fill all password fields.');
      return;
    }

    if (!isStrongEnoughPassword(newPassword)) {
      setMessage('New password must be at least 8 characters.');
      return;
    }

    if (newPassword !== confirmPassword) {
      setMessage('New password and confirmation must match.');
      return;
    }

    setLoading(true);

    try {
      await healthclanApi.users.changePassword({ currentPassword, newPassword });
      setMessage('Password updated.');
      setTimeout(() => router.replace('/settings' as any), 450);
    } catch (error) {
      setMessage(error instanceof Error ? error.message : 'Unable to update password.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <Screen>
      <Header title="Change Password" backTo="/settings" />
      <View style={styles.hero}>
        <Text style={styles.title}>Update your password</Text>
        <Text style={styles.sub}>Use a password that is at least 8 characters and different from anything you use elsewhere.</Text>
      </View>
      <View style={styles.form}>
        <Field
          placeholder="Current Password"
          secureTextEntry={!currentVisible}
          value={currentPassword}
          onChangeText={setCurrentPassword}
          rightLabel={currentVisible ? 'Hide' : 'Show'}
          onRightPress={() => setCurrentVisible(current => !current)}
        />
        <Field
          placeholder="New Password"
          secureTextEntry={!newVisible}
          value={newPassword}
          onChangeText={setNewPassword}
          rightLabel={newVisible ? 'Hide' : 'Show'}
          onRightPress={() => setNewVisible(current => !current)}
        />
        <Field
          placeholder="Confirm Password"
          secureTextEntry={!confirmVisible}
          value={confirmPassword}
          onChangeText={setConfirmPassword}
          rightLabel={confirmVisible ? 'Hide' : 'Show'}
          onRightPress={() => setConfirmVisible(current => !current)}
        />
        {message ? <Text style={styles.message}>{message}</Text> : null}
        <PrimaryButton title={loading ? 'Saving...' : 'Save Password'} onPress={savePassword} loading={loading} />
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  hero: { borderRadius: 24, backgroundColor: colors.teal, padding: 20, marginBottom: 18 },
  title: { color: colors.white, fontFamily: 'Poppins', fontSize: 24, lineHeight: 30, fontWeight: '900' },
  sub: { color: 'rgba(255,255,255,0.84)', fontFamily: 'Poppins', fontSize: 13, lineHeight: 20, fontWeight: '700', marginTop: 8 },
  form: { gap: 12, alignItems: 'center', borderRadius: 20, backgroundColor: colors.white, borderWidth: 1, borderColor: colors.line, padding: 16 },
  message: { width: '100%', maxWidth: 520, color: colors.teal, fontFamily: 'Poppins', fontSize: 12, lineHeight: 18, fontWeight: '800', textAlign: 'center' },
});
