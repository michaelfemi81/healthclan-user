import { createElement, useEffect, useRef, useState } from 'react';
import { router, useLocalSearchParams } from 'expo-router';
import { Platform, Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import { Card, Header, PrimaryButton, Screen } from '../components/HealthClanUI';
import { NativeStripeCardField, useNativeSetupIntent } from '../components/NativeStripeCardField';
import { colors, pages } from '../constants/healthclanDesign';
import { healthclanApi } from '../lib/api';
import { appConfig } from '../lib/config';

declare global {
  interface Window {
    Stripe?: (publishableKey: string) => any;
  }
}

let stripeScriptPromise: Promise<void> | null = null;

function firstParam(value: string | string[] | undefined) {
  return Array.isArray(value) ? value[0] : value;
}

function getCardErrorMessage(error: unknown) {
  const message = error instanceof Error ? error.message : '';
  if (/stripe|payment processor|native|sdk|ioexception|unable to resolve host/i.test(message)) {
    return 'Unable to save this card right now. Please try again shortly.';
  }
  return message || 'Unable to save card.';
}

function loadStripeJs() {
  if (Platform.OS !== 'web') {
    return Promise.reject(new Error('Card entry is unavailable on this device.'));
  }

  if (window.Stripe) return Promise.resolve();

  if (!stripeScriptPromise) {
    stripeScriptPromise = new Promise((resolve, reject) => {
      const existing = document.querySelector<HTMLScriptElement>('script[src="https://js.stripe.com/v3/"]');

      if (existing) {
        existing.addEventListener('load', () => resolve());
        existing.addEventListener('error', () => reject(new Error('Unable to load secure card entry.')));
        return;
      }

      const script = document.createElement('script');
      script.src = 'https://js.stripe.com/v3/';
      script.async = true;
      script.onload = () => resolve();
      script.onerror = () => reject(new Error('Unable to load secure card entry.'));
      document.body.appendChild(script);
    });
  }

  return stripeScriptPromise;
}

export default function AddCard() {
  const params = useLocalSearchParams();
  const confirmNativeSetupIntent = useNativeSetupIntent();
  const returnTo = firstParam(params.returnTo) || '/payment-methods';
  const purpose = firstParam(params.purpose) || 'payment';
  const stripeContainerRef = useRef<HTMLDivElement | null>(null);
  const stripeRef = useRef<any>(null);
  const cardElementRef = useRef<any>(null);
  const [name, setName] = useState('');
  const [postalCode, setPostalCode] = useState('');
  const [saveAsDefault, setSaveAsDefault] = useState(true);
  const [message, setMessage] = useState('');
  const [stripeReady, setStripeReady] = useState(false);
  const [cardComplete, setCardComplete] = useState(false);
  const [nativeCardComplete, setNativeCardComplete] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    let active = true;

    async function mountStripeElement() {
      if (Platform.OS !== 'web') {
        if (!appConfig.stripePublishableKey) {
          setMessage('Card payments are not available yet.');
        }
        return;
      }

      if (!appConfig.stripePublishableKey) {
        setMessage('Card payments are not available yet.');
        return;
      }

      try {
        await loadStripeJs();
        if (!active || !window.Stripe || !stripeContainerRef.current) return;

        const stripe = window.Stripe(appConfig.stripePublishableKey);
        const elements = stripe.elements();
        const cardElement = elements.create('card', {
          hidePostalCode: true,
          style: {
            base: {
              color: colors.ink,
              fontFamily: 'Poppins, Arial, sans-serif',
              fontSize: '15px',
              fontWeight: '700',
              '::placeholder': { color: colors.muted },
            },
            invalid: { color: '#B42318' },
          },
        });

        cardElement.mount(stripeContainerRef.current);
        cardElement.on('change', (event: any) => {
          setCardComplete(Boolean(event.complete));
          if (event.error?.message) setMessage(event.error.message);
          if (!event.error && event.complete) setMessage('');
        });

        stripeRef.current = stripe;
        cardElementRef.current = cardElement;
        setStripeReady(true);
      } catch (error) {
        setMessage(error instanceof Error ? error.message : 'Unable to load secure card entry.');
      }
    }

    mountStripeElement();

    return () => {
      active = false;
      cardElementRef.current?.destroy?.();
      cardElementRef.current = null;
      stripeRef.current = null;
    };
  }, []);

  async function saveCard() {
    if (loading) return;

    setMessage('');

    if (name.trim().length < 3) {
      setMessage('Enter the cardholder name.');
      return;
    }

    if (postalCode.trim().length < 3) {
      setMessage('Enter the billing postcode.');
      return;
    }

    if (Platform.OS === 'web' && (!stripeReady || !stripeRef.current || !cardElementRef.current || !cardComplete)) {
      setMessage('Enter complete card details.');
      return;
    }

    if (Platform.OS !== 'web' && !nativeCardComplete) {
      setMessage('Enter complete card details.');
      return;
    }

    setLoading(true);

    try {
      setMessage('Preparing secure card setup...');
      const setupIntent = await healthclanApi.payments.createCardSetupIntent();

      if (!setupIntent.setupIntentId || !setupIntent.clientSecret) {
        throw new Error('Unable to start secure card setup.');
      }

      setMessage('Checking card securely...');
      let paymentMethodId = '';

      if (Platform.OS === 'web') {
        const result = await stripeRef.current.confirmCardSetup(setupIntent.clientSecret, {
          payment_method: {
            card: cardElementRef.current,
            billing_details: {
              name: name.trim(),
              address: { postal_code: postalCode.trim() },
            },
          },
        });

        if (result.error) {
          throw new Error('This card could not be verified. Please check the details and try again.');
        }

        paymentMethodId = String(result.setupIntent?.payment_method || '');

        if (!paymentMethodId || result.setupIntent?.status !== 'succeeded') {
          throw new Error('This card could not be verified. Please try another card.');
        }
      } else {
        const result = await confirmNativeSetupIntent(setupIntent.clientSecret, {
          paymentMethodType: 'Card',
          paymentMethodData: {
            billingDetails: {
              name: name.trim(),
              address: { postalCode: postalCode.trim() },
            },
          },
        });

        if (result.error) {
          throw new Error('This card could not be verified. Please check the details and try again.');
        }

        const nativeSetupIntent: any = result.setupIntent;
        paymentMethodId = String(nativeSetupIntent?.paymentMethodId || nativeSetupIntent?.paymentMethod?.id || '');

        if (!paymentMethodId || nativeSetupIntent?.status !== 'Succeeded') {
          throw new Error('This card could not be verified. Please try another card.');
        }
      }

      setMessage('Saving card to HealthClan...');
      const card: any = await healthclanApi.payments.saveCard({
        providerPaymentMethodId: String(paymentMethodId),
        setupIntentId: setupIntent.setupIntentId,
        isDefault: saveAsDefault,
      });

      router.replace({
        pathname: returnTo as any,
        params: {
          cardSaved: 'true',
          cardBrand: card?.brand || 'Card',
          last4: card?.last4 || '',
          purpose,
        },
      } as any);
    } catch (error) {
      setMessage(getCardErrorMessage(error));
    } finally {
      setLoading(false);
    }
  }

  return (
    <Screen>
      <Header title="Add Payment Card" backTo={returnTo} />
      <View style={styles.wrap}>
        <Card>
          <View style={styles.cardPreview}>
            <View>
              <Text style={styles.previewLabel}>Payment card</Text>
              <Text style={styles.previewNumber}>Your card details are protected</Text>
            </View>
            <Text style={styles.previewName}>{name || 'Cardholder name'}</Text>
          </View>
        </Card>

        <View style={styles.form}>
          <PaymentField label="Cardholder name" value={name} onChangeText={setName} placeholder="Name on card" />
          <View style={styles.fieldBlock}>
            <Text style={styles.label}>Card details</Text>
            {Platform.OS === 'web' ? (
              createElement('div', {
                ref: stripeContainerRef,
                style: stripeElementStyle,
              })
            ) : (
              <NativeStripeCardField
                onCompleteChange={(complete) => {
                  setNativeCardComplete(complete);
                  if (complete) setMessage('');
                }}
              />
            )}
          </View>
          <PaymentField label="Billing ZIP / postcode" value={postalCode} onChangeText={setPostalCode} placeholder="Billing postcode" />

          <Pressable style={styles.checkRow} onPress={() => setSaveAsDefault(current => !current)}>
            <View style={[styles.checkbox, saveAsDefault && styles.checkboxOn]}>
              {saveAsDefault ? <Text style={styles.checkmark}>✓</Text> : null}
            </View>
            <Text style={styles.checkText}>Save as default payment method</Text>
          </Pressable>

          {message ? <Text style={styles.message}>{message}</Text> : null}
          <PrimaryButton title={loading ? 'Saving securely...' : 'Save card'} onPress={saveCard} loading={loading} />
        </View>
      </View>
    </Screen>
  );
}

