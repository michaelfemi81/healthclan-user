import { Platform } from 'react-native';
import { appConfig } from './config';

export type SupportedCurrency = 'GBP' | 'NGN' | 'USD' | 'CAD' | 'GHS' | 'KES' | 'ZAR' | 'INR' | 'AED' | 'EUR';

export type CurrencyOption = {
  code: SupportedCurrency;
  label: string;
  symbol: string;
};

const CURRENCY_KEY = 'healthclan.currency';
const RATES_KEY = 'healthclan.exchangeRates';
const memoryStore = new Map<string, string>();

export const currencyOptions: CurrencyOption[] = [
  { code: 'NGN', label: 'Nigerian Naira', symbol: 'N' },
  { code: 'GBP', label: 'British Pound', symbol: 'GBP' },
  { code: 'USD', label: 'US Dollar', symbol: '$' },
  { code: 'CAD', label: 'Canadian Dollar', symbol: 'CA$' },
  { code: 'GHS', label: 'Ghanaian Cedi', symbol: 'GHS' },
  { code: 'KES', label: 'Kenyan Shilling', symbol: 'KSh' },
  { code: 'ZAR', label: 'South African Rand', symbol: 'R' },
  { code: 'INR', label: 'Indian Rupee', symbol: 'INR' },
  { code: 'AED', label: 'UAE Dirham', symbol: 'AED' },
  { code: 'EUR', label: 'Euro', symbol: 'EUR' },
];

const fallbackRatesFromGbp: Record<SupportedCurrency, number> = {
  GBP: 1,
  NGN: 1900,
  USD: 1.27,
  CAD: 1.74,
  GHS: 15.6,
  KES: 164,
  ZAR: 23,
  INR: 106,
  AED: 4.66,
  EUR: 1.17,
};

const countryCurrency: Record<string, SupportedCurrency> = {
  NG: 'NGN',
  GB: 'GBP',
  US: 'USD',
  CA: 'CAD',
  GH: 'GHS',
  KE: 'KES',
  ZA: 'ZAR',
  IN: 'INR',
  AE: 'AED',
};

const dialCurrency: Record<string, SupportedCurrency> = {
  '+234': 'NGN',
  '+44': 'GBP',
  '+1': 'USD',
  '+233': 'GHS',
  '+254': 'KES',
  '+27': 'ZAR',
  '+91': 'INR',
  '+971': 'AED',
};

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
  }

  memoryStore.set(key, value);
}

function normalizeRatePayload(payload: any) {
  const source = payload?.data || payload || {};
  const rates = source.rates || source.exchangeRates || source;

  if (!rates || typeof rates !== 'object') return null;

  const nextRates = Object.entries(rates).reduce<Partial<Record<SupportedCurrency, number>>>((result, [currency, rate]) => {
    const code = String(currency).toUpperCase();
    const numericRate = Number(rate);

    if (isSupportedCurrency(code) && Number.isFinite(numericRate) && numericRate > 0) {
      result[code] = numericRate;
    }

    return result;
  }, {});

  if (!nextRates.GBP) nextRates.GBP = 1;

  return {
    baseCurrency: isSupportedCurrency(source.baseCurrency || source.base) ? source.baseCurrency || source.base : 'GBP',
    rates: { ...fallbackRatesFromGbp, ...nextRates } as Record<SupportedCurrency, number>,
    updatedAt: source.updatedAt || new Date().toISOString(),
  };
}

function cachedBackendRates() {
  try {
    const cached = read(RATES_KEY);
    const parsed = cached ? JSON.parse(cached) : null;
    return normalizeRatePayload(parsed)?.rates || fallbackRatesFromGbp;
  } catch {
    return fallbackRatesFromGbp;
  }
}

export async function loadBackendExchangeRates() {
  const response = await fetch(`${appConfig.apiBaseUrl}/currency/rates`, {
    headers: { Accept: 'application/json' },
  });

  if (!response.ok) {
    throw new Error('Unable to load exchange rates from HealthClan.');
  }

  const payload = await response.json().catch(() => ({}));
  const normalized = normalizeRatePayload(payload);

  if (!normalized) {
    throw new Error('HealthClan returned invalid exchange rates.');
  }

  write(RATES_KEY, JSON.stringify(normalized));
  return normalized;
}

export function isSupportedCurrency(value?: string): value is SupportedCurrency {
  return currencyOptions.some(currency => currency.code === value);
}

export function currencyForCountry(country?: string) {
  return countryCurrency[String(country || '').toUpperCase()] || 'NGN';
}

export function currencyForDialCode(dialCode?: string) {
  return dialCurrency[String(dialCode || '')] || 'NGN';
}

export function getPreferredCurrency() {
  const stored = read(CURRENCY_KEY);
  return isSupportedCurrency(stored || '') ? stored as SupportedCurrency : 'NGN';
}

export function setPreferredCurrency(currency: SupportedCurrency) {
  write(CURRENCY_KEY, currency);
}

export function convertAmount(amount: number, from: string, to: string) {
  const rates = cachedBackendRates();
  const source = isSupportedCurrency(from) ? from : 'GBP';
  const target = isSupportedCurrency(to) ? to : getPreferredCurrency();
  const baseAmount = Number(amount) / rates[source];
  return baseAmount * rates[target];
}

export function formatCurrency(amount: number, currency: string) {
  const code = isSupportedCurrency(currency) ? currency : getPreferredCurrency();

  return new Intl.NumberFormat(undefined, {
    style: 'currency',
    currency: code,
    maximumFractionDigits: ['NGN', 'KES', 'INR'].includes(code) ? 0 : 2,
  }).format(amount);
}

export function convertedCurrencyLabel(amount: number, from: string, to = getPreferredCurrency()) {
  const converted = convertAmount(amount, from, to);
  return formatCurrency(converted, to);
}
