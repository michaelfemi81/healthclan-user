import { Platform } from 'react-native';

const memoryStore = new Map<string, string>();

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

function write(key: string, value: string) {
  if (Platform.OS === 'web') {
    try {
      globalThis.localStorage?.setItem(key, value);
    } catch {
      return;
    }
    return;
  }

  memoryStore.set(key, value);
}

export const languageOptions = [
  { code: 'en', label: 'English' },
  { code: 'fr', label: 'French' },
  { code: 'yo', label: 'Yoruba' },
  { code: 'ha', label: 'Hausa' },
  { code: 'ig', label: 'Igbo' },
];

const languageLabels = languageOptions.map(language => language.label);

function localeForLanguage(language: string) {
  return languageOptions.find(item => item.label === language || item.code === language)?.code || 'en';
}

export function getLanguagePreference() {
  const value = read('healthclan.language');
  return value && languageLabels.includes(value) ? value : 'English';
}

export function setLanguagePreference(language: string) {
  if (languageLabels.includes(language)) {
    write('healthclan.language', language);
    write('locale', localeForLanguage(language));
  }
}

export function getLocalePreference() {
  return localeForLanguage(getLanguagePreference());
}

export function getBooleanPreference(key: string, fallback = true) {
  const value = read(key);
  if (value === 'true') return true;
  if (value === 'false') return false;
  return fallback;
}

export function setBooleanPreference(key: string, value: boolean) {
  write(key, value ? 'true' : 'false');
}