function PaymentField({
  label,
  value,
  onChangeText,
  placeholder,
}: {
  label: string;
  value: string;
  onChangeText: (value: string) => void;
  placeholder: string;
}) {
  return (
    <View style={styles.fieldBlock}>
      <Text style={styles.label}>{label}</Text>
      <TextInput
        value={value}
        onChangeText={onChangeText}
        placeholder={placeholder}
        placeholderTextColor={colors.muted}
        autoCapitalize="words"
        style={styles.input}
      />
    </View>
  );
}

const stripeElementStyle = {
  minHeight: 50,
  borderRadius: 12,
  backgroundColor: colors.field,
  padding: '16px 14px',
  boxSizing: 'border-box',
} as const;

const styles = StyleSheet.create({
  wrap: { width: '100%', maxWidth: pages.maxWidth, alignSelf: 'center', gap: 14 },
  cardPreview: { minHeight: 152, borderRadius: 18, backgroundColor: colors.teal, padding: 18, justifyContent: 'space-between' },
  previewLabel: { color: colors.white, fontFamily: 'Poppins', fontSize: 16, fontWeight: '900' },
  previewNumber: { color: colors.white, fontFamily: 'Poppins', fontSize: 21, lineHeight: 27, fontWeight: '900', marginTop: 22 },
  previewName: { color: 'rgba(255,255,255,0.82)', fontFamily: 'Poppins', fontSize: 12, fontWeight: '800', textTransform: 'uppercase' },
  form: { gap: 12 },
  fieldBlock: { width: '100%' },
  label: { color: colors.teal, fontFamily: 'Poppins', fontSize: 12, fontWeight: '900', marginBottom: 6 },
  input: { minHeight: 50, borderRadius: 12, backgroundColor: colors.field, color: colors.ink, fontFamily: 'Poppins', fontSize: 14, fontWeight: '800', paddingHorizontal: 14, outlineStyle: 'none' as any },
  checkRow: { minHeight: 46, borderRadius: 12, backgroundColor: colors.white, borderWidth: 1, borderColor: colors.line, flexDirection: 'row', alignItems: 'center', paddingHorizontal: 12, gap: 10 },
  checkbox: { width: 22, height: 22, borderRadius: 7, borderWidth: 1, borderColor: colors.teal, alignItems: 'center', justifyContent: 'center' },
  checkboxOn: { backgroundColor: colors.teal },
  checkmark: { color: colors.white, fontSize: 13, fontWeight: '900' },
  checkText: { color: colors.ink, fontFamily: 'Poppins', fontSize: 13, fontWeight: '800' },
  message: { color: '#C17C12', fontFamily: 'Poppins', fontSize: 12, lineHeight: 18, fontWeight: '900', textAlign: 'center' },
});
