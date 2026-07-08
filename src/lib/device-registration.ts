import { Platform } from 'react-native';
import { getApiToken, healthclanApi } from './api';

const DEVICE_ID_KEY = 'healthclan.deviceId';

function readDeviceId() {
  if (Platform.OS !== 'web') return `healthclan-${Platform.OS}`;

  try {
    const existing = globalThis.localStorage?.getItem(DEVICE_ID_KEY);
    if (existing) return existing;

    const next = `healthclan-web-${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
    globalThis.localStorage?.setItem(DEVICE_ID_KEY, next);
    return next;
  } catch {
    return 'healthclan-web';
  }
}

export function registerTrustedDevice() {
  if (!getApiToken()) return;

  const platform = Platform.OS;
  const deviceId = readDeviceId();
  const name = platform === 'web' ? 'Web browser' : `${platform} app`;

  healthclanApi.users.upsertTrustedDevice({
    deviceId,
    name,
    platform,
    isTrusted: true,
  }).catch(() => null);
}
