import { Platform } from 'react-native';
import * as FileSystem from 'expo-file-system/legacy';
import { setApiToken } from '../lib/api';

const AUTH_KEY = 'healthclan.authenticated';
const ONBOARD_KEY = 'healthclan.onboarded';
const LEGACY_AUTH_KEY = 'auth';
const LEGACY_ONBOARD_KEY = 'onboard';
const LEGACY_TOKEN_KEY = 'user_token';

const memoryStore = new Map<string, string>();
const NATIVE_SESSION_FILE = `${FileSystem.documentDirectory || ''}healthclan-session.json`;

type NativeSessionPayload = Record<string, string>;

function read(key: string) {
  if (Platform.OS === 'web') {
    try {
      return globalThis.localStorage?.getItem(key) ?? null;
    } catch {
      return null;
    }
  }

  return memoryStore.get(key) ?? null;
}

function write(key: string, value: string | null) {
  if (Platform.OS === 'web') {
    try {
      if (value === null) {
        globalThis.localStorage?.removeItem(key);
      } else {
        globalThis.localStorage?.setItem(key, value);
      }
    } catch {
      return;
    }
    return;
  }

  if (value === null) {
    memoryStore.delete(key);
  } else {
    memoryStore.set(key, value);
  }
}

async function persistNativeSession() {
  if (Platform.OS === 'web' || !FileSystem.documentDirectory) return;

  const payload = Array.from(memoryStore.entries()).reduce<NativeSessionPayload>((result, [key, value]) => {
    result[key] = value;
    return result;
  }, {});

  try {
    await FileSystem.writeAsStringAsync(NATIVE_SESSION_FILE, JSON.stringify(payload));
  } catch {
    return;
  }
}

export async function restoreSession() {
  if (Platform.OS === 'web' || !FileSystem.documentDirectory) return;

  try {
    const info = await FileSystem.getInfoAsync(NATIVE_SESSION_FILE);
    if (!info.exists) return;

    const raw = await FileSystem.readAsStringAsync(NATIVE_SESSION_FILE);
    const payload = JSON.parse(raw || '{}') as NativeSessionPayload;

    memoryStore.clear();
    Object.entries(payload).forEach(([key, value]) => {
      if (typeof value === 'string') memoryStore.set(key, value);
    });

    const token = memoryStore.get(LEGACY_TOKEN_KEY);
    if (token && token !== 'xxx') setApiToken(token);
  } catch {
    return;
  }
}

export function isAuthenticated() {
  return read(AUTH_KEY) === 'true' || !!read(LEGACY_AUTH_KEY) || !!read(LEGACY_TOKEN_KEY);
}

export function hasCompletedOnboarding() {
  return read(ONBOARD_KEY) === 'true' || read(LEGACY_ONBOARD_KEY) === 'true';
}

export function completeOnboarding() {
  write(ONBOARD_KEY, 'true');
  write(LEGACY_ONBOARD_KEY, 'true');
}

export function signInSession(token?: string) {
  write(ONBOARD_KEY, 'true');
  write(AUTH_KEY, 'true');
  write(LEGACY_ONBOARD_KEY, 'true');
  write(LEGACY_AUTH_KEY, 'xxx');
  write(LEGACY_TOKEN_KEY, token || 'xxx');
  if (token) setApiToken(token);
  persistNativeSession();
}

export function signOutSession() {
  write(AUTH_KEY, null);
  write(ONBOARD_KEY, null);
  write(LEGACY_AUTH_KEY, null);
  write(LEGACY_ONBOARD_KEY, null);
  write(LEGACY_TOKEN_KEY, null);
  setApiToken(null);
  persistNativeSession();
}

export function goHomeAfterAuth() {
  return;
}
