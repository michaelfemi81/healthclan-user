import { Platform } from 'react-native';
import { doctors } from './doctors';

const FAVORITES_KEY = 'healthclan.favoriteDoctorIds';
const memoryFavorites = new Set<string>();

function readStoredIds() {
  if (Platform.OS === 'web') {
    try {
      const value = globalThis.localStorage?.getItem(FAVORITES_KEY);
      return value ? JSON.parse(value) as string[] : [];
    } catch {
      return [];
    }
  }

  return Array.from(memoryFavorites);
}

function writeStoredIds(ids: string[]) {
  if (Platform.OS === 'web') {
    try {
      globalThis.localStorage?.setItem(FAVORITES_KEY, JSON.stringify(ids));
    } catch {
      return;
    }
    return;
  }

  memoryFavorites.clear();
  ids.forEach(id => memoryFavorites.add(id));
}

export function getFavoriteDoctorIds() {
  return readStoredIds().filter(id => doctors.some(doctor => doctor.id === id));
}

export function getFavoriteDoctors() {
  const ids = getFavoriteDoctorIds();
  return ids.map(id => doctors.find(doctor => doctor.id === id)).filter(Boolean) as typeof doctors[number][];
}

export function isFavoriteDoctor(doctorId: string) {
  return getFavoriteDoctorIds().includes(doctorId);
}

export function toggleFavoriteDoctor(doctorId: string) {
  const ids = getFavoriteDoctorIds();
  const nextIds = ids.includes(doctorId)
    ? ids.filter(id => id !== doctorId)
    : [doctorId, ...ids];

  writeStoredIds(nextIds);
  return nextIds.includes(doctorId);
}
