import { router, useFocusEffect } from 'expo-router';
import { useCallback, useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { Header, Row, Screen } from '../components/HealthClanUI';
import { colors } from '../constants/healthclanDesign';
import { getBooleanPreference, getLanguagePreference, setBooleanPreference } from '../constants/preferences';
import { signOutSession } from '../constants/session';
import { useTranslation } from '../i18n/useTranslation';
import { healthclanApi } from '../lib/api';
import { getPreferredCurrency } from '../lib/currency';

const preferenceKeys = {
  appointmentAlerts: 'healthclan.pref.appointmentAlerts',
  paymentAlerts: 'healthclan.pref.paymentAlerts',
  securityAlerts: 'healthclan.pref.securityAlerts',
};

function Toggle({ value, onPress }: { value: boolean; onPress: () => void }) {
  return (
    <Pressable style={[styles.toggle, value && styles.toggleActive]} onPress={onPress}>
      <View style={[styles.knob, value && styles.knobActive]} />
    </Pressable>
  );
}

export default function Settings() {
  const [language, setLanguage] = useState(() => getLanguagePreference());
  const [currency, setCurrency] = useState(() => getPreferredCurrency());
  const [appointmentAlerts, setAppointmentAlerts] = useState(() => getBooleanPreference(preferenceKeys.appointmentAlerts, true));
  const [paymentAlerts, setPaymentAlerts] = useState(() => getBooleanPreference(preferenceKeys.paymentAlerts, true));
  const [securityAlerts, setSecurityAlerts] = useState(() => getBooleanPreference(preferenceKeys.securityAlerts, true));
  const { t } = useTranslation();

  useFocusEffect(
    useCallback(() => {
      setLanguage(getLanguagePreference());
      setCurrency(getPreferredCurrency());
    }, [])
  );

  function togglePreference(key: string, field: string, value: boolean, setter: (value: boolean) => void) {
    const nextValue = !value;
    setter(nextValue);
    setBooleanPreference(key, nextValue);
    healthclanApi.users.updatePreferences({ [field]: nextValue }).catch(() => null);
  }

  return (
    <Screen>
      <Header title={t('Settings')} backTo="/profile" />
      <View style={styles.hero}>
        <Text style={styles.eyebrow}>HealthClan</Text>
        <Text style={styles.title}>{t('Settings')}</Text>
        <Text style={styles.sub}>{t('settingsSubtitle')}</Text>
      </View>

      <Text style={styles.section}>{t('Preferences')}</Text>
      <View style={styles.list}>
        <Row
          title={t('Language')}
          subtitle={language}
          right={t('Change')}
          onPress={() => router.push('/language' as any)}
        />
        <Row
          title="Currency"
          subtitle={currency}
          right={t('Change')}
          onPress={() => router.push('/currency' as any)}
        />
        <View style={styles.settingRow}>
          <View style={styles.settingCopy}>
            <Text style={styles.settingTitle}>{t('appointmentReminders')}</Text>
            <Text style={styles.settingSub}>{t('appointmentRemindersValue')}</Text>
          </View>
          <Toggle value={appointmentAlerts} onPress={() => togglePreference(preferenceKeys.appointmentAlerts, 'appointmentAlerts', appointmentAlerts, setAppointmentAlerts)} />
        </View>
        <View style={styles.settingRow}>
          <View style={styles.settingCopy}>
            <Text style={styles.settingTitle}>{t('Payment alerts')}</Text>
            <Text style={styles.settingSub}>{t('Card, billing, and receipt updates')}</Text>
          </View>
          <Toggle value={paymentAlerts} onPress={() => togglePreference(preferenceKeys.paymentAlerts, 'paymentAlerts', paymentAlerts, setPaymentAlerts)} />
        </View>
        <View style={styles.settingRow}>
          <View style={styles.settingCopy}>
            <Text style={styles.settingTitle}>{t('Security alerts')}</Text>
            <Text style={styles.settingSub}>{t('Password and trusted device notifications')}</Text>
          </View>
          <Toggle value={securityAlerts} onPress={() => togglePreference(preferenceKeys.securityAlerts, 'securityAlerts', securityAlerts, setSecurityAlerts)} />
        </View>
      </View>

      <Text style={styles.section}>{t('Security & Billing')}</Text>
      <View style={styles.list}>
        <Row title={t('Change Password')} subtitle={t('Update your password')} onPress={() => router.push('/change-password' as any)} />
        <Row title={t('Trusted Devices')} subtitle={t('Review signed-in devices')} onPress={() => router.push('/trusted-devices' as any)} />
        <Row title="Privacy & Security" subtitle="Permissions, trusted devices, and data controls" onPress={() => router.push('/privacy-security' as any)} />
        <Row title={t('paymentMethods')} subtitle={t('paymentMethodsValue')} onPress={() => router.push('/payment-methods' as any)} />
      </View>

      <Text style={styles.section}>Support & Legal</Text>
      <View style={styles.list}>
        <Row title="Help & Support" subtitle="Contact support and response details" onPress={() => router.push('/help-support' as any)} />
        <Row title={t('Terms & Conditions')} subtitle={t('Read app usage terms')} onPress={() => router.push('/terms-conditions' as any)} />
        <Row title={t('privacyPolicy')} subtitle={t('Read data handling details')} onPress={() => router.push('/privacy-policy' as any)} />
        <Row
          title={t('signOut')}
          subtitle={t('Return to onboarding')}
          onPress={() => {
            signOutSession();
            router.replace('/onboard' as any);
          }}
        />
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  hero: { borderRadius: 24, backgroundColor: colors.teal, padding: 18, marginBottom: 20 },
  eyebrow: { color: 'rgba(255,255,255,0.72)', fontFamily: 'Poppins', fontSize: 12, fontWeight: '900', marginBottom: 6 },
  title: { color: colors.white, fontFamily: 'Poppins', fontSize: 26, lineHeight: 32, fontWeight: '900' },
  sub: { color: 'rgba(255,255,255,0.84)', fontFamily: 'Poppins', fontSize: 13, lineHeight: 20, fontWeight: '700', marginTop: 8 },
  section: { color: colors.ink, fontFamily: 'Poppins', fontSize: 18, fontWeight: '900', marginTop: 8, marginBottom: 12 },
  list: { gap: 12, marginBottom: 18 },
  settingRow: { minHeight: 76, borderRadius: 16, backgroundColor: colors.white, borderWidth: 1, borderColor: colors.line, padding: 12, flexDirection: 'row', alignItems: 'center', gap: 12 },
  settingCopy: { flex: 1, minWidth: 0 },
  settingTitle: { color: colors.ink, fontFamily: 'Poppins', fontSize: 15, fontWeight: '800' },
  settingSub: { color: colors.muted, fontFamily: 'Poppins', fontSize: 12, lineHeight: 17, fontWeight: '600', marginTop: 3 },
  toggle: { width: 52, height: 30, borderRadius: 15, backgroundColor: colors.panel, borderWidth: 1, borderColor: colors.line, padding: 3, justifyContent: 'center' },
  toggleActive: { backgroundColor: colors.teal, borderColor: colors.teal },
  knob: { width: 22, height: 22, borderRadius: 11, backgroundColor: colors.white },
  knobActive: { transform: [{ translateX: 21 }] },
});
