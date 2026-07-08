export function useNativeSetupIntent() {
  return async (..._args: any[]): Promise<any> => {
    throw new Error('Card entry is unavailable on this device.');
  };
}

export function NativeStripeCardField() {
  return null;
}
