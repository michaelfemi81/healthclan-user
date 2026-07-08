import { Platform } from 'react-native';

const memoryStore = new Map<string, string>();

function readRaw(key: string) {
  if (Platform.OS === 'web') {
    try {
      return globalThis.localStorage?.getItem(key) ?? null;
    } catch {
      return null;
    }
  }

  return memoryStore.get(key) ?? null;
}

function writeRaw(key: string, value: string | null) {
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

export function readOfflineValue<T>(key: string): T | null {
  const raw = readRaw(key);
  if (!raw) return null;

  try {
    return JSON.parse(raw) as T;
  } catch {
    return null;
  }
}

export function writeOfflineValue(key: string, value: unknown) {
  writeRaw(key, JSON.stringify(value));
}

export function removeOfflineValue(key: string) {
  writeRaw(key, null);
}

export function removeOfflineValuesByPrefix(prefixes: string[]) {
  if (prefixes.length === 0) return;

  if (Platform.OS === 'web') {
    try {
      const storage = globalThis.localStorage;
      if (!storage) return;

      const keys = Array.from({ length: storage.length }, (_, index) => storage.key(index)).filter(Boolean) as string[];
      keys.forEach(key => {
        if (prefixes.some(prefix => key.startsWith(prefix))) {
          storage.removeItem(key);
        }
      });
    } catch {
      return;
    }
    return;
  }

  Array.from(memoryStore.keys()).forEach(key => {
    if (prefixes.some(prefix => key.startsWith(prefix))) {
      memoryStore.delete(key);
    }
  });
}

export type OfflineMutation = {
  id: string;
  path: string;
  method: string;
  body?: unknown;
  createdAt: string;
};

const QUEUE_KEY = 'healthclan.offlineQueue';

export function readOfflineQueue() {
  return readOfflineValue<OfflineMutation[]>(QUEUE_KEY) || [];
}

export function enqueueOfflineMutation(mutation: Omit<OfflineMutation, 'id' | 'createdAt'>) {
  const queue = readOfflineQueue();
  const next = [
    ...queue,
    {
      ...mutation,
      id: `${Date.now()}-${Math.random().toString(36).slice(2)}`,
      createdAt: new Date().toISOString(),
    },
  ];

  writeOfflineValue(QUEUE_KEY, next);
  return next.at(-1);
}

export function replaceOfflineQueue(queue: OfflineMutation[]) {
  writeOfflineValue(QUEUE_KEY, queue);
}
