import { useFonts } from 'expo-font';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import * as SystemUI from 'expo-system-ui';
import { useEffect, useState } from 'react';
import { Platform, StatusBar as NativeStatusBar, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { StripeRoot } from '../components/StripeRoot';
import { colors } from '../constants/healthclanDesign';
import { restoreSession } from '../constants/session';
import { useOfflineSync } from '../hooks/use-offline-sync';
import { loadBackendExchangeRates } from '../lib/currency';
import { registerTrustedDevice } from '../lib/device-registration';

function StatusBarBackdrop() {
  const insets = useSafeAreaInsets();

  if (insets.top <= 0) return null;

  return <View pointerEvents="none" style={[styles.statusBarBackdrop, { height: insets.top }]} />;
}

export default function RootLayout() {
  useOfflineSync();
  const [sessionReady, setSessionReady] = useState(Platform.OS === 'web');

  const [loaded] = useFonts({
    Poppins: require('../../assets/fonts/ttf/Poppins-Regular.ttf'),
  });

  useEffect(() => {
    restoreSession()
      .then(() => Promise.allSettled([
        registerTrustedDevice(),
        loadBackendExchangeRates(),
      ]))
      .finally(() => setSessionReady(true));
  }, []);

  useEffect(() => {
    SystemUI.setBackgroundColorAsync(colors.bg).catch(() => null);
    NativeStatusBar.setBarStyle('dark-content', true);

    if (Platform.OS === 'android') {
      NativeStatusBar.setBackgroundColor(colors.bg, true);
      NativeStatusBar.setTranslucent(false);
    }

    if (Platform.OS === 'web') {
      document.body.style.margin = '0';
      document.body.style.backgroundColor = colors.bg;
    }
  }, []);

  if (!loaded || !sessionReady) {
    return null;
  }

  const app = (
    <>
      <StatusBar style="dark" />
      <StatusBarBackdrop />
      <Stack screenOptions={{ headerShown: false, contentStyle: { backgroundColor: colors.bg }, animation: 'fade' }} />
    </>
  );

  return <StripeRoot>{app}</StripeRoot>;
}

const styles = StyleSheet.create({
  statusBarBackdrop: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    zIndex: 1000,
    backgroundColor: colors.bg,
  },
});
