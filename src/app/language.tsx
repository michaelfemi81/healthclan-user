import { useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { Header, Row, Screen } from '../components/HealthClanUI';
import { colors } from '../constants/healthclanDesign';
import { getLanguagePreference, languageOptions, setLanguagePreference } from '../constants/preferences';
import { useStorageState } from '../constants/useStorageState';
import { useTranslation } from '../i18n/useTranslation';
import { healthclanApi } from '../lib/api';

export default function Language() {
  const [selected, setSelected] = useState(() => getLanguagePreference());
  const [, setLocale] = useStorageState('locale');
  const { t } = useTranslation();

  function chooseLanguage(language: string) {
    const locale = languageOptions.find(item => item.label === language)?.code || 'en';
    setSelected(language);
    setLanguagePreference(language);
    setLocale(locale);
    healthclanApi.users.updatePreferences({ language }).catch(() => null);
  }

  return (
    <Screen>
      <Header title={t('Language')} backTo="/settings" />
      <View style={styles.hero}>
        <Text style={styles.label}>{t('Current language')}</Text>
        <Text style={styles.title}>{selected}</Text>
        <Text style={styles.sub}>{t('languageSubtitle')}</Text>
      </View>
      <View style={styles.list}>
        {languageOptions.map(({ label }) => (
          <Row
            key={label}
            title={label}
            subtitle={selected === label ? t('Selected for this device') : t('Tap to switch language')}
            right={selected === label ? '✓' : t('Choose')}
            onPress={() => chooseLanguage(label)}
          />
        ))}
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  hero: { borderRadius: 22, backgroundColor: colors.teal, padding: 18, marginBottom: 16 },
  label: { color: 'rgba(255,255,255,0.72)', fontFamily: 'Poppins', fontSize: 12, fontWeight: '900', marginBottom: 6 },
  title: { color: colors.white, fontFamily: 'Poppins', fontSize: 26, fontWeight: '900' },
  sub: { color: 'rgba(255,255,255,0.84)', fontFamily: 'Poppins', fontSize: 13, lineHeight: 20, fontWeight: '700', marginTop: 8 },
  list: { gap: 12 },
});
