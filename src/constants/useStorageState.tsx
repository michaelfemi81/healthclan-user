import { useEffect, useCallback, useReducer } from 'react';
import { Platform } from 'react-native';

type UseStateHook<T> = [[boolean, T | null], (value: T | null) => void];
type StorageListener = (value: string | null) => void;

const storageListeners = new Map<string, Set<StorageListener>>();
const nativeMemoryStore = new Map<string, string>();

function addStorageListener(key: string, listener: StorageListener) {
    const listeners = storageListeners.get(key) || new Set<StorageListener>();
    listeners.add(listener);
    storageListeners.set(key, listeners);

    return () => {
        listeners.delete(listener);
        if (listeners.size === 0) {
            storageListeners.delete(key);
        }
    };
}

function notifyStorageListeners(key: string, value: string | null) {
    storageListeners.get(key)?.forEach(listener => listener(value));
}

function useAsyncState<T>(
    initialValue: [boolean, T | null] = [true, null],
): UseStateHook<T> {
    return useReducer(
        (state: [boolean, T | null], action: T | null = null): [boolean, T | null] => [false, action],
        initialValue
    ) as UseStateHook<T>;
}

export async function setStorageItemAsync(key: string, value: string | null) {
    if (process.env.EXPO_OS === 'web') {
        if (value === null) {
            localStorage.removeItem(key);
        } else {
            localStorage.setItem(key, value);
        }
    } else {
        if (value == null) {
            nativeMemoryStore.delete(key);
        } else {
            nativeMemoryStore.set(key, value);
        }
    }
}

export function useStorageState(key: string): UseStateHook<string> {
    // Public
    const [state, setState] = useAsyncState<string>();

    // Get
    useEffect(() => {
        const removeListener = addStorageListener(key, value => {
            setState(value);
        });

        if (Platform.OS === 'web') {
            try {
                if (typeof localStorage !== 'undefined') {
                    setState(localStorage.getItem(key));
                }
            } catch (e) {
                console.error('Local storage is unavailable:', e);
            }
        } else {
            setState(nativeMemoryStore.get(key) ?? null);
        }

        return removeListener;
    }, [key]);

    // Set
    const setValue = useCallback(
        (value: string | null) => {
            setState(value);
            notifyStorageListeners(key, value);
            setStorageItemAsync(key, value);
        },
        [key]
    );

    return [state, setValue];
}
